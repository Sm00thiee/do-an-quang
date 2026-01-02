import commonAxios from './commonAxios';
import candidateAxios from './candidateAxios';

const aiApi = {
    // Generate career roadmap (requires auth)
    generateRoadmap: (data) => {
        return candidateAxios.post('/ai/generate-roadmap', data);
    },

    // Complete a lesson
    completeLesson: (roadmapId, lessonId) => {
        return candidateAxios.put(`/ai/roadmaps/${roadmapId}/lessons/${lessonId}/complete`);
    },

    // Chat with AI (public for guests, saves history for logged-in)
    chat: (message, sessionId = null) => {
        return commonAxios.post('/ai/chat', { message, sessionId });
    },

    // Get chat history (requires auth)
    getChatHistory: (params) => {
        return candidateAxios.get('/ai/chat/history', { params });
    }
};

export default aiApi;
