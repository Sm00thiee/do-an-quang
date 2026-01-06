/**
 * Session Management Service
 * Quản lý session cho AI chatbot
 */

import { supabase } from './supabase';

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
    const sessionId = generateSessionId();
    storeSessionId(sessionId);

    const { data, error } = await supabase
        .from('chat_sessions')
        .insert({
            session_id: sessionId,
            field_id: fieldId,
            question_count: 0
        })
        .select()
        .single();

    if (error) throw error;
    return data;
};

/**
 * Validate session hiện tại
 */
export const validateSession = async (sessionId) => {
    const { data, error } = await supabase
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
    const storedSessionId = getStoredSessionId();

    if (storedSessionId) {
        const existingSession = await validateSession(storedSessionId);
        if (existingSession) {
            return existingSession;
        }
    }

    // Tạo session mới
    return await createSession(fieldId);
};

/**
 * Kiểm tra giới hạn câu hỏi
 */
export const checkQuestionLimit = async (sessionId) => {
    const { data, error } = await supabase
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
    await supabase
        .from('chat_sessions')
        .update({ updated_at: new Date().toISOString() })
        .eq('session_id', sessionId);
};
