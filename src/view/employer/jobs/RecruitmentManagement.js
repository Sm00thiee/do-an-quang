import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    BsPlus,
    BsSearch,
    BsPencil,
    BsTrash,
    BsEye,
    BsPeople,
    BsCalendar3
} from 'react-icons/bs';
import employerAxios from '../../../api/employerAxios';
import './RecruitmentManagement.css';

function RecruitmentManagement() {
    const navigate = useNavigate();
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchKeyword, setSearchKeyword] = useState('');
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    // Fetch jobs from API
    const fetchJobs = async () => {
        try {
            setLoading(true);
            // Temporarily use public API (will create employer-specific API later)
            const response = await employerAxios.get('/jobs', {
                params: {
                    page,
                    limit: 10,
                    keyword: searchKeyword
                }
            });

            // Add applicants_count field (mock for now)
            const jobsWithCount = (response.content || []).map(job => ({
                ...job,
                applicants_count: 0 // Mock data, will be real count later
            }));

            setJobs(jobsWithCount);
            setTotalPages(response.totalPages || 0);
        } catch (error) {
            console.error('Error fetching jobs:', error);
            setJobs([]); // Set empty array on error
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchJobs();
        // eslint-disable-next-line
    }, [page, searchKeyword]);

    const handleSearch = (e) => {
        e.preventDefault();
        setPage(0); // Reset to first page
        fetchJobs();
    };

    const handleDelete = async (jobId) => {
        if (window.confirm('Bạn có chắc muốn xóa tin tuyển dụng này?')) {
            try {
                await employerAxios.delete(`/jobs/${jobId}`);
                alert('Xóa thành công!');
                fetchJobs(); // Refresh list
            } catch (error) {
                console.error('Error deleting job:', error);
                alert('Có lỗi xảy ra khi xóa!');
            }
        }
    };

    const handleEdit = (jobId) => {
        navigate(`/employer/jobs/edit/${jobId}`);
    };

    const handleViewDetail = (jobId) => {
        navigate(`/employer/jobs/${jobId}`);
    };

    const getStatusBadge = (status, deadline) => {
        const now = new Date();
        const deadlineDate = new Date(deadline);

        if (status === 'closed' || deadlineDate < now) {
            return (
                <span className="status-badge closed">
                    <span className="status-dot"></span>
                    Kết thúc
                </span>
            );
        } else if (status === 'active') {
            return (
                <span className="status-badge active">
                    <span className="status-dot"></span>
                    Đang tuyển
                </span>
            );
        } else {
            return (
                <span className="status-badge pending">
                    <span className="status-dot"></span>
                    Chờ duyệt
                </span>
            );
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN');
    };

    return (
        <div className="recruitment-container">
            {/* Header */}
            <div className="recruitment-header">
                <div>
                    <h1 className="recruitment-title">Quản lý tuyển dụng</h1>
                    <p className="recruitment-subtitle">
                        Quản lý tất cả tin tuyển dụng của công ty
                    </p>
                </div>
                <button
                    className="create-job-btn"
                    onClick={() => navigate('/employer/jobs/create')}
                >
                    <BsPlus />
                    Tạo bài tuyển dụng mới
                </button>
            </div>

            {/* Search Section */}
            <div className="search-section">
                <form onSubmit={handleSearch} className="search-bar">
                    <div className="search-input-wrapper">
                        <BsSearch className="search-icon" />
                        <input
                            type="text"
                            placeholder="Tìm kiếm theo tên công việc..."
                            value={searchKeyword}
                            onChange={(e) => setSearchKeyword(e.target.value)}
                        />
                    </div>
                </form>
            </div>

            {/* Jobs Table */}
            <div className="jobs-table-container">
                {loading ? (
                    <div className="loading-container">
                        <div className="spinner"></div>
                    </div>
                ) : jobs.length > 0 ? (
                    <>
                        <table className="jobs-table">
                            <thead>
                                <tr>
                                    <th>Tên tin tuyển dụng</th>
                                    <th>Số lượng ứng viên</th>
                                    <th>Trạng thái</th>
                                    <th>Ngày kết thúc</th>
                                    <th>Hành động</th>
                                </tr>
                            </thead>
                            <tbody>
                                {jobs.map((job) => (
                                    <tr key={job.id}>
                                        <td>
                                            <div
                                                className="job-title-cell"
                                                onClick={() => handleViewDetail(job.id)}
                                            >
                                                {job.title}
                                            </div>
                                        </td>
                                        <td>
                                            <div className="applicants-count">
                                                <BsPeople />
                                                <span>{job.applicants_count || 0}</span>
                                            </div>
                                        </td>
                                        <td>
                                            {getStatusBadge(job.status, job.deadline)}
                                        </td>
                                        <td>
                                            <div className="date-display">
                                                <BsCalendar3 />
                                                <span>{formatDate(job.deadline)}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="action-buttons">
                                                <button
                                                    className="action-btn view"
                                                    onClick={() => handleViewDetail(job.id)}
                                                    title="Xem chi tiết"
                                                >
                                                    <BsEye />
                                                </button>
                                                <button
                                                    className="action-btn edit"
                                                    onClick={() => handleEdit(job.id)}
                                                    title="Chỉnh sửa"
                                                >
                                                    <BsPencil />
                                                </button>
                                                <button
                                                    className="action-btn delete"
                                                    onClick={() => handleDelete(job.id)}
                                                    title="Xóa"
                                                >
                                                    <BsTrash />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="pagination-container">
                                <div className="pagination-info">
                                    Trang {page + 1} / {totalPages}
                                </div>
                                <div className="pagination-buttons">
                                    <button
                                        className="pagination-btn"
                                        disabled={page === 0}
                                        onClick={() => setPage(page - 1)}
                                    >
                                        Trước
                                    </button>
                                    {[...Array(Math.min(totalPages, 5))].map((_, idx) => {
                                        const pageNum = page < 3 ? idx : page - 2 + idx;
                                        if (pageNum >= totalPages) return null;
                                        return (
                                            <button
                                                key={pageNum}
                                                className={`pagination-btn ${page === pageNum ? 'active' : ''}`}
                                                onClick={() => setPage(pageNum)}
                                            >
                                                {pageNum + 1}
                                            </button>
                                        );
                                    })}
                                    <button
                                        className="pagination-btn"
                                        disabled={page === totalPages - 1}
                                        onClick={() => setPage(page + 1)}
                                    >
                                        Sau
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="empty-state">
                        <div className="empty-icon">📋</div>
                        <h3 className="empty-title">Chưa có tin tuyển dụng nào</h3>
                        <p className="empty-description">
                            Bắt đầu tạo tin tuyển dụng đầu tiên của bạn
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default RecruitmentManagement;
