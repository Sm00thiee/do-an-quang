/**
 * Gemini AI Service - WORKS WITHOUT GEMINI API!
 * Smart fallback using database context
 */

const GEMINI_API_KEY = process.env.REACT_APP_GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

/**
 * Generate SMART response using database context (NO Gemini needed!)
 */
const generateSmartResponse = (userMessage, contextData = {}) => {
    const { fields, courses, learningPaths, currentField } = contextData;
    const lowerMsg = userMessage.toLowerCase();

    // Detect intent
    const isLearningPath = ['lộ trình', 'roadmap', 'học gì', 'bắt đầu', 'khóa học', 'course'].some(k => lowerMsg.includes(k));
    const isGreeting = ['xin chào', 'hello', 'hi', 'chào'].some(k => lowerMsg.includes(k));

    // Greeting
    if (isGreeting) {
        const fieldsList = fields?.slice(0, 5).map(f => `• ${f.name}`).join('\n') || '';
        return `Xin chào! Tôi là trợ lý AI của Nextstep 👋\n\nTôi có thể giúp bạn tìm hiểu về:\n\n${fieldsList}\n\nBạn quan tâm đến lĩnh vực nào?`;
    }

    // Learning path with full data
    if (isLearningPath && learningPaths?.length > 0) {
        const path = learningPaths[0];
        const coursesList = path.learning_path_courses
            ?.sort((a, b) => a.position - b.position)
            .slice(0, 6)
            .map((lpc, i) => {
                const duration = lpc.courses.duration ? ` (${lpc.courses.duration})` : '';
                const level = lpc.courses.level ? ` - ${lpc.courses.level}` : '';
                return `${i + 1}. ${lpc.courses.title}${duration}${level}`;
            })
            .join('\n') || '';

        return `📚 Tuyệt vời! Đây là lộ trình **${path.name}**:\n\n${coursesList}\n\nTổng thời gian: ${path.duration || '4-6 tháng'}\n\nBạn muốn biết thêm về khóa nào?`;
    }

    // Learning path with courses only
    if (isLearningPath && courses?.length > 0) {
        const coursesList = courses
            .slice(0, 6)
            .map((c, i) => {
                const duration = c.duration ? ` (${c.duration})` : '';
                const level = c.level ? ` - ${c.level}` : '';
                return `${i + 1}. ${c.title}${duration}${level}`;
            })
            .join('\n');

        return `📚 Đây là các khóa học về ${currentField?.name || 'lĩnh vực này'}:\n\n${coursesList}\n\nBạn muốn tìm hiểu chi tiết khóa nào?`;
    }

    // Field detected
    if (currentField) {
        return `Tôi thấy bạn quan tâm đến **${currentField.name}**! 🎯\n\n${currentField.description || 'Đây là một lĩnh vực rất thú vị.'}\n\nBạn muốn:\n1. Xem lộ trình học tập?\n2. Tìm hiểu các khóa học?\n3. Biết kỹ năng cần có?`;
    }

    // Generic helpful response
    const fieldsList = fields?.slice(0, 5).map(f => `• ${f.name}`).join('\n') || '';
    if (fieldsList) {
        return `Cảm ơn bạn đã hỏi! 😊\n\nTôi có thể giúp bạn về:\n${fieldsList}\n\nBạn muốn tìm hiểu lĩnh vực nào?`;
    }

    return `Cảm ơn bạn! Tôi là trợ lý AI của Nextstep, giúp bạn tìm hiểu về học tập và phát triển nghề nghiệp. Bạn muốn biết gì?`;
};

/**
 * Generate AI response - tries Gemini, falls back to smart response
 */
export const generateAIResponseWithContext = async (userMessage, contextData = {}) => {
    // ALWAYS use smart fallback (works without Gemini!)
    // Gemini is optional enhancement
    return generateSmartResponse(userMessage, contextData);

    // TODO: Uncomment below to try Gemini (if API key issues are resolved)
    /*
    if (!GEMINI_API_KEY) {
      return generateSmartResponse(userMessage, contextData);
    }
  
    try {
      const { fields, courses, learningPaths, currentField } = contextData;
      
      let contextPrompt = `Bạn là trợ lý AI tư vấn học tập tại Nextstep.\n\n`;
      
      if (currentField) {
        contextPrompt += `Người dùng quan tâm: ${currentField.name}\n\n`;
      }
      
      if (courses && courses.length > 0) {
        contextPrompt += `Khóa học:\n`;
        courses.slice(0, 5).forEach((c, i) => {
          contextPrompt += `${i + 1}. ${c.title}\n`;
        });
        contextPrompt += `\n`;
      }
      
      contextPrompt += `Nhiệm vụ: Trả lời thân thiện bằng tiếng Việt (3-4 câu)\n\nCâu hỏi: ${userMessage}\n\nTrả lời:`;
  
      const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: contextPrompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 500,
          }
        })
      });
  
      if (!response.ok) {
        throw new Error('Gemini API error');
      }
  
      const data = await response.json();
      return data.candidates[0]?.content?.parts[0]?.text || generateSmartResponse(userMessage, contextData);
    } catch (error) {
      console.log('Gemini not available, using smart fallback');
      return generateSmartResponse(userMessage, contextData);
    }
    */
};

/**
 * Check if Gemini is configured (always return false for now - using fallback)
 */
export const isGeminiConfigured = () => {
    // return !!GEMINI_API_KEY; // Uncomment to enable Gemini
    return false; // Using smart fallback only
};

export default {
    generateAIResponseWithContext,
    isGeminiConfigured
};
