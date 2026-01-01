import { useState } from "react";
import adminApi from "../../../api/admin";

function EmployersDetail({ employer, onClose, onUpdated }) {
  const [formData, setFormData] = useState({ ...employer });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    try {
      await adminApi.updateEmployer(employer.id, formData);
      onUpdated();
      alert("Cập nhật thành công!");
    } catch (error) {
      alert(error);
    }
  };

  return (
    <div className="modal show d-block" tabIndex="-1" role="dialog">
      <div className="modal-dialog" role="document">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Chi tiết nhà tuyển dụng</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            <div className="mb-3">
              <label>Tên công ty:</label>
              <input
                type="text"
                name="name"
                value={formData.name || ""}
                onChange={handleChange}
                className="form-control"
              />
            </div>
            <div className="mb-3">
              <label>Liên hệ:</label>
              <input
                type="text"
                name="contact_name"
                value={formData.contact_name || ""}
                onChange={handleChange}
                className="form-control"
              />
            </div>
            <div className="mb-3">
              <label>Số điện thoại:</label>
              <input
                type="text"
                name="phone"
                value={formData.phone || ""}
                onChange={handleChange}
                className="form-control"
              />
            </div>
            <div className="mb-3">
              <label>Địa chỉ:</label>
              <input
                type="text"
                name="address"
                value={formData.address || ""}
                onChange={handleChange}
                className="form-control"
              />
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn btn-success" onClick={handleSave}>
              Cập nhật
            </button>
            <button className="btn btn-secondary" onClick={onClose}>
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EmployersDetail;
