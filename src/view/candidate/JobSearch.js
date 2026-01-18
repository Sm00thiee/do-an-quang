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
import { useCandidateAuthStore } from '../../stores/candidateAuthStore';
import './JobSearch.css';

const JobSearch = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { setCurrentPage } = useContext(AppContext);
  const user = useCandidateAuthStore((state) => state.current);
  const isAuth = useCandidateAuthStore((state) => state.isAuth);

  // Search state
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [jobs, setJobs] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Pagination state
  const [currentPageNum, setCurrentPageNum] = useState(parseInt(searchParams.get('page')) || 1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalJobs, setTotalJobs] = useState(0);

  // Saved jobs state
  const [savedJobIds, setSavedJobIds] = useState(new Set());

  // Load saved jobs status when jobs change
  useEffect(() => {
    if (isAuth && user?.id && jobs.length > 0) {
      loadSavedJobsStatus();
    }
  }, [isAuth, user?.id, jobs]);

  const loadSavedJobsStatus = async () => {
    if (!isAuth || !user?.id) return;

    try {
      const jobIds = jobs.map((job) => job.id);
      const savedStatusPromises = jobIds.map((jobId) =>
        JobSearchService.isJobSaved(jobId, user.id)
      );
      const results = await Promise.all(savedStatusPromises);

      const savedIds = new Set();
      results.forEach((result, index) => {
        if (result.success && result.isSaved) {
          savedIds.add(jobIds[index]);
        }
      });

      setSavedJobIds(savedIds);
    } catch (error) {
      console.error('Error loading saved jobs status:', error);
    }
  };

  // Sample companies data - keeping as fallback only if database fetch fails
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
  }, [currentPageNum]);

  const loadJobs = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch jobs from database
      const filters = {
        search: searchQuery || null,
        page: currentPageNum,
        limit: 12
      };

      const result = await JobSearchService.searchJobs(filters);

      if (result.success) {
        // Transform database jobs to match component format
        const transformedJobs = result.data.map((job) => ({
          id: job.id,
          title: job.title,
          company: {
            name: job.company?.name || 'Chưa cập nhật',
            logo_url: job.company?.logo_url
          },
          salary: job.salary_min && job.salary_max
            ? `${Math.round(job.salary_min / 1000000)}-${Math.round(job.salary_max / 1000000)} triệu`
            : 'Thỏa thuận',
          location: job.location?.city || job.location?.district || 'Chưa cập nhật',
          match_score: 90, // This could be calculated based on user profile
        }));

        setJobs(transformedJobs);
        setTotalPages(result.totalPages || 1);
        setTotalJobs(result.total || 0);
      } else {
        setError('Không thể tải danh sách việc làm');
        setJobs([]);
      }

      // Fetch featured companies from database
      const companiesResult = await JobSearchService.getFeaturedCompanies(3);
      if (companiesResult.success) {
        const transformedCompanies = companiesResult.data.map((company) => ({
          id: company.id,
          name: company.name,
          logo_url: company.logo_url,
          employee_count: company.employee_count ? `${company.employee_count} nhân viên` : 'Chưa cập nhật',
          industry: company.industry?.name_vi || 'Chưa cập nhật',
          location: company.headquarters ? 
            `${company.headquarters.district || ''} ${company.headquarters.city || ''}`.trim() || 'Chưa cập nhật'
            : 'Chưa cập nhật'
        }));
        setCompanies(transformedCompanies);
      } else {
        // Fallback to sample companies if API fails
        setCompanies(sampleCompanies);
      }
    } catch (err) {
      console.error('Load jobs error:', err);
      setError('Đã xảy ra lỗi khi tải danh sách việc làm');
      setJobs([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/job-search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleToggleSaveJob = async (jobId, e) => {
    e?.stopPropagation();

    if (!isAuth || !user?.id) {
      alert('Vui lòng đăng nhập để lưu việc làm');
      navigate('/login');
      return;
    }

    const isCurrentlySaved = savedJobIds.has(jobId);

    try {
      let result;
      if (isCurrentlySaved) {
        result = await JobSearchService.removeSavedJob(jobId, user.id);
      } else {
        result = await JobSearchService.saveJob(jobId, user.id);
      }

      if (result.success) {
        setSavedJobIds(prev => {
          const newSet = new Set(prev);
          if (isCurrentlySaved) {
            newSet.delete(jobId);
          } else {
            newSet.add(jobId);
          }
          return newSet;
        });
      } else {
        throw new Error(result.error || 'Có lỗi xảy ra');
      }
    } catch (error) {
      console.error('Error toggling save job:', error);
      alert(error.message || 'Có lỗi xảy ra khi lưu việc làm. Vui lòng thử lại.');
    }
  };

  const handleJobClick = (jobId) => {
    navigate(`/jobs/${jobId}`);
  };

  const handleCompanyClick = (companyId) => {
    navigate(`/companies/${companyId}`);
  };

  const updateURL = () => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('q', searchQuery);
    if (currentPageNum > 1) params.set('page', currentPageNum);
    setSearchParams(params);
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
