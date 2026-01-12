/**
 * API Service for Chat Feature
 * Ported from CourseAiChat/src/services/api.ts
 * CRITICAL: Uses supabaseChat instance, NOT the main supabase instance
 */

import { supabaseChat } from './supabase';
import { getAIResponseStream } from './aiService';

// Helper to get AI response with streaming and conversation history
async function getAIResponseStreamWithCallback(
  message,
  field,
  sessionId,
  callbacks
) {
  if (!supabaseChat) {
    throw new Error('Chat Supabase instance is not configured');
  }

  // Fetch conversation history
  const { data: sessionData } = await supabaseChat
    .from('chat_sessions')
    .select('id')
    .eq('session_id', sessionId)
    .single();
  
  let conversationHistory = [];
  if (sessionData) {
    const { data: messages } = await supabaseChat
      .from('chat_messages')
      .select('role, content')
      .eq('chat_session_id', sessionData.id)
      .order('created_at', { ascending: true })
      .limit(20); // Last 20 messages for context
    
    if (messages) {
      conversationHistory = messages;
      console.log('[API] ✓ Conversation context loaded:', {
        sessionId,
        dbSessionId: sessionData.id,
        messageCount: messages.length,
        contextEnabled: true,
        messages: messages.map(m => ({ role: m.role, contentLength: m.content.length }))
      });
    } else {
      console.log('[API] No messages found in database for session:', sessionData.id);
    }
  } else {
    console.log('[API] Session not found:', sessionId);
  }
  
  console.log('[API] Sending to AI with context:', {
    hasContext: conversationHistory.length > 0,
    contextMessages: conversationHistory.length,
    currentMessage: message.substring(0, 100) + '...'
  });
  
  // Call streaming with history
  await getAIResponseStream(
    {
      sessionId,
      message,
      fieldOfStudy: field,
      conversationHistory
    },
    callbacks
  );
}

// Field API
export const fetchFields = async () => {
  if (!supabaseChat) {
    return {
      data: null,
      error: 'Chat Supabase instance is not configured',
      status: 500
    };
  }

  try {
    const { data, error } = await supabaseChat
      .from('fields')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) {
      return {
        data: null,
        error: error.message,
        status: 400
      };
    }

    return {
      data,
      error: null,
      status: 200
    };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error',
      status: 500
    };
  }
};

export const fetchFieldById = async (fieldId) => {
  if (!supabaseChat) {
    return {
      data: null,
      error: 'Chat Supabase instance is not configured',
      status: 500
    };
  }

  try {
    const { data, error } = await supabaseChat
      .from('fields')
      .select('*')
      .eq('id', fieldId)
      .single();

    if (error) {
      return {
        data: null,
        error: error.message,
        status: 400
      };
    }

    return {
      data,
      error: null,
      status: 200
    };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error',
      status: 500
    };
  }
};

// Chat Session API
export const createChatSession = async (request) => {
  if (!supabaseChat) {
    return {
      data: null,
      error: 'Chat Supabase instance is not configured',
      status: 500
    };
  }

  try {
    const { data, error } = await supabaseChat
      .from('chat_sessions')
      .insert([request])
      .select()
      .single();

    if (error) {
      return {
        data: null,
        error: error.message,
        status: 400
      };
    }

    return {
      data,
      error: null,
      status: 200
    };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error',
      status: 500
    };
  }
};

export const fetchChatSession = async (sessionId) => {
  if (!supabaseChat) {
    return {
      data: null,
      error: 'Chat Supabase instance is not configured',
      status: 500
    };
  }

  try {
    const { data, error } = await supabaseChat
      .from('chat_sessions')
      .select(`
        *,
        field:fields(*),
        messages:chat_messages(*)
      `)
      .eq('session_id', sessionId)
      .single();

    if (error) {
      return {
        data: null,
        error: error.message,
        status: 400
      };
    }

    return {
      data,
      error: null,
      status: 200
    };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error',
      status: 500
    };
  }
};

export const updateChatSession = async (sessionId, updates) => {
  if (!supabaseChat) {
    return {
      data: null,
      error: 'Chat Supabase instance is not configured',
      status: 500
    };
  }

  try {
    const { data, error } = await supabaseChat
      .from('chat_sessions')
      .update(updates)
      .eq('session_id', sessionId)
      .select()
      .single();

    if (error) {
      return {
        data: null,
        error: error.message,
        status: 400
      };
    }

    return {
      data,
      error: null,
      status: 200
    };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error',
      status: 500
    };
  }
};

