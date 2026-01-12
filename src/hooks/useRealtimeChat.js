/**
 * Custom hook for managing real-time chat functionality
 * Ported from CourseAiChat/src/hooks/useRealtimeChat.ts
 * Handles subscriptions to job status updates and new messages
 */

import { useEffect, useRef, useCallback } from 'react';
import { useAppContext } from '../contexts/AppContext';
import realtimeService from '../services/realtimeService';

/**
 * Custom hook for managing real-time chat functionality
 * @returns {Object} Real-time chat state and methods
 */
export const useRealtimeChat = () => {
  const { state, dispatch } = useAppContext();
  
  const isInitialized = useRef(false);
  const currentSessionId = useRef(null);

  // Update AppContext state when service state changes
  const updateAppContextState = useCallback(() => {
    const serviceState = realtimeService.getState();
    dispatch({
      type: 'SET_REALTIME_STATE',
      payload: serviceState
    });
  }, [dispatch]);

  // Handle job status updates
  const handleJobStatusUpdate = useCallback((event) => {
    const { job, old_status, new_status } = event.data;

    // Remove job from active jobs first
    dispatch({
      type: 'REMOVE_ACTIVE_JOB',
      payload: job.job_id
    });

    // Add job to active list if it's still being processed
    if (['pending', 'processing', 'retrying'].includes(new_status)) {
      dispatch({
        type: 'ADD_ACTIVE_JOB',
        payload: job
      });
    }

    // Move job to history if completed or failed
    if (['completed', 'failed'].includes(new_status)) {
      dispatch({
        type: 'ADD_JOB_HISTORY',
        payload: job
      });
    }

    // Dispatch optimistic UI updates
    if (new_status === 'completed' && job.assistant_message_id) {
      // If job completed successfully, we might want to refresh messages
      // This will be handled by the new message event
    } else if (new_status === 'failed') {
      // Handle job failure - could show error notification
      dispatch({
        type: 'SET_ERROR',
        payload: `Job failed: ${job.error_message || 'Unknown error'}`
      });
    }

    console.log(`Job ${job.job_id} status changed from ${old_status} to ${new_status}`);
  }, [dispatch]);

  // Handle new messages
  const handleNewMessage = useCallback((event) => {
    const { message } = event.data;

    // Add message to the app context
    dispatch({
      type: 'ADD_MESSAGE',
      payload: message
    });

    console.log('New message received:', message.id);
  }, [dispatch]);

  // Handle job creation
  const handleJobCreated = useCallback((event) => {
    const { job } = event.data;

    // Add to active jobs if it's a new job
    if (['pending', 'processing', 'retrying'].includes(job.status)) {
      dispatch({
        type: 'ADD_ACTIVE_JOB',
        payload: job
      });
    }

    console.log('New job created:', job.job_id);
  }, [dispatch]);

  // Handle job failures
  const handleJobFailed = useCallback((event) => {
    const { job_id, error_message, retry_count, max_retries } = event.data;

    // Update active jobs to remove the failed job
    dispatch({
      type: 'REMOVE_ACTIVE_JOB',
      payload: job_id
    });

    // Show error notification if max retries reached
    if (retry_count >= max_retries) {
      dispatch({
        type: 'SET_ERROR',
        payload: `Job ${job_id} failed permanently: ${error_message}`
      });
    }

    console.error(`Job ${job_id} failed:`, error_message);
  }, [dispatch]);

  // Handle connection status changes
  const handleConnectionStatusChange = useCallback((event) => {
    const { status, message } = event.data;

    // Update loading state based on connection
    if (status === 'reconnecting') {
      dispatch({
        type: 'SET_LOADING',
        payload: true
      });
    } else if (status === 'connected') {
      dispatch({
        type: 'SET_LOADING',
        payload: false
      });
      dispatch({
        type: 'SET_ERROR',
        payload: null
      });
    } else if (status === 'error') {
      dispatch({
        type: 'SET_LOADING',
        payload: false
      });
      dispatch({
        type: 'SET_ERROR',
        payload: message || 'Real-time connection error'
      });
    }

    console.log('Connection status:', status, message);
  }, [dispatch]);

  // Handle errors
  const handleError = useCallback((error) => {
    console.error('Real-time service error:', error);
    dispatch({
      type: 'SET_ERROR',
      payload: `Real-time error: ${error.message}`
    });
  }, [dispatch]);

  // Initialize real-time subscriptions
  const subscribe = useCallback(async (sessionId) => {
    if (currentSessionId.current === sessionId && state.realtime.isConnected) {
      return; // Already subscribed to this session
    }

    currentSessionId.current = sessionId;

    try {
      await realtimeService.initialize({
        sessionId,
        onJobStatusUpdate: handleJobStatusUpdate,
        onNewMessage: handleNewMessage,
        onJobCreated: handleJobCreated,
        onJobFailed: handleJobFailed,
        onConnectionStatusChange: handleConnectionStatusChange,
        onError: handleError
      });

      isInitialized.current = true;
      updateAppContextState();
    } catch (error) {
      console.error('Failed to initialize real-time service:', error);
      handleError(error instanceof Error ? error : new Error(String(error)));
    }
  }, [
    state.realtime.isConnected,
    handleJobStatusUpdate,
    handleNewMessage,
    handleJobCreated,
    handleJobFailed,
    handleConnectionStatusChange,
    handleError,
    updateAppContextState
  ]);

  // Unsubscribe from real-time updates
  const unsubscribe = useCallback(async () => {
    try {
      await realtimeService.unsubscribe();
      currentSessionId.current = null;
      isInitialized.current = false;
      
      // Clear real-time state from AppContext
      dispatch({
        type: 'SET_ACTIVE_JOBS',
        payload: []
      });
      dispatch({
        type: 'SET_JOB_HISTORY',
        payload: []
      });
      
      updateAppContextState();
    } catch (error) {
      console.error('Failed to unsubscribe from real-time service:', error);
    }
  }, [dispatch, updateAppContextState]);

  // Reconnect to real-time service
  const reconnect = useCallback(async () => {
    try {
      await realtimeService.reconnect();
      updateAppContextState();
    } catch (error) {
      console.error('Failed to reconnect to real-time service:', error);
      handleError(error instanceof Error ? error : new Error(String(error)));
    }
  }, [handleError, updateAppContextState]);

  // Set up state polling to sync with service state
  useEffect(() => {
    const interval = setInterval(() => {
      updateAppContextState();
    }, 1000); // Update every second

    return () => clearInterval(interval);
  }, [updateAppContextState]);

  // Auto-subscribe when chat session changes
  useEffect(() => {
    if (state.chatSession?.session_id && !isInitialized.current) {
      subscribe(state.chatSession.session_id);
    }

    // Cleanup when session changes or component unmounts
    return () => {
      if (currentSessionId.current && currentSessionId.current !== state.chatSession?.session_id) {
        unsubscribe();
      }
    };
  }, [state.chatSession?.session_id, subscribe, unsubscribe]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isInitialized.current) {
        unsubscribe();
      }
    };
  }, [unsubscribe]);

  // Computed values
  const isConnected = state.realtime.isConnected;
  const isProcessing = state.activeJobs.some(job => job.status === 'processing');

  return {
    realtimeState: state.realtime,
    activeJobs: state.activeJobs,
    jobHistory: state.jobHistory,
    subscribe,
    unsubscribe,
    reconnect,
    isConnected,
    isProcessing
  };
};

export default useRealtimeChat;
