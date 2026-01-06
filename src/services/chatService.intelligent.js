/**
 * Intelligent Chat Service - WITH LEARNING PATH DETECTION
 * Detects field interests, learning path requests, and provides recommendations
 */

import { supabase } from './supabase';

/**
 * Lấy danh sách fields từ database
 */
export const getFields = async () => {
    const { data, error } = await supabase
        .from('fields')
        .select('*')
        .eq('is_active', true)
        .order('name');

    if (error) throw error;
    return data || [];
};

/**
 * Lấy courses theo field
 */
export const getCoursesByField = async (fieldId) => {
    const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('field_id', fieldId)
        .eq('is_active', true)
        .order('created_at');

    if (error) throw error;
    return data || [];
};

/**
 * Lấy learning paths theo field
 */
export const getLearningPathsByField = async (fieldId) => {
    const { data, error } = await supabase
        .from('learning_paths')
        .select(`
      *,
      learning_path_courses (
        position,
        courses (
          id,
          title,
          description,
          duration
        )
      )
    `)
        .eq('field_id', fieldId)
        .order('created_at');

    if (error) throw error;
    return data || [];
};

/**
 * Lấy tin nhắn của session
 */
export const getMessages = async (sessionId) => {
    const { data: session } = await supabase
        .from('chat_sessions')
        .select('id')
        .eq('session_id', sessionId)
        .single();

    if (!session) throw new Error('Session not found');

    const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('chat_session_id', session.id)
        .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
};

/**
 * Tạo tin nhắn mới
 */
export const createMessage = async (sessionId, role, content) => {
    const { data: session } = await supabase
        .from('chat_sessions')
        .select('id')
        .eq('session_id', sessionId)
        .single();

    if (!session) throw new Error('Session not found');

    const { data, error } = await supabase
        .from('chat_messages')
        .insert({
            chat_session_id: session.id,
            role,
            content
        })
        .select()
        .single();

    if (error) throw error;
    return data;
};

/**
 * DETECT LEARNING PATH REQUEST
 * Vietnamese keywords for learning path detection
 */
const LEARNING_PATH_KEYWORDS = [
    'lộ trình', 'lo trinh', 'roadmap', 'học gì', 'hoc gi',
    'học như thế nào', 'hoc nhu the nao', 'học thế nào', 'hoc the nao',
    'bắt đầu', 'bat dau', 'khóa học', 'khoa hoc', 'course',
    'learning path', 'syllabus', 'curriculum', 'chương trình', 'chuong trinh'
];

const isLearningPathRequest = (message) => {
    const lowerMessage = message.toLowerCase();
    return LEARNING_PATH_KEYWORDS.some(keyword => lowerMessage.includes(keyword));
};

/**
 * DETECT FIELD INTEREST
 */
const FIELD_KEYWORDS = {
    marketing: ['marketing', 'quảng cáo', 'quang cao', 'digital marketing'],
    'ui-ux': ['ui', 'ux', 'thiết kế', 'thiet ke', 'design', 'figma'],
    'graphic-design': ['đồ họa', 'do hoa', 'graphic', 'photoshop', 'illustrator'],
    'mobile-dev': ['mobile', 'app', 'ứng dụng', 'ung dung', 'android', 'ios'],
    'web-dev': ['web', 'website', 'frontend', 'backend', 'fullstack']
};

const detectField = async (message) => {
    const lowerMessage = message.toLowerCase();

    // Get all fields first
    const allFields = await getFields();

    for (const [fieldKey, keywords] of Object.entries(FIELD_KEYWORDS)) {
        if (keywords.some(keyword => lowerMessage.includes(keyword))) {
            // Find matching field from loaded fields
            const matchedField = allFields.find(f =>
                f.name.toLowerCase().includes(fieldKey.split('-')[0].toLowerCase()) ||
                keywords.some(kw => f.name.toLowerCase().includes(kw.toLowerCase()))
            );

            if (matchedField) return matchedField;
        }
    }

    return null;
};

/**
 * GENERATE INTELLIGENT AI RESPONSE
 */
