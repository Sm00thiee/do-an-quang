import candidateAxios from './candidateAxios';

const savedJobsApi = {
    // Save a job
    saveJob: (jobId) => {
        return candidateAxios.post('/saved-jobs', { jobId });
    },

    // Get saved jobs
    getSavedJobs: (params) => {
        return candidateAxios.get('/saved-jobs', { params });
    },

    // Remove saved job by ID
    removeSavedJob: (savedJobId) => {
        return candidateAxios.delete(`/saved-jobs/${savedJobId}`);
    },

    // Remove saved job by job ID
    removeSavedJobByJobId: (jobId) => {
        return candidateAxios.delete(`/saved-jobs/by-job/${jobId}`);
    },

    // Check if job is saved
    checkIfSaved: (jobId) => {
        return candidateAxios.get(`/saved-jobs/check/${jobId}`);
    }
};

export default savedJobsApi;
