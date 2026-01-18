/**
 * Job Search Result Page
 * Following Figma design: node-id=8037:29067
 * Route: /job-search
 * Features: Advanced filters, vertical job list, pagination, save jobs, apply
 */

import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { BsSearch, BsBookmark, BsBookmarkFill, BsFunnel, BsChevronLeft, BsChevronRight } from 'react-icons/bs';
import JobSearchService from '../../services/jobSearchService';
import { useCandidateAuthStore } from '../../stores/candidateAuthStore';
import { AppContext } from '../../App';
import './JobSearchResult.css';

const JobSearchResult = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { setCurrentPage } = useContext(AppContext);
  const user = useCandidateAuthStore((state) => state.current);
  const isAuth = useCandidateAuthStore((state) => state.isAuth);

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [jobs, setJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Filter states - matching Figma design exactly
  const [filters, setFilters] = useState({
    experience: ['Tất cả'], // Selected by default in design
    salary: ['Tất cả'], // Selected by default in design
    location: ['Tất cả'], // Selected by default in design
  });

  // Pagination state
  const [currentPageNum, setCurrentPageNum] = useState(parseInt(searchParams.get('page')) || 1);
  const [totalPages, setTotalPages] = useState(50);
  const [totalJobs, setTotalJobs] = useState(0);

  // Saved jobs state
  const [savedJobIds, setSavedJobIds] = useState(new Set());
  const [savingJobId, setSavingJobId] = useState(null);

  useEffect(() => {
    setCurrentPage('jobs');
    // Sync search query from URL params
    const urlQuery = searchParams.get('q') || '';
    setSearchQuery(urlQuery);
  }, [setCurrentPage, searchParams]);

  useEffect(() => {
    searchJobs();
  }, [currentPageNum, filters, searchQuery]);

  // Load saved jobs status on mount and when jobs change
  useEffect(() => {
    if (isAuth && user?.id && jobs.length > 0) {
      loadSavedJobsStatus();
    }
  }, [isAuth, user?.id, jobs]);

  const searchJobs = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Map filters to API format
      const searchFilters = {
        search: searchQuery,
        experience: filters.experience.includes('Tất cả') ? null : filters.experience,
        salaryMin: getSalaryMin(filters.salary),
        salaryMax: getSalaryMax(filters.salary),
        location: filters.location.includes('Tất cả') ? null : filters.location,
        page: currentPageNum,
        limit: 9
      };

      const result = await JobSearchService.searchJobs(searchFilters);

      if (result.success) {
        setJobs(result.data || []);
        setTotalPages(result.totalPages || 1);
        setTotalJobs(result.total || 0);
      } else {
        setError('Không thể tải danh sách việc làm');
      }
    } catch (err) {
      console.error('Search error:', err);
      setError('Đã xảy ra lỗi khi tìm kiếm');
    } finally {
      setIsLoading(false);
    }
  };

  const getSalaryMin = (salaryFilters) => {
    if (salaryFilters.includes('Tất cả')) return null;
    const mins = salaryFilters.map(s => {
      if (s === 'Dưới 10 triệu') return 0;
      if (s === '10 - 15 triệu') return 10;
      if (s === '15 - 20 triệu') return 15;
      if (s === '20 - 25 triệu') return 20;
      if (s === '25 - 30 triệu') return 25;
      if (s === '30 - 50 triệu') return 30;
      if (s === 'Trên 50 triệu') return 50;
      return 0;
    });
    return Math.min(...mins);
  };

  const getSalaryMax = (salaryFilters) => {
    if (salaryFilters.includes('Tất cả')) return null;
    const maxs = salaryFilters.map(s => {
      if (s === 'Dưới 10 triệu') return 10;
      if (s === '10 - 15 triệu') return 15;
      if (s === '15 - 20 triệu') return 20;
      if (s === '20 - 25 triệu') return 25;
      if (s === '25 - 30 triệu') return 30;
      if (s === '30 - 50 triệu') return 50;
      if (s === 'Trên 50 triệu') return 100;
      return 100;
    });
    return Math.max(...maxs);
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

  const toggleFilter = (filterType, value) => {
    setFilters(prev => {
      const currentFilters = prev[filterType];
      let newFilters;

      if (value === 'Tất cả') {
        // If "Tất cả" is clicked, select only it
        newFilters = ['Tất cả'];
      } else {
        // Remove "Tất cả" if it's selected
        const withoutAll = currentFilters.filter(f => f !== 'Tất cả');
        
        if (currentFilters.includes(value)) {
          // Remove the value
          newFilters = withoutAll.filter(f => f !== value);
          // If nothing left, select "Tất cả"
          if (newFilters.length === 0) {
            newFilters = ['Tất cả'];
          }
        } else {
          // Add the value
          newFilters = [...withoutAll, value];
        }
      }

      return {
        ...prev,
        [filterType]: newFilters
      };
    });
    setCurrentPageNum(1); // Reset to page 1 when filter changes
  };

  const loadSavedJobsStatus = async () => {
    if (!isAuth || !user?.id) return;

    try {
      const jobIds = jobs.map(job => job.id);
      const savedStatusPromises = jobIds.map(jobId => 
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

  const toggleSaveJob = async (jobId) => {
    if (!isAuth || !user?.id) {
      alert('Vui lòng đăng nhập để lưu việc làm');
      return;
    }

    setSavingJobId(jobId);
    const isCurrentlySaved = savedJobIds.has(jobId);

    try {
      let result;
      if (isCurrentlySaved) {
        // Unsave job
        result = await JobSearchService.removeSavedJob(jobId, user.id);
      } else {
        // Save job
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
    } finally {
      setSavingJobId(null);
    }
  };

  const handleApplyJob = (jobId) => {
    navigate(`/jobs/${jobId}`);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPageNum(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="job-search-result-page">
      {/* Search Bar Section */}
      <div className="search-section">
        <div className="search-container">
          <form className="search-form" onSubmit={handleSearchSubmit}>
            <div className="search-input-wrapper">
              <BsSearch className="search-icon" />
              <input
                type="text"
                className="search-input"
                placeholder="Tìm kiếm..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button type="submit" className="search-button">
              Tìm kiếm
            </button>
          </form>
        </div>
      </div>

      {/* Main Content */}
      <div className="content-wrapper">
        <div className="content-container">
          {/* Filter Sidebar */}
          <aside className="filter-sidebar">
            <div className="filter-header">
              <BsFunnel className="filter-icon" />
              <h3 className="filter-title">Lọc nâng cao</h3>
            </div>

            {/* Experience Filter */}
            <div className="filter-section">
              <h4 className="filter-section-title">Kinh nghiệm</h4>
              <div className="filter-options">
                <div className="filter-column">
                  {['Tất cả', 'Dưới 1 năm', '2 năm', '4 năm', 'Trên 5 năm'].map(exp => (
                    <label key={exp} className="filter-checkbox">
                      <input
                        type="checkbox"
                        checked={filters.experience.includes(exp)}
                        onChange={() => toggleFilter('experience', exp)}
                      />
                      <span className="checkbox-custom"></span>
                      <span className="checkbox-label">{exp}</span>
                    </label>
                  ))}
                </div>
                <div className="filter-column">
                  {['Không yêu cầu', '1 năm', '3 năm', '5 năm'].map(exp => (
                    <label key={exp} className="filter-checkbox">
                      <input
                        type="checkbox"
                        checked={filters.experience.includes(exp)}
                        onChange={() => toggleFilter('experience', exp)}
                      />
                      <span className="checkbox-custom"></span>
                      <span className="checkbox-label">{exp}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Salary Filter */}
            <div className="filter-section">
              <h4 className="filter-section-title">Mức lương</h4>
              <div className="filter-options">
                <div className="filter-column">
                  {['Tất cả', '10 - 15 triệu', '20 - 25 triệu', '30 - 50 triệu', 'Thoả thuận'].map(salary => (
                    <label key={salary} className="filter-checkbox">
                      <input
                        type="checkbox"
                        checked={filters.salary.includes(salary)}
                        onChange={() => toggleFilter('salary', salary)}
                      />
                      <span className="checkbox-custom"></span>
                      <span className="checkbox-label">{salary}</span>
                    </label>
                  ))}
                </div>
                <div className="filter-column">
                  {['Dưới 10 triệu', '15 - 20 triệu', '25 - 30 triệu', 'Trên 50 triệu'].map(salary => (
                    <label key={salary} className="filter-checkbox">
                      <input
                        type="checkbox"
                        checked={filters.salary.includes(salary)}
                        onChange={() => toggleFilter('salary', salary)}
                      />
                      <span className="checkbox-custom"></span>
                      <span className="checkbox-label">{salary}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Location Filter */}
            <div className="filter-section">
              <h4 className="filter-section-title">Khu vực</h4>
              <div className="filter-options-single">
                {['Tất cả', 'Hà Nội', 'TP.Hồ Chí Minh'].map(location => (
                  <label key={location} className="filter-checkbox">
                    <input
                      type="checkbox"
                      checked={filters.location.includes(location)}
                      onChange={() => toggleFilter('location', location)}
                    />
                    <span className="checkbox-custom"></span>
                    <span className="checkbox-label">{location}</span>
                  </label>
                ))}
              </div>
            </div>
          </aside>

          {/* Job Results */}
          <main className="job-results">
            <h2 className="results-title">Kết quả tìm kiếm</h2>

            {isLoading && (
              <div className="loading-state">
                <div className="spinner"></div>
                <p>Đang tải...</p>
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

            {!isLoading && !error && jobs.length > 0 && (
              <>
                <div className="job-cards-list">
                  {jobs.map((job) => {
                    const isSaved = savedJobIds.has(job.id);
                    return (
                      <div key={job.id} className="job-card">
                        {/* Left Section: Logo with Slogan */}
                        <div className="job-card-logo-section">
                          <div className="company-logo">
                            {job.company?.logo_url ? (
                              <img src={job.company.logo_url} alt={job.company?.name || 'Company'} />
                            ) : (
                              <div className="logo-placeholder">
                                {job.company?.short_name?.[0] || job.company?.name?.[0] || 'C'}
                              </div>
                            )}
                          </div>
                          {job.company?.slogan && (
                            <p className="company-slogan">{job.company.slogan}</p>
                          )}
                        </div>

                        {/* Middle Section: Job Info */}
                        <div className="job-card-info-section">
                          <h3 className="job-title">{job.title}</h3>
                          <p className="company-name">{job.company?.name}</p>
                          <p className="job-salary">
                            {job.salary_min && job.salary_max 
                              ? `${job.salary_min}-${job.salary_max} triệu`
                              : 'Thỏa thuận'}
                          </p>

                          {/* Badges */}
                          <div className="job-badges">
                            <span className="badge badge-location">
                              {job.location?.city || 'Hồ Chí Minh'}
                            </span>
                            <span className="badge badge-experience">
                              {job.experience || '1 năm'}
                            </span>
                          </div>
                        </div>

                        {/* Right Section: Action Buttons */}
                        <div className="job-card-right">
                          <button
                            className={`save-button ${isSaved ? 'saved' : ''}`}
                            onClick={() => toggleSaveJob(job.id)}
                            disabled={savingJobId === job.id}
                          >
                            {isSaved ? <BsBookmarkFill /> : <BsBookmark />}
                            <span>{savingJobId === job.id ? 'Đang xử lý...' : (isSaved ? 'Đã lưu' : 'Lưu việc làm')}</span>
                          </button>
                          <button
                            className="apply-button"
                            onClick={() => handleApplyJob(job.id)}
                          >
                            Ứng tuyển ngay
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Pagination */}
                <div className="pagination">
                  <button
                    className="pagination-button"
                    onClick={() => handlePageChange(currentPageNum - 1)}
                    disabled={currentPageNum === 1}
                  >
                    <BsChevronLeft />
                  </button>
                  <span className="pagination-info">
                    <span className="current-page">{currentPageNum}</span>/{totalPages} trang
                  </span>
                  <button
                    className="pagination-button"
                    onClick={() => handlePageChange(currentPageNum + 1)}
                    disabled={currentPageNum === totalPages}
                  >
                    <BsChevronRight />
                  </button>
                </div>
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default JobSearchResult;
