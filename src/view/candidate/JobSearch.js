/**
 * Job Search Page
 * Following Figma design: node-id=8057-48598
 * Full-featured job search with filters, saved jobs, and applications
 */

import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  BsSearch,
  BsBookmark,
  BsBookmarkFill,
  BsGeoAlt,
  BsCurrencyDollar,
  BsArrowLeft,
  BsArrowRight
} from 'react-icons/bs';
import JobSearchService from '../../services/jobSearchService';
import { AppContext } from '../../App';
import './JobSearch.css';

const JobSearch = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, setCurrentPage } = useContext(AppContext);

  // Search state
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [jobs, setJobs] = useState([]);
  const [locations, setLocations] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Filter state
  const [filters, setFilters] = useState({
    location: searchParams.get('location') || '',
    salaryMin: searchParams.get('salaryMin') || '',
    salaryMax: searchParams.get('salaryMax') || '',
    experience: searchParams.get('experience') || '',
  });

  // Pagination state
  const [currentPage, setCurrentPageNum] = useState(parseInt(searchParams.get('page')) || 1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalJobs, setTotalJobs] = useState(0);

  // Saved jobs state
  const [savedJobIds, setSavedJobIds] = useState(new Set());

  useEffect(() => {
    setCurrentPage('jobs');
    fetchLocations();
    fetchFeaturedCompanies();
  }, [setCurrentPage]);

  useEffect(() => {
    searchJobs();
  }, [searchParams, currentPage]);

  const fetchLocations = async () => {
    const result = await JobSearchService.getLocations();
    if (result.success) {
      setLocations(result.data);
    }
  };

  const fetchFeaturedCompanies = async () => {
    const result = await JobSearchService.getFeaturedCompanies(3);
    if (result.success) {
      setCompanies(result.data);
    }
  };

  const searchJobs = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const searchFilters = {
        search: searchQuery,
        location: filters.location || null,
        salaryMin: filters.salaryMin ? parseInt(filters.salaryMin) : null,
        salaryMax: filters.salaryMax ? parseInt(filters.salaryMax) : null,
        experience: filters.experience || null,
        page: currentPage,
        limit: 12
      };

      const result = await JobSearchService.searchJobs(searchFilters);

      if (result.success) {
        setJobs(result.data);
        setTotalPages(result.totalPages);
        setTotalJobs(result.total);

        // Check which jobs are saved (if user is logged in)
        if (user?.id) {
          const savedIds = new Set();
          for (const job of result.data) {
            const savedResult = await JobSearchService.isJobSaved(job.id, user.id);
            if (savedResult.isSaved) {
              savedIds.add(job.id);
            }
          }
          setSavedJobIds(savedIds);
        }
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    updateSearchParams({ q: searchQuery, page: 1 });
  };

  const updateSearchParams = (newParams) => {
    const params = new URLSearchParams(searchParams);
    Object.keys(newParams).forEach(key => {
      if (newParams[key]) {
        params.set(key, newParams[key]);
      } else {
        params.delete(key);
      }
    });
    setSearchParams(params);
  };

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    updateSearchParams({ ...newFilters, page: 1 });
  };

  const handleToggleSaveJob = async (jobId, e) => {
    e.stopPropagation();

    if (!user?.id) {
      // Redirect to login
      navigate('/login');
      return;
    }

    const isSaved = savedJobIds.has(jobId);

    if (isSaved) {
      const result = await JobSearchService.removeSavedJob(jobId, user.id);
      if (result.success) {
        setSavedJobIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(jobId);
          return newSet;
        });
      }
    } else {
      const result = await JobSearchService.saveJob(jobId, user.id);
      if (result.success) {
        setSavedJobIds(prev => new Set(prev).add(jobId));
      }
    }
  };

  const handleJobClick = (jobId) => {
    navigate(`/jobs/${jobId}`);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPageNum(newPage);
      updateSearchParams({ page: newPage });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="job-search-page">
      {/* Hero Section with Search */}
      <div className="job-search-hero">
        <div className="hero-content">
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

          {/* Hero Image */}
          <div className="hero-image">
            <img
              src="/image/job-search-hero.jpg"
              alt="Tìm việc làm"
              onError={(e) => {
                e.target.src = 'https://via.placeholder.com/1200x400?text=Find+Your+Dream+Job';
              }}
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
                {jobs.map((job) => (
                  <div
                    key={job.id}
                    className="job-card"
                    onClick={() => handleJobClick(job.id)}
                  >
                    {/* Company Logo and Job Info */}
                    <div className="job-card-header">
                      <div className="company-logo">
                        {job.company?.logo_url ? (
                          <img src={job.company.logo_url} alt={job.company.name} />
                        ) : (
                          <div className="logo-placeholder">
                            {job.company?.short_name?.[0] || 'C'}
                          </div>
                        )}
                      </div>

                      <div className="job-info">
                        <h3 className="job-title">{job.title}</h3>
                        <p className="company-name">{job.company?.name}</p>
                        <p className="match-score">
                          Độ phù hợp với bạn : <span className="score">90%</span>
                        </p>
                      </div>
                    </div>

                    {/* Job Details */}
                    <div className="job-card-footer">
                      <div className="job-tags">
                        <span className="tag salary-tag">
                          <BsCurrencyDollar />
                          {job.salary_display || 'Thỏa thuận'}
                        </span>
                        <span className="tag location-tag">
                          <BsGeoAlt />
                          {job.location?.city || 'Hà Nội'}
                        </span>
                      </div>

                      <button
                        className="save-job-button"
                        onClick={(e) => handleToggleSaveJob(job.id, e)}
                        aria-label={savedJobIds.has(job.id) ? 'Bỏ lưu' : 'Lưu việc làm'}
                      >
                        {savedJobIds.has(job.id) ? (
                          <BsBookmarkFill className="icon-saved" />
                        ) : (
                          <BsBookmark className="icon-unsaved" />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              <div className="pagination">
                <button
                  className="pagination-button"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <BsArrowLeft />
                </button>

                <span className="pagination-info">
                  <span className="current-page">{currentPage}</span>/{totalPages} trang
                </span>

                <button
                  className="pagination-button"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  <BsArrowRight />
                </button>
              </div>
            </>
          )}
        </div>

        {/* Featured Companies Section */}
        {companies.length > 0 && (
          <div className="featured-companies-section">
            <h2 className="section-title">Top Công ty Nghề Nổi Bật</h2>
            <div className="companies-grid">
              {companies.map((company) => (
                <div
                  key={company.id}
                  className="company-card"
                  onClick={() => navigate(`/companies/${company.id}`)}
                >
                  <div className="company-header">
                    <div className="company-logo-large">
                      {company.logo_url ? (
                        <img src={company.logo_url} alt={company.name} />
                      ) : (
                        <div className="logo-placeholder-large">
                          {company.short_name?.[0] || 'C'}
                        </div>
                      )}
                    </div>
                    <p className="company-name-large">{company.name}</p>
                  </div>

                  <div className="company-details">
                    <div className="company-info-row">
                      <span className="label">Quy mô :</span>
                      <span className="value">{company.employee_count || 'N/A'}</span>
                    </div>
                    <div className="company-info-row">
                      <span className="label">Lĩnh vực :</span>
                      <span className="value">{company.industry?.name_vi || 'N/A'}</span>
                    </div>
                    <div className="company-info-row">
                      <span className="label">Địa điểm :</span>
                      <span className="value">
                        {company.headquarters?.district} - {company.headquarters?.city}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default JobSearch;
