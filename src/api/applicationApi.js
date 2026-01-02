import employerAxios from './employerAxios';

const applicationApi = {
    // Apply for a job
    apply: (jobId, data) => {
        return employerAxios.post('/applications/apply', {
            jobId,
            ...data
        });
    },

    // Get my applications (candidate)
    getMyApplications: (params) => {
        return employerAxios.get('/applications/my-applications', { params });
    },

    // Get applications for a job (employer)
    getJobApplications: (jobId, params) => {
        return employerAxios.get(`/applications/job/${jobId}`, { params });
    },

    // Review application (employer)
    reviewApplication: (applicationId, data) => {
        return employerAxios.put(`/applications/${applicationId}/review`, data);
    },

    // Withdraw application (candidate)
    withdrawApplication: (applicationId) => {
        return employerAxios.delete(`/applications/${applicationId}`);
    }
};

export default applicationApi;
