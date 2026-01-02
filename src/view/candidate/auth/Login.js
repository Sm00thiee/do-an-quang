import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import authApi from "../../../api/auth";
import { useCandidateAuthStore } from "../../../stores/candidateAuthStore";
import LanguageSwitcher from "../../../components/LanguageSwitcher";

function Login() {
  const { t } = useTranslation();
  const {
    register,
    formState: { errors },
    handleSubmit,
  } = useForm();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Carousel state (similar to Signup)
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      image: "https://img.freepik.com/free-vector/hiring-concept-illustration_114360-1285.jpg",
      title: t('welcomeBack'),
      description: t('continueJourney')
    },
    {
      image: "https://img.freepik.com/free-vector/job-interview-conversation_52683-43379.jpg",
      title: t('careerOpportunities'),
      description: t('discoverJobs')
    },
    {
      image: "https://img.freepik.com/free-vector/we-are-hiring-concept-illustration_114360-2977.jpg",
      title: t('findDreamJob'),
      description: t('connectWithEmployers')
    }
  ];

  // Auto-play carousel
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [slides.length]);

  const handleDotClick = (index) => {
    setCurrentSlide(index);
  };

  // Alert message component (matching Signup style)
  const AlertMsg = ({ msg }) => {
    return (
      <div className="d-flex justify-content-start">
        <span className="text-danger text-start" style={{ fontSize: "15px" }}>
          <span className="h5">
            <i className="fas fa-exclamation-triangle"></i>
          </span>
          <span className="ms-1">{msg}</span>
        </span>
      </div>
    );
  };

  const handleLogin = async (user) => {
    //add role candidate
    user.role = 'candidate';
    setIsLoading(true);
    setIsError(false);

    try {
      const response = await authApi.login(user);
      console.log('Login response:', response);

      // Store token from session (backend returns session.access_token)
      if (response.session && response.session.access_token) {
        localStorage.setItem("candidate_jwt", response.session.access_token);
      }

      // Store user info
      if (response.user) {
        useCandidateAuthStore.getState().setCurrentCandidate(response.user);
      }

      // Show success message
      toast.success(t('loginSuccess'), {
        position: "top-right",
        autoClose: 2000
      });

      // Navigation
      navigate("/");
    } catch (error) {
      console.error('Login error:', error);
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container-fluid min-vh-100 d-flex align-items-center" style={{ backgroundColor: "#f8f9fa" }}>
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-lg-10">
            <div className="card shadow-lg border-0 rounded-4 overflow-hidden">
              <div className="row g-0">
                {/* Left side - Illustration */}
                <div className="col-md-5 d-flex align-items-center justify-content-center" style={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" }}>
                  <div className="text-center p-5">
                    <div className="position-relative">
                      <img
                        src={slides[currentSlide].image}
                        alt="Login Illustration"
                        className="img-fluid mb-4 transition-opacity"
                        style={{
                          maxHeight: "300px",
                          filter: "brightness(1.1)",
                          transition: "opacity 0.5s ease-in-out"
                        }}
                      />
                    </div>

                    {/* Pagination dots */}
                    <div className="d-flex justify-content-center mb-3">
                      {slides.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => handleDotClick(index)}
                          className={`bg-white rounded-circle mx-1 border-0 ${currentSlide === index ? '' : 'opacity-50'
                            }`}
                          style={{
                            width: "12px",
                            height: "12px",
                            cursor: "pointer",
                            transition: "opacity 0.3s ease"
                          }}
                        ></button>
                      ))}
                    </div>

                    <h4 className="text-white mb-2">{slides[currentSlide].title}</h4>
                    <p className="text-white-50">{slides[currentSlide].description}</p>
                  </div>
                </div>

                {/* Right side - Form */}
                <div className="col-md-7">
                  <div className="p-5">
                    {/* Language Switcher */}
                    <div className="d-flex justify-content-end mb-3">
                      <LanguageSwitcher />
                    </div>

                    {/* Logo and header */}
                    <div className="text-center mb-4">
                      <div className="d-flex align-items-center justify-content-center mb-3">
                        <div className="bg-primary text-white rounded-3 p-2 me-2">
                          <i className="fas fa-briefcase"></i>
                        </div>
                        <h5 className="mb-0 fw-bold text-primary">NEXTSTEP</h5>
                      </div>
                      <h3 className="fw-bold mb-2">{t('loginTitle')}</h3>
                      <p className="text-muted">{t('loginSubtitle')}</p>
                    </div>

                    <form onSubmit={handleSubmit(handleLogin)}>
                      {/* Email */}
                      <div className="mb-3">
                        <label htmlFor="email" className="form-label fw-semibold">
                          {t('email')} <span className="text-danger fw-bold">*</span>
                        </label>
                        <input
                          type="email"
                          className="form-control form-control-lg"
                          {...register("email", {
                            required: true,
                            pattern: /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/,
                          })}
                          id="email"
                          placeholder={t('enterEmail')}
                        />
                        {errors.email?.type === "required" && <AlertMsg msg={t('pleaseEnterEmail')} />}
                        {errors.email?.type === "pattern" && <AlertMsg msg={t('invalidEmail')} />}
                      </div>

                      {/* Password */}
                      <div className="mb-3">
                        <label htmlFor="password" className="form-label fw-semibold">
                          {t('password')} <span className="text-danger fw-bold">*</span>
                        </label>
                        <div className="position-relative">
                          <input
                            type={showPassword ? "text" : "password"}
                            className="form-control form-control-lg"
                            {...register("password", { required: true })}
                            id="password"
                            placeholder={t('enterPassword')}
                          />
                          <i
                            className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'} position-absolute top-50 end-0 translate-middle-y me-3 text-muted password-toggle-icon`}
                            onClick={() => setShowPassword(!showPassword)}
                            style={{ cursor: 'pointer', fontSize: '18px' }}
                          ></i>
                        </div>
                        {errors.password && <AlertMsg msg={t('pleaseEnterPassword')} />}
                      </div>

                      {/* Remember me and Forgot password */}
                      <div className="d-flex justify-content-between align-items-center mb-4">
                        <div className="form-check">
                          <input className="form-check-input" type="checkbox" id="remember" />
                          <label className="form-check-label text-muted" htmlFor="remember">
                            {t('rememberMe')}
                          </label>
                        </div>
                        <a href="#" className="text-primary text-decoration-none">
                          {t('forgotPassword')}
                        </a>
                      </div>

                      {/* Error message */}
                      {isError && (
                        <div className="alert alert-danger">
                          {t('loginFailed')}
                        </div>
                      )}

                      {/* Submit button */}
                      <button
                        type="submit"
                        className="btn btn-primary btn-lg w-100 mb-3 rounded-pill"
                        style={{ padding: "12px" }}
                        disabled={isLoading}
                      >
                        {isLoading && (
                          <span className="spinner-border spinner-border-sm me-2"></span>
                        )}
                        <span>{t('login')}</span>
                      </button>

                      {/* Sign up link */}
                      <div className="text-center">
                        <span className="text-muted">{t('dontHaveAccount')} </span>
                        <a href="/signup" className="text-primary fw-semibold text-decoration-none">{t('registerNow')}</a>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
