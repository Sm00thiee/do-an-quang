/**
 * Session Management Service
 * Quản lý session cho AI chatbot
 * Sử dụng chat Supabase instance
 */

import { supabaseChat } from './supabase';

const SESSION_KEY = 'ai_chatbot_session_id';
const SESSION_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Tạo session ID mới
 */
export const generateSessionId = () => {
    const timestamp = Date.now().toString(36);
    const randomPart = Math.random().toString(36).substring(2, 15);
    return `${timestamp}-${randomPart}`;
};

/**
 * Lưu session ID vào localStorage
 */
export const storeSessionId = (sessionId) => {
    const sessionData = {
        id: sessionId,
        createdAt: Date.now(),
        expiresAt: Date.now() + SESSION_EXPIRY
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
};

/**
 * Lấy session ID từ localStorage
 */
export const getStoredSessionId = () => {
    const stored = localStorage.getItem(SESSION_KEY);
    if (!stored) return null;

    try {
        const sessionData = JSON.parse(stored);
        if (Date.now() > sessionData.expiresAt) {
            clearSession();
            return null;
        }
        return sessionData.id;
    } catch {
        return null;
    }
};

/**
 * Xóa session
 */
export const clearSession = () => {
    localStorage.removeItem(SESSION_KEY);
};

/**
 * Kiểm tra session có hết hạn không
 */
export const isSessionExpired = (session) => {
    const createdAt = new Date(session.created_at).getTime();
    return (Date.now() - createdAt) > SESSION_EXPIRY;
};

/**
 * Tạo session mới trong database
 */
export const createSession = async (fieldId) => {
    if (!supabaseChat) {
        throw new Error('Chat Supabase instance is not configured. Please set REACT_APP_CHAT_SUPABASE_URL and REACT_APP_CHAT_SUPABASE_ANON_KEY in .env');
    }
    
    const sessionId = generateSessionId();
    storeSessionId(sessionId);

    const { data, error } = await supabaseChat
        .from('chat_sessions')
        .insert({
            session_id: sessionId,
            field_id: fieldId,
            question_count: 0
        })
        .select()
        .single();

    if (error) {
        // Provide helpful error message for 401 (invalid API key)
        if (error.message && error.message.includes('Invalid API key')) {
            const helpfulError = new Error(
                'Invalid Supabase API key. Please:\n' +
                '1. Go to https://supabase.com/dashboard/project/hdbgaxifsgrvlfsztvrm/settings/api\n' +
                '2. Copy the "anon public" key\n' +
                '3. Update REACT_APP_CHAT_SUPABASE_ANON_KEY in your .env file\n' +
                '4. Restart your dev server'
            );
            helpfulError.originalError = error;
            throw helpfulError;
        }
        throw error;
    }
    return data;
};

/**
 * Validate session hiện tại
 */
export const validateSession = async (sessionId) => {
    if (!supabaseChat) {
        return null; // Return null if chat instance not configured
    }
    
    const { data, error } = await supabaseChat
        .from('chat_sessions')
        .select('*')
        .eq('session_id', sessionId)
        .single();

    if (error || !data) return null;

    // Kiểm tra session có hết hạn không
    if (isSessionExpired(data)) {
        return null;
    }

    return data;
};

/**
 * Lấy hoặc tạo session
 */
export const getOrCreateSession = async (fieldId) => {
    // If chat Supabase is not configured, return a local session
    if (!supabaseChat) {
        const localSessionId = getStoredSessionId() || generateSessionId();
        if (!getStoredSessionId()) {
            storeSessionId(localSessionId);
        }
        return {
            id: `local-${localSessionId}`,
            session_id: localSessionId,
            field_id: fieldId,
            question_count: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
    }
    
    const storedSessionId = getStoredSessionId();

    if (storedSessionId) {
        try {
            const existingSession = await validateSession(storedSessionId);
            if (existingSession) {
                return existingSession;
            }
        } catch (error) {
            // If validation fails (e.g., 401), fall back to local mode
            console.warn('[sessionService] Supabase validation failed, using local session:', error.message);
        }
    }

    // Try to create session in Supabase, fall back to local if it fails
    try {
        return await createSession(fieldId);
    } catch (error) {
        // If creation fails (e.g., 401 Invalid API key), use local session
        console.warn('[sessionService] Supabase session creation failed, using local session:', error.message);
        const localSessionId = getStoredSessionId() || generateSessionId();
        if (!getStoredSessionId()) {
            storeSessionId(localSessionId);
        }
        return {
            id: `local-${localSessionId}`,
            session_id: localSessionId,
            field_id: fieldId,
            question_count: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
    }
};

/**
 * Kiểm tra giới hạn câu hỏi
 */
export const checkQuestionLimit = async (sessionId) => {
    if (!supabaseChat) {
        return false; // Return false if chat instance not configured
    }
    
    const { data, error } = await supabaseChat
        .from('chat_sessions')
        .select('question_count')
        .eq('session_id', sessionId)
        .single();

    if (error || !data) return false;

    return data.question_count < 10;
};

/**
 * Cập nhật hoạt động của session
 */
export const updateSessionActivity = async (sessionId) => {
    if (!supabaseChat) {
        return; // Silently return if chat instance not configured
    }
    
    await supabaseChat
        .from('chat_sessions')
        .update({ updated_at: new Date().toISOString() })
        .eq('session_id', sessionId);
};

/**
 * Lấy tất cả các chat sessions
 */
export const getAllChatSessions = async () => {
    if (!supabaseChat) {
        console.warn('[sessionService] Chat Supabase not configured');
        return [];
    }
    
    try {
        const { data, error } = await supabaseChat
            .from('chat_sessions')
            .select(`
                *,
                field:fields(*),
                messages:chat_messages(*)
            `)
            .order('updated_at', { ascending: false });

        if (error) {
            console.error('[sessionService] Error fetching chat sessions:', error);
            return [];
        }
        
        return data || [];
    } catch (error) {
        console.error('[sessionService] Exception fetching chat sessions:', error);
        return [];
    }
};

/**
 * Xóa một chat session (sẽ cascade delete messages và learning paths)
 */
export const deleteChatSession = async (sessionId) => {
    if (!supabaseChat) {
        throw new Error('Chat Supabase instance is not configured');
    }
    
    try {
        console.log('[sessionService] Deleting chat session:', sessionId);
        
        const { error, count } = await supabaseChat
            .from('chat_sessions')
            .delete({ count: 'exact' })
            .eq('id', sessionId);

        console.log('[sessionService] Delete result - error:', error, 'count:', count);

        if (error) {
            console.error('[sessionService] Supabase delete error:', error);
            throw error;
        }

        return { success: true, count };
    } catch (error) {
        console.error('[sessionService] Delete exception:', error);
        throw error;
    }
};

/**
 * Xóa tất cả chat sessions
 */
export const deleteAllChatSessions = async () => {
    if (!supabaseChat) {
        throw new Error('Chat Supabase instance is not configured');
    }
    
    try {
        console.log('[sessionService] Deleting all chat sessions');
        
        const { error, count } = await supabaseChat
            .from('chat_sessions')
            .delete({ count: 'exact' })
            .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all (using a condition that matches all)

        console.log('[sessionService] Delete all result - error:', error, 'count:', count);

        if (error) {
            console.error('[sessionService] Supabase delete all error:', error);
            throw error;
        }

        return { success: true, count };
    } catch (error) {
        console.error('[sessionService] Delete all exception:', error);
        throw error;
    }
};
