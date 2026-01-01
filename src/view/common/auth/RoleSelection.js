import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "../../../components/LanguageSwitcher";
import "./RoleSelection.css";

function RoleSelection() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [selectedRole, setSelectedRole] = useState(null);
    const [isHovering, setIsHovering] = useState(null);

    const roles = [
        {
            id: "candidate",
            icon: "👤",
            title: t('iAmCandidate'),
            subtitle: t('candidateDescription'),
            color: "#667eea",
            gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            features: [
                t('findJobs'),
                t('buildProfile'),
                t('trackApplications'),
                t('createRoadmap')
            ],
            path: "/login"
        },
        {
            id: "employer",
            icon: "🏢",
            title: t('iAmEmployer'),
            subtitle: t('employerDescription'),
            color: "#10b981",
            gradient: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
            features: [
                t('postJobs'),
                t('findCandidates'),
                t('manageApplications'),
                t('companyBranding')
            ],
            path: "/employer/login"
        }
    ];

    const handleContinue = () => {
        if (selectedRole) {
            const role = roles.find(r => r.id === selectedRole);
            navigate(role.path);
        }
    };

    return (
        <div className="role-selection-container">
            {/* Background decorations */}
            <div className="decoration-circle circle-1"></div>
            <div className="decoration-circle circle-2"></div>
            <div className="decoration-circle circle-3"></div>

            {/* Language Switcher */}
            <div className="language-wrapper">
                <LanguageSwitcher />
            </div>

            {/* Main Content */}
            <div className="role-content">
                {/* Logo and Header */}
                <div className="role-header">
                    <div className="logo-section">
                        <div className="logo-icon">
                            <i className="fas fa-briefcase"></i>
                        </div>
                        <h1 className="logo-text">NEXTSTEP</h1>
                    </div>
                    <h2 className="main-title">{t('selectYourRole')}</h2>
                    <p className="main-subtitle">{t('selectRoleDescription')}</p>
                </div>

                {/* Role Cards */}
                <div className="role-cards">
                    {roles.map((role) => (
                        <div
                            key={role.id}
                            className={`role-card ${selectedRole === role.id ? 'selected' : ''} ${isHovering === role.id ? 'hovering' : ''}`}
                            onClick={() => setSelectedRole(role.id)}
                            onMouseEnter={() => setIsHovering(role.id)}
                            onMouseLeave={() => setIsHovering(null)}
                            style={{
                                '--role-color': role.color,
                                '--role-gradient': role.gradient
                            }}
                        >
                            {/* Selection indicator */}
                            <div className="selection-indicator">
                                <div className={`radio-circle ${selectedRole === role.id ? 'checked' : ''}`}>
                                    {selectedRole === role.id && (
                                        <i className="fas fa-check"></i>
                                    )}
                                </div>
                            </div>

                            {/* Card Content */}
                            <div className="card-icon-wrapper" style={{ background: role.gradient }}>
                                <span className="card-icon">{role.icon}</span>
                            </div>

                            <h3 className="card-title">{role.title}</h3>
                            <p className="card-subtitle">{role.subtitle}</p>

                            {/* Features */}
                            <ul className="features-list">
                                {role.features.map((feature, index) => (
                                    <li key={index} className="feature-item">
                                        <i className="fas fa-check-circle" style={{ color: role.color }}></i>
                                        <span>{feature}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                {/* Continue Button */}
                <button
                    className={`continue-btn ${selectedRole ? 'active' : ''}`}
                    onClick={handleContinue}
                    disabled={!selectedRole}
                >
                    {t('continue')}
                    <i className="fas fa-arrow-right"></i>
                </button>

                {/* Already have account link */}
                <p className="login-link">
                    {t('alreadyHaveAccount')}
                    <span onClick={() => setSelectedRole('candidate')}>
                        {t('loginAsCandidate')}
                    </span>
                    {' '}{t('or')}{' '}
                    <span onClick={() => setSelectedRole('employer')}>
                        {t('loginAsEmployer')}
                    </span>
                </p>
            </div>
        </div>
    );
}

export default RoleSelection;
