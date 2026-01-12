/**
 * Intelligent Chat Service - WITH LEARNING PATH DETECTION
 * Detects field interests, learning path requests, and provides recommendations
 * Sử dụng chat Supabase instance
 */

import { supabaseChat } from './supabase';

/**
 * Lấy danh sách fields từ database
 */
export const getFields = async () => {
    // Default fallback fields
    const fallbackFields = [
        { id: '1', name: 'Marketing', description: 'Digital marketing and brand management', is_active: true },
        { id: '2', name: 'UI/UX Design', description: 'User interface and experience design', is_active: true },
        { id: '3', name: 'Graphic Design', description: 'Visual communication and design', is_active: true },
        { id: '4', name: 'Web Development', description: 'Frontend and backend development', is_active: true },
        { id: '5', name: 'Mobile Development', description: 'iOS and Android app development', is_active: true }
    ];
    
    if (!supabaseChat) {
        // Return default fields if chat Supabase is not configured
        return fallbackFields;
    }
    
    try {
        const { data, error } = await supabaseChat
            .from('fields')
            .select('*')
            .eq('is_active', true)
            .order('name');

        if (error) {
            // If 401 or other Supabase errors, return fallback fields
            if (error.message && error.message.includes('Invalid API key')) {
                console.warn('[chatService.intelligent] Invalid API key in getFields, using fallback fields');
                return fallbackFields;
            }
            throw error;
        }
        return data || fallbackFields;
    } catch (error) {
        // Any error - return fallback fields
        console.warn('[chatService.intelligent] Error getting fields, using fallback:', error.message);
        return fallbackFields;
    }
};

/**
 * Lấy courses theo field
 */
export const getCoursesByField = async (fieldId) => {
    if (!supabaseChat) {
        return []; // Return empty array if chat Supabase is not configured
    }
    
    try {
        const { data, error } = await supabaseChat
            .from('courses')
            .select('*')
            .eq('field_id', fieldId)
            .eq('is_active', true)
            .order('created_at');

        if (error) {
            // If 401 or other Supabase errors, return empty array (fallback mode)
            if (error.message && error.message.includes('Invalid API key')) {
                console.warn('[chatService.intelligent] Invalid API key in getCoursesByField, returning empty array');
                return [];
            }
            throw error;
        }
        return data || [];
    } catch (error) {
        // Any error - return empty array for fallback mode
        console.warn('[chatService.intelligent] Error getting courses, returning empty array:', error.message);
        return [];
    }
};

/**
 * Lấy learning paths theo field
 */
export const getLearningPathsByField = async (fieldId) => {
    if (!supabaseChat) {
        return []; // Return empty array if chat Supabase is not configured
    }
    
    try {
        const { data, error } = await supabaseChat
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

        if (error) {
            // If 401 or other Supabase errors, return empty array (fallback mode)
            if (error.message && error.message.includes('Invalid API key')) {
                console.warn('[chatService.intelligent] Invalid API key in getLearningPathsByField, returning empty array');
                return [];
            }
            throw error;
        }
        return data || [];
    } catch (error) {
        // Any error - return empty array for fallback mode
        console.warn('[chatService.intelligent] Error getting learning paths, returning empty array:', error.message);
        return [];
    }
};

/**
 * Lấy tin nhắn của session
 */
export const getMessages = async (sessionId) => {
    if (!supabaseChat) {
        return []; // Return empty array if chat Supabase is not configured
    }
    
    const { data: session } = await supabaseChat
        .from('chat_sessions')
        .select('id')
        .eq('session_id', sessionId)
        .single();

    if (!session) return []; // Return empty instead of throwing

    const { data, error } = await supabaseChat
        .from('chat_messages')
        .select('*')
        .eq('chat_session_id', session.id)
        .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
};

/**
 * Lấy tin nhắn từ localStorage (fallback)
 */
const getLocalMessages = (sessionId) => {
    try {
        const stored = localStorage.getItem(`chat_messages_${sessionId}`);
        return stored ? JSON.parse(stored) : [];
    } catch {
        return [];
    }
};

/**
 * Lưu tin nhắn vào localStorage (fallback)
 */
const saveLocalMessage = (sessionId, message) => {
    try {
        const messages = getLocalMessages(sessionId);
        messages.push({
            ...message,
            id: message.id || `local-${Date.now()}-${Math.random()}`,
            created_at: message.created_at || new Date().toISOString()
        });
        localStorage.setItem(`chat_messages_${sessionId}`, JSON.stringify(messages));
        return messages[messages.length - 1];
    } catch (error) {
        console.error('[chatService.intelligent] Error saving local message:', error);
        return message;
    }
};

/**
 * Tạo tin nhắn mới - with proper fallback to local storage
 */