// Fetch all chat sessions (conversation history)
export const fetchAllChatSessions = async () => {
  if (!supabaseChat) {
    return {
      data: null,
      error: 'Chat Supabase instance is not configured',
      status: 500
    };
  }

  try {
    const { data, error } = await supabaseChat
      .from('chat_sessions')
      .select(`
        *,
        field:fields(*),
        messages:chat_messages(*)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      return {
        data: null,
        error: error.message,
        status: 400
      };
    }

    return {
      data: data || [],
      error: null,
      status: 200
    };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error',
      status: 500
    };
  }
};

// Fetch recent chat sessions (limited to N)
export const fetchRecentChatSessions = async (limit = 10) => {
  if (!supabaseChat) {
    return {
      data: null,
      error: 'Chat Supabase instance is not configured',
      status: 500
    };
  }

  try {
    const { data, error } = await supabaseChat
      .from('chat_sessions')
      .select(`
        *,
        field:fields(*),
        messages:chat_messages(*)
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      return {
        data: null,
        error: error.message,
        status: 400
      };
    }

    return {
      data: data || [],
      error: null,
      status: 200
    };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error',
      status: 500
    };
  }
};

// Delete a chat session (will cascade delete messages and generated learning paths)
export const deleteChatSession = async (sessionId) => {
  if (!supabaseChat) {
    return {
      data: null,
      error: 'Chat Supabase instance is not configured',
      status: 500
    };
  }

  try {
    console.log('[API] Deleting chat session with id:', sessionId);
    
    const { error, count } = await supabaseChat
      .from('chat_sessions')
      .delete({ count: 'exact' })
      .eq('id', sessionId);

    console.log('[API] Delete result - error:', error, 'count:', count);

    if (error) {
      console.error('[API] Supabase delete error:', error);
      return {
        data: null,
        error: error.message,
        status: 400
      };
    }

    return {
      data: null,
      error: null,
      status: 200
    };
  } catch (error) {
    console.error('[API] Delete exception:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error',
      status: 500
    };
  }
};

// Chat Message API
export const createChatMessage = async (request) => {
  if (!supabaseChat) {
    return {
      data: null,
      error: 'Chat Supabase instance is not configured',
      status: 500
    };
  }

  try {
    const { data, error } = await supabaseChat
      .from('chat_messages')
      .insert([request])
      .select()
      .single();

    if (error) {
      return {
        data: null,
        error: error.message,
        status: 400
      };
    }

    return {
      data,
      error: null,
      status: 200
    };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error',
      status: 500
    };
  }
};

export const fetchChatMessages = async (chatSessionId) => {
  if (!supabaseChat) {
    return {
      data: null,
      error: 'Chat Supabase instance is not configured',
      status: 500
    };
  }

  try {
    const { data, error } = await supabaseChat
      .from('chat_messages')
      .select('*')
      .eq('chat_session_id', chatSessionId)
      .order('created_at', { ascending: true });

    if (error) {
      return {
        data: null,
        error: error.message,
        status: 400
      };
    }

    return {
      data,
      error: null,
      status: 200
    };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error',
      status: 500
    };
  }
};

// Learning Path API
export const fetchLearningPathsByField = async (fieldId) => {
  if (!supabaseChat) {
    return {
      data: null,
      error: 'Chat Supabase instance is not configured',
      status: 500
    };
  }

  try {
    const { data, error } = await supabaseChat
      .from('learning_paths')
      .select(`
        *,
        courses:learning_path_courses(
          *,
          course:courses(*)
        )
      `)
      .eq('is_active', true)
      .order('name');

    if (error) {
      return {
        data: null,
        error: error.message,
        status: 400
      };
    }

    // Filter learning paths that have courses in the specified field
    const filteredPaths = data?.filter((path) =>
      path.courses.some((lpc) => lpc.course.field_id === fieldId)
    ) || [];

    return {
      data: filteredPaths,
      error: null,
      status: 200
    };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error',
      status: 500
    };
  }
};

