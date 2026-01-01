import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import authApi from "../../../api/auth";
import LanguageSwitcher from "../../../components/LanguageSwitcher";
import "./Register.css";

function Register() {
    const { t } = useTranslation();
    const {
        register,
        formState: { errors },
        handleSubmit,
        watch
    } = useForm();
    const [isView, setIsView] = useState(false);
    const [isViewConfirm, setIsViewConfirm] = useState(false);
    const [msg, setMsg] = useState("");
    const nav = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [currentSlide, setCurrentSlide] = useState(0);

    const slides = [
        {
            image: "https://img.freepik.com/free-vector/recruiting-agency-concept_74855-7598.jpg",
            title: t('findTalent'),
            description: t('findTalentDesc')
        },
        {
            image: "https://img.freepik.com/free-vector/job-interview-illustration_52683-47287.jpg",
            title: t('manageRecruitment'),
            description: t('manageRecruitmentDesc')
        },
        {
            image: "https://img.freepik.com/free-vector/business-team-brainstorm-idea-lightbulb-from-jigsaw_107791-5197.jpg",
            title: t('buildTeam'),
            description: t('buildTeamDesc')
        }
    ];

    // Auto-play carousel
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % slides.length);
        }, 4000);
        return () => clearInterval(interval);
    }, [slides.length]);

    const AlertMsg = ({ msg }) => (
        <span className="error-text">
            <i className="fas fa-exclamation-circle"></i>
            {msg || t('required')}
        </span>
    );

    const onSubmit = async (data) => {
        data.role = 'employer';
        setIsLoading(true);
        setMsg("");

        try {
            await authApi.register(data);
            toast.success(t('registerSuccess'));
            nav("/employer/login");
        } catch (error) {
            console.error(error);
            setMsg(t('registerFailed'));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="employer-login-page">
            <div className="login-wrapper">
                {/* Left Panel - Carousel (Hidden on Mobile) */}
                <div className="left-panel">
                    <div className="panel-content">
                        <img
                            src={slides[currentSlide].image}
                            alt="Employer"
                            className="slide-image"
                        />
                        <div className="carousel-dots">
                            {slides.map((_, index) => (
                                <button
                                    key={index}
                                    className={`dot ${currentSlide === index ? 'active' : ''}`}
                                    onClick={() => setCurrentSlide(index)}
                                ></button>
                            ))}
                        </div>
                        <h3 className="slide-title">{slides[currentSlide].title}</h3>
                        <p className="slide-desc">{slides[currentSlide].description}</p>
                    </div>
                </div>

                {/* Right Panel - Form */}
                <div className="right-panel">
                    <div className="lang-pos">
                        <LanguageSwitcher />
                    </div>

                    <div className="form-wrapper">
                        {/* Logo */}
                        <div className="logo-area">
                            <div className="logo-icon">
                                <i className="fas fa-building"></i>
                            </div>
                            <span className="logo-name">NEXTSTEP</span>
                        </div>

                        {/* Header */}
                        <h1 className="form-title">{t('employerRegister')}</h1>
                        <p className="form-subtitle">{t('createEmployerAccount')}</p>

                        {/* Form */}
                        <form onSubmit={handleSubmit(onSubmit)} className="login-form">

                            {/* Name Row */}
                            <div className="row-group">
                                <div className="field-group">
                                    <label className="field-label">{t('firstName')} <span className="req">*</span></label>
                                    <div className="input-box">
                                        <i className="fas fa-user"></i>
                                        <input {...register("firstName", { required: true })} placeholder={t('firstName')} />
                                    </div>
                                    {errors.firstName && <AlertMsg />}
                                </div>
                                <div className="field-group">
                                    <label className="field-label">{t('lastName')} <span className="req">*</span></label>
                                    <div className="input-box">
                                        <i className="fas fa-user"></i>
                                        <input {...register("lastName", { required: true })} placeholder={t('lastName')} />
                                    </div>
                                    {errors.lastName && <AlertMsg />}
                                </div>
                            </div>

                            {/* Company & Phone Row */}
                            <div className="row-group">
                                <div className="field-group">
                                    <label className="field-label">{t('companyName')} <span className="req">*</span></label>
                                    <div className="input-box">
                                        <i className="fas fa-building"></i>
                                        <input {...register("companyName", { required: true })} placeholder={t('companyName')} />
                                    </div>
                                    {errors.companyName && <AlertMsg />}
                                </div>
                                <div className="field-group">
                                    <label className="field-label">{t('phone')} <span className="req">*</span></label>
                                    <div className="input-box">
                                        <i className="fas fa-phone"></i>
                                        <input {...register("phone", { required: true })} placeholder={t('phone')} />
                                    </div>
                                    {errors.phone && <AlertMsg />}
                                </div>
                            </div>

                            {/* Email */}
                            <div className="field-group">
                                <label className="field-label">{t('email')} <span className="req">*</span></label>
                                <div className="input-box">
                                    <i className="fas fa-envelope"></i>
                                    <input type="email" placeholder={t('enterEmail')} {...register("email", { required: true })} />
                                </div>
                                {errors.email && <AlertMsg />}
                            </div>

                            {/* Password */}
                            <div className="field-group">
                                <label className="field-label">{t('password')} <span className="req">*</span></label>
                                <div className="input-box">
                                    <i className="fas fa-lock"></i>
                                    <input
                                        type={isView ? "text" : "password"}
                                        placeholder={t('enterPassword')}
                                        {...register("password", { required: true, minLength: 6 })}
                                    />
                                    <i className={`toggle-eye fas ${isView ? 'fa-eye-slash' : 'fa-eye'}`} onClick={() => setIsView(!isView)}></i>
                                </div>
                                {errors.password && <AlertMsg msg={t('passwordMinLength')} />}
                            </div>

                            {/* Confirm Password */}
                            <div className="field-group">
                                <label className="field-label">{t('confirmPassword')} <span className="req">*</span></label>
                                <div className="input-box">
                                    <i className="fas fa-lock"></i>
                                    <input
                                        type={isViewConfirm ? "text" : "password"}
                                        placeholder={t('confirmPassword')}
                                        {...register("confirmPassword", {
                                            required: true,
                                            validate: (val) => {
                                                if (watch('password') != val) {
                                                    return t('passwordNotMatch');
                                                }
                                            }
                                        })}
                                    />
                                    <i className={`toggle-eye fas ${isViewConfirm ? 'fa-eye-slash' : 'fa-eye'}`} onClick={() => setIsViewConfirm(!isViewConfirm)}></i>
                                </div>
                                {errors.confirmPassword && <AlertMsg msg={errors.confirmPassword.message} />}
                            </div>

                            {/* Terms */}
                            <div className="options-row">
                                <label className="remember-check" style={{ alignItems: 'flex-start' }}>
                                    <input type="checkbox" {...register("terms", { required: true })} style={{ marginTop: '3px' }} />
                                    <span style={{ fontSize: '12px', lineHeight: '1.4' }}>{t('agreeTerms')}</span>
                                </label>
                            </div>
                            {errors.terms && <AlertMsg msg={t('mustAgreeTerms')} />}

                            {/* Error */}
                            {msg && <div className="error-box">{msg}</div>}

                            {/* Submit */}
                            <button type="submit" className="submit-btn" disabled={isLoading}>
                                {isLoading && <span className="spinner"></span>}
                                <span>{t('register')}</span>
                            </button>
                        </form>

                        {/* Login Link */}
                        <p className="register-text">
                            {t('alreadyHaveAccount')}
                            <Link to="/employer/login">{t('login')}</Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Register;
