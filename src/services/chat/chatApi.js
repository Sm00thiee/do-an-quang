/**
 * Chat API Service
 * Main API functions for chat feature using dedicated Supabase instance
 */

import { chatSupabase } from './chatSupabase';
import { logger } from '../../utils/chatLogger';

/**
 * Generate a unique session ID
 * @returns {string}
 */
export const generateSessionId = () => {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// ============================================================================
// FIELD API
// ============================================================================

/**
 * Fetch all active fields
 * @returns {Promise<{data: Field[]|null, error: string|null, status: number}>}
 */
export const fetchFields = async () => {
  try {
    logger.debug('ChatAPI', 'Fetching fields');
    
    const { data, error } = await chatSupabase
      .from('fields')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) {
      logger.error('ChatAPI', 'Error fetching fields', { error });
      return { data: null, error: error.message, status: 400 };
    }

    logger.info('ChatAPI', `Fetched ${data?.length || 0} fields`);
    return { data, error: null, status: 200 };
  } catch (error) {
    logger.error('ChatAPI', 'Exception fetching fields', { error });
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error',
      status: 500
    };
  }
};

/**
 * Fetch field by ID
 * @param {string} fieldId
 * @returns {Promise<{data: Field|null, error: string|null, status: number}>}
 */
export const fetchFieldById = async (fieldId) => {
  try {
    logger.debug('ChatAPI', 'Fetching field by ID', { fieldId });
    
    const { data, error } = await chatSupabase
      .from('fields')
      .select('*')
      .eq('id', fieldId)
      .single();

    if (error) {
      logger.error('ChatAPI', 'Error fetching field', { error, fieldId });
      return { data: null, error: error.message, status: 400 };
    }

    return { data, error: null, status: 200 };
  } catch (error) {
    logger.error('ChatAPI', 'Exception fetching field', { error, fieldId });
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error',
      status: 500
    };
  }
};

// ============================================================================
// CHAT SESSION API
// ============================================================================

/**
 * Create a new chat session
 * @param {{session_id: string, field_id?: string}} request
 * @returns {Promise<{data: ChatSession|null, error: string|null, status: number}>}
 */
export const createChatSession = async (request) => {
  try {
    logger.info('ChatAPI', 'Creating chat session', { request });
    
    const { data, error } = await chatSupabase
      .from('chat_sessions')
      .insert([request])
      .select()
      .single();

    if (error) {
      logger.error('ChatAPI', 'Error creating chat session', { error, request });
      return { data: null, error: error.message, status: 400 };
    }

    logger.info('ChatAPI', 'Chat session created', { sessionId: data.session_id });
    return { data, error: null, status: 200 };
  } catch (error) {
    logger.error('ChatAPI', 'Exception creating chat session', { error, request });
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error',
      status: 500
    };
  }
};

/**
 * Get or create a chat session
 * @param {string} sessionId
 * @param {string} [fieldId]
 * @returns {Promise<{data: ChatSession|null, error: string|null, status: number}>}
 */
export const getOrCreateChatSession = async (sessionId, fieldId) => {
  try {
    // First, try to fetch existing session
    const { data: existingSession } = await chatSupabase
      .from('chat_sessions')
      .select('*')
      .eq('session_id', sessionId)
      .single();

    if (existingSession) {
      logger.debug('ChatAPI', 'Found existing session', { sessionId });
      return { data: existingSession, error: null, status: 200 };
    }

    // If not found, create new session
    logger.debug('ChatAPI', 'Creating new session', { sessionId, fieldId });
    return await createChatSession({ session_id: sessionId, field_id: fieldId });
  } catch (error) {
    logger.error('ChatAPI', 'Exception in getOrCreateChatSession', { error, sessionId });
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error',
      status: 500
    };
  }
};

/**
 * Fetch chat session with messages
 * @param {string} sessionId
 * @returns {Promise<{data: ChatSessionWithMessages|null, error: string|null, status: number}>}
 */
export const fetchChatSession = async (sessionId) => {
  try {
    logger.debug('ChatAPI', 'Fetching chat session', { sessionId });
    
    const { data, error } = await chatSupabase
      .from('chat_sessions')
      .select(`
        *,
        field:fields(*),
        messages:chat_messages(*)
      `)
      .eq('session_id', sessionId)
      .single();

    if (error) {
      logger.error('ChatAPI', 'Error fetching chat session', { error, sessionId });
      return { data: null, error: error.message, status: 400 };
    }

    logger.info('ChatAPI', 'Fetched chat session', { 
      sessionId, 
      messageCount: data.messages?.length 
    });
    return { data, error: null, status: 200 };
  } catch (error) {
    logger.error('ChatAPI', 'Exception fetching chat session', { error, sessionId });
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error',
      status: 500
    };
  }
};

/**
 * Update chat session
 * @param {string} sessionId
 * @param {Partial<ChatSession>} updates
 * @returns {Promise<{data: ChatSession|null, error: string|null, status: number}>}
 */
export const updateChatSession = async (sessionId, updates) => {
  try {
    logger.debug('ChatAPI', 'Updating chat session', { sessionId, updates });
    
    const { data, error } = await chatSupabase
      .from('chat_sessions')
      .update(updates)
      .eq('session_id', sessionId)
      .select()
      .single();

    if (error) {
      logger.error('ChatAPI', 'Error updating chat session', { error, sessionId });
      return { data: null, error: error.message, status: 400 };
    }

    return { data, error: null, status: 200 };
  } catch (error) {
    logger.error('ChatAPI', 'Exception updating chat session', { error, sessionId });
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error',
      status: 500
    };
  }
};

/**
 * Update session activity timestamp
 * @param {string} sessionId
 * @returns {Promise<{data: ChatSession|null, error: string|null, status: number}>}
 */
