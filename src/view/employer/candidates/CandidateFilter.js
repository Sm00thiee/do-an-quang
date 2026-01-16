import React, { useState } from 'react';
import { BsFilter, BsX } from 'react-icons/bs';
import './CandidateFilter.css';

const SKILL_OPTIONS = [
    'JavaScript', 'React', 'Node.js', 'Python', 'Java', 'C++', 'PHP',
    'Angular', 'Vue.js', 'TypeScript', 'MongoDB', 'PostgreSQL', 'MySQL',
    'AWS', 'Docker', 'Kubernetes', 'Git', 'HTML/CSS', 'REST API', 'GraphQL'
];

const EXPERIENCE_LEVELS = [
    { value: 'intern', label: 'Thực tập sinh' },
    { value: 'fresher', label: 'Fresher (0-1 năm)' },
    { value: 'junior', label: 'Junior (1-3 năm)' },
    { value: 'middle', label: 'Middle (3-5 năm)' },
    { value: 'senior', label: 'Senior (5+ năm)' },
    { value: 'lead', label: 'Team Lead' },
    { value: 'manager', label: 'Manager' }
];

const LOCATIONS = [
    'Hà Nội', 'TP. Hồ Chí Minh', 'Đà Nẵng', 'Hải Phòng', 'Cần Thơ',
    'Biên Hòa', 'Nha Trang', 'Huế', 'Vũng Tàu', 'Buôn Ma Thuột'
];

const SALARY_RANGES = [
    { value: '0-10', label: 'Dưới 10 triệu' },
    { value: '10-15', label: '10-15 triệu' },
    { value: '15-20', label: '15-20 triệu' },
    { value: '20-30', label: '20-30 triệu' },
    { value: '30-50', label: '30-50 triệu' },
    { value: '50+', label: 'Trên 50 triệu' }
];

