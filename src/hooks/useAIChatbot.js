/**
 * Custom React Hook for AI Chatbot
 * Sử dụng hook này để tích hợp chatbot vào component
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
    getOrCreateSession,
    getStoredSessionId,
    checkQuestionLimit
} from '../services/sessionService';
import {
    getMessages,
    getFields,
    createMessage
} from '../services/chatService';
import { submitChat } from '../services/chatEdgeClient';
import useRealtimeChat from './useRealtimeChat';

/**
 * useAIChatbot Hook
 * 
 * @param {string} fieldId - ID của lĩnh vực học tập (optional)
 * @returns {object} - Chatbot state và methods
 */
export const useAIChatbot = (fieldId = null) => {
    // States
    const [session, setSession] = useState(null);
    const [messages, setMessages] = useState([]);
    const [fields, setFields] = useState([]);
    const [currentField, setCurrentField] = useState(fieldId);
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState(null);
    const [questionLimit, setQuestionLimit] = useState(null);
    const [streamingMessage, setStreamingMessage] = useState('');
    // Handle new messages from realtime
    const handleRealtimeNewMessage = useCallback((message) => {
        // Only add assistant messages (user messages are added optimistically in sendMessage)
        if (message.role === 'assistant') {
            setMessages(prev => {
                // Avoid duplicates
                if (prev.some(m => m.id === message.id)) {
                    return prev;
                }
                return [...prev, message];
            });
            // Stop showing loading state when we get the assistant response
            setSending(false);
            setStreamingMessage('');
        }
    }, []);

    const {
        subscribe: subscribeRealtime,
        unsubscribe: unsubscribeRealtime,
        isConnected: realtimeConnected,
        isProcessing: realtimeProcessing,
        activeJobs: realtimeActiveJobs,
        jobHistory: realtimeJobHistory,
        realtimeState
    } = useRealtimeChat({ onNewMessage: handleRealtimeNewMessage });

    /**
     * Khởi tạo session và load dữ liệu
     */
    const initializeSession = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            // Tạo hoặc lấy session
            const newSession = await getOrCreateSession(currentField);
            setSession(newSession);

            // Load tin nhắn hiện có
            const existingMessages = await getMessages(newSession.session_id);
            setMessages(existingMessages);

            // Kiểm tra giới hạn câu hỏi
            const hasLimit = await checkQuestionLimit(newSession.session_id);
            setQuestionLimit(hasLimit);

            // Load danh sách fields
            const fieldsList = await getFields();
            setFields(fieldsList);

            // Subscribe enhanced realtime service (handles both messages and jobs)
            subscribeRealtime(newSession.session_id);

        } catch (err) {
            console.error('Error initializing session:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentField]);

    /**
     * Gửi tin nhắn - Sử dụng Supabase Edge Functions
     */
    const sendMessage = useCallback(async (messageContent) => {
        if (!session || !messageContent.trim()) {
            return;
        }

        // Kiểm tra giới hạn
        if (!questionLimit) {
            setError('Bạn đã hết lượt hỏi cho session này');
            return;
        }

        setSending(true);
        setError(null);
        setStreamingMessage('');

        try {
            // 1. Tạo user message trong database ngay lập tức (optimistic update)
            // Check if this is a local session (id starts with "local-")
            const isLocalSession = session.id && session.id.startsWith('local-');
            const sessionIdToUse = isLocalSession ? session.session_id : session.session_id;
            
            const userMessage = await createMessage(sessionIdToUse, 'user', messageContent);
            setMessages(prev => [...prev, userMessage]);

            // 2. Try to submit vào Edge Function để xử lý AI response
            console.log('[useAIChatbot] Submitting chat to edge function:', {
                sessionId: session.session_id,
                fieldId: currentField,
                messageLength: messageContent.length
            });

            let useFallback = false;
            try {
                let fullStreamedResponse = '';
                const result = await submitChat({
                    session_id: session.session_id,
                    field_id: currentField,
                    message: messageContent,
                    conversation_history: messages // Include conversation history for context
                }, {
                    // Handle streaming chunks
                    onChunk: (chunk) => {
                        fullStreamedResponse += chunk;
                        setStreamingMessage(fullStreamedResponse);
                    },
                    // Handle completion
                    onDone: async (data) => {
                        console.log('[useAIChatbot] Stream completed:', {
                            responseLength: fullStreamedResponse.length,
                            jobId: data.job_id
                        });
                        
                        // Create assistant message with the complete response
                        const assistantMessage = await createMessage(
                            session.session_id,
                            'assistant',
                            fullStreamedResponse
                        );
                        setMessages(prev => [...prev, assistantMessage]);
                        setSending(false);
                        setStreamingMessage('');
                    },
                    // Handle errors
                    onError: (error) => {
                        console.error('[useAIChatbot] Stream error:', error);
                        setError(error);
                        setSending(false);
                        setStreamingMessage('');
                    }
                });

                if (result.error) {
                    // If Edge Function fails (e.g., invalid API key), use fallback
                    console.warn('[useAIChatbot] Edge Function failed, using fallback:', result.error);
                    useFallback = true;
                } else if (!result.data?.streaming) {
                    // Non-streaming response (shouldn't happen but handle it)
                    console.log('[useAIChatbot] Non-streaming response received');
                    setSending(false);
                    setStreamingMessage('');
                }
            } catch (err) {
                console.warn('[useAIChatbot] Edge Function exception, using fallback:', err.message);
                useFallback = true;
            }

            // 3. If Edge Function failed, use local AI fallback
            if (useFallback) {
                const { generateAIResponseWithContext } = await import('../services/geminiService');
                const fieldsList = fields || [];
                const currentFieldData = fieldsList.find(f => f.id === currentField) || null;
                
                const aiResponse = await generateAIResponseWithContext(messageContent, {
                    fields: fieldsList,
                    currentField: currentFieldData
                });

                // Create assistant message locally
                const assistantMessage = await createMessage(
                    session.session_id,
                    'assistant',
                    aiResponse
                );
                setMessages(prev => [...prev, assistantMessage]);
                setSending(false);
                setStreamingMessage('');
            }

            // 4. Cập nhật lại question limit (if Supabase is available)
            try {
                const hasLimit = await checkQuestionLimit(session.session_id);
                setQuestionLimit(hasLimit);
            } catch (err) {
                // If check fails, assume unlimited (for local mode)
                setQuestionLimit(true);
            }

            // Note: setSending(false) will be called when we receive the assistant message via realtime
            // or if we use fallback. We keep it true to show loading state until then.

        } catch (err) {
            console.error('[useAIChatbot] Error sending message:', err);
            
            // Extract error message (handle both Error objects and Supabase error objects)
            const errorMessage = err?.message || (typeof err === 'string' ? err : JSON.stringify(err));
            const errorStr = String(errorMessage);
            
            // If error is about invalid API key or Supabase issues, try fallback AI response
            if (errorStr.includes('Invalid API key') || 
                errorStr.includes('Failed to create session') ||
                errorStr.includes('401') ||
                (err && err.hint && err.hint.includes('API key'))) {
                console.warn('[useAIChatbot] Supabase unavailable, using local AI fallback');
                try {
                    const { generateAIResponseWithContext } = await import('../services/geminiService');
                    const fieldsList = fields || [];
                    const currentFieldData = fieldsList.find(f => f.id === currentField) || null;
                    
                    const aiResponse = await generateAIResponseWithContext(messageContent, {
                        fields: fieldsList,
                        currentField: currentFieldData
                    });

                    // Create assistant message locally (this should work even with Supabase errors)
                    try {
                        const assistantMessage = await createMessage(
                            session.session_id,
                            'assistant',
                            aiResponse
                        );
                        setMessages(prev => [...prev, assistantMessage]);
                        setSending(false);
                        setStreamingMessage('');
                        return; // Success with fallback
                    } catch (msgErr) {
                        // Even createMessage failed, but we can still show the response
                        console.warn('[useAIChatbot] Could not save assistant message, but showing response');
                        setMessages(prev => [...prev, {
                            id: `temp-${Date.now()}`,
                            role: 'assistant',
                            content: aiResponse,
                            created_at: new Date().toISOString()
                        }]);
                        setSending(false);
                        setStreamingMessage('');
                        return;
                    }
                } catch (fallbackErr) {
                    console.error('[useAIChatbot] Fallback also failed:', fallbackErr);
                }
            }
            
            setError(errorStr || 'Failed to send message');
            setSending(false);
            setStreamingMessage('');
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [session, currentField, questionLimit]);

    /**
     * Thay đổi lĩnh vực học tập
     */
    const changeField = useCallback(async (newFieldId) => {
        setCurrentField(newFieldId);
        // Có thể tạo session mới hoặc update session hiện tại
    }, []);

    /**
     * Reset session (tạo mới)
     */
    const resetSession = useCallback(async () => {
        // Cleanup enhanced realtime
        unsubscribeRealtime();

        // Clear state
        setSession(null);
        setMessages([]);
        setStreamingMessage('');

        // Initialize new session
        await initializeSession();
    }, [initializeSession, unsubscribeRealtime]);

    /**
     * Listen for new messages from realtime service
     */
    useEffect(() => {
        // This will be handled by useRealtimeChat hook's callbacks
        // We just need to sync messages when they arrive
    }, []);

    /**
     * Handle job status updates - update sending state based on job completion
     */
    useEffect(() => {
        // If we have active jobs, keep sending state true
        if (realtimeActiveJobs.length > 0) {
            setSending(true);
        } else if (realtimeActiveJobs.length === 0 && sending) {
            // No active jobs but we were sending - check if we got the message
            // If not, might be an error or timeout
            // The handleRealtimeNewMessage will set sending to false when message arrives
        }
    }, [realtimeActiveJobs, sending]);

    /**
     * Handle job failures - show error and stop sending
     */
    useEffect(() => {
        const failedJobs = realtimeJobHistory.filter(j => j.status === 'failed');
        if (failedJobs.length > 0 && sending) {
            const latestFailed = failedJobs[0];
            setError(latestFailed.error_message || 'Failed to process message');
            setSending(false);
            setStreamingMessage('');
        }
    }, [realtimeJobHistory, sending]);

    /**
     * Khởi tạo khi component mount
     */
    useEffect(() => {
        initializeSession();

        // Cleanup khi unmount
        return () => {
            unsubscribeRealtime();
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return {
        // State
        session,
        messages,
        fields,
        currentField,
        loading,
        sending,
        error,
        questionLimit,
        streamingMessage,

        // Methods
        sendMessage,
        changeField,
        resetSession,
        initializeSession,
        // Realtime data for UI (e.g., status badges, job counters)
        realtimeConnected,
        realtimeProcessing,
        realtimeActiveJobs,
        realtimeJobHistory,
        realtimeState
    };
};

/**
 * Ví dụ sử dụng:
 * 
 * function ChatComponent() {
 *   const {
 *     session,
 *     messages,
 *     loading,
 *     sending,
 *     error,
 *     questionLimit,
 *     streamingMessage,
 *     sendMessage,
 *     resetSession
 *   } = useAIChatbot('marketing');
 *   
 *   const [input, setInput] = useState('');
 *   
 *   const handleSend = () => {
 *     sendMessage(input);
 *     setInput('');
 *   };
 *   
 *   if (loading) return <div>Loading...</div>;
 *   
 *   return (
 *     <div>
 *       <div>Session: {session?.session_id}</div>
 *       <div>Questions left: {questionLimit ? 'Yes' : 'No'}</div>
 *       
 *       <div className="messages">
 *         {messages.map(msg => (
 *           <div key={msg.id}>
 *             <strong>{msg.role}:</strong> {msg.content}
 *           </div>
 *         ))}
 *         {streamingMessage && (
 *           <div>
 *             <strong>AI:</strong> {streamingMessage}
 *           </div>
 *         )}
 *       </div>
 *       
 *       <input
 *         value={input}
 *         onChange={e => setInput(e.target.value)}
 *         disabled={sending || !questionLimit}
 *       />
 *       <button onClick={handleSend} disabled={sending || !questionLimit}>
 *         {sending ? 'Sending...' : 'Send'}
 *       </button>
 *       <button onClick={resetSession}>New Chat</button>
 *       
 *       {error && <div className="error">{error}</div>}
 *     </div>
 *   );
 * }
 */

export default useAIChatbot;
