import { useContext, useEffect, useState } from "react";
import { BsSearch, BsBookmark, BsBookmarkFill } from "react-icons/bs";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { AppContext } from "../../../App";
import {
  MdOutlineAttachMoney,
  MdLocationOn,
  MdAccessTime,
  MdWork,
  MdBusiness,
} from "react-icons/md";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

// Draft data giống VietnamWork
const MOCK_JOBS = [
  {
    id: 1,
    title: "UI/UX Designer (Web/Mobile App)",
    company: "CÔNG TY CỔ PHẦN CÔNG NGHỆ ONUSLAB",
    location: "Hà Nội",
    salary: "Đỗ phù hợp với bạn: 90%",
    postedTime: "7-12 trình",
    isUrgent: true,
    companyLogo:
      "https://static.topcv.vn/company_logos/nhan-vien-thiet-ke-3d-1-nam-kinh-nghiem-6d0d8f6a6d.jpg",
    skills: ["UI/UX", "Figma", "Adobe XD"],
    workType: "Full-time",
    experience: "1-2 năm",
  },
  {
    id: 2,
    title: "Home Trading System Developer - WLH",
    company: "CÔNG TY CỔ PHẦN SMARTOSC",
    location: "Hồ Chí Minh",
    salary: "Đỗ phù hợp với bạn: 90%",
    postedTime: "22 - 45 triệu",
    isHot: true,
    companyLogo:
      "https://static.topcv.vn/company_logos/home-trading-system-developer-wlh-a5c8b7e9f1.jpg",
    skills: ["Trading", "Java", "React"],
    workType: "Full-time",
    experience: "2-3 năm",
  },
  {
    id: 3,
    title: "Chuyên Viên Cao Cấp Phát Triển Ứng...",
    company: "Ngân Hàng Thương Mại Cổ Phần Tiên Phong",
    location: "Hà Nội",
    salary: "Đỗ phù hợp với bạn: 90%",
    postedTime: "7-12 triệu",
    isUrgent: true,
    companyLogo:
      "https://static.topcv.vn/company_logos/chuyen-vien-cao-cap-phat-trien-ung-4f3d2e1a8b.jpg",
    skills: ["Banking", "Finance", "Development"],
    workType: "Full-time",
    experience: "3-5 năm",
  },
  {
    id: 4,
    title: "Nhân Viên Thiết Kế 3D - 1 Năm Kinh...",
    company: "CÔNG TY TNHH MTV KIẾN TRÚC VẬT LIỆU TRI VIỆT",
    location: "Hà Nội",
    salary: "Đỗ phù hợp với bạn: 90%",
    postedTime: "7-12 triệu",
    companyLogo:
      "https://static.topcv.vn/company_logos/nhan-vien-thiet-ke-3d-1-nam-kinh-6e8f9a2b3c.jpg",
    skills: ["3D Design", "AutoCAD", "SketchUp"],
    workType: "Full-time",
    experience: "1 năm",
  },
  {
    id: 5,
    title: "UI/UX Designer (Web/Mobile App)",
    company: "CÔNG TY CỔ PHẦN CÔNG NGHỆ SMART SG",
    location: "Hà Nội",
    salary: "Đỗ phù hợp với bạn: 90%",
    postedTime: "7-12 triệu",
    companyLogo:
      "https://static.topcv.vn/company_logos/uiux-designer-webmobile-app-7d5e8f9a1b.jpg",
    skills: ["UI/UX", "Mobile App", "Web Design"],
    workType: "Full-time",
    experience: "2 năm",
  },
  {
    id: 6,
    title: "Nhân Viên IT",
    company: "CÔNG TY TNHH ATEC SYSTEM VIỆT NAM",
    location: "Hà Nội",
    salary: "Đỗ phù hợp với bạn: 90%",
    postedTime: "7-12 triệu",
    companyLogo:
      "https://static.topcv.vn/company_logos/nhan-vien-it-atec-system-8c9d1e2f4a.jpg",
    skills: ["IT Support", "Network", "System"],
    workType: "Full-time",
    experience: "1-2 năm",
  },
  {
    id: 7,
    title: "GRC Analyst (Governance, Risk, Com...",
    company: "CÔNG TY TNHH MTV KBN INNOVATION",
    location: "Hà Nội",
    salary: "Đỗ phù hợp với bạn: 90%",
    postedTime: "7-12 triệu",
    companyLogo:
      "https://static.topcv.vn/company_logos/grc-analyst-governance-risk-9f1a2b3c5d.jpg",
    skills: ["Risk Management", "Compliance", "Analytics"],
    workType: "Full-time",
    experience: "2-3 năm",
  },
  {
    id: 8,
    title: "Kỹ Sư Lập Trình Nhúng Firmware Điện...",
    company: "CÔNG TY TNHH EYSELAB",
    location: "Hà Nội",
    salary: "Đỗ phù hợp với bạn: 90%",
    postedTime: "7-12 triệu",
    companyLogo:
      "https://static.topcv.vn/company_logos/ky-su-lap-trinh-nhung-firmware-1e2f3a4b5c.jpg",
    skills: ["Firmware", "Embedded", "C/C++"],
    workType: "Full-time",
    experience: "2-4 năm",
  },
  {
    id: 9,
    title: "IT Security Manager",
    company: "CÔNG TY CỔ PHẦN SMARTOSC",
    location: "Hà Nội",
    salary: "Đỗ phù hợp với bạn: 90%",
    postedTime: "7-12 triệu",
    companyLogo:
      "https://static.topcv.vn/company_logos/it-security-manager-smartosc-6d7e8f9a1b.jpg",
    skills: ["Security", "Network", "Management"],
    workType: "Full-time",
    experience: "3-5 năm",
  },
  {
    id: 10,
    title: "BrSE / Product Manager",
    company: "CÔNG TY TNHH BORDER-2 VIETNAM",
    location: "Hà Nội",
    salary: "Đỗ phù hợp với bạn: 90%",
    postedTime: "7-12 triệu",
    companyLogo:
      "https://static.topcv.vn/company_logos/brse-product-manager-border2-2c3d4e5f6a.jpg",
    skills: ["BrSE", "Product Management", "Bridge SE"],
    workType: "Full-time",
    experience: "3-5 năm",
  },
  {
    id: 11,
    title: "Lập Trình Viên iOS (Swift, Objective-C)",
    company: "Công ty CP Giải pháp Thanh toán Việt",
    location: "Hà Nội",
    salary: "Đỗ phù hợp với bạn: 90%",
    postedTime: "7-12 triệu",
    companyLogo:
      "https://static.topcv.vn/company_logos/lap-trinh-vien-ios-swift-7e8f9a1b2c.jpg",
    skills: ["iOS", "Swift", "Objective-C"],
    workType: "Full-time",
    experience: "2-3 năm",
  },
  {
    id: 12,
    title: "Giáng Viên Công Nghệ Thông Tin/ Kh...",
    company: "Trường Đại học CMC",
    location: "Hà Nội",
    salary: "Đỗ phù hợp với bạn: 90%",
    postedTime: "7-12 triệu",
    companyLogo:
      "https://static.topcv.vn/company_logos/giang-vien-cong-nghe-thong-tin-3d4e5f6a7b.jpg",
    skills: ["Teaching", "IT", "Education"],
    workType: "Full-time",
    experience: "2+ năm",
  },
];