function CandidateFilter({ onFilterChange, initialFilters = {} }) {
    const [showFilter, setShowFilter] = useState(false);
    const [filters, setFilters] = useState({
        skills: initialFilters.skills || [],
        experienceLevel: initialFilters.experienceLevel || [],
        locations: initialFilters.locations || [],
        salaryRange: initialFilters.salaryRange || [],
        applicationDateFrom: initialFilters.applicationDateFrom || '',
        applicationDateTo: initialFilters.applicationDateTo || '',
        status: initialFilters.status || []
    });

    const [activeFilters, setActiveFilters] = useState(0);

    const handleFilterChange = (filterType, value) => {
        let newFilters = { ...filters };

        if (Array.isArray(filters[filterType])) {
            if (filters[filterType].includes(value)) {
                newFilters[filterType] = filters[filterType].filter(item => item !== value);
            } else {
                newFilters[filterType] = [...filters[filterType], value];
            }
        } else {
            newFilters[filterType] = value;
        }

        setFilters(newFilters);
        calculateActiveFilters(newFilters);
    };

    const calculateActiveFilters = (currentFilters) => {
        let count = 0;
        Object.keys(currentFilters).forEach(key => {
            if (Array.isArray(currentFilters[key])) {
                count += currentFilters[key].length;
            } else if (currentFilters[key]) {
                count += 1;
            }
        });
        setActiveFilters(count);
    };

    const applyFilters = () => {
        if (onFilterChange) {
            onFilterChange(filters);
        }
        setShowFilter(false);
    };

    const clearFilters = () => {
        const emptyFilters = {
            skills: [],
            experienceLevel: [],
            locations: [],
            salaryRange: [],
            applicationDateFrom: '',
            applicationDateTo: '',
            status: []
        };
        setFilters(emptyFilters);
        setActiveFilters(0);
        if (onFilterChange) {
            onFilterChange(emptyFilters);
        }
    };

    const removeFilter = (filterType, value) => {
        let newFilters = { ...filters };
        if (Array.isArray(filters[filterType])) {
            newFilters[filterType] = filters[filterType].filter(item => item !== value);
        } else {
            newFilters[filterType] = '';
        }
        setFilters(newFilters);
        calculateActiveFilters(newFilters);
        if (onFilterChange) {
            onFilterChange(newFilters);
        }
    };

    const renderActiveFilters = () => {
        const active = [];
        
        filters.skills.forEach(skill => {
            active.push({ type: 'skills', value: skill, label: skill });
        });
        
        filters.experienceLevel.forEach(level => {
            const option = EXPERIENCE_LEVELS.find(e => e.value === level);
            active.push({ type: 'experienceLevel', value: level, label: option?.label || level });
        });
        
        filters.locations.forEach(loc => {
            active.push({ type: 'locations', value: loc, label: loc });
        });
        
        filters.salaryRange.forEach(salary => {
            const option = SALARY_RANGES.find(s => s.value === salary);
            active.push({ type: 'salaryRange', value: salary, label: option?.label || salary });
        });

        if (filters.applicationDateFrom) {
            active.push({ 
                type: 'applicationDateFrom', 
                value: filters.applicationDateFrom, 
                label: `Từ: ${filters.applicationDateFrom}` 
            });
        }

        if (filters.applicationDateTo) {
            active.push({ 
                type: 'applicationDateTo', 
                value: filters.applicationDateTo, 
                label: `Đến: ${filters.applicationDateTo}` 
            });
        }

        return active;
    };

    return (
        <div className="candidate-filter-container">
            <button 
                className="filter-toggle-btn"
                onClick={() => setShowFilter(!showFilter)}
            >
                <BsFilter />
                <span>Bộ lọc</span>
                {activeFilters > 0 && (
                    <span className="filter-badge">{activeFilters}</span>
                )}
            </button>

            {activeFilters > 0 && (
                <div className="active-filters">
                    {renderActiveFilters().map((filter, index) => (
                        <div key={index} className="filter-tag">
                            <span>{filter.label}</span>
                            <button onClick={() => removeFilter(filter.type, filter.value)}>
                                <BsX />
                            </button>
                        </div>
                    ))}
                    <button className="clear-all-btn" onClick={clearFilters}>
                        Xóa tất cả
                    </button>
                </div>
            )}

            {showFilter && (
                <div className="filter-panel">
                    <div className="filter-panel-header">
                        <h3>Bộ lọc nâng cao</h3>
                        <button className="close-btn" onClick={() => setShowFilter(false)}>
                            <BsX />
                        </button>
                    </div>

                    <div className="filter-panel-body">
                        {/* Skills Filter */}
                        <div className="filter-section">
                            <h4>Kỹ năng</h4>
                            <div className="filter-options">
                                {SKILL_OPTIONS.map(skill => (
                                    <label key={skill} className="filter-checkbox">
                                        <input
                                            type="checkbox"
                                            checked={filters.skills.includes(skill)}
                                            onChange={() => handleFilterChange('skills', skill)}
                                        />
                                        <span>{skill}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Experience Level Filter */}
                        <div className="filter-section">
                            <h4>Kinh nghiệm</h4>
                            <div className="filter-options">
                                {EXPERIENCE_LEVELS.map(level => (
                                    <label key={level.value} className="filter-checkbox">
                                        <input
                                            type="checkbox"
                                            checked={filters.experienceLevel.includes(level.value)}
                                            onChange={() => handleFilterChange('experienceLevel', level.value)}
                                        />
                                        <span>{level.label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Location Filter */}
                        <div className="filter-section">
                            <h4>Địa điểm</h4>
                            <div className="filter-options">
                                {LOCATIONS.map(location => (
                                    <label key={location} className="filter-checkbox">
                                        <input
                                            type="checkbox"
                                            checked={filters.locations.includes(location)}
                                            onChange={() => handleFilterChange('locations', location)}
                                        />
                                        <span>{location}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Salary Range Filter */}
                        <div className="filter-section">
                            <h4>Mức lương mong muốn</h4>
                            <div className="filter-options">
                                {SALARY_RANGES.map(salary => (
                                    <label key={salary.value} className="filter-checkbox">
                                        <input
                                            type="checkbox"
                                            checked={filters.salaryRange.includes(salary.value)}
                                            onChange={() => handleFilterChange('salaryRange', salary.value)}
                                        />
                                        <span>{salary.label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Application Date Filter */}
                        <div className="filter-section">
                            <h4>Ngày ứng tuyển</h4>
                            <div className="date-range-filter">
                                <div className="date-input-group">
                                    <label>Từ ngày</label>
                                    <input
                                        type="date"
                                        value={filters.applicationDateFrom}
                                        onChange={(e) => handleFilterChange('applicationDateFrom', e.target.value)}
                                    />
                                </div>
                                <div className="date-input-group">
                                    <label>Đến ngày</label>
                                    <input
                                        type="date"
                                        value={filters.applicationDateTo}
                                        onChange={(e) => handleFilterChange('applicationDateTo', e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="filter-panel-footer">
                        <button className="btn-clear" onClick={clearFilters}>
                            Xóa bộ lọc
                        </button>
                        <button className="btn-apply" onClick={applyFilters}>
                            Áp dụng
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default CandidateFilter;