// Send AI message with real-time updates
export const sendAIMessageWithRealtime = async (
  message,
  fieldId,
  sessionId,
  field = null,
  callbacks = {}
) => {
  if (!supabaseChat) {
    const error = 'Chat Supabase instance is not configured';
    if (callbacks.onJobFailed) {
      callbacks.onJobFailed(error);
    }
    return {
      data: null,
      error,
      status: 500
    };
  }

  try {
    // Create a job for processing the message
    const jobId = crypto.randomUUID();
    
    // Notify about job creation
    if (callbacks.onJobCreated) {
      callbacks.onJobCreated(jobId);
    }
    
    // Update status to pending
    if (callbacks.onJobStatusUpdate) {
      callbacks.onJobStatusUpdate('pending', 10);
    }
    
    // First, lookup the session to get the UUID
    const { data: sessionData, error: sessionError } = await supabaseChat
      .from('chat_sessions')
      .select('id')
      .eq('session_id', sessionId)
      .single();

    if (sessionError || !sessionData) {
      throw new Error(`Không thể tìm thấy phiên: ${sessionError?.message || 'Phiên không được tìm thấy'}`);
    }

    // Insert job into database using the session UUID
    const { error: jobError } = await supabaseChat
      .from('chat_jobs')
      .insert({
        job_id: jobId,
        chat_session_id: sessionData.id,
        user_message: message,
        status: 'pending',
        priority: 5,
        field_id: fieldId,
        metadata: {
          field_name: field?.name,
          source: 'web-app'
        }
      })
      .select()
      .single();

    if (jobError) {
      throw new Error(`Không thể tạo công việc: ${jobError.message}`);
    }
    
    // Update status to processing
    if (callbacks.onJobStatusUpdate) {
      callbacks.onJobStatusUpdate('processing', 50);
    }
    
    // Get AI response using streaming with real-time updates
    const fieldOfStudy = field ? {
      id: field.id,
      name: field.name,
      description: field.description || undefined
    } : undefined;
    
    let fullResponse = '';
    let contextInfo = { contextMessages: 0, hasContext: false };
    
    await getAIResponseStreamWithCallback(message, fieldOfStudy, sessionId, {
      onChunk: (chunk) => {
        fullResponse += chunk;
        // Update with partial response for real-time display
        if (callbacks.onJobStatusUpdate) {
          callbacks.onJobStatusUpdate('streaming', 75);
        }
        if (callbacks.onJobCompleted) {
          callbacks.onJobCompleted(fullResponse, contextInfo);
        }
      },
      onComplete: (response, ctxInfo) => {
        fullResponse = response;
        if (ctxInfo) {
          contextInfo = ctxInfo;
        }
        // Mark as complete
        if (callbacks.onJobStatusUpdate) {
          callbacks.onJobStatusUpdate('completed', 100);
        }
        if (callbacks.onJobCompleted) {
          callbacks.onJobCompleted(response, contextInfo);
        }
      },
      onError: (error) => {
        if (callbacks.onJobFailed) {
          callbacks.onJobFailed(error.message);
        }
      }
    });
    
    // Update job with final response
    const { error: updateError } = await supabaseChat
      .from('chat_jobs')
      .update({
        status: 'completed',
        ai_response: fullResponse,
        processing_completed_at: new Date().toISOString()
      })
      .eq('job_id', jobId);

    if (updateError) {
      throw new Error(`Không thể cập nhật công việc: ${updateError.message}`);
    }
    
    return {
      data: fullResponse,
      error: null,
      status: 200
    };
  } catch (error) {
    // Notify about failure
    if (callbacks.onJobFailed) {
      callbacks.onJobFailed(error instanceof Error ? error.message : 'Unknown error');
    }
    
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error',
      status: 500
    };
  }
};