export const updateSessionActivity = async (sessionId) => {
  return updateChatSession(sessionId, {
    last_message_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  });
};

/**
 * Check if session is expired (> 24 hours old)
 * @param {ChatSession} session
 * @returns {boolean}
 */
export const isSessionExpired = (session) => {
  if (!session || !session.created_at) return false;
  
  const sessionAge = Date.now() - new Date(session.created_at).getTime();
  const dayInMs = 24 * 60 * 60 * 1000;
  
  return sessionAge > dayInMs;
};

/**
 * Fetch all chat sessions (conversation history)
 * @returns {Promise<{data: ChatSessionWithMessages[]|null, error: string|null, status: number}>}
 */
export const fetchAllChatSessions = async () => {
  try {
    logger.debug('ChatAPI', 'Fetching all chat sessions');
    
    const { data, error } = await chatSupabase
      .from('chat_sessions')
      .select(`
        *,
        field:fields(*),
        messages:chat_messages(*)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('ChatAPI', 'Error fetching chat sessions', { error });
      return { data: null, error: error.message, status: 400 };
    }

    logger.info('ChatAPI', `Fetched ${data?.length || 0} chat sessions`);
    return { data: data || [], error: null, status: 200 };
  } catch (error) {
    logger.error('ChatAPI', 'Exception fetching chat sessions', { error });
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error',
      status: 500
    };
  }
};

/**
 * Delete a chat session
 * @param {string} sessionId
 * @returns {Promise<{data: null, error: string|null, status: number}>}
 */
export const deleteChatSession = async (sessionId) => {
  try {
    logger.info('ChatAPI', 'Deleting chat session', { sessionId });
    
    const { error } = await chatSupabase
      .from('chat_sessions')
      .delete()
      .eq('id', sessionId);

    if (error) {
      logger.error('ChatAPI', 'Error deleting chat session', { error, sessionId });
      return { data: null, error: error.message, status: 400 };
    }

    logger.info('ChatAPI', 'Chat session deleted', { sessionId });
    return { data: null, error: null, status: 200 };
  } catch (error) {
    logger.error('ChatAPI', 'Exception deleting chat session', { error, sessionId });
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error',
      status: 500
    };
  }
};

// ============================================================================
// CHAT MESSAGE API
// ============================================================================

/**
 * Create a chat message
 * @param {{chat_session_id: string, role: 'user'|'assistant', content: string}} request
 * @returns {Promise<{data: ChatMessage|null, error: string|null, status: number}>}
 */
export const createChatMessage = async (request) => {
  try {
    logger.debug('ChatAPI', 'Creating chat message', { 
      role: request.role, 
      contentLength: request.content.length 
    });
    
    const { data, error } = await chatSupabase
      .from('chat_messages')
      .insert([request])
      .select()
      .single();

    if (error) {
      logger.error('ChatAPI', 'Error creating chat message', { error, request });
      return { data: null, error: error.message, status: 400 };
    }

    return { data, error: null, status: 200 };
  } catch (error) {
    logger.error('ChatAPI', 'Exception creating chat message', { error, request });
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error',
      status: 500
    };
  }
};

/**
 * Fetch chat messages for a session
 * @param {string} chatSessionId
 * @returns {Promise<{data: ChatMessage[]|null, error: string|null, status: number}>}
 */
export const fetchChatMessages = async (chatSessionId) => {
  try {
    logger.debug('ChatAPI', 'Fetching chat messages', { chatSessionId });
    
    const { data, error } = await chatSupabase
      .from('chat_messages')
      .select('*')
      .eq('chat_session_id', chatSessionId)
      .order('created_at', { ascending: true });

    if (error) {
      logger.error('ChatAPI', 'Error fetching chat messages', { error, chatSessionId });
      return { data: null, error: error.message, status: 400 };
    }

    logger.info('ChatAPI', `Fetched ${data?.length || 0} messages`);
    return { data, error: null, status: 200 };
  } catch (error) {
    logger.error('ChatAPI', 'Exception fetching chat messages', { error, chatSessionId });
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error',
      status: 500
    };
  }
};

// ============================================================================
// LEARNING PATH API
// ============================================================================

/**
 * Fetch generated learning paths for a session
 * @param {string} sessionId
 * @returns {Promise<{data: GeneratedLearningPath[]|null, error: string|null, status: number}>}
 */
export const fetchGeneratedLearningPaths = async (sessionId) => {
  try {
    logger.debug('ChatAPI', 'Fetching generated learning paths', { sessionId });
    
    const { data, error } = await chatSupabase
      .from('generated_learning_paths')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('ChatAPI', 'Error fetching learning paths', { error, sessionId });
      return { data: null, error: error.message, status: 400 };
    }

    return { data: data || [], error: null, status: 200 };
  } catch (error) {
    logger.error('ChatAPI', 'Exception fetching learning paths', { error, sessionId });
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error',
      status: 500
    };
  }
};

/**
 * Fetch all generated learning paths (for My Routines page)
 * @returns {Promise<{data: GeneratedLearningPath[]|null, error: string|null, status: number}>}
 */
export const fetchAllGeneratedLearningPaths = async () => {
  try {
    logger.debug('ChatAPI', 'Fetching all generated learning paths');
    
    const { data, error } = await chatSupabase
      .from('generated_learning_paths')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('ChatAPI', 'Error fetching all learning paths', { error });
      return { data: null, error: error.message, status: 400 };
    }

    logger.info('ChatAPI', `Fetched ${data?.length || 0} generated learning paths`);
    return { data: data || [], error: null, status: 200 };
  } catch (error) {
    logger.error('ChatAPI', 'Exception fetching all learning paths', { error });
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error',
      status: 500
    };
  }
};