export const createMessage = async (sessionId, role, content) => {
    // Always try local first if Supabase is not available or if we get errors
    const createLocalMessage = () => {
        const message = {
            id: `local-${Date.now()}-${Math.random()}`,
            chat_session_id: sessionId,
            role,
            content,
            created_at: new Date().toISOString()
        };
        return saveLocalMessage(sessionId, message);
    };

    // If no Supabase, always use local
    if (!supabaseChat) {
        return createLocalMessage();
    }
    
    try {
        // Lấy session UUID từ session_id string
        const { data: session, error: sessionError } = await supabaseChat
            .from('chat_sessions')
            .select('id')
            .eq('session_id', sessionId)
            .single();

        // If we get 401 or session not found, it's likely a local session
        if (sessionError) {
            if (sessionError.message && sessionError.message.includes('Invalid API key')) {
                // 401 error - API key is invalid, use local
                console.warn('[chatService.intelligent] Invalid API key, using local storage');
                return createLocalMessage();
            }
            // Other errors - session not found, use local
            console.warn('[chatService.intelligent] Session not found in Supabase, saving locally');
            return createLocalMessage();
        }

        if (!session) {
            // No session data, use local
            return createLocalMessage();
        }

        // Try to save to Supabase
        const { data, error } = await supabaseChat
            .from('chat_messages')
            .insert({
                chat_session_id: session.id,
                role,
                content
            })
            .select()
            .single();

        if (error) {
            // If insert fails (e.g., 401), fall back to local
            if (error.message && error.message.includes('Invalid API key')) {
                console.warn('[chatService.intelligent] Invalid API key on insert, saving locally');
            } else {
                console.warn('[chatService.intelligent] Error creating message in Supabase, saving locally:', error.message);
            }
            return createLocalMessage();
        }
        return data;
    } catch (error) {
        // Any exception - fall back to local
        console.warn('[chatService.intelligent] Exception creating message, saving locally:', error.message);
        return createLocalMessage();
    }
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
    try {
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
    } catch (error) {
        // If anything fails, return a simple greeting
        console.warn('[generateIntelligentResponse] Error, using simple fallback:', error.message);
        return `Xin chào! Tôi là trợ lý AI của Nextstep 👋\n\nTôi có thể giúp bạn tìm hiểu về:\n• Marketing\n• UI/UX Design\n• Graphic Design\n• Web Development\n• Mobile Development\n\nBạn quan tâm đến lĩnh vực nào?`;
    }
};

/**
 * GỬI TIN NHẮN VÀ NHẬN AI RESPONSE với Gemini
 */
export const sendMessageWithResponse = async (sessionId, userMessage, fieldId = null) => {
    // 1. Tạo user message (works in local mode too)
    const userMsg = await createMessage(sessionId, 'user', userMessage);

    // 2. Generate AI response
    await new Promise(resolve => setTimeout(resolve, 500));

    try {
        // Import Gemini service
        const { generateAIResponseWithContext, isGeminiConfigured } = await import('./geminiService');

        // Load fields (works even without chat Supabase - returns defaults)
        const allFields = await getFields();
        let courses = [];
        let learningPaths = [];
        let currentField = null;

        // Detect field từ message
        const detectedField = await detectField(userMessage);
        const targetFieldId = fieldId || detectedField?.id;

        if (targetFieldId && supabaseChat) {
            currentField = allFields.find(f => f.id === targetFieldId) || detectedField;
            try {
                // Load courses và learning paths (only if chat Supabase is configured)
                [courses, learningPaths] = await Promise.all([
                    getCoursesByField(targetFieldId),
                    getLearningPathsByField(targetFieldId)
                ]);
            } catch (error) {
                console.error('Error loading field data:', error);
                courses = [];
                learningPaths = [];
            }
        } else if (detectedField) {
            currentField = detectedField;
        }

        let aiResponse;

        if (isGeminiConfigured()) {
            // Generate AI response with full context using Gemini
            aiResponse = await generateAIResponseWithContext(userMessage, {
                fields: allFields,
                courses,
                learningPaths,
                currentField
            });
        } else {
            // Fallback nếu không có Gemini - use intelligent response
            aiResponse = await generateIntelligentResponse(userMessage, fieldId);
        }

        // 3. Tạo assistant message
        const assistantMsg = await createMessage(sessionId, 'assistant', aiResponse);

        // 4. Return messages (works in local mode - returns array with created messages)
        const messages = await getMessages(sessionId);
        
        // If in local mode and getMessages returns empty, return the messages we just created
        if (messages.length === 0 && (!supabaseChat || sessionId.startsWith('local-'))) {
            return [userMsg, assistantMsg].filter(Boolean);
        }
        
        return messages;
    } catch (error) {
        console.error('Error generating AI response:', error);
        // Fallback on error - use simple response that doesn't require Supabase
        try {
            // Import geminiService for fallback
            const { generateAIResponseWithContext } = await import('./geminiService');
            const fallbackFields = [
                { id: 'marketing', name: 'Marketing', description: 'Học về marketing và quảng cáo' },
                { id: 'ui-ux', name: 'UI/UX Design', description: 'Thiết kế giao diện và trải nghiệm người dùng' },
                { id: 'web', name: 'Web Development', description: 'Phát triển ứng dụng web' }
            ];
            const aiResponse = await generateAIResponseWithContext(userMessage, {
                fields: fallbackFields,
                currentField: null
            });
            const assistantMsg = await createMessage(sessionId, 'assistant', aiResponse);
            
            // Return messages
            const messages = await getMessages(sessionId);
            if (messages.length === 0 && (!supabaseChat || sessionId.startsWith('local-'))) {
                return [userMsg, assistantMsg].filter(Boolean);
            }
            return messages;
        } catch (fallbackError) {
            console.error('Fallback also failed:', fallbackError);
            // Last resort - return at least the user message
            return [userMsg].filter(Boolean);
        }
    }
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
