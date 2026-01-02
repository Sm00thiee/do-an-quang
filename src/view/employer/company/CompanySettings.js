import { useState } from 'react';
import { BsBuilding } from 'react-icons/bs';
import './CompanySettings.css';

function CompanySettings() {
    const [formData, setFormData] = useState({
        name: 'Công ty CP Công nghệ Nasatech',
        email: 'contact@nasatech.com',
        phone: '0123456789',
        website: 'https://nasatech.com',
        address: '123 Đường ABC, Quận 1',
        province: 'TP. Hồ Chí Minh',
        district: 'Quận 1',
        size: '51-200',
        description: 'Công ty chuyên về giải pháp công nghệ và phát triển phần mềm.',
        benefits: 'Bảo hiểm đầy đủ, Thưởng hiệu suất, Du lịch hàng năm'
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // TODO: Call API to save company info
        console.log('Saving company info:', formData);
        alert('Cập nhật thông tin công ty thành công (Mock)');
    };

    const handleBannerUpload = () => {
        // TODO: Implement image upload
        alert('Chức năng upload banner (Chưa implement)');
    };

    const handleLogoUpload = () => {
        // TODO: Implement logo upload
        alert('Chức năng upload logo (Chưa implement)');
    };

    return (
        <div className="company-settings-container">
            {/* Header */}
            <div className="company-settings-header">
                <h1 className="company-settings-title">Thông tin công ty</h1>
            </div>

            {/* Banner & Logo Section */}
            <div className="company-banner-section">
                <div className="company-banner">
                    <button className="banner-upload-btn" onClick={handleBannerUpload}>
                        Thay đổi ảnh bìa
                    </button>
                </div>
                <div className="company-logo-section">
                    <div className="company-logo-wrapper">
                        <div className="company-logo">
                            <BsBuilding />
                        </div>
                    </div>
                    <button className="logo-upload-btn" onClick={handleLogoUpload}>
                        Thay đổi logo
                    </button>
                </div>
            </div>

            {/* Form Section */}
            <form onSubmit={handleSubmit}>
                <div className="company-form-section">
                    <h2 className="form-section-title">Thông tin cơ bản</h2>

                    <div className="form-grid">
                        <div className="form-field">
                            <label className="form-label">
                                Tên công ty <span className="required">*</span>
                            </label>
                            <input
                                type="text"
                                name="name"
                                className="form-input"
                                value={formData.name}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="form-field">
                            <label className="form-label">
                                Email liên hệ <span className="required">*</span>
                            </label>
                            <input
                                type="email"
                                name="email"
                                className="form-input"
                                value={formData.email}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="form-field">
                            <label className="form-label">
                                Số điện thoại <span className="required">*</span>
                            </label>
                            <input
                                type="tel"
                                name="phone"
                                className="form-input"
                                value={formData.phone}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="form-field">
                            <label className="form-label">Website</label>
                            <input
                                type="url"
                                name="website"
                                className="form-input"
                                value={formData.website}
                                onChange={handleChange}
                                placeholder="https://example.com"
                            />
                        </div>

                        <div className="form-field">
                            <label className="form-label">
                                Quy mô công ty <span className="required">*</span>
                            </label>
                            <select
                                name="size"
                                className="form-select"
                                value={formData.size}
                                onChange={handleChange}
                                required
                            >
                                <option value="">Chọn quy mô</option>
                                <option value="1-10">1-10 nhân viên</option>
                                <option value="11-50">11-50 nhân viên</option>
                                <option value="51-200">51-200 nhân viên</option>
                                <option value="201-500">201-500 nhân viên</option>
                                <option value="500+">Trên 500 nhân viên</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="company-form-section" style={{ marginTop: '1.5rem' }}>
                    <h2 className="form-section-title">Địa chỉ</h2>

                    <div className="form-grid">
                        <div className="form-field full-width">
                            <label className="form-label">
                                Địa chỉ <span className="required">*</span>
                            </label>
                            <input
                                type="text"
                                name="address"
                                className="form-input"
                                value={formData.address}
                                onChange={handleChange}
                                placeholder="Số nhà, tên đường"
                                required
                            />
                        </div>

                        <div className="form-field">
                            <label className="form-label">
                                Tỉnh/Thành phố <span className="required">*</span>
                            </label>
                            <select
                                name="province"
                                className="form-select"
                                value={formData.province}
                                onChange={handleChange}
                                required
                            >
                                <option value="">Chọn tỉnh/thành</option>
                                <option value="TP. Hồ Chí Minh">TP. Hồ Chí Minh</option>
                                <option value="Hà Nội">Hà Nội</option>
                                <option value="Đà Nẵng">Đà Nẵng</option>
                                <option value="Cần Thơ">Cần Thơ</option>
                            </select>
                        </div>

                        <div className="form-field">
                            <label className="form-label">
                                Quận/Huyện <span className="required">*</span>
                            </label>
                            <select
                                name="district"
                                className="form-select"
                                value={formData.district}
                                onChange={handleChange}
                                required
                            >
                                <option value="">Chọn quận/huyện</option>
                                <option value="Quận 1">Quận 1</option>
                                <option value="Quận 2">Quận 2</option>
                                <option value="Quận 3">Quận 3</option>
                                <option value="Quận 4">Quận 4</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="company-form-section" style={{ marginTop: '1.5rem' }}>
                    <h2 className="form-section-title">Mô tả công ty</h2>

                    <div className="form-grid single-column">
                        <div className="form-field">
                            <label className="form-label">Giới thiệu công ty</label>
                            <textarea
                                name="description"
                                className="form-textarea"
                                value={formData.description}
                                onChange={handleChange}
                                placeholder="Mô tả về công ty, lĩnh vực hoạt động, sứ mệnh..."
                            />
                            <span className="form-hint">Tối đa 500 ký tự</span>
                        </div>

                        <div className="form-field">
                            <label className="form-label">Phúc lợi nhân viên</label>
                            <textarea
                                name="benefits"
                                className="form-textarea"
                                value={formData.benefits}
                                onChange={handleChange}
                                placeholder="Mô tả các chế độ đãi ngộ, phúc lợi cho nhân viên..."
                            />
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="form-actions">
                        <button type="button" className="btn-cancel">
                            Hủy bỏ
                        </button>
                        <button type="submit" className="btn-save">
                            Lưu thay đổi
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}

export default CompanySettings;
