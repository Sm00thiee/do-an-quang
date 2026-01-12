/**
 * Realtime Service for Chat Feature
 * Ported from CourseAiChat/src/services/realtimeService.ts
 * CRITICAL: Uses supabaseChat instance, NOT the main supabase instance
 */

import { supabaseChat } from './supabase';
import { logger, timeFunction } from '../utils/logger';

class RealtimeService {
  constructor() {
    this.subscriptions = new Map();
    this.state = {
      isConnected: false,
      isConnecting: false,
      error: null,
      subscriptions: {
        chatJobs: false,
        chatMessages: false
      },
      lastEvent: null
    };
    this.config = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000; // Start with 1 second
    this.reconnectTimer = null;
    this.sessionUuid = null; // Store the session UUID for filtering

    // Set up global connection state listeners
    this.setupConnectionListeners();
  }

  /**
   * Initialize real-time subscriptions for a session
   */
  async initialize(config) {
    const sessionId = config.sessionId;
    
    logger.info('RealtimeService', 'Initializing real-time subscriptions', {
      sessionId,
      hasOnJobStatusUpdate: !!config.onJobStatusUpdate,
      hasOnNewMessage: !!config.onNewMessage,
      hasOnJobCreated: !!config.onJobCreated,
      hasOnJobFailed: !!config.onJobFailed,
      hasOnConnectionStatusChange: !!config.onConnectionStatusChange,
      hasOnError: !!config.onError
    });

    if (!supabaseChat) {
      const error = new Error('Chat Supabase instance is not configured');
      this.handleError(error);
      throw error;
    }

    return await timeFunction(`realtime-initialize-${sessionId}`, async () => {
      this.config = config;
      this.updateState({ isConnecting: true, error: null });

      try {
        // Get the session UUID from session_id
        const { data: sessionData, error: sessionError } = await supabaseChat
          .from('chat_sessions')
          .select('id')
          .eq('session_id', sessionId)
          .single();

        if (sessionError || !sessionData) {
          throw new Error(`Session not found: ${sessionError?.message || 'Session not found'}`);
        }

        this.sessionUuid = sessionData.id;

        // Clear any existing subscriptions
        await this.unsubscribe();
        
        // Set up new subscriptions
        await this.setupChatJobsSubscription(this.sessionUuid);
        await this.setupChatMessagesSubscription(this.sessionUuid);

        this.updateState({
          isConnected: true,
          isConnecting: false,
          error: null
        });

        this.reconnectAttempts = 0;
        this.reconnectDelay = 1000;

        logger.info('RealtimeService', 'Real-time subscriptions initialized successfully', {
          sessionId,
          sessionUuid: this.sessionUuid,
          connectedAt: new Date().toISOString()
        });

        this.emitConnectionStatus('connected', 'Successfully connected to real-time updates');
      } catch (error) {
        logger.error('RealtimeService', 'Failed to initialize real-time subscriptions', error instanceof Error ? error : new Error(String(error)), {
          sessionId
        });
        this.handleError(error instanceof Error ? error : new Error(String(error)));
      }
    }, 'RealtimeService');
  }

