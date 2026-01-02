// Authentication Guard Hook
// Use this hook to protect features that require login

import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useCandidateAuthStore } from '../stores/candidateAuthStore';
import { useEmployerAuthStore } from '../stores/employerAuthStore';

export const useAuthGuard = () => {
    const navigate = useNavigate();
    const candidateAuth = useCandidateAuthStore();
    const employerAuth = useEmployerAuthStore();

    const isAuthenticated = !!candidateAuth.currentCandidate || !!employerAuth.user;
    const user = candidateAuth.currentCandidate || employerAuth.user;

    const requireAuth = (action, message = 'Vui lòng đăng nhập để sử dụng chức năng này') => {
        if (!isAuthenticated) {
            toast.info(message, {
                position: 'top-right',
                autoClose: 3000
            });
            navigate('/login');
            return false;
        }
        return true;
    };

    const requireRole = (allowedRoles, action) => {
        if (!isAuthenticated) {
            toast.info('Vui lòng đăng nhập');
            navigate('/login');
            return false;
        }

        if (!allowedRoles.includes(user?.role)) {
            toast.error('Bạn không có quyền truy cập chức năng này');
            return false;
        }

        return true;
    };

    return {
        isAuthenticated,
        user,
        requireAuth,
        requireRole
    };
};

// Usage example:
// const { requireAuth } = useAuthGuard();
// 
// const handleSaveJob = () => {
//     if (!requireAuth(() => saveJob(jobId), 'Đăng nhập để lưu việc làm')) return;
//     // Proceed with action
// };
