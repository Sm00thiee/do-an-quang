/**
 * Chat Service
 * Xử lý các chức năng chat với AI
 */

import { supabase, EDGE_FUNCTIONS_URL } from './supabase';

/**
 * Lấy danh sách fields (lĩnh vực học tập)
 */
export const getFields = async () => {
    const { data, error } = await supabase
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
    const { data: session } = await supabase
        .from('chat_sessions')
        .select('id')
        .eq('session_id', sessionId)
        .single();

    if (!session) throw new Error('Session not found');

    const { data, error } = await supabase
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
    const { data: session } = await supabase
        .from('chat_sessions')
        .select('id')
        .eq('session_id', sessionId)
        .single();

    if (!session) throw new Error('Session not found');

    const { data, error } = await supabase
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
 * Gửi tin nhắn đến AI (sử dụng Edge Functions)
 */
export const submitChatMessage = async (sessionId, message, fieldId) => {
    const response = await fetch(`${EDGE_FUNCTIONS_URL}/chat-submit`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`
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
};

/**
 * Lấy trạng thái job
 */
export const getJobStatus = async (jobId) => {
    const response = await fetch(`${EDGE_FUNCTIONS_URL}/chat-status?job_id=${jobId}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`
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
    const response = await fetch(`${EDGE_FUNCTIONS_URL}/chat-status`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`
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
    supabase
        .from('chat_sessions')
        .select('id')
        .eq('session_id', sessionId)
        .single()
        .then(({ data: session }) => {
            if (!session) {
                onError(new Error('Session not found'));
                return;
            }

            const channel = supabase
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
    supabase
        .from('chat_sessions')
        .select('id')
        .eq('session_id', sessionId)
        .single()
        .then(({ data: session }) => {
            if (!session) {
                onError(new Error('Session not found'));
                return;
            }

            const channel = supabase
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
    if (channel) {
        supabase.removeChannel(channel);
    }
};

/**
 * Xử lý streaming response từ AI
 */
export const streamChatResponse = async (sessionId, message, fieldId, onChunk, onComplete, onError) => {
    try {
        const response = await submitChatMessage(sessionId, message, fieldId);

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
