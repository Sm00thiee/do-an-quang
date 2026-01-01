import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import authApi from "../../../api/auth";
import { useEmployerAuthStore } from "../../../stores/employerAuthStore";
import LanguageSwitcher from "../../../components/LanguageSwitcher";
import "./Login.css";

function Login() {
  const { t } = useTranslation();
  const {
    register,
    formState: { errors },
    handleSubmit,
  } = useForm();
  const [isView, setIsView] = useState(false);
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
      {msg}
    </span>
  );

  const onSubmit = async (inf) => {
    inf.role = 'employer';
    setIsLoading(true);
    setMsg("");

    try {
      const res = await authApi.login(inf);
      localStorage.setItem("employer_jwt", res.authorization.token);
      toast.success(t('loginSuccess'));

      const userRes = await authApi.getMe(2);
      useEmployerAuthStore.getState().setUser(userRes);
      nav("/employer");
    } catch (error) {
      setMsg(t('loginFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (localStorage.getItem("employer_jwt")) {
      nav("/employer");
    }
  }, [nav]);

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
          {/* Language Switcher */}
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
            <h1 className="form-title">{t('employerLoginTitle')}</h1>
            <p className="form-subtitle">{t('employerLoginSubtitle')}</p>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="login-form">
              {/* Email */}
              <div className="field-group">
                <label className="field-label">
                  {t('email')} <span className="req">*</span>
                </label>
                <div className="input-box">
                  <i className="fas fa-envelope"></i>
                  <input
                    type="email"
                    placeholder={t('enterEmail')}
                    {...register("email", { required: true })}
                  />
                </div>
                {errors.email && <AlertMsg msg={t('pleaseEnterEmail')} />}
              </div>

              {/* Password */}
              <div className="field-group">
                <label className="field-label">
                  {t('password')} <span className="req">*</span>
                </label>
                <div className="input-box">
                  <i className="fas fa-lock"></i>
                  <input
                    type={isView ? "text" : "password"}
                    placeholder={t('enterPassword')}
                    {...register("password", { required: true })}
                  />
                  <i
                    className={`toggle-eye fas ${isView ? 'fa-eye-slash' : 'fa-eye'}`}
                    onClick={() => setIsView(!isView)}
                  ></i>
                </div>
                {errors.password && <AlertMsg msg={t('pleaseEnterPassword')} />}
              </div>

              {/* Options */}
              <div className="options-row">
                <label className="remember-check">
                  <input type="checkbox" />
                  <span>{t('rememberMe')}</span>
                </label>
                <Link to="#" className="forgot-link">{t('forgotPassword')}</Link>
              </div>

              {/* Error */}
              {msg && <div className="error-box">{msg}</div>}

              {/* Submit */}
              <button type="submit" className="submit-btn" disabled={isLoading}>
                {isLoading && <span className="spinner"></span>}
                <span>{t('login')}</span>
              </button>
            </form>

            {/* Register */}
            <p className="register-text">
              {t('newEmployer')}
              <Link to="/employer/register">{t('registerNow')}</Link>
            </p>

            {/* Divider */}
            <div className="divider">
              <span>{t('or')}</span>
            </div>

            {/* Switch */}
            <Link to="/login" className="switch-btn">
              <i className="fas fa-user"></i>
              {t('loginAsCandidate')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
