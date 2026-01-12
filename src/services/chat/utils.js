/**
 * Chat Utilities
 * Helper functions for the chat feature
 */

import debounce from 'lodash.debounce';

/**
 * Debounce function for user input
 * @param {Function} callback
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
    return `${days} ngày`;
  } else if (hours > 0) {
    return `${hours} giờ`;
  } else if (minutes > 0) {
    return `${minutes} phút`;
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
  
  if (message.length > 2000) {
    return {
      isValid: false,
      error: 'Tin nhắn quá dài (tối đa 2000 ký tự)'
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
 * Check if browser supports required features
 * @returns {{isSupported: boolean, missingFeatures: string[]}}
 */
export const checkBrowserSupport = () => {
  const missingFeatures = [];
  
  if (!window.fetch) {
    missingFeatures.push('Fetch API');
  }
  
  if (!window.localStorage) {
    missingFeatures.push('Local Storage');
  }
  
  if (!window.sessionStorage) {
    missingFeatures.push('Session Storage');
  }
  
  return {
    isSupported: missingFeatures.length === 0,
    missingFeatures
  };
};

/**
 * Get device type for responsive design
 * @returns {'mobile'|'tablet'|'desktop'}
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
 * Get time difference in human-readable format
 * @param {string|Date} timestamp
 * @returns {string}
 */
export const getTimeDifference = (timestamp) => {
  const now = new Date();
  const past = new Date(timestamp);
  const diffMs = now - past;
  
  const seconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days} ngày trước`;
  if (hours > 0) return `${hours} giờ trước`;
  if (minutes > 0) return `${minutes} phút trước`;
  return 'Vừa xong';
};

/**
 * Format date for display
 * @param {string|Date} date
 * @returns {string}
 */
export const formatDate = (date) => {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  
  return `${day}/${month}/${year} ${hours}:${minutes}`;
};

/**
 * Truncate text with ellipsis
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
 * Sleep for specified milliseconds
 * @param {number} ms
 * @returns {Promise<void>}
 */
export const sleep = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};
