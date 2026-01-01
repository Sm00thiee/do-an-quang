import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import authApi from "../../../api/auth";
import LanguageSwitcher from "../../../components/LanguageSwitcher";

function Signup() {
  const { t } = useTranslation();
  const {
    register,
    formState: { errors },
    handleSubmit,
    watch,
  } = useForm();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Carousel state (similar to Login)
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      image: "https://img.freepik.com/free-vector/hiring-concept-illustration_114360-1285.jpg",
      title: t('findDreamJob'),
      description: t('connectWithOpportunities')
    },
    {
      image: "https://img.freepik.com/free-vector/job-interview-conversation_52683-43379.jpg",
      title: t('careerOpportunities'),
      description: t('developCareer')
    },
    {
      image: "https://img.freepik.com/free-vector/we-are-hiring-concept-illustration_114360-2977.jpg",
      title: t('joinNewTeam'),
      description: t('startJourney')
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

  // Alert message component (matching Login style)
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

  const handleSignup = async (userData) => {
    // Add role candidate by default
    userData.role = 'candidate';
    setIsLoading(true);
    setIsError(false);

    try {
      const response = await authApi.register(userData);
      console.log('Signup response:', response);

      // Hiển thị thông báo thành công
      const signupInfo = `
Đăng ký thành công!

Thông tin tài khoản:
📧 Email: ${userData.email}
👤 Tên: ${userData.firstName} ${userData.lastName}
📱 SĐT: ${userData.phone}
🏷️ Role: Candidate

Vui lòng đăng nhập để tiếp tục!
      `;
      alert(signupInfo);

      // Chuyển hướng về trang login
      navigate("/login");
    } catch (error) {
      console.error('Signup error:', error);
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container-fluid min-vh-100 d-flex align-items-center" style={{ backgroundColor: "#f8f9fa" }}>
      <div className="container py-[20px]">
        <div className="row justify-content-center">
          <div className="col-lg-11">
            <div className="card shadow-lg border-0 rounded-4 overflow-hidden">
              <div className="row g-0">
                {/* Left side - Illustration */}
                <div className="col-md-5 d-flex align-items-center justify-content-center" style={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" }}>
                  <div className="text-center p-5">
                    <div className="position-relative">
                      <img
                        src={slides[currentSlide].image}
                        alt="Signup Illustration"
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
                      <h3 className="fw-bold mb-2">{t('signupTitle')}</h3>
                      <p className="text-muted">{t('signupSubtitle')}</p>
                    </div>

                    <form onSubmit={handleSubmit(handleSignup)}>
                      {/* Name fields */}
                      <div className="row mb-3">
                        <div className="col-md-6">
                          <label htmlFor="firstName" className="form-label fw-semibold">
                            {t('firstName')} <span className="text-danger fw-bold">*</span>
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            {...register("firstName", { required: true })}
                            id="firstName"
                            placeholder={t('enterFirstName')}
                          />
                          {errors.firstName && <AlertMsg msg={t('pleaseEnterFirstName')} />}
                        </div>
                        <div className="col-md-6">
                          <label htmlFor="lastName" className="form-label fw-semibold">
                            {t('lastName')} <span className="text-danger fw-bold">*</span>
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            {...register("lastName", { required: true })}
                            id="lastName"
                            placeholder={t('enterLastName')}
                          />
                          {errors.lastName && <AlertMsg msg={t('pleaseEnterLastName')} />}
                        </div>
                      </div>

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

                      {/* Phone */}
                      <div className="mb-3">
                        <label htmlFor="phone" className="form-label fw-semibold">
                          {t('phone')} <span className="text-danger fw-bold">*</span>
                        </label>
                        <input
                          type="tel"
                          className="form-control"
                          {...register("phone", {
                            required: true,
                            pattern: /^[0-9]{10,11}$/,
                          })}
                          id="phone"
                          placeholder={t('enterPhone')}
                        />
                        {errors.phone?.type === "required" && <AlertMsg msg={t('pleaseEnterPhone')} />}
                        {errors.phone?.type === "pattern" && <AlertMsg msg={t('invalidPhone')} />}
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
                            {...register("password", {
                              required: true,
                              minLength: 6,
                            })}
                            id="password"
                            placeholder={t('enterPassword')}
                          />
                          <i
                            className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'} position-absolute top-50 end-0 translate-middle-y me-3 text-muted password-toggle-icon`}
                            onClick={() => setShowPassword(!showPassword)}
                            style={{ cursor: 'pointer', fontSize: '18px' }}
                          ></i>
                        </div>
                        {errors.password?.type === "required" && <AlertMsg msg={t('pleaseEnterPassword')} />}
                        {errors.password?.type === "minLength" && <AlertMsg msg={t('passwordMinLength')} />}
                      </div>

                      {/* Confirm Password */}
                      <div className="mb-3">
                        <label htmlFor="confirmPassword" className="form-label fw-semibold">
                          {t('confirmPassword')} <span className="text-danger fw-bold">*</span>
                        </label>
                        <div className="position-relative">
                          <input
                            type={showConfirmPassword ? "text" : "password"}
                            className="form-control form-control-lg"
                            {...register("confirmPassword", { required: true })}
                            id="confirmPassword"
                            placeholder={t('enterConfirmPassword')}
                          />
                          <i
                            className={`fas ${showConfirmPassword ? 'fa-eye-slash' : 'fa-eye'} position-absolute top-50 end-0 translate-middle-y me-3 text-muted password-toggle-icon`}
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            style={{ cursor: 'pointer', fontSize: '18px' }}
                          ></i>
                        </div>
                        {errors.confirmPassword?.type === "required" && <AlertMsg msg={t('pleaseConfirmPassword')} />}
                        {!errors.confirmPassword && watch("confirmPassword") !== "" && watch("password") !== watch("confirmPassword") && (
                          <AlertMsg msg={t('passwordNotMatch')} />
                        )}
                      </div>

                      {/* Terms and conditions */}
                      <div className="form-check mb-4">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          {...register("terms", { required: true })}
                          id="terms"
                        />
                        <label className="form-check-label text-muted" htmlFor="terms">
                          {t('agreeTerms')}{" "}
                          <a href="#" className="text-primary">
                            {t('termsOfService')}
                          </a>{" "}
                          {t('and')}{" "}
                          <a href="#" className="text-primary">
                            {t('privacyPolicy')}
                          </a>
                        </label>
                        {errors.terms && <AlertMsg msg={t('mustAgreeTerms')} />}
                      </div>

                      {/* Error message */}
                      {isError && (
                        <div className="alert alert-danger">
                          {t('signupFailed')}
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
                        <span>{t('signup')}</span>
                      </button>

                      {/* Login link */}
                      <div className="text-center">
                        <span className="text-muted">{t('alreadyHaveAccount')} </span>
                        <a href="/login" className="text-primary fw-semibold text-decoration-none">{t('login')}</a>
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

export default Signup;
