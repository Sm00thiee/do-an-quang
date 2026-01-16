import { useContext, useEffect, useState } from "react";
import {
  BsSearch,
  BsBookmark, BsBookmarkFill,
  BsGeoAlt,
  BsClock,
  BsCurrencyDollar
} from "react-icons/bs";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AppContext } from "../../App";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import jobApi from "../../api/job";
import "./JobList.css";

dayjs.extend(relativeTime);

// Categories for filtering
const CATEGORIES = [
  { id: "all", name: "Tất cả", icon: "💼" },
  { id: "it", name: "IT & Tech", icon: "💻" },
  { id: "marketing", name: "Marketing", icon: "📊" },
  { id: "design", name: "Design", icon: "🎨" },
  { id: "business", name: "Business", icon: "📈" },
  { id: "finance", name: "Finance", icon: "💰" },
];

function JobList() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { setCurrentPage } = useContext(AppContext);

  const [jobs, setJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [savedJobs, setSavedJobs] = useState(new Set());
  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showFilters, setShowFilters] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Filter states
  const [salaryRange, setSalaryRange] = useState([0, 50]);
  const [experienceFilter, setExperienceFilter] = useState([]);
  const [jobTypeFilter, setJobTypeFilter] = useState([]);

  useEffect(() => {
    setCurrentPage("jobs");
  }, [setCurrentPage]);

  // Read initial keyword from query string and trigger first search
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const keyword = params.get("keyword") || "";
    setSearchKeyword(keyword);

    const payload = {};
    if (keyword.trim()) {
      payload.keyword = keyword.trim();
    }

    fetchJobs(payload);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  // Apply client-side filters (location, experience, job type) on top of API results
  useEffect(() => {
    let filtered = jobs;

    // Location filter (by name or address)
    if (selectedLocation && selectedLocation !== "all") {
      filtered = filtered.filter((job) => {
        const jobLocation = job.location || job.address || "";
        return jobLocation === selectedLocation;
      });
    }

    // Experience filter (fallback to simple text matching)
    if (experienceFilter.length > 0) {
      filtered = filtered.filter((job) => {
        const experienceText = job.experience || (job.yoe ? `${job.yoe}` : "");
        return experienceFilter.some((exp) =>
          String(experienceText).includes(exp)
        );
      });
    }

    // Job type filter
    if (jobTypeFilter.length > 0) {
      filtered = filtered.filter((job) => {
        const type =
          job.type ||
          job.jtype?.name ||
          "";
        return jobTypeFilter.includes(type);
      });
    }

    setFilteredJobs(filtered);
  }, [jobs, selectedLocation, experienceFilter, jobTypeFilter]);

  const fetchJobs = async (payload = {}) => {
    try {
      setIsLoading(true);
      setError(null);

      // Only send known fields to backend; start with keyword for now
      const filterPayload = {};
      if (payload.keyword && payload.keyword.trim()) {
        filterPayload.keyword = payload.keyword.trim();
      }

      const res = await jobApi.filter(filterPayload);
      const data = Array.isArray(res) ? res : res?.data || [];
      setJobs(data);
      setFilteredJobs(data);
    } catch (err) {
      console.error("Error fetching jobs:", err);
      setError(err.message || "Không thể tải danh sách việc làm");
      setJobs([]);
      setFilteredJobs([]);
    } finally {
      setIsLoading(false);
    }
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

  const handleSearch = (e) => {
    e.preventDefault();

    const keyword = searchKeyword.trim();

    // Update URL query and trigger API search
    const params = new URLSearchParams();
    if (keyword) {
      params.set("keyword", keyword);
    }
    navigate(`/jobs?${params.toString()}`, { replace: false });

    fetchJobs({ keyword });
  };

  const toggleExperienceFilter = (exp) => {
    setExperienceFilter((prev) =>
      prev.includes(exp) ? prev.filter((e) => e !== exp) : [...prev, exp]
    );
  };

  const toggleJobTypeFilter = (type) => {
    setJobTypeFilter((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  return (
    <div className="job-list-container">
      {/* Hero Search Section */}
      <div className="hero-section">
        <div className="container">
          <div className="hero-content">
            <h1 className="hero-title">
              {t('findJobsTitle')}
            </h1>
            <p className="hero-subtitle">
              {t('discoverJobs')}
            </p>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="search-form">
              <div className="search-bar">
                <div className="search-input-group">
                  <BsSearch className="search-icon" />
                  <input
                    type="text"
                    placeholder={t('searchPlaceholder')}
                    className="search-input"
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                  />
                </div>
                <div className="search-divider" />
                <div className="location-select-group">
                  <BsGeoAlt className="location-icon" />
                  <select
                    className="location-select"
                    value={selectedLocation}
                    onChange={(e) => setSelectedLocation(e.target.value)}
                  >
                    <option value="">{t('selectLocation')}</option>
                    <option value="Hà Nội">Hà Nội</option>
                    <option value="Hồ Chí Minh">Hồ Chí Minh</option>
                    <option value="Đà Nẵng">Đà Nẵng</option>
                    <option value="Remote">Remote</option>
                  </select>
                </div>
                <button type="submit" className="search-btn">
                  {t('search')}
                </button>
              </div>
            </form>

            {/* Category Chips */}
            <div className="category-chips">
              {CATEGORIES.map((category) => (
                <button
                  key={category.id}
                  className={`category-chip ${selectedCategory === category.id ? "active" : ""
                    }`}
                  onClick={() => setSelectedCategory(category.id)}
                >
                  <span className="category-icon">{category.icon}</span>
                  <span className="category-name">{category.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container main-content">
        <div className="content-grid">
          {/* Sidebar Filters */}
          <aside className={`filters-sidebar ${showFilters ? "open" : ""}`}>
            <div className="filters-header">
              <h3>{t('filter')}</h3>
              <button
                className="filter-toggle-mobile"
                onClick={() => setShowFilters(!showFilters)}
              >
                ×
              </button>
            </div>

            {/* Salary Range */}
            <div className="filter-section">
              <h4>{t('selectSalary')}</h4>
              <div className="salary-range">
                <input
                  type="range"
                  min="0"
                  max="50"
                  value={salaryRange[1]}
                  onChange={(e) => setSalaryRange([0, parseInt(e.target.value)])}
                  className="range-slider"
                />
                <div className="range-values">
                  <span>0 {t('million')}</span>
                  <span>{salaryRange[1]} {t('million')}</span>
                </div>
              </div>
            </div>

            {/* Experience Level */}
            <div className="filter-section">
              <h4>{t('selectExperience')}</h4>
              <div className="checkbox-group">
                {["0-1", "1-2", "2-3", "3-5", "5+"].map((exp) => (
                  <label key={exp} className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={experienceFilter.includes(exp)}
                      onChange={() => toggleExperienceFilter(exp)}
                    />
                    <span>{exp} {t('years')}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Job Type */}
            <div className="filter-section">
              <h4>{t('selectJobType')}</h4>
              <div className="checkbox-group">
                {["Full-time", "Part-time", "Remote", "Contract"].map((type) => (
                  <label key={type} className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={jobTypeFilter.includes(type)}
                      onChange={() => toggleJobTypeFilter(type)}
                    />
                    <span>{type}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Reset Filters */}
            <button
              className="reset-filters-btn"
              onClick={() => {
                setSalaryRange([0, 50]);
                setExperienceFilter([]);
                setJobTypeFilter([]);
                setSelectedLocation("");
                setSearchKeyword("");
                setSelectedCategory("all");
              }}
            >
              {t('clearFilter')}
            </button>
          </aside>

          {/* Job Grid */}
          <div className="jobs-grid-wrapper">
            {/* Results Header */}
            <div className="results-header">
              <h2 className="results-count">
                {filteredJobs.length} {t('jobsFound')}
              </h2>
              <button
                className="filter-toggle-btn"
                onClick={() => setShowFilters(!showFilters)}
              >
                <BsSearch /> {t('filter')}
              </button>
            </div>

            {/* Job Cards Grid */}
            {isLoading ? (
              <div className="no-results">
                <div className="no-results-icon">⏳</div>
                <h3>{t('loading') || 'Đang tải việc làm...'}</h3>
              </div>
            ) : error ? (
              <div className="no-results">
                <div className="no-results-icon">⚠️</div>
                <h3>{t('error') || 'Đã xảy ra lỗi'}</h3>
                <p>{error}</p>
              </div>
            ) : (
              <>
                <div className="jobs-grid">
                  {filteredJobs.map((job) => {
                    const title = job.title || job.jname || "";
                    const company =
                      job.company ||
                      job.employer?.name ||
                      "";
                    const locationText =
                      job.location ||
                      job.address ||
                      "";
                    const salaryText =
                      job.salary ||
                      (job.min_salary && job.max_salary
                        ? `${job.min_salary} - ${job.max_salary} triệu`
                        : t('competitive') || "Cạnh tranh");
                    const postedTime =
                      job.postedTime ||
                      (job.created_at
                        ? `Đăng ${dayjs(job.created_at).fromNow()}`
                        : "");
                    const jobTags =
                      job.tags ||
                      (job.industries
                        ? job.industries.map((ind) => ind.name)
                        : []);
                    const jobType =
                      job.type ||
                      job.jtype?.name ||
                      "";

                    return (
                      <div
                        key={job.id}
                        className="job-card"
                        onClick={() => navigate(`/jobs/${job.id}`)}
                      >
                        {/* Badges */}
                        <div className="job-badges">
                          {job.isHot && (
                            <span className="badge badge-hot">🔥 Hot</span>
                          )}
                          {job.isNew && (
                            <span className="badge badge-new">✨ New</span>
                          )}
                        </div>

                        {/* Company Logo */}
                        <div className="company-logo">
                          <div className="logo-placeholder">
                            {company ? company.charAt(0) : "?"}
                          </div>
                        </div>

                        {/* Job Info */}
                        <h3 className="job-title">{title}</h3>
                        <p className="job-company">{company}</p>

                        {/* Job Meta */}
                        <div className="job-meta">
                          <div className="meta-item">
                            <BsGeoAlt />
                            <span>{locationText}</span>
                          </div>
                          <div className="meta-item">
                            <BsCurrencyDollar />
                            <span>{salaryText}</span>
                          </div>
                          <div className="meta-item">
                            <BsClock />
                            <span>{postedTime}</span>
                          </div>
                        </div>

                        {/* Tags */}
                        <div className="job-tags">
                          {jobTags.slice(0, 3).map((tag, idx) => (
                            <span key={idx} className="tag">
                              {tag}
                            </span>
                          ))}
                        </div>

                        {/* Footer */}
                        <div className="job-card-footer">
                          <span className="job-type-badge">{jobType}</span>
                          <button
                            className="save-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleSaveJob(job.id);
                            }}
                          >
                            {savedJobs.has(job.id) ? (
                              <BsBookmarkFill className="saved" />
                            ) : (
                              <BsBookmark />
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* No Results */}
                {filteredJobs.length === 0 && (
                  <div className="no-results">
                    <div className="no-results-icon">🔍</div>
                    <h3>{t('noJobsFound')}</h3>
                    <p>{t('tryChangeKeywords')}</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default JobList;