  /**
   * Set up subscription to chat_jobs table
   */
  async setupChatJobsSubscription(sessionUuid) {
    return await timeFunction(`setup-chat-jobs-${sessionUuid}`, async () => {
      const channelName = `chat_jobs:${sessionUuid}`;
      
      logger.debug('RealtimeService', 'Setting up chat jobs subscription', {
        sessionId: this.config?.sessionId,
        sessionUuid,
        channelName
      });
      
      const subscription = supabaseChat
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'chat_jobs',
            filter: `chat_session_id=eq.${sessionUuid}`
          },
          (payload) => {
            logger.debug('RealtimeService', 'Chat jobs change received', {
              sessionId: this.config?.sessionId,
              sessionUuid,
              eventType: payload.eventType,
              hasNew: !!payload.new,
              hasOld: !!payload.old
            });
            
            this.handleChatJobChange(payload);
          }
        )
        .subscribe((status) => {
          logger.info('RealtimeService', 'Chat jobs subscription status changed', {
            sessionId: this.config?.sessionId,
            sessionUuid,
            channelName,
            status
          });
          
          if (status === 'SUBSCRIBED') {
            this.state = {
              ...this.state,
              subscriptions: { ...this.state.subscriptions, chatJobs: true }
            };
            
            logger.info('RealtimeService', 'Chat jobs subscription successful', {
              sessionId: this.config?.sessionId,
              sessionUuid,
              channelName
            });
          } else if (status === 'CHANNEL_ERROR') {
            logger.error('RealtimeService', 'Chat jobs subscription error', new Error(`Failed to subscribe to chat_jobs: ${status}`), {
              sessionId: this.config?.sessionId,
              sessionUuid,
              channelName,
              status
            });
            
            this.handleError(new Error(`Failed to subscribe to chat_jobs: ${status}`));
          }
        });

      this.subscriptions.set('chatJobs', subscription);
      
      logger.debug('RealtimeService', 'Chat jobs subscription set up', {
        sessionId: this.config?.sessionId,
        sessionUuid,
        channelName
      });
    }, 'RealtimeService');
  }

  /**
   * Set up subscription to chat_messages table
   */
  async setupChatMessagesSubscription(sessionUuid) {
    return await timeFunction(`setup-chat-messages-${sessionUuid}`, async () => {
      const channelName = `chat_messages:${sessionUuid}`;
      
      logger.debug('RealtimeService', 'Setting up chat messages subscription', {
        sessionId: this.config?.sessionId,
        sessionUuid,
        channelName
      });
      
      const subscription = supabaseChat
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'chat_messages',
            filter: `chat_session_id=eq.${sessionUuid}`
          },
          (payload) => {
            logger.debug('RealtimeService', 'Chat messages change received', {
              sessionId: this.config?.sessionId,
              sessionUuid,
              eventType: payload.eventType,
              hasNew: !!payload.new
            });
            
            this.handleChatMessageInsert(payload);
          }
        )
        .subscribe((status) => {
          logger.info('RealtimeService', 'Chat messages subscription status changed', {
            sessionId: this.config?.sessionId,
            sessionUuid,
            channelName,
            status
          });
          
          if (status === 'SUBSCRIBED') {
            this.state = {
              ...this.state,
              subscriptions: { ...this.state.subscriptions, chatMessages: true }
            };
            
            logger.info('RealtimeService', 'Chat messages subscription successful', {
              sessionId: this.config?.sessionId,
              sessionUuid,
              channelName
            });
          } else if (status === 'CHANNEL_ERROR') {
            logger.error('RealtimeService', 'Chat messages subscription error', new Error(`Failed to subscribe to chat_messages: ${status}`), {
              sessionId: this.config?.sessionId,
              sessionUuid,
              channelName,
              status
            });
            
            this.handleError(new Error(`Failed to subscribe to chat_messages: ${status}`));
          }
        });

      this.subscriptions.set('chatMessages', subscription);
      
      logger.debug('RealtimeService', 'Chat messages subscription set up', {
        sessionId: this.config?.sessionId,
        sessionUuid,
        channelName
      });
    }, 'RealtimeService');
  }

  /**
   * Handle changes to chat_jobs table
   */
  handleChatJobChange(payload) {
    const { eventType, new: newRecord, old: oldRecord } = payload;

    if (eventType === 'INSERT') {
      this.handleJobCreated(newRecord);
    } else if (eventType === 'UPDATE') {
      this.handleJobStatusUpdate(oldRecord, newRecord);
    }
  }

  /**
   * Handle new chat message insertions
   */
  handleChatMessageInsert(payload) {
    const { new: newRecord } = payload;
    const message = newRecord;

    const event = {
      type: 'new_message',
      data: {
        message,
        chat_session_id: message.chat_session_id
      },
      timestamp: new Date().toISOString(),
      sessionId: this.config?.sessionId || ''
    };

    this.emitEvent(event);
    if (this.config?.onNewMessage) {
      this.config.onNewMessage(event);
    }
  }

  /**
   * Handle job creation
   */
  handleJobCreated(job) {
    const event = {
      type: 'job_created',
      data: { job },
      timestamp: new Date().toISOString(),
      sessionId: this.config?.sessionId || ''
    };

    this.emitEvent(event);
    if (this.config?.onJobCreated) {
      this.config.onJobCreated(event);
    }
  }

  /**
   * Handle job status updates
   */
  handleJobStatusUpdate(oldJob, newJob) {
    if (oldJob.status === newJob.status) return;

    const event = {
      type: 'job_status_update',
      data: {
        job_id: newJob.job_id,
        chat_session_id: newJob.chat_session_id,
        old_status: oldJob.status,
        new_status: newJob.status,
        job: newJob
      },
      timestamp: new Date().toISOString(),
      sessionId: this.config?.sessionId || ''
    };

    this.emitEvent(event);
    if (this.config?.onJobStatusUpdate) {
      this.config.onJobStatusUpdate(event);
    }

    // Handle job failure
    if (newJob.status === 'failed') {
      const failedEvent = {
        type: 'job_failed',
        data: {
          job_id: newJob.job_id,
          chat_session_id: newJob.chat_session_id,
          error_message: newJob.error_message || 'Unknown error',
          retry_count: newJob.retry_count,
          max_retries: newJob.max_retries
        },
        timestamp: new Date().toISOString(),
        sessionId: this.config?.sessionId || ''
      };

      if (this.config?.onJobFailed) {
        this.config.onJobFailed(failedEvent);
      }
    }
  }

  /**
   * Set up global connection listeners
   */
  setupConnectionListeners() {
    if (!supabaseChat) return;

    logger.debug('RealtimeService', 'Setting up global connection listeners');
    
    // Note: Newer Supabase clients don't expose realtime.onOpen/onClose/onError
    // Connection state is handled per-channel instead
    // We'll handle connection state in individual channel subscriptions
    
    // Mark as potentially connected (channels will verify)
    this.updateState({ isConnecting: false, isConnected: true });
  }

  /**
   * Handle reconnection logic
   */
  handleReconnection() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      logger.error('RealtimeService', 'Max reconnection attempts reached', new Error('Max reconnection attempts reached'), {
        reconnectAttempts: this.reconnectAttempts,
        maxReconnectAttempts: this.maxReconnectAttempts
      });
      
      this.handleError(new Error('Max reconnection attempts reached'));
      return;
    }

    this.reconnectAttempts++;
    this.updateState({ isConnecting: true });

    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1); // Exponential backoff

    logger.info('RealtimeService', 'Attempting reconnection', {
      reconnectAttempts: this.reconnectAttempts,
      maxReconnectAttempts: this.maxReconnectAttempts,
      delay,
      nextAttemptIn: new Date(Date.now() + delay).toISOString()
    });

    this.emitConnectionStatus('reconnecting', `Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

    this.reconnectTimer = window.setTimeout(() => {
      if (this.config) {
        logger.debug('RealtimeService', 'Executing reconnection attempt', {
          reconnectAttempts: this.reconnectAttempts,
          sessionId: this.config.sessionId
        });
        
        this.initialize(this.config).catch(error => {
          logger.error('RealtimeService', 'Reconnection failed', error instanceof Error ? error : new Error(String(error)), {
            reconnectAttempts: this.reconnectAttempts,
            sessionId: this.config?.sessionId
          });
        });
      }
    }, delay);
  }

  /**
   * Handle errors
   */
  handleError(error) {
    logger.error('RealtimeService', 'Realtime service error', error instanceof Error ? error : new Error(String(error)), {
      wasConnected: this.state.isConnected,
      wasConnecting: this.state.isConnecting,
      reconnectAttempts: this.reconnectAttempts,
      sessionId: this.config?.sessionId
    });
    
    this.updateState({
      isConnected: false,
      isConnecting: false,
      error: error.message || String(error)
    });

    this.emitConnectionStatus('error', error.message || String(error));
    if (this.config?.onError) {
      this.config.onError(error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Emit connection status events
   */
  emitConnectionStatus(status, message) {
    const event = {
      type: 'connection_status',
      data: { status, message },
      timestamp: new Date().toISOString()
    };

    this.emitEvent(event);
    if (this.config?.onConnectionStatusChange) {
      this.config.onConnectionStatusChange(event);
    }
  }

  /**
   * Emit generic events
   */
  emitEvent(event) {
    this.updateState({ lastEvent: event });
  }

  /**
   * Update internal state
   */
  updateState(updates) {
    this.state = { ...this.state, ...updates };
  }

  /**
   * Get current state
   */
  getState() {
    return { ...this.state };
  }

  /**
   * Unsubscribe from all real-time updates
   */
  async unsubscribe() {
    return await timeFunction('realtime-unsubscribe', async () => {
      logger.info('RealtimeService', 'Unsubscribing from all real-time updates', {
        sessionId: this.config?.sessionId,
        subscriptionCount: this.subscriptions.size,
        subscriptions: Array.from(this.subscriptions.keys())
      });

      // Clear reconnection timer
      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = null;
        
        logger.debug('RealtimeService', 'Cleared reconnection timer');
      }

      // Unsubscribe from all channels
      if (supabaseChat) {
        for (const [name, subscription] of this.subscriptions) {
          try {
            await supabaseChat.removeChannel(subscription);
            
            logger.debug('RealtimeService', 'Successfully unsubscribed from channel', {
              channelName: name
            });
          } catch (error) {
            logger.error('RealtimeService', 'Error unsubscribing from channel', error instanceof Error ? error : new Error(String(error)), {
              channelName: name
            });
          }
        }
      }

      this.subscriptions.clear();
      this.sessionUuid = null;
      this.updateState({
        isConnected: false,
        isConnecting: false,
        subscriptions: { chatJobs: false, chatMessages: false }
      });

      logger.info('RealtimeService', 'Successfully unsubscribed from all real-time updates', {
        sessionId: this.config?.sessionId
      });

      this.emitConnectionStatus('disconnected', 'Unsubscribed from all real-time updates');
    }, 'RealtimeService');
  }

  /**
   * Manually reconnect
   */
  async reconnect() {
    if (!this.config) {
      throw new Error('Cannot reconnect: no configuration available');
    }

    this.reconnectAttempts = 0;
    this.reconnectDelay = 1000;

    await this.unsubscribe();
    await this.initialize(this.config);
  }

  /**
   * Check if connected to real-time updates
   */
  isConnected() {
    return this.state.isConnected;
  }

  /**
   * Check if currently connecting
   */
  isConnecting() {
    return this.state.isConnecting;
  }

  /**
   * Get current error state
   */
  getError() {
    return this.state.error;
  }

  /**
   * Clean up resources
   */
  async cleanup() {
    await this.unsubscribe();
    this.config = null;
    this.reconnectAttempts = 0;
    this.reconnectDelay = 1000;
  }
}

// Create singleton instance
const realtimeService = new RealtimeService();

export default realtimeService;
export { RealtimeService };
