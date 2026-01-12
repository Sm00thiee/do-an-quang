/**
 * AI Service for Chat Feature
 * Ported from CourseAiChat/src/services/aiService.ts
 * CRITICAL: Uses CHAT_EDGE_FUNCTIONS_URL and supabaseChat
 */

import { supabaseChat, CHAT_EDGE_FUNCTIONS_URL } from './supabase';
import { logger } from '../utils/logger';
import { saveGeneratedLearningPath } from './api';

// Vietnamese keywords for learning path detection
export const VIETNAMESE_LEARNING_PATH_KEYWORDS = [
  'lộ trình',
  'lo trinh',
  'tạo lộ trình',
  'tao lo trinh',
  'gợi ý lộ trình',
  'goi y lo trinh',
  'học tập',
  'hoc tap',
  'khóa học',
  'khoa hoc',
  'đào tạo',
  'dao tao',
  'chương trình học',
  'chuong trinh hoc',
  'nội dung học',
  'noi dung hoc',
  'bài học',
  'bai hoc',
  'curriculum',
  'syllabus',
  'learning path',
  'đường đi',
  'duong di',
  'con đường học tập',
  'con duong hoc tap',
  'học như thế nào',
  'hoc nhu the nao',
  'bắt đầu học',
  'bat dau hoc'
];

/**
 * Get AI response with streaming from Edge Function
 */
