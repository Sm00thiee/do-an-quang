import React from "react";
import adminApi from "../../../api/admin";

function EmployersDeleting({ employer, onDeleted }) {
  const handleDelete = async () => {
    if (!employer) return;
    try {
      await adminApi.deleteEmployer(employer.id);
      onDeleted(); // Cập nhật lại danh sách sau khi xóa thành công
      document.getElementById("closeDeleteModal").click(); // Đóng modal sau khi xóa
    } catch (error) {
      console.error("Lỗi khi xóa nhà tuyển dụng:", error);
    }
  };

  return (
    <div
      className="modal fade"
      id="EmployersDeleting"
      tabIndex="-1"
      aria-labelledby="deleteModalLabel"
      aria-hidden="true"
    >
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title" id="deleteModalLabel">
              Xác nhận xóa
            </h5>
            <button
              type="button"
              className="btn-close"
              data-bs-dismiss="modal"
              aria-label="Close"
              id="closeDeleteModal"
            ></button>
          </div>
          <div className="modal-body">
            {employer ? (
              <p>
                Bạn có chắc chắn muốn xóa nhà tuyển dụng{" "}
                <strong>
                  {employer.name}
                </strong>
                ?
              </p>
            ) : (
              <p>Không có nhà tuyển dụng nào được chọn để xóa.</p>
            )}
          </div>
          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              data-bs-dismiss="modal"
            >
              Hủy
            </button>
            <button type="button" className="btn btn-danger" onClick={handleDelete}>
              Xóa
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EmployersDeleting;
