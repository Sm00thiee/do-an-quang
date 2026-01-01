import candidateAxios from './candidateAxios';

/**
 * Roadmap API Service
 * Kết nối với backend API cho các chức năng Roadmap
 */

// =====================================================
// ROADMAP CRUD
// =====================================================

/**
 * Lấy danh sách tất cả roadmaps của user
 * @param {Object} params - { status?, category?, page?, limit? }
 */
export const getRoadmaps = async (params = {}) => {
    try {
        const response = await candidateAxios.get('/roadmaps', { params });
        return response;
    } catch (error) {
        console.error('Error fetching roadmaps:', error);
        throw error;
    }
};

/**
 * Lấy thống kê tiến độ
 */
export const getRoadmapStats = async () => {
    try {
        const response = await candidateAxios.get('/roadmaps/stats');
        return response;
    } catch (error) {
        console.error('Error fetching roadmap stats:', error);
        throw error;
    }
};

/**
 * Lấy chi tiết một roadmap
 * @param {string} id - Roadmap ID
 */
export const getRoadmapById = async (id) => {
    try {
        const response = await candidateAxios.get(`/roadmaps/${id}`);
        return response;
    } catch (error) {
        console.error('Error fetching roadmap detail:', error);
        throw error;
    }
};

/**
 * Tạo roadmap mới
 * @param {Object} data - { title, description?, category?, sections?: [...] }
 */
export const createRoadmap = async (data) => {
    try {
        const response = await candidateAxios.post('/roadmaps', data);
        return response;
    } catch (error) {
        console.error('Error creating roadmap:', error);
        throw error;
    }
};

/**
 * Cập nhật roadmap
 * @param {string} id - Roadmap ID
 * @param {Object} data - { title?, description?, category?, status? }
 */
export const updateRoadmap = async (id, data) => {
    try {
        const response = await candidateAxios.put(`/roadmaps/${id}`, data);
        return response;
    } catch (error) {
        console.error('Error updating roadmap:', error);
        throw error;
    }
};

/**
 * Xóa roadmap
 * @param {string} id - Roadmap ID
 */
export const deleteRoadmap = async (id) => {
    try {
        const response = await candidateAxios.delete(`/roadmaps/${id}`);
        return response;
    } catch (error) {
        console.error('Error deleting roadmap:', error);
        throw error;
    }
};

// =====================================================
// SECTION OPERATIONS
// =====================================================

/**
 * Thêm section vào roadmap
 * @param {string} roadmapId - Roadmap ID
 * @param {Object} data - { title, description?, color?, icon? }
 */
export const addSection = async (roadmapId, data) => {
    try {
        const response = await candidateAxios.post(`/roadmaps/${roadmapId}/sections`, data);
        return response;
    } catch (error) {
        console.error('Error adding section:', error);
        throw error;
    }
};

/**
 * Cập nhật section
 * @param {string} sectionId - Section ID
 * @param {Object} data - { title?, description?, color?, icon?, status? }
 */
export const updateSection = async (sectionId, data) => {
    try {
        const response = await candidateAxios.put(`/roadmaps/sections/${sectionId}`, data);
        return response;
    } catch (error) {
        console.error('Error updating section:', error);
        throw error;
    }
};

/**
 * Xóa section
 * @param {string} sectionId - Section ID
 */
export const deleteSection = async (sectionId) => {
    try {
        const response = await candidateAxios.delete(`/roadmaps/sections/${sectionId}`);
        return response;
    } catch (error) {
        console.error('Error deleting section:', error);
        throw error;
    }
};

// =====================================================
// LESSON OPERATIONS
// =====================================================

/**
 * Thêm lesson vào section
 * @param {string} sectionId - Section ID
 * @param {Object} data - { title, description?, content?, duration_minutes?, skills?: [], resources?: [] }
 */
export const addLesson = async (sectionId, data) => {
    try {
        const response = await candidateAxios.post(`/roadmaps/sections/${sectionId}/lessons`, data);
        return response;
    } catch (error) {
        console.error('Error adding lesson:', error);
        throw error;
    }
};

/**
 * Cập nhật trạng thái lesson
 * @param {string} lessonId - Lesson ID
 * @param {string} status - 'completed' | 'in-progress' | 'pending'
 */
export const updateLessonStatus = async (lessonId, status) => {
    try {
        const response = await candidateAxios.put(`/roadmaps/lessons/${lessonId}/status`, { status });
        return response;
    } catch (error) {
        console.error('Error updating lesson status:', error);
        throw error;
    }
};

// =====================================================
// EXPORT ALL
// =====================================================

const roadmapApi = {
    // Roadmap CRUD
    getRoadmaps,
    getRoadmapStats,
    getRoadmapById,
    createRoadmap,
    updateRoadmap,
    deleteRoadmap,
    // Section operations
    addSection,
    updateSection,
    deleteSection,
    // Lesson operations
    addLesson,
    updateLessonStatus
};

export default roadmapApi;
