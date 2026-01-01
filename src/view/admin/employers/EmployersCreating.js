import { useForm } from "react-hook-form";
import adminApi from "../../../api/admin";

function EmployersCreating() {
  const {
    register,
    formState: { errors },
    handleSubmit,
  } = useForm();

  const onSubmit = async (data) => {
    try {
      await adminApi.createEmployer(data);
      alert("Tạo mới thành công!");
      window.location.reload();
    } catch (error) {
      alert("Có lỗi xảy ra khi tạo nhà tuyển dụng.");
      console.error(error);
    }
  };

  return (
    <div className="modal modal-xl fade" id="employersCreating">
      <div className="modal-dialog modal-fullscreen-md-down modal-dialog-scrollable">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="ms-2">Thêm nhà tuyển dụng mới</h5>
            <button
              type="button"
              className="btn btn-sm btn-close"
              data-bs-dismiss="modal"
            />
          </div>
          <div
            className="modal-body text-start mb-4"
            style={{ fontSize: "16px" }}
          >
            <form className="ms-4 me-4" onSubmit={handleSubmit(onSubmit)}>
              <div className="row">
                {/* Tên công ty */}
                <div className="col-md-6">
                  <strong>Tên công ty:</strong>
                  <input
                    type="text"
                    className="form-control mt-1"
                    placeholder="Nhập tên công ty"
                    {...register("name", { required: "Tên công ty là bắt buộc" })}
                  />
                  {errors.name && (
                    <small className="text-danger">{errors.name.message}</small>
                  )}
                </div>

                {/* Địa chỉ */}
                <div className="col-md-6">
                  <strong>Địa chỉ:</strong>
                  <input
                    type="text"
                    className="form-control mt-1"
                    placeholder="Nhập địa chỉ"
                    {...register("address", { required: "Địa chỉ là bắt buộc" })}
                  />
                  {errors.address && (
                    <small className="text-danger">{errors.address.message}</small>
                  )}
                </div>
              </div>

              <div className="row mt-3">
                {/* Số nhân viên tối thiểu */}
                <div className="col-md-6">
                  <strong>Số nhân viên tối thiểu:</strong>
                  <input
                    type="number"
                    className="form-control mt-1"
                    placeholder="Nhập số nhân viên tối thiểu"
                    {...register("min_employees", { required: "Số nhân viên tối thiểu là bắt buộc" })}
                  />
                  {errors.min_employees && (
                    <small className="text-danger">{errors.min_employees.message}</small>
                  )}
                </div>

                {/* Số nhân viên tối đa */}
                <div className="col-md-6">
                  <strong>Số nhân viên tối đa:</strong>
                  <input
                    type="number"
                    className="form-control mt-1"
                    placeholder="Nhập số nhân viên tối đa"
                    {...register("max_employees", { required: "Số nhân viên tối đa là bắt buộc" })}
                  />
                  {errors.max_employees && (
                    <small className="text-danger">{errors.max_employees.message}</small>
                  )}
                </div>
              </div>

              <div className="row mt-3">
                {/* Người liên hệ */}
                <div className="col-md-6">
                  <strong>Người liên hệ:</strong>
                  <input
                    type="text"
                    className="form-control mt-1"
                    placeholder="Nhập tên người liên hệ"
                    {...register("contact_name", { required: "Người liên hệ là bắt buộc" })}
                  />
                  {errors.contact_name && (
                    <small className="text-danger">{errors.contact_name.message}</small>
                  )}
                </div>

                {/* Số điện thoại */}
                <div className="col-md-6">
                  <strong>Số điện thoại:</strong>
                  <input
                    type="text"
                    className="form-control mt-1"
                    placeholder="Nhập số điện thoại"
                    {...register("phone", {
                      required: "Số điện thoại là bắt buộc",
                      pattern: {
                        value: /^[0-9]{10,11}$/,
                        message: "Số điện thoại không hợp lệ",
                      },
                    })}
                  />
                  {errors.phone && (
                    <small className="text-danger">{errors.phone.message}</small>
                  )}
                </div>
              </div>

              <div className="mt-3">
                {/* Website */}
                <div className="col-md-12">
                  <strong>Website:</strong>
                  <input
                    type="url"
                    className="form-control mt-1"
                    placeholder="Nhập website"
                    {...register("website", { required: "Website là bắt buộc" })}
                  />
                  {errors.website && (
                    <small className="text-danger">{errors.website.message}</small>
                  )}
                </div>

                {/* Mô tả công ty */}
                <div className="col-md-12">
                  <strong>Mô tả công ty:</strong>
                  <textarea
                    className="form-control mt-1"
                    placeholder="Nhập mô tả công ty"
                    {...register("description", { required: "Mô tả công ty là bắt buộc" })}
                  ></textarea>
                  {errors.description && (
                    <small className="text-danger">{errors.description.message}</small>
                  )}
                </div>
              </div>

              <div className="mt-3">
                {/* Website */}
                <div className="col-md-12">
                  <strong>Email:</strong>
                  <input
                    type="email"
                    className="form-control mt-1"
                    placeholder="Nhập email"
                    {...register("email", { required: "Website là bắt buộc" })}
                  />
                  {errors.website && (
                    <small className="text-danger">{errors.website.message}</small>
                  )}
                </div>

                <div className="col-md-12">
                  <strong>Mật khẩu:</strong>
                  <input
                    type="password"
                    className="form-control mt-1"
                    placeholder="Nhập password"
                    {...register("password", { required: "password là bắt buộc" })}
                  />
                  {errors.password && (
                    <small className="text-danger">{errors.password.message}</small>
                  )}
                </div>
              </div>

              <div className="mt-4 float-end">
                <button type="submit" className="btn btn-primary">
                  Tạo mới
                </button>
                <button
                  type="button"
                  className="btn btn-danger me-2 ms-3"
                  data-bs-dismiss="modal"
                >
                  Đóng
                </button>
              </div>

            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EmployersCreating;
