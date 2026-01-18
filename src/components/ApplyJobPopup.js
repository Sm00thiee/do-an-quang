import React, { useState, useRef } from 'react';
import { BsFileEarmarkPdf, BsX } from 'react-icons/bs';
import './ApplyJobPopup.css';

const ApplyJobPopup = ({ job, user, isOpen, onClose, onSubmit, isSubmitting = false }) => {
  const [formData, setFormData] = useState({
    fullName: user ? `${user.name?.lastname || ''} ${user.name?.firstname || ''}`.trim() || user.email || '' : '',
    email: user?.email || '',
    phone: user?.phone || '',
  });
  const [cvFile, setCvFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);
  const cvUploadRef = useRef(null);

  if (!isOpen) return null;

  const validateForm = () => {
    const newErrors = {};

    // Validate full name
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Vui lòng nhập họ và tên';
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = 'Họ và tên phải có ít nhất 2 ký tự';
    }

    // Validate email
    if (!formData.email.trim()) {
      newErrors.email = 'Vui lòng nhập email';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email không hợp lệ';
    }

    // Validate phone
    if (!formData.phone.trim()) {
      newErrors.phone = 'Vui lòng nhập số điện thoại';
    } else if (!/^[0-9]{10,11}$/.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Số điện thoại không hợp lệ (10-11 chữ số)';
    }

    // Validate CV
    if (!cvFile) {
      newErrors.cv = 'Vui lòng chọn CV';
    } else {
      const maxSize = 5 * 1024 * 1024; // 5MB
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (cvFile.size > maxSize) {
        newErrors.cv = 'File CV không được vượt quá 5MB';
      } else if (!allowedTypes.includes(cvFile.type)) {
        newErrors.cv = 'Chỉ chấp nhận file PDF, DOC hoặc DOCX';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleFileSelect = (file) => {
    if (file) {
      setCvFile(file);
      if (errors.cv) {
        setErrors(prev => ({
          ...prev,
          cv: ''
        }));
      }
    }
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Clear previous submit error
    setSubmitError(null);
    
    if (!validateForm()) {
      return;
    }

    try {
      await onSubmit({
        ...formData,
        cvFile
      });
      // If onSubmit succeeds, the parent component will handle success and close modal
    } catch (error) {
      // Handle error from parent component - display in-app instead of browser alert
      const errorMessage = error?.message || error?.toString() || 'Có lỗi xảy ra khi nộp hồ sơ. Vui lòng thử lại sau.';
      setSubmitError(errorMessage);
      // Scroll to error message
      setTimeout(() => {
        const errorElement = document.querySelector('.apply-popup-error-container');
        if (errorElement) {
          errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    }
  };

  const handleCancel = () => {
    setFormData({
      fullName: user ? `${user.name?.lastname || ''} ${user.name?.firstname || ''}`.trim() || user.email || '' : '',
      email: user?.email || '',
      phone: user?.phone || '',
    });
    setCvFile(null);
    setErrors({});
    setSubmitError(null);
    onClose();
  };

  const jobTitle = job?.jname || job?.title || 'Vị trí tuyển dụng';

  return (
    <div className="apply-popup-overlay" onClick={handleCancel}>
      <div className="apply-popup-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="apply-popup-header">
          <h2 className="apply-popup-title">{jobTitle}</h2>
          <button 
            className="apply-popup-close" 
            onClick={handleCancel}
            type="button"
            aria-label="Đóng"
          >
            <BsX />
          </button>
        </div>

        {/* CV Upload Section */}
        <div className="apply-popup-section">
          <div className="apply-popup-section-header">
            <BsFileEarmarkPdf className="apply-popup-icon" />
            <h3 className="apply-popup-section-title">Chọn CV để ứng tuyển</h3>
          </div>

          <div 
            className={`apply-popup-upload-area ${isDragging ? 'dragging' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            ref={cvUploadRef}
          >
            <p className="apply-popup-upload-text">
              Tải lên CV từ máy tính, chọn hoặc kéo thả
            </p>
            <button
              type="button"
              className="apply-popup-upload-btn"
              onClick={() => fileInputRef.current?.click()}
            >
              Chọn CV
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={handleFileInputChange}
              style={{ display: 'none' }}
            />
            {cvFile && (
              <div className="apply-popup-file-info">
                <BsFileEarmarkPdf />
                <span>{cvFile.name}</span>
                <button
                  type="button"
                  className="apply-popup-remove-file"
                  onClick={() => {
                    setCvFile(null);
                    if (fileInputRef.current) {
                      fileInputRef.current.value = '';
                    }
                  }}
                >
                  <BsX />
                </button>
              </div>
            )}
            {errors.cv && (
              <p className="apply-popup-error">{errors.cv}</p>
            )}
          </div>
        </div>

        {/* Form Section */}
        <div className="apply-popup-section">
          <div className="apply-popup-form-header">
            <p className="apply-popup-form-title">Vui lòng nhập đầy đủ thông tin chi tiết:</p>
            <p className="apply-popup-required-note">
              (<span className="required-asterisk">*</span>) Thông tin bắt buộc.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="apply-popup-form">
            {/* Full Name */}
            <div className="apply-popup-form-group">
              <label className="apply-popup-label">
                Họ và Tên
                <span className="required-asterisk">*</span>
              </label>
              <input
                type="text"
                name="fullName"
                className={`apply-popup-input ${errors.fullName ? 'error' : ''}`}
                placeholder="Họ tên hiện thị với NTD"
                value={formData.fullName}
                onChange={handleInputChange}
              />
              {errors.fullName && (
                <p className="apply-popup-error">{errors.fullName}</p>
              )}
            </div>

            {/* Email and Phone Row */}
            <div className="apply-popup-form-row">
              {/* Email */}
              <div className="apply-popup-form-group">
                <label className="apply-popup-label">
                  Email
                  <span className="required-asterisk">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  className={`apply-popup-input ${errors.email ? 'error' : ''}`}
                  placeholder="Email hiện thị với NTD"
                  value={formData.email}
                  onChange={handleInputChange}
                />
                {errors.email && (
                  <p className="apply-popup-error">{errors.email}</p>
                )}
              </div>

              {/* Phone */}
              <div className="apply-popup-form-group">
                <label className="apply-popup-label">
                  Số điện thoại
                  <span className="required-asterisk">*</span>
                </label>
                <input
                  type="tel"
                  name="phone"
                  className={`apply-popup-input ${errors.phone ? 'error' : ''}`}
                  placeholder="Số điện thoại hiện thị với NTD"
                  value={formData.phone}
                  onChange={handleInputChange}
                />
                {errors.phone && (
                  <p className="apply-popup-error">{errors.phone}</p>
                )}
              </div>
            </div>

            {/* Submit Error Display */}
            {submitError && (
              <div className="apply-popup-error-container" style={{
                padding: '12px',
                marginBottom: '16px',
                backgroundColor: '#fee',
                border: '1px solid #fcc',
                borderRadius: '8px',
                color: '#c33'
              }}>
                <strong>Lỗi:</strong> {submitError}
              </div>
            )}

            {/* Action Buttons */}
            <div className="apply-popup-actions">
              <button
                type="button"
                className="apply-popup-btn apply-popup-btn-cancel"
                onClick={handleCancel}
                disabled={isSubmitting}
              >
                Hủy
              </button>
              <button
                type="submit"
                className="apply-popup-btn apply-popup-btn-submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Đang xử lý...' : 'Nộp hồ sơ ứng tuyển'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ApplyJobPopup;
