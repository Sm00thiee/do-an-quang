/**
 * Utility functions for chat feature
 * Converted from TypeScript to JavaScript
 */

import debounce from 'lodash.debounce';

/**
 * Debounce function for user input
 * @param {() => void} callback
 * @param {number} delay
 * @returns {Function}
 */
export const debounceInput = (callback, delay = 300) => {
  return debounce(callback, delay);
};

/**
 * Format session age for display
 * @param {number} ageInMs
 * @returns {string}
 */
export const formatSessionAge = (ageInMs) => {
  const minutes = Math.floor(ageInMs / (1000 * 60));
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) {
    return `${days} day${days > 1 ? 's' : ''}`;
  } else if (hours > 0) {
    return `${hours} hour${hours > 1 ? 's' : ''}`;
  } else if (minutes > 0) {
    return `${minutes} minute${minutes > 1 ? 's' : ''}`;
  } else {
    return 'Vừa xong';
  }
};

/**
 * Validate message content
 * @param {string} message
 * @returns {{isValid: boolean, error?: string}}
 */
export const validateMessage = (message) => {
  if (!message || message.trim().length === 0) {
    return {
      isValid: false,
      error: 'Tin nhắn không thể để trống'
    };
  }
  
  if (message.length > 1000) {
    return {
      isValid: false,
      error: 'Tin nhắn quá dài (tối đa 1000 ký tự)'
    };
  }
  
  // Check for potentially harmful content
  const harmfulPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi
  ];
  
  for (const pattern of harmfulPatterns) {
    if (pattern.test(message)) {
      return {
        isValid: false,
        error: 'Tin nhắn chứa nội dung không hợp lệ'
      };
    }
  }
  
  return {
    isValid: true
  };
};

/**
 * Generate a unique ID for temporary messages
 * @returns {string}
 */
export const generateTempId = () => {
  return `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Check if a message is a temporary message
 * @param {string} id
 * @returns {boolean}
 */
export const isTempMessage = (id) => {
  return id.startsWith('temp_');
};

/**
 * Format file size for display
 * @param {number} bytes
 * @returns {string}
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Truncate text for display
 * @param {string} text
 * @param {number} maxLength
 * @returns {string}
 */
export const truncateText = (text, maxLength) => {
  if (text.length <= maxLength) {
    return text;
  }
  
  return text.substr(0, maxLength - 3) + '...';
};

/**
 * Check if browser supports required features
 * @returns {{isSupported: boolean, missingFeatures: string[]}}
 */
export const checkBrowserSupport = () => {
  const missingFeatures = [];
  
  // Check for required APIs
  if (!window.fetch) {
    missingFeatures.push('Fetch API');
  }
  
  if (!window.localStorage) {
    missingFeatures.push('Local Storage');
  }
  
  if (!window.sessionStorage) {
    missingFeatures.push('Session Storage');
  }
  
  // Check for clipboard API (optional but nice to have)
  if (!navigator.clipboard) {
    missingFeatures.push('Clipboard API (copy functionality may not work)');
  }
  
  return {
    isSupported: missingFeatures.length === 0,
    missingFeatures
  };
};

/**
 * Get device type for responsive design
 * @returns {'mobile' | 'tablet' | 'desktop'}
 */
export const getDeviceType = () => {
  const width = window.innerWidth;
  
  if (width < 768) {
    return 'mobile';
  } else if (width < 1024) {
    return 'tablet';
  } else {
    return 'desktop';
  }
};

/**
 * Save data to local storage with error handling
 * @param {string} key
 * @param {any} data
 * @returns {boolean}
 */
export const saveToLocalStorage = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error('Error saving to local storage:', error);
    return false;
  }
};

/**
 * Load data from local storage with error handling
 * @template T
 * @param {string} key
 * @param {T} defaultValue
 * @returns {T}
 */
export const loadFromLocalStorage = (key, defaultValue) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error('Error loading from local storage:', error);
    return defaultValue;
  }
};

/**
 * Remove data from local storage
 * @param {string} key
 * @returns {boolean}
 */
export const removeFromLocalStorage = (key) => {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error('Error removing from local storage:', error);
    return false;
  }
};

/**
 * Generate a color based on a string (for avatars, etc.)
 * @param {string} str
 * @returns {string}
 */
export const generateColorFromString = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const hue = hash % 360;
  return `hsl(${hue}, 70%, 60%)`;
};

/**
 * Check if a URL is valid
 * @param {string} url
 * @returns {boolean}
 */
export const isValidUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Extract URLs from text
 * @param {string} text
 * @returns {string[]}
 */
export const extractUrls = (text) => {
  const urlPattern = /(https?:\/\/[^\s]+)/g;
  return text.match(urlPattern) || [];
};

/**
 * Convert plain text URLs to HTML links
 * @param {string} text
 * @returns {string}
 */
export const urlsToLinks = (text) => {
  const urlPattern = /(https?:\/\/[^\s]+)/g;
  return text.replace(urlPattern, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>');
};

/**
 * Get current timestamp in ISO format
 * @returns {string}
 */
export const getCurrentTimestamp = () => {
  return new Date().toISOString();
};

/**
 * Calculate time difference in human-readable format
 * @param {string} timestamp
 * @returns {string}
 */
export const getTimeDifference = (timestamp) => {
  const now = Date.now();
  const past = new Date(timestamp).getTime();
  const diff = now - past;
  
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) {
    return `${days} ngày trước`;
  } else if (hours > 0) {
    return `${hours} giờ trước`;
  } else if (minutes > 0) {
    return `${minutes} phút trước`;
  } else {
    return 'Vừa xong';
  }
};

/**
 * Retry function with exponential backoff
 * @template T
 * @param {() => Promise<T>} fn
 * @param {number} maxRetries
 * @param {number} baseDelay
 * @returns {Promise<T>}
 */
export const retryWithBackoff = async (fn, maxRetries = 3, baseDelay = 1000) => {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      
      if (attempt === maxRetries) {
        break;
      }
      
      // Exponential backoff with jitter
      const delay = baseDelay * Math.pow(2, attempt - 1) + Math.random() * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
};