export const generateIntelligentResponse = async (userMessage, sessionFieldId = null) => {
    const isLearningPathReq = isLearningPathRequest(userMessage);
    const detectedField = await detectField(userMessage);

    // Case 1: Learning path request với field đã biết
    if (isLearningPathReq && (sessionFieldId || detectedField)) {
        const fieldId = sessionFieldId || detectedField.id;
        const learningPaths = await getLearningPathsByField(fieldId);
        const courses = await getCoursesByField(fieldId);

        if (learningPaths.length > 0) {
            const path = learningPaths[0];
            const courseList = path.learning_path_courses
                .map((lpc, idx) => `${idx + 1}. ${lpc.courses.title} (${lpc.courses.duration})`)
                .join('\n');

            return `📚 Tuyệt vời! Đây là lộ trình học **${path.name}**:\n\n${courseList}\n\nBạn muốn biết thêm về khóa học nào?`;
        } else if (courses.length > 0) {
            const courseList = courses
                .slice(0, 5)
                .map((c, idx) => `${idx + 1}. ${c.title}`)
                .join('\n');

            return `📚 Dưới đây là các khóa học về ${detectedField?.name || 'lĩnh vực này'}:\n\n${courseList}\n\nBạn muốn tìm hiểu thêm về khóa nào?`;
        }
    }

    // Case 2: Chỉ detect field (chưa hỏi learning path)
    if (detectedField && !isLearningPathReq) {
        return `Tôi thấy bạn quan tâm đến **${detectedField.name}**! 🎯\n\nĐây là một lĩnh vực rất thú vị. Bạn muốn:\n\n1. Xem lộ trình học tập cho ${detectedField.name}?\n2. Tìm hiểu các khóa học cụ thể?\n3. Biết kỹ năng cần có để làm việc trong lĩnh vực này?`;
    }

    // Case 3: Hỏi chung, chưa detect được gì
    const allFields = await getFields();
    if (allFields.length > 0) {
        const fieldList = allFields
            .slice(0, 5)
            .map(f => `• ${f.name}`)
            .join('\n');

        return `Xin chào! Tôi là trợ lý AI của Nextstep 👋\n\nTôi có thể giúp bạn tìm hiểu về các lĩnh vực sau:\n\n${fieldList}\n\nBạn quan tâm đến lĩnh vực nào?`;
    }

    // Fallback
    return `Cảm ơn bạn đã nhắn tin! Bạn muốn tìm hiểu về lĩnh vực nào? (Marketing, UI/UX, Web Development, ...)`;
};

/**
 * GỬI TIN NHẮN VÀ NHẬN AI RESPONSE với Gemini
 */
export const sendMessageWithResponse = async (sessionId, userMessage, fieldId = null) => {
    // 1. Tạo user message
    await createMessage(sessionId, 'user', userMessage);

    // 2. Generate AI response
    await new Promise(resolve => setTimeout(resolve, 500));

    try {
        // Import Gemini service
        const { generateAIResponseWithContext, isGeminiConfigured } = await import('./geminiService');

        if (isGeminiConfigured()) {
            // Load fields và field-specific data
            const allFields = await getFields();
            let courses = [];
            let learningPaths = [];
            let currentField = null;

            // Detect field từ message
            const detectedField = await detectField(userMessage);
            const targetFieldId = fieldId || detectedField?.id;

            if (targetFieldId) {
                currentField = allFields.find(f => f.id === targetFieldId) || detectedField;
                try {
                    // Load courses và learning paths
                    [courses, learningPaths] = await Promise.all([
                        getCoursesByField(targetFieldId),
                        getLearningPathsByField(targetFieldId)
                    ]);
                } catch (error) {
                    console.error('Error loading field data:', error);
                    // Nếu lỗi, để empty array - Gemini sẽ tự generate
                    courses = [];
                    learningPaths = [];
                }
            }

            // Generate AI response with full context
            const aiResponse = await generateAIResponseWithContext(userMessage, {
                fields: allFields,
                courses,
                learningPaths,
                currentField
            });

            await createMessage(sessionId, 'assistant', aiResponse);
        } else {
            // Fallback nếu không có Gemini
            const aiResponse = await generateIntelligentResponse(userMessage, fieldId);
            await createMessage(sessionId, 'assistant', aiResponse);
        }
    } catch (error) {
        console.error('Error generating AI response:', error);
        // Fallback on error
        const aiResponse = await generateIntelligentResponse(userMessage, fieldId);
        await createMessage(sessionId, 'assistant', aiResponse);
    }

    return await getMessages(sessionId);
};

// Export all functions
export default {
    getFields,
    getCoursesByField,
    getLearningPathsByField,
    getMessages,
    createMessage,
    sendMessageWithResponse,
    generateIntelligentResponse
};
