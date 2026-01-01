import { useForm } from "react-hook-form";
import adminApi from "../../../api/admin";

function CandidatesCreating() {
  const {
    register,
    formState: { errors },
    handleSubmit,
  } = useForm();

  const onSubmit = async (data) => {
    try {      
      await adminApi.createCandidate(data);
      alert("Tạo mới thành công!");
      window.location.reload();
    } catch (error) {
      alert("Có lỗi xảy ra khi tạo ứng viên.");
      console.error(error);
    }
  };

  return (
    <div className="modal modal-xl fade" id="candidatesCreating">
      <div className="modal-dialog modal-fullscreen-md-down modal-dialog-scrollable">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="ms-2">Thêm ứng viên mới</h5>
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
            <form className="ms-5" onSubmit={handleSubmit(onSubmit)}>
              
              <div>
                <strong>Họ:</strong>
                <input
                  type="text"
                  className="form-control mt-1"
                  placeholder="Nhập họ"
                  autoFocus
                  {...register("lastname", { required: "Họ là bắt buộc" })}
                />
                {errors.lastname && (
                  <small className="text-danger">{errors.lastname.message}</small>
                )}
              </div>

              <div className="mt-3">
                <strong>Tên:</strong>
                <input
                  type="text"
                  className="form-control mt-1"
                  placeholder="Nhập tên"
                  {...register("firstname", { required: "Tên là bắt buộc" })}
                />
                {errors.firstname && (
                  <small className="text-danger">{errors.firstname.message}</small>
                )}
              </div>

             

              <div className="mt-3">
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

              <div className="mt-3">
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

              <div className="mt-3">
                <strong>Giới tính:</strong>
                <select
                  className="form-control mt-1"
                  {...register("gender", { required: "Giới tính là bắt buộc" })}
                >
                  <option value="">Chọn giới tính</option>
                  <option value="0">Nam</option>
                  <option value="1">Nữ</option>
                </select>
                {errors.gender && (
                  <small className="text-danger">{errors.gender.message}</small>
                )}
              </div>

              <div className="mt-3">
                <strong>Email:</strong>
                <input
                  type="email"
                  className="form-control mt-1"
                  placeholder="Nhập email"
                  {...register("email", {
                    required: "Email là bắt buộc",
                    pattern: {
                      value: /^\S+@\S+$/i,
                      message: "Email không hợp lệ",
                    },
                  })}
                />
                {errors.email && (
                  <small className="text-danger">{errors.email.message}</small>
                )}
              </div>

              <div className="mt-3">
                <strong>Mật khẩu:</strong>
                <input
                  type="password"
                  className="form-control mt-1"
                  placeholder="Nhập mật khẩu"
                  {...register("password", {
                    required: "Mật khẩu là bắt buộc"
                  })}
                />
                {errors.password && (
                  <small className="text-danger">{errors.password.message}</small>
                )}
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

export default CandidatesCreating;
