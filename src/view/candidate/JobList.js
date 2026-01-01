import { useContext, useEffect, useState } from "react";
import { BsSearch, BsBookmark, BsBookmarkFill, BsGeoAlt, BsClock, BsCurrencyDollar } from "react-icons/bs";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AppContext } from "../../App";
import "./JobList.css";

// Mock job data
const MOCK_JOBS = [
  {
    id: 1,
    title: "Senior Frontend Developer",
    company: "TechCorp Vietnam",
    location: "Hà Nội",
    salary: "20-30 triệu",
    type: "Full-time",
    experience: "3-5 năm",
    postedTime: "2 ngày trước",
    isHot: true,
    tags: ["React", "TypeScript", "Node.js"],
  },
  {
    id: 2,
    title: "UI/UX Designer",
    company: "Design Studio",
    location: "Hồ Chí Minh",
    salary: "15-25 triệu",
    type: "Remote",
    experience: "2-3 năm",
    postedTime: "1 ngày trước",
    tags: ["Figma", "Adobe XD", "Sketch"],
  },
  {
    id: 3,
    title: "Product Manager",
    company: "Startup Hub",
    location: "Đà Nẵng",
    salary: "25-35 triệu",
    type: "Full-time",
    experience: "4-6 năm",
    postedTime: "3 ngày trước",
    isNew: true,
    tags: ["Agile", "Product Strategy", "Analytics"],
  },
  {
    id: 4,
    title: "Data Analyst",
    company: "Analytics Co",
    location: "Hà Nội",
    salary: "18-28 triệu",
    type: "Full-time",
    experience: "2-4 năm",
    postedTime: "1 ngày trước",
    tags: ["SQL", "Python", "Power BI"],
  },
  {
    id: 5,
    title: "Backend Developer (Java)",
    company: "Enterprise Solutions",
    location: "Hồ Chí Minh",
    salary: "22-32 triệu",
    type: "Full-time",
    experience: "3-5 năm",
    postedTime: "2 ngày trước",
    tags: ["Java", "Spring Boot", "MySQL"],
  },
  {
    id: 6,
    title: "Marketing Manager",
    company: "Digital Agency",
    location: "Hà Nội",
    salary: "20-30 triệu",
    type: "Full-time",
    experience: "3-5 năm",
    postedTime: "4 ngày trước",
    isHot: true,
    tags: ["Digital Marketing", "SEO", "Content"],
  },
  {
    id: 7,
    title: "Mobile Developer (Flutter)",
    company: "Mobile First",
    location: "Remote",
    salary: "19-29 triệu",
    type: "Remote",
    experience: "2-4 năm",
    postedTime: "1 ngày trước",
    tags: ["Flutter", "Dart", "Firebase"],
  },
  {
    id: 8,
    title: "DevOps Engineer",
    company: "Cloud Systems",
    location: "Hồ Chí Minh",
    salary: "25-35 triệu",
    type: "Full-time",
    experience: "4-6 năm",
    postedTime: "2 ngày trước",
    tags: ["AWS", "Docker", "Kubernetes"],
  },
];

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
  const { setCurrentPage } = useContext(AppContext);

  const [jobs, setJobs] = useState(MOCK_JOBS);
  const [filteredJobs, setFilteredJobs] = useState(MOCK_JOBS);
  const [savedJobs, setSavedJobs] = useState(new Set());
  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showFilters, setShowFilters] = useState(true);

  // Filter states
  const [salaryRange, setSalaryRange] = useState([0, 50]);
  const [experienceFilter, setExperienceFilter] = useState([]);
  const [jobTypeFilter, setJobTypeFilter] = useState([]);

  useEffect(() => {
    setCurrentPage("jobs");
  }, [setCurrentPage]);

  useEffect(() => {
    handleFilter();
  }, [searchKeyword, selectedLocation, selectedCategory, salaryRange, experienceFilter, jobTypeFilter]);

  const handleFilter = () => {
    let filtered = jobs;

    // Search keyword
    if (searchKeyword.trim()) {
      filtered = filtered.filter(
        (job) =>
          job.title.toLowerCase().includes(searchKeyword.toLowerCase()) ||
          job.company.toLowerCase().includes(searchKeyword.toLowerCase()) ||
          job.tags.some((tag) =>
            tag.toLowerCase().includes(searchKeyword.toLowerCase())
          )
      );
    }

    // Location filter
    if (selectedLocation && selectedLocation !== "all") {
      filtered = filtered.filter((job) => job.location === selectedLocation);
    }

    // Experience filter
    if (experienceFilter.length > 0) {
      filtered = filtered.filter((job) =>
        experienceFilter.some((exp) => job.experience.includes(exp))
      );
    }

    // Job type filter
    if (jobTypeFilter.length > 0) {
      filtered = filtered.filter((job) => jobTypeFilter.includes(job.type));
    }

    setFilteredJobs(filtered);
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
    handleFilter();
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
              Tìm việc làm <span className="highlight">phù hợp</span> với bạn
            </h1>
            <p className="hero-subtitle">
              Hơn 100,000+ việc làm đang chờ bạn khám phá
            </p>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="search-form">
              <div className="search-bar">
                <div className="search-input-group">
                  <BsSearch className="search-icon" />
                  <input
                    type="text"
                    placeholder="Tìm kiếm công việc, vị trí..."
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
                    <option value="">Tất cả địa điểm</option>
                    <option value="Hà Nội">Hà Nội</option>
                    <option value="Hồ Chí Minh">Hồ Chí Minh</option>
                    <option value="Đà Nẵng">Đà Nẵng</option>
                    <option value="Remote">Remote</option>
                  </select>
                </div>
                <button type="submit" className="search-btn">
                  Tìm kiếm
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
              <h3>Bộ lọc</h3>
              <button
                className="filter-toggle-mobile"
                onClick={() => setShowFilters(!showFilters)}
              >
                ×
              </button>
            </div>

            {/* Salary Range */}
            <div className="filter-section">
              <h4>Mức lương</h4>
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
                  <span>0 triệu</span>
                  <span>{salaryRange[1]} triệu</span>
                </div>
              </div>
            </div>

            {/* Experience Level */}
            <div className="filter-section">
              <h4>Kinh nghiệm</h4>
              <div className="checkbox-group">
                {["0-1", "1-2", "2-3", "3-5", "5+"].map((exp) => (
                  <label key={exp} className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={experienceFilter.includes(exp)}
                      onChange={() => toggleExperienceFilter(exp)}
                    />
                    <span>{exp} năm</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Job Type */}
            <div className="filter-section">
              <h4>Loại hình công việc</h4>
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
              Xóa bộ lọc
            </button>
          </aside>

          {/* Job Grid */}
          <div className="jobs-grid-wrapper">
            {/* Results Header */}
            <div className="results-header">
              <h2 className="results-count">
                {filteredJobs.length} việc làm phù hợp
              </h2>
              <button
                className="filter-toggle-btn"
                onClick={() => setShowFilters(!showFilters)}
              >
                <BsSearch /> Bộ lọc
              </button>
            </div>

            {/* Job Cards Grid */}
            <div className="jobs-grid">
              {filteredJobs.map((job) => (
                <div
                  key={job.id}
                  className="job-card"
                  onClick={() => navigate(`/jobs/${job.id}`)}
                >
                  {/* Badges */}
                  <div className="job-badges">
                    {job.isHot && <span className="badge badge-hot">🔥 Hot</span>}
                    {job.isNew && <span className="badge badge-new">✨ New</span>}
                  </div>

                  {/* Company Logo */}
                  <div className="company-logo">
                    <div className="logo-placeholder">
                      {job.company.charAt(0)}
                    </div>
                  </div>

                  {/* Job Info */}
                  <h3 className="job-title">{job.title}</h3>
                  <p className="job-company">{job.company}</p>

                  {/* Job Meta */}
                  <div className="job-meta">
                    <div className="meta-item">
                      <BsGeoAlt />
                      <span>{job.location}</span>
                    </div>
                    <div className="meta-item">
                      <BsCurrencyDollar />
                      <span>{job.salary}</span>
                    </div>
                    <div className="meta-item">
                      <BsClock />
                      <span>{job.postedTime}</span>
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="job-tags">
                    {job.tags.slice(0, 3).map((tag, idx) => (
                      <span key={idx} className="tag">
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Footer */}
                  <div className="job-card-footer">
                    <span className="job-type-badge">{job.type}</span>
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
              ))}
            </div>

            {/* No Results */}
            {filteredJobs.length === 0 && (
              <div className="no-results">
                <div className="no-results-icon">🔍</div>
                <h3>Không tìm thấy việc làm phù hợp</h3>
                <p>Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default JobList;
