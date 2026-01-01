import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BsArrowLeft, BsClock, BsCheckCircleFill, BsBuilding, BsCurrencyDollar, BsGeoAlt } from 'react-icons/bs';
import './RoadmapView.css';

function RoadmapView() {
    const { t } = useTranslation();
    const navigate = useNavigate();

    // Mock milestone data
    const milestone = {
        id: 1,
        title: 'Junior Developer',
        description: 'Bắt đầu sự nghiệp lập trình với các kỹ năng cơ bản và công cụ thiết yếu',
        status: 'current',
        duration: '3-6 tháng',
        progress: 40,
    };

    // Skills data with icons
    const skills = [
        { id: 1, name: 'HTML & CSS', level: 85, icon: '🌐' },
        { id: 2, name: 'JavaScript', level: 70, icon: '⚡' },
        { id: 3, name: 'React', level: 60, icon: '⚛️' },
        { id: 4, name: 'Git & GitHub', level: 75, icon: '📦' },
        { id: 5, name: 'Responsive Design', level: 80, icon: '📱' },
        { id: 6, name: 'REST API', level: 55, icon: '🔗' },
    ];

    // Mock job recommendations
    const jobs = [
        {
            id: 1,
            title: 'Junior Frontend Developer',
            company: 'TechViet Solutions',
            location: 'Hà Nội',
            salary: '10-15 triệu',
            type: 'Full-time',
            logo: 'https://via.placeholder.com/60'
        },
        {
            id: 2,
            title: 'React Developer (Fresher)',
            company: 'FPT Software',
            location: 'TP. Hồ Chí Minh',
            salary: '12-18 triệu',
            type: 'Full-time',
            logo: 'https://via.placeholder.com/60'
        },
        {
            id: 3,
            title: 'Web Developer Intern',
            company: 'VNG Corporation',
            location: 'Đà Nẵng',
            salary: '8-12 triệu',
            type: 'Internship',
            logo: 'https://via.placeholder.com/60'
        },
    ];

    return (
        <div className="roadmap-detail-container">
            {/* Hero Section */}
            <div className="roadmap-hero">
                <div className="container">
                    {/* Breadcrumb */}
                    <Link to="/" className="breadcrumb-link">
                        <BsArrowLeft className="me-2" />
                        Quay lại
                    </Link>

                    <div className="hero-content">
                        <div className="hero-left">
                            <span className="status-badge badge-current">
                                {milestone.status === 'current' ? 'Đang học' : 'Hoàn thành'}
                            </span>

                            <h1 className="milestone-title">{milestone.title}</h1>
                            <p className="milestone-description">{milestone.description}</p>

                            <div className="hero-stats">
                                <div className="stat-item">
                                    <BsClock className="stat-icon" />
                                    <div>
                                        <span className="stat-label">Thời gian</span>
                                        <span className="stat-value">{milestone.duration}</span>
                                    </div>
                                </div>
                                <div className="stat-item">
                                    <BsCheckCircleFill className="stat-icon" />
                                    <div>
                                        <span className="stat-label">Tiến độ</span>
                                        <span className="stat-value">{milestone.progress}%</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="hero-right">
                            {/* Circular Progress */}
                            <div className="progress-circle">
                                <svg width="160" height="160" viewBox="0 0 160 160">
                                    <circle
                                        cx="80"
                                        cy="80"
                                        r="70"
                                        fill="none"
                                        stroke="rgba(255,255,255,0.2)"
                                        strokeWidth="12"
                                    />
                                    <circle
                                        cx="80"
                                        cy="80"
                                        r="70"
                                        fill="none"
                                        stroke="white"
                                        strokeWidth="12"
                                        strokeDasharray={`${2 * Math.PI * 70}`}
                                        strokeDashoffset={`${2 * Math.PI * 70 * (1 - milestone.progress / 100)}`}
                                        strokeLinecap="round"
                                        transform="rotate(-90 80 80)"
                                    />
                                </svg>
                                <div className="progress-text">
                                    <span className="progress-number">{milestone.progress}%</span>
                                    <span className="progress-label">hoàn thành</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Linear Progress Bar */}
                    <div className="progress-bar-linear">
                        <div className="progress-fill" style={{ width: `${milestone.progress}%` }}></div>
                    </div>
                </div>
            </div>

            {/* Skills Section */}
            <div className="skills-section">
                <div className="container">
                    <h2 className="section-title">Kỹ năng cần thiết</h2>
                    <p className="section-subtitle">
                        Phát triển các kỹ năng quan trọng để trở thành Junior Developer chuyên nghiệp
                    </p>

                    <div className="skills-grid">
                        {skills.map(skill => (
                            <div key={skill.id} className="skill-card">
                                <div className="skill-icon-wrapper">
                                    <span className="skill-icon">{skill.icon}</span>
                                </div>
                                <h3 className="skill-name">{skill.name}</h3>
                                <div className="skill-progress">
                                    <div className="skill-level-bar">
                                        <div
                                            className="skill-level-fill"
                                            style={{ width: `${skill.level}%` }}
                                        ></div>
                                    </div>
                                    <span className="skill-level-text">{skill.level}%</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Jobs Section */}
            <div className="jobs-section">
                <div className="container">
                    <div className="section-header">
                        <div>
                            <h2 className="section-title">Việc làm phù hợp</h2>
                            <p className="section-subtitle">
                                Các cơ hội việc làm dành cho Junior Developer
                            </p>
                        </div>
                        <Link to="/jobs" className="view-all-link">
                            Xem tất cả →
                        </Link>
                    </div>

                    <div className="jobs-grid">
                        {jobs.map(job => (
                            <div key={job.id} className="job-card" onClick={() => navigate(`/jobs/${job.id}`)}>
                                <div className="job-card-header">
                                    <div className="company-logo">
                                        <img src={job.logo} alt={job.company} />
                                    </div>
                                    <span className="job-type-badge">{job.type}</span>
                                </div>

                                <h3 className="job-title">{job.title}</h3>
                                <p className="company-name">
                                    <BsBuilding className="me-2" />
                                    {job.company}
                                </p>

                                <div className="job-meta">
                                    <span className="meta-item">
                                        <BsGeoAlt className="me-1" />
                                        {job.location}
                                    </span>
                                    <span className="meta-item">
                                        <BsCurrencyDollar className="me-1" />
                                        {job.salary}
                                    </span>
                                </div>

                                <button className="apply-btn">Ứng tuyển ngay</button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default RoadmapView;
