import "./Job.css";
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { BsBookmark, BsBookmarkFill, BsShare, BsClock, BsGeoAlt, BsCurrencyDollar, BsBriefcase, BsPeople } from "react-icons/bs";
import { BiBuildings } from "react-icons/bi";
import jobApi from "../../api/job";
import candidateApi from "../../api/candidate";
import { useCandidateAuthStore } from "../../stores/candidateAuthStore";
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
  const [file, setFile] = useState(null);
  const [uploadMethod, setUploadMethod] = useState(""); // "upload" or "create"

  const getJobInf = async () => {
    const res = await jobApi.getById(id);
    setJob(res);
  };

  const checkApplying = async () => {
    const res = await jobApi.checkApplying(id);
    setIsApplied(res.value);
  };

  const checkJobSaved = async () => {
    const res = await candidateApi.checkJobSaved(id);
    setIsSaved(res.value);
  };

  const handleApply = async () => {
    if (uploadMethod === "upload" && !file) {
      alert("Vui lòng chọn file CV!");
      return;
    }

    if (uploadMethod === "upload") {
      const formData = new FormData();
      formData.append("cv", file);
      formData.append("fname", file.name);
      await jobApi.apply(id, formData);
    }

    alert("Ứng tuyển thành công!");
    setShowApplyModal(false);
    window.location.reload();
  };

  const toggleSaveJob = async () => {
    if (!isAuth) {
      alert("Vui lòng đăng nhập!");
      return;
    }
    const data = { status: !isSaved };
    await candidateApi.processJobSaving(id, data);
    setIsSaved(!isSaved);
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

      {/* Apply Modal */}
      {showApplyModal && (
        <div className="modal-overlay" onClick={() => setShowApplyModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <p className="modal-subtitle">Ứng tuyển vào vị trí</p>
                <h2 className="modal-title">{job.jname}</h2>
                <p className="modal-company">{job.employer.name}</p>
              </div>
              <button className="modal-close" onClick={() => setShowApplyModal(false)}>
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label>Họ và tên</label>
                <input
                  type="text"
                  className="form-input"
                  value={user ? `${user.name.lastname} ${user.name.firstname}` : ""}
                  disabled
                />
              </div>

              <div className="form-group">
                <label>Email</label>
                <input
                  type="text"
                  className="form-input"
                  value={user?.email || ""}
                  disabled
                />
              </div>

              <div className="form-group">
                <label>Chọn hồ sơ</label>
                <div className="upload-options">
                  <button
                    className={`upload-option-btn ${uploadMethod === "create" ? "active" : ""}`}
                    onClick={() => {
                      setUploadMethod("create");
                      setShowApplyModal(false);
                      navigate("/candidate/resumes");
                    }}
                  >
                    📝 Tạo hồ sơ trực tuyến
                  </button>
                  <button
                    className={`upload-option-btn ${uploadMethod === "upload" ? "active" : ""}`}
                    onClick={() => setUploadMethod("upload")}
                  >
                    📤 Tải lên CV có sẵn
                  </button>
                </div>

                {uploadMethod === "upload" && (
                  <input
                    type="file"
                    className="file-input"
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => setFile(e.target.files[0])}
                  />
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="modal-btn modal-btn-primary"
                onClick={handleApply}
                disabled={uploadMethod === "upload" && !file}
              >
                Nộp hồ sơ
              </button>
              <button
                className="modal-btn modal-btn-secondary"
                onClick={() => setShowApplyModal(false)}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Job;
