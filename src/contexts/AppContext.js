/**
 * AppContext for Chat Feature
 * Ported from CourseAiChat/src/contexts/AppContext.tsx
 * Provides global state management for chat functionality
 */

import React, { createContext, useContext, useReducer } from 'react';

// Initial state
const initialState = {
  selectedField: null,
  chatSession: null,
  messages: [],
  questionCount: 0,
  isLoading: false,
  error: null,
  learningPaths: [],
  showLearningPaths: false,
  userInterests: [],
  recommendationResult: null,
  lastRecommendationTime: null,
  isGeneratingRecommendations: false,
  realtime: {
    isConnected: false,
    isConnecting: false,
    error: null,
    subscriptions: {
      chatJobs: false,
      chatMessages: false
    },
    lastEvent: null
  },
  activeJobs: [],
  jobHistory: []
};

// Reducer function
const appReducer = (state, action) => {
  switch (action.type) {
    case 'SET_FIELD':
      return {
        ...state,
        selectedField: action.payload
      };
    case 'SET_CHAT_SESSION':
      return {
        ...state,
        chatSession: action.payload
      };
    case 'ADD_MESSAGE':
      return {
        ...state,
        messages: [...state.messages, action.payload]
      };
    case 'SET_MESSAGES':
      return {
        ...state,
        messages: action.payload
      };
    case 'UPDATE_MESSAGE':
      return {
        ...state,
        messages: state.messages.map(message =>
          message.id === action.payload.id
            ? {
                ...message,
                ...action.payload.updates,
                ...(action.payload.newId && { id: action.payload.newId })
              }
            : message
        )
      };
    case 'REMOVE_MESSAGE':
      return {
        ...state,
        messages: state.messages.filter(message => message.id !== action.payload)
      };
    case 'INCREMENT_QUESTION_COUNT':
      return {
        ...state,
        questionCount: state.questionCount + 1
      };
    case 'SET_QUESTION_COUNT':
      return {
        ...state,
        questionCount: action.payload
      };
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload
      };
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload
      };
    case 'SET_LEARNING_PATHS':
      return {
        ...state,
        learningPaths: action.payload
      };
    case 'TOGGLE_LEARNING_PATHS':
      return {
        ...state,
        showLearningPaths: !state.showLearningPaths
      };
    case 'RESET_SESSION':
      return {
        ...initialState
      };
    case 'SET_USER_INTERESTS':
      return {
        ...state,
        userInterests: action.payload
      };
    case 'SET_RECOMMENDATION_RESULT':
      return {
        ...state,
        recommendationResult: action.payload
      };
    case 'SET_LAST_RECOMMENDATION_TIME':
      return {
        ...state,
        lastRecommendationTime: action.payload
      };
    case 'SET_GENERATING_RECOMMENDATIONS':
      return {
        ...state,
        isGeneratingRecommendations: action.payload
      };
    case 'SET_REALTIME_STATE':
      return {
        ...state,
        realtime: action.payload
      };
    case 'SET_ACTIVE_JOBS':
      return {
        ...state,
        activeJobs: action.payload
      };
    case 'ADD_ACTIVE_JOB':
      return {
        ...state,
        activeJobs: [...state.activeJobs, action.payload].sort((a, b) => (b.priority || 0) - (a.priority || 0))
      };
    case 'UPDATE_ACTIVE_JOB':
      return {
        ...state,
        activeJobs: state.activeJobs.map(job =>
          job.job_id === action.payload.jobId
            ? { ...job, ...action.payload.updates }
            : job
        )
      };
    case 'REMOVE_ACTIVE_JOB':
      return {
        ...state,
        activeJobs: state.activeJobs.filter(job => job.job_id !== action.payload)
      };
    case 'ADD_JOB_HISTORY':
      return {
        ...state,
        jobHistory: [action.payload, ...state.jobHistory].slice(0, 50) // Keep last 50 jobs
      };
    case 'SET_JOB_HISTORY':
      return {
        ...state,
        jobHistory: action.payload
      };
    default:
      return state;
  }
};

// Create context
const AppContext = createContext(null);

// Provider component
export const AppProvider = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
};

// Custom hook to use the context
export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext phải được sử dụng trong AppProvider');
  }
  return context;
};

// Action creators for common operations
export const appActions = {
  setSelectedField: (field) => ({ type: 'SET_FIELD', payload: field }),
  setChatSession: (session) => ({ type: 'SET_CHAT_SESSION', payload: session }),
  addMessage: (message) => ({ type: 'ADD_MESSAGE', payload: message }),
  setMessages: (messages) => ({ type: 'SET_MESSAGES', payload: messages }),
  updateMessage: (id, updates) => ({
    type: 'UPDATE_MESSAGE',
    payload: { id, updates }
  }),
  removeMessage: (id) => ({ type: 'REMOVE_MESSAGE', payload: id }),
  incrementQuestionCount: () => ({ type: 'INCREMENT_QUESTION_COUNT' }),
  setQuestionCount: (count) => ({ type: 'SET_QUESTION_COUNT', payload: count }),
  setLoading: (loading) => ({ type: 'SET_LOADING', payload: loading }),
  setError: (error) => ({ type: 'SET_ERROR', payload: error }),
  setLearningPaths: (paths) => ({ type: 'SET_LEARNING_PATHS', payload: paths }),
  toggleLearningPaths: () => ({ type: 'TOGGLE_LEARNING_PATHS' }),
  resetSession: () => ({ type: 'RESET_SESSION' }),
  setUserInterests: (interests) => ({ type: 'SET_USER_INTERESTS', payload: interests }),
  setRecommendationResult: (result) => ({ type: 'SET_RECOMMENDATION_RESULT', payload: result }),
  setLastRecommendationTime: (time) => ({ type: 'SET_LAST_RECOMMENDATION_TIME', payload: time }),
  setGeneratingRecommendations: (generating) => ({ type: 'SET_GENERATING_RECOMMENDATIONS', payload: generating }),
  setRealtimeState: (realtimeState) => ({ type: 'SET_REALTIME_STATE', payload: realtimeState }),
  setActiveJobs: (jobs) => ({ type: 'SET_ACTIVE_JOBS', payload: jobs }),
  addActiveJob: (job) => ({ type: 'ADD_ACTIVE_JOB', payload: job }),
  updateActiveJob: (jobId, updates) => ({ type: 'UPDATE_ACTIVE_JOB', payload: { jobId, updates } }),
  removeActiveJob: (jobId) => ({ type: 'REMOVE_ACTIVE_JOB', payload: jobId }),
  addJobHistory: (job) => ({ type: 'ADD_JOB_HISTORY', payload: job }),
  setJobHistory: (jobs) => ({ type: 'SET_JOB_HISTORY', payload: jobs })
};