// Subscribe to real-time job updates for a session
export const subscribeToChatJobUpdates = (
  sessionId,
  callbacks
) => {
  if (!supabaseChat) {
    if (callbacks.onError) {
      callbacks.onError(new Error('Chat Supabase instance is not configured'));
    }
    return () => {};
  }

  try {
    // First, get the session UUID from session_id
    let sessionUuid = null;
    
    // Create a subscription to chat_jobs table for the specific session
    const subscription = supabaseChat
      .channel(`chat_jobs_${sessionId}`)
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'chat_jobs',
          filter: `session_id=eq.${sessionId}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT' && callbacks.onJobCreated) {
            callbacks.onJobCreated(payload.new);
          } else if (payload.eventType === 'UPDATE' && callbacks.onJobStatusUpdate) {
            callbacks.onJobStatusUpdate(payload.new);
          }
        }
      )
      .subscribe();

    // Create a subscription to chat_messages table for new messages
    const messageSubscription = supabaseChat
      .channel(`chat_messages_${sessionId}`)
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'chat_messages',
          filter: `session_id=eq.${sessionId}`
        },
        (payload) => {
          if (callbacks.onNewMessage) {
            callbacks.onNewMessage(payload.new);
          }
        }
      )
      .subscribe();

    // Return unsubscribe function
    return () => {
      subscription.unsubscribe();
      messageSubscription.unsubscribe();
    };
  } catch (error) {
    if (callbacks.onError) {
      callbacks.onError(error instanceof Error ? error : new Error('Subscription failed'));
    }
    // Return empty function as fallback
    return () => {};
  }
};

// Get job history for a session
export const getJobHistory = async (sessionId) => {
  if (!supabaseChat) {
    return {
      data: null,
      error: 'Chat Supabase instance is not configured',
      status: 500
    };
  }

  try {
    // First get the session UUID
    const { data: sessionData } = await supabaseChat
      .from('chat_sessions')
      .select('id')
      .eq('session_id', sessionId)
      .single();

    if (!sessionData) {
      return {
        data: [],
        error: null,
        status: 200
      };
    }

    const { data, error } = await supabaseChat
      .from('chat_jobs')
      .select('*')
      .eq('chat_session_id', sessionData.id)
      .order('created_at', { ascending: false });

    if (error) {
      return {
        data: null,
        error: error.message,
        status: 400
      };
    }

    return {
      data,
      error: null,
      status: 200
    };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error',
      status: 500
    };
  }
};

// Get active jobs for a session
export const getActiveJobs = async (sessionId) => {
  if (!supabaseChat) {
    return {
      data: null,
      error: 'Chat Supabase instance is not configured',
      status: 500
    };
  }

  try {
    // First get the session UUID
    const { data: sessionData } = await supabaseChat
      .from('chat_sessions')
      .select('id')
      .eq('session_id', sessionId)
      .single();

    if (!sessionData) {
      return {
        data: [],
        error: null,
        status: 200
      };
    }

    const { data, error } = await supabaseChat
      .from('chat_jobs')
      .select('*')
      .eq('chat_session_id', sessionData.id)
      .in('status', ['pending', 'processing', 'retrying'])
      .order('created_at', { ascending: false });

    if (error) {
      return {
        data: null,
        error: error.message,
        status: 400
      };
    }

    return {
      data,
      error: null,
      status: 200
    };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error',
      status: 500
    };
  }
};

// Cancel a job
export const cancelChatJob = async (jobId) => {
  if (!supabaseChat) {
    return {
      data: null,
      error: 'Chat Supabase instance is not configured',
      status: 500
    };
  }

  try {
    const { data, error } = await supabaseChat
      .from('chat_jobs')
      .update({ status: 'cancelled' })
      .eq('job_id', jobId)
      .select()
      .single();

    if (error) {
      return {
        data: null,
        error: error.message,
        status: 400
      };
    }

    return {
      data,
      error: null,
      status: 200
    };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error',
      status: 500
    };
  }
};

// Retry a failed job
export const retryChatJob = async (jobId) => {
  if (!supabaseChat) {
    return {
      data: null,
      error: 'Chat Supabase instance is not configured',
      status: 500
    };
  }

  try {
    const { data, error } = await supabaseChat
      .from('chat_jobs')
      .update({ status: 'pending' })
      .eq('job_id', jobId)
      .select()
      .single();

    if (error) {
      return {
        data: null,
        error: error.message,
        status: 400
      };
    }

    return {
      data,
      error: null,
      status: 200
    };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error',
      status: 500
    };
  }
};

// Enhanced session management functions
export const generateSessionId = () => {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Get or create a chat session with enhanced error handling
export const getOrCreateChatSession = async (
  sessionId,
  fieldId
) => {
  try {
    // First try to fetch existing session
    const existingSession = await fetchChatSession(sessionId);
    
    if (existingSession.data && !existingSession.error) {
      return existingSession;
    }
    
    // If session doesn't exist, create a new one
    return await createChatSession({
      session_id: sessionId,
      field_id: fieldId || undefined
    });
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error',
      status: 500
    };
  }
};

// Update session with last activity timestamp
export const updateSessionActivity = async (sessionId) => {
  try {
    return await updateChatSession(sessionId, {
      updated_at: new Date().toISOString()
    });
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error',
      status: 500
    };
  }
};

// Check if session has expired (24 hours timeout)
export const isSessionExpired = (session) => {
  const lastActivity = new Date(session.updated_at).getTime();
  const now = Date.now();
  const sessionTimeout = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
  
  return (now - lastActivity) > sessionTimeout;
};

// Get session statistics
export const getSessionStats = async (sessionId) => {
  try {
    const sessionResponse = await fetchChatSession(sessionId);
    
    if (!sessionResponse.data || sessionResponse.error) {
      return null;
    }
    
    const session = sessionResponse.data;
    const messageCount = session.messages?.length || 0;
    const sessionAge = Date.now() - new Date(session.created_at).getTime();
    const isExpired = isSessionExpired(session);
    
    // Get job statistics
    const jobHistoryResponse = await getJobHistory(sessionId);
    const jobStats = {
      activeJobsCount: 0,
      completedJobsCount: 0,
      failedJobsCount: 0
    };
    
    if (jobHistoryResponse.data && !jobHistoryResponse.error) {
      jobHistoryResponse.data.forEach(job => {
        if (job.status === 'completed') {
          jobStats.completedJobsCount++;
        } else if (job.status === 'failed') {
          jobStats.failedJobsCount++;
        } else if (['pending', 'processing', 'retrying'].includes(job.status)) {
          jobStats.activeJobsCount++;
        }
      });
    }
    
    return {
      messageCount,
      questionCount: session.question_count,
      sessionAge,
      isExpired,
      ...jobStats
    };
  } catch (error) {
    console.error('Error getting session stats:', error);
    return null;
  }
};
