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
    submitChatMessage,
    subscribeToMessages,
    subscribeToJobUpdates,
    unsubscribeChannel,
    streamChatResponse
} from '../services/chatService';

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

    // Refs for subscriptions
    const messageChannelRef = useRef(null);
    const jobChannelRef = useRef(null);

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

            // Subscribe to real-time updates
            setupRealtimeSubscriptions(newSession.session_id);

        } catch (err) {
            console.error('Error initializing session:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [currentField]);

    /**
     * Thiết lập real-time subscriptions
     */
    const setupRealtimeSubscriptions = (sessionId) => {
        // Subscribe to messages
        messageChannelRef.current = subscribeToMessages(
            sessionId,
            (newMessage) => {
                setMessages(prev => [...prev, newMessage]);
            },
            (err) => {
                console.error('Message subscription error:', err);
            }
        );

        // Subscribe to job updates
        jobChannelRef.current = subscribeToJobUpdates(
            sessionId,
            (job) => {
                console.log('Job update:', job);
                // Có thể xử lý job status ở đây
            },
            (err) => {
                console.error('Job subscription error:', err);
            }
        );
    };

    /**
     * Gửi tin nhắn
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
            // Gửi tin nhắn và xử lý streaming response
            await streamChatResponse(
                session.session_id,
                messageContent,
                currentField,
                // onChunk - nhận từng đoạn response
                (chunk) => {
                    setStreamingMessage(prev => prev + chunk);
                },
                // onComplete - hoàn thành
                (result) => {
                    console.log('Chat completed:', result);
                    setStreamingMessage('');
                    setSending(false);
                },
                // onError - lỗi
                (errorMsg) => {
                    console.error('Chat error:', errorMsg);
                    setError(errorMsg);
                    setStreamingMessage('');
                    setSending(false);
                }
            );

            // Cập nhật lại question limit
            const hasLimit = await checkQuestionLimit(session.session_id);
            setQuestionLimit(hasLimit);

        } catch (err) {
            console.error('Error sending message:', err);
            setError(err.message);
            setSending(false);
            setStreamingMessage('');
        }
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
        // Cleanup subscriptions
        if (messageChannelRef.current) {
            unsubscribeChannel(messageChannelRef.current);
        }
        if (jobChannelRef.current) {
            unsubscribeChannel(jobChannelRef.current);
        }

        // Clear state
        setSession(null);
        setMessages([]);
        setStreamingMessage('');

        // Initialize new session
        await initializeSession();
    }, [initializeSession]);

    /**
     * Khởi tạo khi component mount
     */
    useEffect(() => {
        initializeSession();

        // Cleanup khi unmount
        return () => {
            if (messageChannelRef.current) {
                unsubscribeChannel(messageChannelRef.current);
            }
            if (jobChannelRef.current) {
                unsubscribeChannel(jobChannelRef.current);
            }
        };
    }, [initializeSession]);

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
        initializeSession
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
