/**
 * Chat Service
 * Xử lý các chức năng chat với AI
 * Sử dụng chat Supabase instance
 * Enhanced with CSV Learning Path Detection
 */

import { supabaseChat, CHAT_EDGE_FUNCTIONS_URL } from './supabase';
import csvService, { VIETNAMESE_LEARNING_PATH_KEYWORDS } from './csvService';

/**
 * Lấy danh sách fields (lĩnh vực học tập)
 */
// Fallback fields if Supabase is unavailable
const FALLBACK_FIELDS = [
    { id: 'marketing', name: 'Marketing', description: 'Học về marketing và quảng cáo' },
    { id: 'ui-ux', name: 'UI/UX Design', description: 'Thiết kế giao diện và trải nghiệm người dùng' },
    { id: 'graphic', name: 'Graphic Design', description: 'Thiết kế đồ họa và hình ảnh' },
    { id: 'web', name: 'Web Development', description: 'Phát triển ứng dụng web' },
    { id: 'mobile', name: 'Mobile Development', description: 'Phát triển ứng dụng di động' }
];

export const getFields = async () => {
    if (!supabaseChat) {
        console.warn('[chatService] Chat Supabase not configured, using fallback fields');
        return FALLBACK_FIELDS;
    }
    
    console.log('[chatService] Fetching fields from Supabase...');
    const { data, error } = await supabaseChat
        .from('fields')
        .select('*')
        .eq('is_active', true)
        .order('name');

    if (error) {
        console.warn('[chatService] Error fetching fields, using fallback:', error.message);
        
        // If 401 (invalid API key) or other errors, use fallback fields
        if (error.message && error.message.includes('Invalid API key')) {
            console.warn('[chatService] Invalid API key detected, using fallback fields. Please update REACT_APP_CHAT_SUPABASE_ANON_KEY in .env');
        }
        
        // Return fallback fields instead of throwing
        return FALLBACK_FIELDS;
    }
    console.log('[chatService] Fields fetched:', data?.length || 0);
    return data || FALLBACK_FIELDS;
};

/**
 * Lấy tin nhắn từ localStorage (fallback)
 */
const getLocalMessages = (sessionId) => {
    try {
        const stored = localStorage.getItem(`chat_messages_${sessionId}`);
        return stored ? JSON.parse(stored) : [];
    } catch {
        return [];
    }
};

/**
 * Lưu tin nhắn vào localStorage (fallback)
 */
const saveLocalMessage = (sessionId, message) => {
    try {
        const messages = getLocalMessages(sessionId);
        messages.push({
            ...message,
            id: message.id || `local-${Date.now()}-${Math.random()}`,
            created_at: message.created_at || new Date().toISOString()
        });
        localStorage.setItem(`chat_messages_${sessionId}`, JSON.stringify(messages));
        return messages[messages.length - 1];
    } catch (error) {
        console.error('[chatService] Error saving local message:', error);
        return message;
    }
};

/**
 * Lấy tin nhắn của session
 * Using local storage for demo (no Supabase sessions needed)
 */
export const getMessages = async (sessionId) => {
    // For demo purposes, use local storage only
    // This avoids 406 errors from checking chat_sessions table
    return getLocalMessages(sessionId);
};

/**
 * Tạo tin nhắn mới
 * Using local storage for demo (no Supabase sessions needed)
 */
export const createMessage = async (sessionId, role, content) => {
    // For demo purposes, use local storage only
    // This avoids 406 errors from checking chat_sessions table
    const message = {
        id: `local-${Date.now()}-${Math.random()}`,
        chat_session_id: sessionId,
        role,
        content,
        created_at: new Date().toISOString()
    };
    return saveLocalMessage(sessionId, message);
};

/**
 * Gửi tin nhắn đến AI (sử dụng Edge Functions)
 * Enhanced with CSV learning path detection
 */
