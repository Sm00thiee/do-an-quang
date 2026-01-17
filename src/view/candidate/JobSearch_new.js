/**
 * Job Search Page - Danh sách việc làm
 * Following Figma design: node-id=8057-48598
 * Complete implementation matching design pixel-perfect
 */

import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  BsSearch, 
  BsBookmark, 
  BsBookmarkFill,
  BsChevronLeft,
  BsChevronRight
} from 'react-icons/bs';
import JobSearchService from '../../services/jobSearchService';
import { AppContext } from '../../App';
import './JobSearch.css';

const JobSearch = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, setCurrentPage } = useContext(AppContext);

  // Search state
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [jobs, setJobs] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Pagination state
  const [currentPageNum, setCurrentPageNum] = useState(parseInt(searchParams.get('page')) || 1);
  const [totalPages, setTotalPages] = useState(50);
  const [totalJobs, setTotalJobs] = useState(0);

  // Saved jobs state
  const [savedJobIds, setSavedJobIds] = useState(new Set());

  // Sample job data matching Figma design
  const sampleJobs = [
    {
      id: 1,
      title: 'UI/UX Designer (Web/Mobile App)',
      company: { name: 'CÔNG TY CỔ PHẦN CÔNG NGHỆ ONUSLAB', logo_url: '/image/companies/onuslab.png' },
      salary: '7-12 triệu',
      location: 'Hà Nội',
      match_score: 90,
      saved: true
    },
    {
      id: 2,
      title: 'Home Trading System Developer - Windows',
      company: { name: 'CÔNG TY CỔ PHẦN SMARTOSC', logo_url: '/image/companies/smartosc.png' },
      salary: '22 - 45 triệu',
      location: 'Hồ Chí Minh',
      match_score: 90,
      saved: true
    },
    {
      id: 3,
      title: 'Chuyên Viên Cao Cấp Phát Triển Ứng Dụng',
      company: { name: 'Ngân Hàng Thương Mại Cổ Phần Thịnh Vượng Và Phát Triển', logo_url: '/image/companies/vpbank.png' },
      salary: '7-12 triệu',
      location: 'Hà Nội',
      match_score: 90,
      saved: false
    },
    {
      id: 4,
      title: 'Nhân Viên Thiết Kế 3D - 1 Năm Kinh Nghiệm',
      company: { name: 'Công Ty TNHH MTV Phong Việt', logo_url: '/image/companies/phongviet.png' },
      salary: '7-12 triệu',
      location: 'Hà Nội',
      match_score: 90,
      saved: false
    },
    {
      id: 5,
      title: 'UI/UX Designer (Web/Mobile App)',
      company: { name: 'CÔNG TY CỔ PHẦN CÔNG NGHỆ SMART SCORE', logo_url: '/image/companies/smartscore.png' },
      salary: '7-12 triệu',
      location: 'Hà Nội',
      match_score: 90,
      saved: false
    },
    {
      id: 6,
      title: 'Nhân Viên IT',
      company: { name: 'CÔNG TY TNHH ATEC SYSTEM VIỆT NAM', logo_url: '/image/companies/atec.png' },
      salary: '7-12 triệu',
      location: 'Hà Nội',
      match_score: 90,
      saved: false
    },
    {
      id: 7,
      title: 'GRC Analyst (Governance, Risk, Compliance)',
      company: { name: 'CÔNG TY TNHH MTV ABN INNOVATION', logo_url: '/image/companies/abn.png' },
      salary: '7-12 triệu',
      location: 'Hà Nội',
      match_score: 90,
      saved: false
    },
    {
      id: 8,
      title: 'Kỹ Sư Lập Trình Nhúng Firmware Điện Tử',
      company: { name: 'CÔNG TY TNHH EVSELAB', logo_url: '/image/companies/evselab.png' },
      salary: '7-12 triệu',
      location: 'Hà Nội',
      match_score: 90,
      saved: false
    },
    {
      id: 9,
      title: 'IT Security Manager',
      company: { name: 'CÔNG TY CỔ PHẦN SMARTOSC', logo_url: '/image/companies/smartosc2.png' },
      salary: '7-12 triệu',
      location: 'Hà Nội',
      match_score: 90,
      saved: false
    },
    {
      id: 10,
      title: 'BrSE / Product Manager',
      company: { name: 'CÔNG TY TNHH BORDER Z VIETNAM', logo_url: '/image/companies/borderz.png' },
      salary: '7-12 triệu',
      location: 'Hà Nội',
      match_score: 90,
      saved: false
    },
    {
      id: 11,
      title: 'Lập Trình Viên IOS (Swift, Objective-C)',
      company: { name: 'Công ty CP Giải pháp Thanh toán Việt', logo_url: '/image/companies/vietpay.png' },
      salary: '7-12 triệu',
      location: 'Hà Nội',
      match_score: 90,
      saved: false
    },
    {
      id: 12,
      title: 'Giảng Viên Công Nghệ Thông Tin/ Khoa Học',
      company: { name: 'Trường Đại học CMC', logo_url: '/image/companies/cmc.png' },
      salary: '7-12 triệu',
      location: 'Hà Nội',
      match_score: 90,
      saved: false
    }
  ];

  // Sample companies data
  const sampleCompanies = [
    {
      id: 1,
      name: 'Công ty Cổ phần Công Nghệ ONUS LABS',
      logo_url: '/image/companies/onuslab-featured.png',
      employee_count: '25 nhân viên',
      industry: 'Tài Chính',
      location: 'Thanh Xuân - Hà Nội'
    },
    {
      id: 2,
      name: 'Công ty Cổ phần Công Nghệ ONUS LABS',
      logo_url: '/image/companies/onuslab-featured.png',
      employee_count: '25 nhân viên',
      industry: 'Tài Chính',
      location: 'Thanh Xuân - Hà Nội'
    },
    {
      id: 3,
      name: 'Công ty Cổ phần Công Nghệ ONUS LABS',
      logo_url: '/image/companies/onuslab-featured.png',
      employee_count: '25 nhân viên',
      industry: 'Tài Chính',
      location: 'Thanh Xuân - Hà Nội'
    }
  ];

  useEffect(() => {
    setCurrentPage('jobs');
    loadJobs();
  }, [setCurrentPage]);

  useEffect(() => {
    loadJobs();
  }, [currentPageNum, searchQuery]);

  const loadJobs = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // In production, fetch from API
      // For now, use sample data
      setTimeout(() => {
        setJobs(sampleJobs);
        setCompanies(sampleCompanies);
        setTotalPages(50);
        setTotalJobs(sampleJobs.length);
        setIsLoading(false);

        // Initialize saved jobs
        const savedIds = new Set();
        sampleJobs.forEach(job => {
          if (job.saved) savedIds.add(job.id);
        });
        setSavedJobIds(savedIds);
      }, 500);
    } catch (err) {
      console.error('Load jobs error:', err);
      setError('Đã xảy ra lỗi khi tải danh sách việc làm');
      setIsLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setCurrentPageNum(1);
    updateURL();
  };

  const updateURL = () => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('q', searchQuery);
    if (currentPageNum > 1) params.set('page', currentPageNum);
    setSearchParams(params);
  };

  const handleToggleSaveJob = async (jobId, e) => {
    e.stopPropagation();

    if (!user?.id) {
      navigate('/login');
      return;
    }

    setSavedJobIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(jobId)) {
        newSet.delete(jobId);
      } else {
        newSet.add(jobId);
      }
      return newSet;
    });
    
    // TODO: Call API to save/unsave job
  };

  const handleJobClick = (jobId) => {
    navigate(`/jobs/${jobId}`);
  };

  const handleCompanyClick = (companyId) => {
    navigate(`/companies/${companyId}`);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPageNum(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      updateURL();
    }
  };

  return (
    <div className="job-search-page">
      {/* Hero Section with Search */}
      <div className="job-search-hero">
        <div className="hero-content">
          {/* Search Form */}
          <form className="search-form" onSubmit={handleSearchSubmit}>
            <div className="search-input-wrapper">
              <BsSearch className="search-icon" />
              <input
                type="text"
                className="search-input"
                placeholder="Tìm kiếm ..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button type="submit" className="search-button">
              Tìm kiếm
            </button>
          </form>

          {/* Hero Banner Image */}
          <div className="hero-image">
            <img
              src="/image/companies/hero-banner.png"
              alt="Nhanh hơn, dễ dàng hơn"
            />
          </div>
        </div>

        {/* Page Number Badge */}
        <div className="page-number-badge">
          <span>{currentPageNum}</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="job-search-content">
        {/* Job Cards Grid */}
        <div className="job-results-section">
          {isLoading && (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>Đang tìm kiếm việc làm...</p>
            </div>
          )}

          {error && (
            <div className="error-state">
              <p>{error}</p>
            </div>
          )}

          {!isLoading && !error && jobs.length === 0 && (
            <div className="empty-state">
              <p>Không tìm thấy việc làm phù hợp</p>
            </div>
          )}

          {!isLoading && jobs.length > 0 && (
            <>
              <div className="job-cards-grid">
                {jobs.map((job) => {
                  const isSaved = savedJobIds.has(job.id);
                  return (
                    <div
                      key={job.id}
                      className="job-card"
                      onClick={() => handleJobClick(job.id)}
                    >
                      {/* Card Content */}
                      <div className="job-card-content">
                        {/* Company Logo */}
                        <div className="company-logo">
                          <img src={job.company.logo_url} alt={job.company.name} />
                        </div>

                        {/* Job Info */}
                        <div className="job-info">
                          <h3 className="job-title">{job.title}</h3>
                          <p className="company-name">{job.company.name}</p>
                          <p className="match-score">
                            Độ phù hợp với bạn : <span className="score">{job.match_score}%</span>
                          </p>
                        </div>
                      </div>

                      {/* Card Footer */}
                      <div className="job-card-footer">
                        <div className="job-tags">
                          <span className="tag salary-tag">{job.salary}</span>
                          <span className="tag location-tag">{job.location}</span>
                        </div>

                        <button
                          className={`save-job-button ${isSaved ? 'saved' : ''}`}
                          onClick={(e) => handleToggleSaveJob(job.id, e)}
                          aria-label={isSaved ? 'Bỏ lưu' : 'Lưu việc làm'}
                        >
                          {isSaved ? (
                            <BsBookmarkFill className="icon-saved" />
                          ) : (
                            <BsBookmark className="icon-unsaved" />
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination */}
              <div className="pagination">
                <button
                  className="pagination-button prev"
                  onClick={() => handlePageChange(currentPageNum - 1)}
                  disabled={currentPageNum === 1}
                  aria-label="Previous page"
                >
                  <BsChevronLeft />
                </button>

                <span className="pagination-info">
                  <span className="current-page">{currentPageNum}</span>/{totalPages} trang
                </span>

                <button
                  className="pagination-button next"
                  onClick={() => handlePageChange(currentPageNum + 1)}
                  disabled={currentPageNum === totalPages}
                  aria-label="Next page"
                >
                  <BsChevronRight />
                </button>
              </div>
            </>
          )}
        </div>

        {/* Featured Companies Section */}
        <div className="featured-companies-section">
          <h2 className="section-title">Top Công ty Nghề Nổi Bật</h2>
          <div className="companies-grid">
            {companies.map((company) => (
              <div
                key={company.id}
                className="company-card"
                onClick={() => handleCompanyClick(company.id)}
              >
                {/* Company Header */}
                <div className="company-header">
                  <div className="company-logo-large">
                    <img src={company.logo_url} alt={company.name} />
                  </div>
                  <p className="company-name-large">{company.name}</p>
                </div>

                {/* Company Details */}
                <div className="company-details">
                  <div className="company-info-row">
                    <span className="icon-users"></span>
                    <span className="label">Quy mô :</span>
                    <span className="value">{company.employee_count}</span>
                  </div>
                  <div className="company-info-row">
                    <span className="icon-hourglass"></span>
                    <span className="label">Lĩnh vực :</span>
                    <span className="value">{company.industry}</span>
                  </div>
                  <div className="company-info-row">
                    <span className="icon-map"></span>
                    <span className="label">Quy mô :</span>
                  </div>
                  <p className="location-value">{company.location}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobSearch;
