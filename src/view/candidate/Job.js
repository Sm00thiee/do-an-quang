import "./Job.css";
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { BsBookmark, BsBookmarkFill, BsShare, BsClock, BsGeoAlt, BsCurrencyDollar, BsBriefcase, BsPeople } from "react-icons/bs";
import { BiBuildings } from "react-icons/bi";
import jobService from "../../services/jobService";
import { useCandidateAuthStore } from "../../stores/candidateAuthStore";
import ApplyJobPopup from "../../components/ApplyJobPopup";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

function Job() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState({
    employer: {},
    jtype: {},
    jlevel: {},
    industries: [],
  });
  const user = useCandidateAuthStore((state) => state.current);
  const isAuth = useCandidateAuthStore((state) => state.isAuth);
  const [isApplied, setIsApplied] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getJobInf = async () => {
    try {
      const res = await jobService.getJobById(id);
      setJob(res);
    } catch (error) {
      console.error('Error fetching job:', error);
      alert('Không thể tải thông tin công việc. Vui lòng thử lại sau.');
    }
  };

  const checkApplying = async () => {
    try {
      const res = await jobService.checkApplying(id, user.id);
      setIsApplied(res.value);
    } catch (error) {
      console.error('Error checking application:', error);
    }
  };

  const checkJobSaved = async () => {
    try {
      const res = await jobService.checkJobSaved(id, user.id);
      setIsSaved(res.value);
    } catch (error) {
      console.error('Error checking saved job:', error);
    }
  };

  const handleApplySubmit = async (formData) => {
    setIsSubmitting(true);
    try {
      let cvUrl = null;

      // Upload CV file if provided
      if (formData.cvFile) {
        cvUrl = await jobService.uploadCV(formData.cvFile, user.id, id);
      }

      // Prepare application data
      const applicationData = {
        cv_url: cvUrl,
        cover_letter: null,
        resume_data: {
          full_name: formData.fullName,
          email: formData.email,
          phone: formData.phone,
        },
      };

      // Submit application
      await jobService.applyToJob(id, user.id, applicationData);

      alert("Ứng tuyển thành công!");
      setShowApplyModal(false);
      setIsApplied(true);
      // Refresh page to update UI
      window.location.reload();
    } catch (error) {
      console.error('Error applying to job:', error);
      const errorMessage = error.message || 'Có lỗi xảy ra khi ứng tuyển. Vui lòng thử lại sau.';
      alert(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleSaveJob = async () => {
    if (!isAuth) {
      alert("Vui lòng đăng nhập!");
      return;
    }
    try {
      await jobService.processJobSaving(id, user.id, !isSaved);
      setIsSaved(!isSaved);
    } catch (error) {
      console.error('Error saving job:', error);
      alert('Có lỗi xảy ra. Vui lòng thử lại sau.');
    }
  };

  const handleApplyClick = () => {
    if (!isAuth) {
      alert("Vui lòng đăng nhập!");
      return;
    }
    if (isApplied) {
      return;
    }
    setShowApplyModal(true);
  };

  useEffect(() => {
    getJobInf();
  }, []);

  useEffect(() => {
    if (isAuth) {
      checkApplying();
      checkJobSaved();
    }
  }, [isAuth]);

  return (
    <div className="job-detail-container">
      {/* Company Banner */}
      <div className="company-banner">
        <img
          src={job.employer.image || "https://via.placeholder.com/1200x300?text=Company+Banner"}
          alt="Company Banner"
          className="banner-image"
        />
      </div>

      {/* Job Header */}
      <div className="job-header-section">
        <div className="container">
          <div className="job-header-card">
            <div className="job-header-content">
              <div className="company-logo-container">
                <img
                  src={job.employer.logo || "https://via.placeholder.com/100"}
                  alt={job.employer.name}
                  className="company-logo"
                />
              </div>

              <div className="job-header-info">
                <h1 className="job-title">{job.jname}</h1>
                <p className="company-name">{job.employer.name}</p>

                <div className="job-quick-info">
                  <div className="info-item">
                    <BsGeoAlt />
                    <span>{job.address}</span>
                  </div>
                  <div className="info-item">
                    <BsCurrencyDollar />
                    <span>
                      {job.min_salary ? `${job.min_salary} - ${job.max_salary} triệu` : "Cạnh tranh"}
                    </span>
                  </div>
                  <div className="info-item">
                    <BsClock />
                    <span>Đăng {dayjs(job.created_at).fromNow()}</span>
                  </div>
                </div>
              </div>

              <div className="job-header-actions">
                <button
                  className={`apply-btn ${isApplied ? "applied" : ""}`}
                  onClick={handleApplyClick}
                  disabled={isApplied}
                >
                  {isApplied ? "✓ Đã ứng tuyển" : "Ứng tuyển ngay"}
                </button>
                <button className="icon-btn" onClick={toggleSaveJob}>
                  {isSaved ? <BsBookmarkFill className="saved" /> : <BsBookmark />}
                </button>
                <button className="icon-btn">
                  <BsShare />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container job-content-section">
        <div className="content-grid">
          {/* Left Column - Job Details */}
          <div className="job-details-column">
            {/* Job Overview */}
            <div className="detail-card">
              <h2 className="section-title">Thông tin chung</h2>
              <div className="job-overview-grid">
                <div className="overview-item">
                  <BsBriefcase className="overview-icon" />
                  <div>
                    <div className="overview-label">Kinh nghiệm</div>
                    <div className="overview-value">
                      {job.yoe ? `${job.yoe} năm` : "Không yêu cầu"}
                    </div>
                  </div>
                </div>

                <div className="overview-item">
                  <BiBuildings className="overview-icon" />
                  <div>
                    <div className="overview-label">Cấp bậc</div>
                    <div className="overview-value">{job.jlevel.name}</div>
                  </div>
                </div>

                <div className="overview-item">
                  <BsClock className="overview-icon" />
                  <div>
                    <div className="overview-label">Hình thức</div>
                    <div className="overview-value">{job.jtype.name}</div>
                  </div>
                </div>

                <div className="overview-item">
                  <BsPeople className="overview-icon" />
                  <div>
                    <div className="overview-label">Số lượng</div>
                    <div className="overview-value">{job.amount} người</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Job Description */}
            <div className="detail-card">
              <h2 className="section-title">Mô tả công việc</h2>
              <div className="section-content">
                {job.description || "Chưa cập nhật thông tin"}
              </div>
            </div>

            {/* Requirements */}
            <div className="detail-card">
              <h2 className="section-title">Yêu cầu ứng viên</h2>
              <div className="section-content">
                {job.requirements || "Chưa cập nhật thông tin"}
              </div>
            </div>

            {/* Benefits */}
            <div className="detail-card">
              <h2 className="section-title">Quyền lợi</h2>
              <div className="section-content">
                {job.benefits || "Chưa cập nhật thông tin"}
              </div>
            </div>

            {/* Apply CTA */}
            <div className="apply-cta-card">
              <h3>Bạn quan tâm đến vị trí này?</h3>
              <button
                className={`apply-btn-large ${isApplied ? "applied" : ""}`}
                onClick={handleApplyClick}
                disabled={isApplied}
              >
                {isApplied ? "✓ Đã ứng tuyển" : "Ứng tuyển ngay"}
              </button>
            </div>
          </div>

          {/* Right Column - Company Info */}
          <div className="company-info-column">
            <div className="detail-card sticky-card">
              <div className="company-info-header">
                <img
                  src={job.employer.logo || "https://via.placeholder.com/80"}
                  alt={job.employer.name}
                  className="company-info-logo"
                />
                <h3>{job.employer.name}</h3>
              </div>

              <div className="company-info-details">
                <div className="company-detail-item">
                  <BsPeople className="detail-icon" />
                  <div>
                    <div className="detail-label">Quy mô</div>
                    <div className="detail-value">
                      {job.employer.min_employees
                        ? `${job.employer.min_employees}${job.employer.max_employees !== 0
                          ? ` - ${job.employer.max_employees}`
                          : "+"
                        } nhân viên`
                        : "Chưa cập nhật"}
                    </div>
                  </div>
                </div>

                <div className="company-detail-item">
                  <BiBuildings className="detail-icon" />
                  <div>
                    <div className="detail-label">Ngành nghề</div>
                    <div className="detail-value">
                      {job.industries && job.industries.length > 0
                        ? job.industries.map((ind) => ind.name).join(", ")
                        : "Chưa cập nhật"}
                    </div>
                  </div>
                </div>

                <div className="company-detail-item">
                  <BsGeoAlt className="detail-icon" />
                  <div>
                    <div className="detail-label">Địa điểm</div>
                    <div className="detail-value">{job.address || "Chưa cập nhật"}</div>
                  </div>
                </div>
              </div>

              <button
                className="view-company-btn"
                onClick={() => navigate(`/companies/${job.employer.id}`)}
              >
                Xem trang công ty
              </button>
            </div>

            {/* Application Deadline */}
            <div className="detail-card deadline-card">
              <div className="deadline-content">
                <BsClock className="deadline-icon" />
                <div>
                  <div className="deadline-label">Hạn nộp hồ sơ</div>
                  <div className="deadline-date">
                    {dayjs(job.expire_at).format("DD/MM/YYYY")}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Apply Job Popup */}
      <ApplyJobPopup
        job={job}
        user={user}
        isOpen={showApplyModal}
        onClose={() => setShowApplyModal(false)}
        onSubmit={handleApplySubmit}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}

export default Job;
