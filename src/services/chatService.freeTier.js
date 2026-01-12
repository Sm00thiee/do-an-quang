/**
 * Chat Service - FREE TIER VERSION
 * Sử dụng polling thay vì realtime subscriptions
 * Sử dụng chat Supabase instance
 */

import { supabaseChat, CHAT_EDGE_FUNCTIONS_URL } from './supabase';

/**
 * Lấy danh sách fields (lĩnh vực học tập)
 */
export const getFields = async () => {
    const { data, error } = await supabaseChat
        .from('fields')
        .select('*')
        .eq('is_active', true)
        .order('name');

    if (error) throw error;
    return data || [];
};

/**
 * Lấy tin nhắn của session
 */
export const getMessages = async (sessionId) => {
    // Lấy session UUID từ session_id string
    const { data: session } = await supabaseChat
        .from('chat_sessions')
        .select('id')
        .eq('session_id', sessionId)
        .single();

    if (!session) throw new Error('Session not found');

    const { data, error } = await supabaseChat
        .from('chat_messages')
        .select('*')
        .eq('chat_session_id', session.id)
        .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
};

/**
 * Tạo tin nhắn mới
 */
export const createMessage = async (sessionId, role, content) => {
    // Lấy session UUID từ session_id string
    const { data: session } = await supabaseChat
        .from('chat_sessions')
        .select('id')
        .eq('session_id', sessionId)
        .single();

    if (!session) throw new Error('Session not found');

    const { data, error } = await supabaseChat
        .from('chat_messages')
        .insert({
            chat_session_id: session.id,
            role,
            content
        })
        .select()
        .single();

    if (error) throw error;
    return data;
};

/**
 * POLLING-BASED: Kiểm tra tin nhắn mới
 * Gọi function này mỗi vài giây để lấy messages mới
 */
export const checkForNewMessages = async (sessionId, lastMessageId = null) => {
    const { data: session } = await supabaseChat
        .from('chat_sessions')
        .select('id')
        .eq('session_id', sessionId)
        .single();

    if (!session) return [];

    let query = supabaseChat
        .from('chat_messages')
        .select('*')
        .eq('chat_session_id', session.id)
        .order('created_at', { ascending: true });

    // Nếu có lastMessageId, chỉ lấy messages sau nó
    if (lastMessageId) {
        const { data: lastMsg } = await supabaseChat
            .from('chat_messages')
            .select('created_at')
            .eq('id', lastMessageId)
            .single();

        if (lastMsg) {
            query = query.gt('created_at', lastMsg.created_at);
        }
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
};

/**
 * Gửi tin nhắn đến AI (nếu có backend/edge functions)
 */
export const submitChatMessage = async (sessionId, message, fieldId) => {
    try {
        const response = await fetch(`${CHAT_EDGE_FUNCTIONS_URL}/chat-submit`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.REACT_APP_CHAT_SUPABASE_ANON_KEY}`
            },
            body: JSON.stringify({
                session_id: sessionId,
                message,
                field_id: fieldId
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return response;
    } catch (error) {
        console.error('Error calling edge function:', error);
        // Fallback: Tạo message trực tiếp
        return createMessage(sessionId, 'user', message);
    }
};

/**
 * MOCK AI Response (dùng khi không có Edge Functions)
 */
export const getMockAIResponse = (userMessage) => {
    const responses = [
        "Đó là một câu hỏi rất hay! Để tôi giúp bạn tìm hiểu về điều đó.",
        "Tôi hiểu bạn đang quan tâm đến vấn đề này. Hãy để tôi gợi ý một số hướng đi.",
        "Dựa trên câu hỏi của bạn, tôi có thể gợi ý một số khóa học phù hợp.",
        "Đây là một lĩnh vực rất thú vị! Bạn có muốn tìm hiểu sâu hơn không?",
        "Tôi sẽ giúp bạn tìm các tài nguyên học tập phù hợp nhất."
    ];

    return responses[Math.floor(Math.random() * responses.length)];
};

/**
 * Gửi tin nhắn và nhận AI response (với mock fallback)
 */
export const sendMessageWithResponse = async (sessionId, userMessage, fieldId) => {
    // 1. Tạo user message
    await createMessage(sessionId, 'user', userMessage);

    // 2. Simulate AI thinking
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 3. Get AI response (mock for now)
    const aiResponse = getMockAIResponse(userMessage);

    // 4. Tạo assistant message
    await createMessage(sessionId, 'assistant', aiResponse);

    // 5. Return updated messages
    return await getMessages(sessionId);
};

/**
 * Setup polling để auto-refresh messages
 * Gọi từ component với useEffect
 */
export const startMessagePolling = (sessionId, onNewMessages, interval = 3000) => {
    let lastMessageId = null;

    const poll = async () => {
        try {
            const newMessages = await checkForNewMessages(sessionId, lastMessageId);

            if (newMessages.length > 0) {
                lastMessageId = newMessages[newMessages.length - 1].id;
                onNewMessages(newMessages);
            }
        } catch (error) {
            console.error('Polling error:', error);
        }
    };

    // Poll immediately
    poll();

    // Then poll at interval
    const intervalId = setInterval(poll, interval);

    // Return cleanup function
    return () => clearInterval(intervalId);
};

// Export all functions
export default {
    getFields,
    getMessages,
    createMessage,
    checkForNewMessages,
    submitChatMessage,
    getMockAIResponse,
    sendMessageWithResponse,
    startMessagePolling
};