export const submitChatMessage = async (sessionId, message, fieldId, fieldName = null, conversationHistory = []) => {
    // Check if this is a learning path request
    const isLearningPathRequest = csvService.isLearningPathRequest(message);
    
    if (isLearningPathRequest) {
        console.log('[chatService] Learning path request detected');
        
        // Detect field from message or use provided fieldId
        let targetField = fieldName;
        if (!targetField && fieldId) {
            // Get field name from fieldId
            const fields = await getFields();
            const field = fields.find(f => f.id === fieldId);
            targetField = field?.name;
        }
        
        // If no field from session, try to detect from message
        if (!targetField) {
            targetField = csvService.detectFieldFromMessage(message);
        }
        
        if (targetField) {
            console.log(`[chatService] Getting learning paths for field: ${targetField}`);
            const learningPaths = await csvService.getLearningPathsByField(targetField);
            
            if (learningPaths && learningPaths.length > 0) {
                console.log(`[chatService] Found ${learningPaths.length} learning paths`);
                // Return CSV response instead of calling AI
                return {
                    isCSVResponse: true,
                    learningPaths,
                    field: targetField
                };
            }
        }
    }
    
    // If not a learning path request or no CSV data found, use AI
    if (!CHAT_EDGE_FUNCTIONS_URL) {
        console.error('[chatService] CHAT_EDGE_FUNCTIONS_URL is not configured');
        throw new Error('Edge Functions URL is not configured');
    }
    
    const url = `${CHAT_EDGE_FUNCTIONS_URL}/chat-submit`;
    console.log('[chatService] Submitting chat message to:', url, { 
        sessionId, 
        messageLength: message?.length, 
        fieldId, 
        fieldName,
        historyLength: conversationHistory.length 
    });
    
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.REACT_APP_CHAT_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
            session_id: sessionId,
            message,
            field_id: fieldId,
            field_name: fieldName,
            conversation_history: conversationHistory
        })
    });

    console.log('[chatService] Edge function response status:', response.status);
    if (!response.ok) {
        const errorText = await response.text();
        console.error('[chatService] Edge function error:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    return response;
};

/**
 * Lấy trạng thái job
 */
export const getJobStatus = async (jobId) => {
    const response = await fetch(`${CHAT_EDGE_FUNCTIONS_URL}/chat-status?job_id=${jobId}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${process.env.REACT_APP_CHAT_SUPABASE_ANON_KEY}`
        }
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
};

/**
 * Lấy trạng thái session
 */
export const getSessionStatus = async (sessionId, limit = 10) => {
    const response = await fetch(`${CHAT_EDGE_FUNCTIONS_URL}/chat-status`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.REACT_APP_CHAT_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
            session_id: sessionId,
            limit
        })
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
};

/**
 * Lắng nghe tin nhắn mới (Real-time)
 */
export const subscribeToMessages = (sessionId, onNewMessage, onError) => {
    // Lấy session UUID từ session_id string
    supabaseChat
        .from('chat_sessions')
        .select('id')
        .eq('session_id', sessionId)
        .single()
        .then(({ data: session }) => {
            if (!session) {
                onError(new Error('Session not found'));
                return;
            }

            const channel = supabaseChat
                .channel(`messages_${sessionId}`)
                .on('postgres_changes', {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'chat_messages',
                    filter: `chat_session_id=eq.${session.id}`
                }, (payload) => {
                    onNewMessage(payload.new);
                })
                .subscribe();

            return channel;
        })
        .catch(error => onError(error));
};

/**
 * Lắng nghe cập nhật job (Real-time)
 */
export const subscribeToJobUpdates = (sessionId, onJobUpdate, onError) => {
    // Lấy session UUID từ session_id string
    supabaseChat
        .from('chat_sessions')
        .select('id')
        .eq('session_id', sessionId)
        .single()
        .then(({ data: session }) => {
            if (!session) {
                onError(new Error('Session not found'));
                return;
            }

            const channel = supabaseChat
                .channel(`jobs_${sessionId}`)
                .on('postgres_changes', {
                    event: '*',
                    schema: 'public',
                    table: 'chat_jobs',
                    filter: `chat_session_id=eq.${session.id}`
                }, (payload) => {
                    onJobUpdate(payload.new);
                })
                .subscribe();

            return channel;
        })
        .catch(error => onError(error));
};

/**
 * Hủy đăng ký channel
 */
export const unsubscribeChannel = (channel) => {
    if (channel && supabaseChat) {
        supabaseChat.removeChannel(channel);
    }
};

/**
 * Xử lý streaming response từ AI
 */
export const streamChatResponse = async (sessionId, message, fieldId, onChunk, onComplete, onError, fieldName = null, conversationHistory = []) => {
    try {
        const response = await submitChatMessage(sessionId, message, fieldId, fieldName, conversationHistory);

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let fullResponse = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    try {
                        const data = JSON.parse(line.slice(6));

                        switch (data.type) {
                            case 'chunk':
                                fullResponse += data.content;
                                onChunk(data.content);
                                break;

                            case 'done':
                                onComplete(data);
                                return;

                            case 'error':
                                onError(data.error);
                                return;
                        }
                    } catch (e) {
                        console.error('Error parsing SSE data:', e);
                    }
                }
            }
        }
    } catch (error) {
        onError(error.message);
    }
};