export async function getAIResponseStream(request, callbacks) {
  const requestId = crypto.randomUUID();
  
  try {
    logger.info('AIService', 'Processing streaming AI request', {
      requestId,
      sessionId: request.sessionId,
      fieldId: request.fieldOfStudy?.id,
      messageLength: request.message.length
    });

    if (!supabaseChat) {
      throw new Error('Chat Supabase instance is not configured');
    }

    const { data: { session } } = await supabaseChat.auth.getSession();
    const token = session?.access_token;

    const edgeFunctionUrl = `${CHAT_EDGE_FUNCTIONS_URL}/chat-submit`;
    
    if (!edgeFunctionUrl || edgeFunctionUrl.includes('undefined')) {
      throw new Error('Chat Edge Functions URL is not configured');
    }

    const response = await fetch(edgeFunctionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token || process.env.REACT_APP_CHAT_SUPABASE_ANON_KEY || ''}`,
      },
      body: JSON.stringify({
        session_id: request.sessionId,
        message: request.message,
        field_id: request.fieldOfStudy?.id,
        field_name: request.fieldOfStudy?.name,
        conversation_history: request.conversationHistory || []
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) {
      throw new Error('No response body');
    }

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
            
            if (data.type === 'chunk') {
              fullResponse += data.content;
              if (callbacks.onChunk) {
                callbacks.onChunk(data.content);
              }
            } else if (data.type === 'done') {
              logger.info('AIService', 'Streaming completed with context', {
                requestId,
                sessionId: request.sessionId,
                responseLength: data.full_response?.length,
                tokensUsed: data.tokens_used,
                model: data.model,
                contextMessages: data.context_messages || 0,
                hasContext: data.has_context || false
              });
              if (callbacks.onComplete) {
                callbacks.onComplete(data.full_response || fullResponse, {
                  contextMessages: data.context_messages || 0,
                  hasContext: data.has_context || false
                });
              }
            } else if (data.type === 'error') {
              throw new Error(data.error);
            }
          } catch (e) {
            // Skip invalid JSON
          }
        }
      }
    }
  } catch (error) {
    logger.error('AIService', 'Streaming AI request failed', error instanceof Error ? error : new Error('Unknown error'), {
      requestId: crypto.randomUUID(),
      sessionId: request.sessionId
    });
    if (callbacks.onError) {
      callbacks.onError(error instanceof Error ? error : new Error('Unknown error'));
    }
  }
}

/**
 * Get AI response from Edge Function (with streaming support)
 */
export async function getAIResponse(request) {
  const requestId = crypto.randomUUID();
  
  try {
    logger.info('AIService', 'Processing AI request', {
      requestId,
      sessionId: request.sessionId,
      fieldId: request.fieldOfStudy?.id,
      messageLength: request.message.length
    });

    // Use streaming API and accumulate full response
    return new Promise((resolve, reject) => {
      let fullResponse = '';
      
      getAIResponseStream(request, {
        onChunk: (chunk) => {
          fullResponse += chunk;
        },
        onComplete: (response) => {
          logger.info('AIService', 'AI request completed', {
            requestId,
            sessionId: request.sessionId,
            responseLength: response.length
          });
          resolve({
            response: response || fullResponse,
            isRelevant: true
          });
        },
        onError: (error) => {
          reject(error);
        }
      }).catch(reject);
    });
  } catch (error) {
    logger.error('AIService', 'AI request failed', error instanceof Error ? error : new Error('Unknown error'), {
      requestId,
      sessionId: request.sessionId
    });

    // Fallback to mock response if Edge Functions are not available
    if (error instanceof Error && error.message.includes('fetch')) {
      logger.warn('AIService', 'Edge Functions unavailable, falling back to mock response', {
        requestId,
        sessionId: request.sessionId,
        fieldId: request.fieldOfStudy?.id,
        errorMessage: error.message
      });
      
      const mockResponse = getMockAIResponse(request.message, request.fieldOfStudy);
      
      logger.info('AIService', 'Mock response returned', {
        requestId,
        sessionId: request.sessionId,
        fieldId: request.fieldOfStudy?.id,
        responseLength: mockResponse?.length
      });
      
      return {
        response: mockResponse,
        isRelevant: true
      };
    }

    throw error;
  }
}

/**
 * Get mock AI response for fallback
 */
function getMockAIResponse(question, field) {
  const fieldName = field?.name || 'general';
  
  const responses = {
    'Computer Science': [
      'That\'s a great question about computer science! Let me help you understand this concept better.',
      'In computer science, this topic relates to fundamental programming concepts that are essential for software development.',
      'This is an important concept in CS that has practical applications in modern technology.'
    ],
    'Data Science': [
      'Data science offers fascinating insights into this topic. Let me explain how we can approach this analytically.',
      'This question relates to key data science principles including statistical analysis and data interpretation.',
      'In data science, we often approach problems like this using both quantitative and qualitative methods.'
    ],
    'Web Development': [
      'Web development provides many solutions for this challenge. Let me share some best practices.',
      'This is a common scenario in web development that can be addressed using modern frameworks and techniques.',
      'In web development, we have several approaches to solve this type of problem effectively.'
    ],
    'default': [
      'That\'s an interesting question! Let me provide you with a comprehensive answer.',
      'I understand you\'re curious about this topic. Let me break it down for you.',
      'This is a great question that touches on important concepts. Let me explain it clearly.'
    ]
  };

  const fieldResponses = responses[fieldName] || responses.default;
  return fieldResponses[Math.floor(Math.random() * fieldResponses.length)];
}

/**
 * Check if message is a learning path request
 */
export function isLearningPathRequest(message) {
  const normalizedMessage = message.toLowerCase();
  return VIETNAMESE_LEARNING_PATH_KEYWORDS.some(keyword =>
    normalizedMessage.includes(keyword)
  );
}

/**
 * Get learning path response from CSV data
 * Simplified version - can be enhanced with actual CSV parsing later
 */
export async function getLearningPathResponse(
  message,
  fieldOfStudy,
  sessionId,
  chatSessionId
) {
  try {
    logger.info('AIService', 'Processing learning path request', {
      messageLength: message.length,
      fieldId: fieldOfStudy?.id,
      fieldName: fieldOfStudy?.name,
      sessionId
    });

    // For now, return a placeholder response
    // This can be enhanced with actual CSV data parsing later
    const response = `Tôi hiểu bạn muốn xem lộ trình học tập cho **${fieldOfStudy?.name || 'lĩnh vực này'}**.\n\n` +
                     `Hiện tại tính năng này đang được phát triển. Vui lòng thử lại sau.`;

    return {
      success: true,
      response
    };
  } catch (error) {
    logger.error('AIService', 'Error processing learning path request', error instanceof Error ? error : new Error('Unknown error'));
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Đã xảy ra lỗi khi xử lý yêu cầu lộ trình học tập'
    };
  }
}

/**
 * Enhanced AI response with learning path detection
 */
export async function getAIResponseWithLearningPath(request) {
  const requestId = crypto.randomUUID();
  
  try {
    logger.info('AIService', 'Processing AI request with learning path detection', {
      requestId,
      sessionId: request.sessionId,
      fieldId: request.fieldOfStudy?.id,
      messageLength: request.message.length
    });

    // Check if this is a learning path request
    if (isLearningPathRequest(request.message)) {
      logger.info('AIService', 'Learning path request detected, using CSV data', {
        requestId,
        sessionId: request.sessionId
      });

      // Pass session IDs for auto-saving (Step 5 of workflow)
      const learningPathResponse = await getLearningPathResponse(
        request.message,
        request.fieldOfStudy,
        request.sessionId,
        request.chatSessionId
      );

      if (learningPathResponse.success && learningPathResponse.response) {
        return {
          response: learningPathResponse.response,
          isRelevant: true
        };
      } else {
        // Fall back to normal AI response with error message
        logger.warn('AIService', 'Learning path processing failed, falling back to AI', {
          requestId,
          error: learningPathResponse.error
        });
      }
    }

    // Use normal AI response for non-learning-path requests
    return await getAIResponse(request);
  } catch (error) {
    logger.error('AIService', 'AI response with learning path failed', error instanceof Error ? error : new Error('Unknown error'), {
      requestId,
      sessionId: request.sessionId
    });

    // Fallback to mock response if Edge Functions are not available
    if (error instanceof Error && error.message.includes('fetch')) {
      logger.warn('AIService', 'Edge Functions unavailable, falling back to mock response', {
        requestId,
        sessionId: request.sessionId,
        fieldId: request.fieldOfStudy?.id,
        errorMessage: error.message
      });
      
      const mockResponse = getMockAIResponse(request.message, request.fieldOfStudy);
      
      logger.info('AIService', 'Mock response returned', {
        requestId,
        sessionId: request.sessionId,
        fieldId: request.fieldOfStudy?.id,
        responseLength: mockResponse?.length
      });
      
      return {
        response: mockResponse,
        isRelevant: true
      };
    }

    throw error;
  }
}
