import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './JobCreate.css';

function JobCreate() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        location: '',
        salaryFrom: '',
        salaryTo: '',
        deadline: '',
        experienceLevel: '',
        jobType: '',
        description: '',
        requirements: '',
        benefits: '',
        workingHours: ''
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e, isDraft = false) => {
        e.preventDefault();
        setLoading(true);

        try {
            // TODO: Call API to create job
            const jobData = {
                ...formData,
                status: isDraft ? 'draft' : 'active'
            };

            console.log('Creating job:', jobData);

            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1500));

            alert(isDraft ? 'Lưu bản nháp thành công!' : 'Đăng tin tuyển dụng thành công!');
            navigate('/employer/jobs');
        } catch (error) {
            console.error('Error creating job:', error);
            alert('Có lỗi xảy ra. Vui lòng thử lại!');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="job-create-container">
            {/* Header */}
            <div className="job-create-header">
                <h1 className="job-create-title">Tạo tin tuyển dụng mới</h1>
                <p className="job-create-subtitle">
                    Điền thông tin chi tiết về vị trí tuyển dụng
                </p>
            </div>

            <form onSubmit={(e) => handleSubmit(e, false)}>
                {/* Basic Info */}
                <div className="job-form-card">
                    <h2 className="form-section-title">Thông tin chung</h2>

                    <div className="job-form-grid">
                        <div className="job-form-field full-width">
                            <label className="job-form-label">
                                Tiêu đề công việc <span className="required">*</span>
                            </label>
                            <input
                                type="text"
                                name="title"
                                className="job-form-input"
                                value={formData.title}
                                onChange={handleChange}
                                placeholder="VD: Senior ReactJS Developer"
                                required
                            />
                        </div>

                        <div className="job-form-field">
                            <label className="job-form-label">
                                Địa điểm làm việc <span className="required">*</span>
                            </label>
                            <select
                                name="location"
                                className="job-form-select"
                                value={formData.location}
                                onChange={handleChange}
                                required
                            >
                                <option value="">Chọn địa điểm</option>
                                <option value="TP. Hồ Chí Minh">TP. Hồ Chí Minh</option>
                                <option value="Hà Nội">Hà Nội</option>
                                <option value="Đà Nẵng">Đà Nẵng</option>
                                <option value="Remote">Remote</option>
                            </select>
                        </div>

                        <div className="job-form-field">
                            <label className="job-form-label">
                                Hạn nộp hồ sơ <span className="required">*</span>
                            </label>
                            <input
                                type="date"
                                name="deadline"
                                className="job-form-input"
                                value={formData.deadline}
                                onChange={handleChange}
                                min={new Date().toISOString().split('T')[0]}
                                required
                            />
                        </div>

                        <div className="job-form-field">
                            <label className="job-form-label">
                                Kinh nghiệm yêu cầu <span className="required">*</span>
                            </label>
                            <select
                                name="experienceLevel"
                                className="job-form-select"
                                value={formData.experienceLevel}
                                onChange={handleChange}
                                required
                            >
                                <option value="">Chọn mức kinh nghiệm</option>
                                <option value="intern">Thực tập sinh</option>
                                <option value="fresher">Mới tốt nghiệp</option>
                                <option value="junior">1-2 năm</option>
                                <option value="mid">2-5 năm</option>
                                <option value="senior">5+ năm</option>
                            </select>
                        </div>

                        <div className="job-form-field">
                            <label className="job-form-label">
                                Loại hình công việc <span className="required">*</span>
                            </label>
                            <select
                                name="jobType"
                                className="job-form-select"
                                value={formData.jobType}
                                onChange={handleChange}
                                required
                            >
                                <option value="">Chọn loại hình</option>
                                <option value="fulltime">Toàn thời gian</option>
                                <option value="parttime">Bán thời gian</option>
                                <option value="contract">Hợp đồng</option>
                                <option value="remote">Remote</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Salary */}
                <div className="job-form-card">
                    <h2 className="form-section-title">Mức lương</h2>

                    <div className="job-form-field">
                        <label className="job-form-label">
                            Mức lương (VNĐ)
                        </label>
                        <div className="salary-range-inputs">
                            <input
                                type="number"
                                name="salaryFrom"
                                className="job-form-input"
                                value={formData.salaryFrom}
                                onChange={handleChange}
                                placeholder="Từ"
                                min="0"
                            />
                            <span className="salary-separator">—</span>
                            <input
                                type="number"
                                name="salaryTo"
                                className="job-form-input"
                                value={formData.salaryTo}
                                onChange={handleChange}
                                placeholder="Đến"
                                min="0"
                            />
                        </div>
                        <span className="job-form-hint">
                            Để trống nếu thỏa thuận
                        </span>
                    </div>
                </div>

                {/* Job Description */}
                <div className="job-form-card">
                    <h2 className="form-section-title">Mô tả công việc</h2>

                    <div className="job-form-grid single">
                        <div className="job-form-field">
                            <label className="job-form-label">
                                Mô tả công việc <span className="required">*</span>
                            </label>
                            <textarea
                                name="description"
                                className="job-form-textarea"
                                value={formData.description}
                                onChange={handleChange}
                                placeholder="Mô tả chi tiết về công việc, trách nhiệm..."
                                required
                            />
                        </div>

                        <div className="job-form-field">
                            <label className="job-form-label">
                                Yêu cầu ứng viên <span className="required">*</span>
                            </label>
                            <textarea
                                name="requirements"
                                className="job-form-textarea"
                                value={formData.requirements}
                                onChange={handleChange}
                                placeholder="Kỹ năng, kinh nghiệm, bằng cấp yêu cầu..."
                                required
                            />
                        </div>

                        <div className="job-form-field">
                            <label className="job-form-label">
                                Quyền lợi
                            </label>
                            <textarea
                                name="benefits"
                                className="job-form-textarea"
                                value={formData.benefits}
                                onChange={handleChange}
                                placeholder="Lương thưởng, chế độ đãi ngộ, phúc lợi..."
                            />
                        </div>

                        <div className="job-form-field">
                            <label className="job-form-label">
                                Giờ làm việc
                            </label>
                            <input
                                type="text"
                                name="workingHours"
                                className="job-form-input"
                                value={formData.workingHours}
                                onChange={handleChange}
                                placeholder="VD: 8:30 - 17:30, T2-T6"
                            />
                        </div>
                    </div>
                </div>

                {/* Form Actions */}
                <div className="job-form-card">
                    <div className="job-form-actions">
                        <button
                            type="button"
                            className="btn-back"
                            onClick={() => navigate('/employer/jobs')}
                        >
                            Quay lại
                        </button>

                        <div className="btn-actions">
                            <button
                                type="button"
                                className="btn-draft"
                                onClick={(e) => handleSubmit(e, true)}
                                disabled={loading}
                            >
                                Lưu nháp
                            </button>
                            <button
                                type="submit"
                                className="btn-submit"
                                disabled={loading}
                            >
                                Đăng tin
                            </button>
                        </div>
                    </div>
                </div>
            </form>

            {/* Loading Overlay */}
            {loading && (
                <div className="form-loading-overlay">
                    <div className="form-loading-spinner"></div>
                </div>
            )}
        </div>
    );
}

export default JobCreate;