function JobList() {
  const nav = useNavigate();
  const { setCurrentPage } = useContext(AppContext);
  const { register, handleSubmit } = useForm();

  const [jobs, setJobs] = useState(MOCK_JOBS);
  const [filteredJobs, setFilteredJobs] = useState(MOCK_JOBS);
  const [savedJobs, setSavedJobs] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [currentPage, setCurrentPageState] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const jobsPerPage = 8;
  const totalPages = Math.ceil(filteredJobs.length / jobsPerPage);
  const startIndex = (currentPage - 1) * jobsPerPage;
  const currentJobs = filteredJobs.slice(startIndex, startIndex + jobsPerPage);

  const locations = [
    "Tất cả",
    "Hà Nội",
    "Hồ Chí Minh",
    "Đà Nẵng",
    "Cần Thơ",
    "Hải Phòng",
  ];

  useEffect(() => {
    setCurrentPage("jobs");
  }, [setCurrentPage]);

  useEffect(() => {
    handleFilter();
  }, [searchTerm, selectedLocation]);

  const handleFilter = () => {
    let filtered = jobs;

    if (searchTerm.trim()) {
      filtered = filtered.filter(
        (job) =>
          job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
          job.skills.some((skill) =>
            skill.toLowerCase().includes(searchTerm.toLowerCase()),
          ),
      );
    }
  };

  const handleSearch = (data) => {
    setIsLoading(true);
    setSearchTerm(data.searchTerm || "");
    setTimeout(() => {
      setIsLoading(false);
    }, 500);
  };

  const toggleSaveJob = (jobId) => {
    setSavedJobs((prev) => {
      const newSaved = new Set(prev);
      if (newSaved.has(jobId)) {
        newSaved.delete(jobId);
      } else {
        newSaved.add(jobId);
      }
      return newSaved;
    });
  };

  const goToJobDetail = (jobId) => {
    nav(`/jobs/${jobId}`);
  };

  return (
    <div
      className='container-fluid'
      style={{ backgroundColor: "#f8fafc", minHeight: "100vh" }}
    >
      {/* Hero Section với Search */}
      <div className='container py-5'>
        <div className='row justify-content-center'>
          <div className='col-lg-10'>
            <div className='bg-white rounded-4 p-4 shadow-lg'>
              <div className='row align-items-center'>
                <div className='col-lg-6'>
                  <h2 className='fw-bold mb-3' style={{ fontSize: "2.5rem" }}>
                    NHANH HƠN.
                    <br />
                    <span style={{ color: "#f59e0b" }}>DỄ DÀNG HƠN</span>
                  </h2>
                  <p className='text-muted mb-4'>
                    Tìm kiếm việc làm phù hợp với bạn
                  </p>
                </div>
                <div className='col-lg-6'>
                  <div className='position-relative'>
                    <img
                      src='https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=300&fit=crop&crop=faces'
                      alt='Happy couple'
                      className='img-fluid rounded-3'
                      style={{
                        maxHeight: "250px",
                        objectFit: "cover",
                        width: "100%",
                      }}
                    />
                    <div className='position-absolute top-0 end-0 bg-white rounded-circle p-2 m-2'>
                      <small className='text-primary'>
                        📧 Thư mời nhận việc
                      </small>
                    </div>
                  </div>
                </div>
              </div>

              {/* Search Form */}
              <form onSubmit={handleSubmit(handleSearch)} className='mt-4'>
                <div className='row g-2'>
                  <div className='col-lg-6'>
                    <div className='input-group'>
                      <span className='input-group-text bg-light border-end-0'>
                        <BsSearch className='text-muted' />
                      </span>
                      <input
                        type='text'
                        className='form-control border-start-0'
                        placeholder='Tìm kiếm...'
                        {...register("searchTerm")}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className='col-lg-4'>
                    <select
                      className='form-select'
                      value={selectedLocation}
                      onChange={(e) => setSelectedLocation(e.target.value)}
                    >
                      {locations.map((location) => (
                        <option key={location} value={location}>
                          {location}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className='col-lg-2'>
                    <button
                      type='submit'
                      className='btn btn-primary w-100'
                      disabled={isLoading}
                    >
                      {isLoading ? "Đang tìm..." : "Tìm kiếm"}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Job Results */}
      <div className='container pb-5'>
        <div className='row'>
          <div className='col-12'>
            <div className='d-flex justify-content-between align-items-center mb-4'>
              <h4 className='text-dark mb-0'>
                Có {filteredJobs.length} việc làm phù hợp với bạn
              </h4>
              <div className='text-muted'>
                Trang {currentPage} / {totalPages}
              </div>
            </div>

            {/* Job Cards */}
            <div className='row'>
              {currentJobs.map((job) => (
                <div key={job.id} className='col-lg-4 col-md-6 col-sm-12 mb-3'>
                  <div
                    className='card border-0 shadow-sm hover-lift'
                    style={{ 
                      cursor: "pointer",
                      borderRadius: "12px",
                      backgroundColor: "#ffffff",
                      height: "150px"
                    }}
                    onClick={() => goToJobDetail(job.id)}
                  >
                    <div className='card-body p-3 d-flex flex-column h-100'>
                      <div className='d-flex align-items-start'>
                        {/* Company Logo */}
                        <div 
                          className='me-3 d-flex align-items-center justify-content-center flex-shrink-0'
                          style={{
                            width: "48px",
                            height: "48px",
                            backgroundColor: "#1e40af",
                            borderRadius: "8px"
                          }}
                        >
                          <div 
                            style={{
                              width: "20px",
                              height: "20px",
                              backgroundColor: "#3b82f6",
                              clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)",
                              transform: "rotate(45deg)"
                            }}
                          ></div>
                        </div>
                        
                        {/* Job Info */}
                        <div className='flex-grow-1 d-flex flex-column justify-content-between'>
                          <div>
                            <h6 
                              className='card-title mb-1 fw-semibold'
                              style={{ 
                                fontSize: "0.9rem",
                                color: "#1f2937",
                                lineHeight: "1.3",
                                overflow: "hidden",
                                display: "-webkit-box",
                                WebkitLineClamp: "2",
                                WebkitBoxOrient: "vertical",
                                minHeight: "2.6em"
                              }}
                            >
                              {job.title}
                            </h6>
                            <p 
                              className='text-muted mb-1'
                              style={{ 
                                fontSize: "0.8rem",
                                overflow: "hidden",
                                display: "-webkit-box",
                                WebkitLineClamp: "1",
                                WebkitBoxOrient: "vertical",
                                maxWidth: "200px"
                              }}
                            >
                              {job.company}
                            </p>
                            <div 
                              className='text-primary mb-2'
                              style={{ 
                                fontSize: "0.8rem",
                                fontWeight: "500"
                              }}
                            >
                              Độ phù hợp với bạn: <span style={{ color: "#3b82f6" }}>90%</span>
                            </div>
                          </div>

                          {/* Bottom Row */}
                          <div className='d-flex justify-content-between align-items-center'>
                            {/* Salary Badge */}
                            <span 
                              className='badge px-2 py-1'
                              style={{
                                backgroundColor: "#dbeafe",
                                color: "#1e40af",
                                fontSize: "0.75rem",
                                fontWeight: "500",
                                borderRadius: "12px"
                              }}
                            >
                              {job.postedTime}
                            </span>
                            
                            {/* Location */}
                            <span 
                              className='text-muted'
                              style={{ fontSize: "0.8rem" }}
                            >
                              {job.location}
                            </span>
                          </div>
                        </div>

                        {/* Bookmark */}
                        <button
                          className='btn btn-sm border-0 p-1 flex-shrink-0 align-self-start'
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSaveJob(job.id);
                          }}
                        >
                          {savedJobs.has(job.id) ? (
                            <BsBookmarkFill className='text-primary' size={16} />
                          ) : (
                            <BsBookmark className='text-muted' size={16} />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className='d-flex justify-content-center mt-4'>
                <nav>
                  <ul className='pagination'>
                    <li
                      className={`page-item ${
                        currentPage === 1 ? "disabled" : ""
                      }`}
                    >
                      <button
                        className='page-link'
                        onClick={() => setCurrentPageState(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        Trước
                      </button>
                    </li>

                    {[...Array(totalPages)].map((_, index) => {
                      const page = index + 1;
                      return (
                        <li
                          key={page}
                          className={`page-item ${
                            currentPage === page ? "active" : ""
                          }`}
                        >
                          <button
                            className='page-link'
                            onClick={() => setCurrentPageState(page)}
                          >
                            {page}
                          </button>
                        </li>
                      );
                    })}

                    <li
                      className={`page-item ${
                        currentPage === totalPages ? "disabled" : ""
                      }`}
                    >
                      <button
                        className='page-link'
                        onClick={() => setCurrentPageState(currentPage + 1)}
                        disabled={currentPage === totalPages}
                      >
                        Sau
                      </button>
                    </li>
                  </ul>
                </nav>
              </div>
            )}

            {/* Load More Button */}
            <div className='text-center mt-4'>
              <button className='btn btn-outline-primary btn-lg'>
                <BsSearch className='me-2' />
                1450 trang
              </button>
            </div>

            {/* No Results */}
            {filteredJobs.length === 0 && (
              <div className='text-center text-muted py-5'>
                <h5>Không tìm thấy việc làm phù hợp</h5>
                <p>Hãy thử thay đổi từ khóa tìm kiếm hoặc bộ lọc</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Floating styles */}
      <style jsx>{`
        .hover-lift:hover {
          transform: translateY(-5px);
          transition: transform 0.3s ease;
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15) !important;
        }

        .card {
          transition: all 0.3s ease;
          border: 1px solid #e9ecef !important;
        }

        .card:hover {
          border-color: #007bff !important;
        }

        .badge {
          font-weight: 500;
        }

        .btn-outline-primary:hover {
          transform: none;
        }
      `}</style>
    </div>
  );
}

export default JobList;
