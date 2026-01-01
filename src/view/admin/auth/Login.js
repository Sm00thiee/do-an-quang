import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { AiFillEye, AiFillEyeInvisible } from "react-icons/ai";
import { Link, useNavigate } from "react-router-dom";
;
import authApi from "../../../api/auth";
;
import { toast } from "react-toastify";

import { useAdminAuthStore } from "../../../stores/adminAuthStore";
function Login() {
  const required_mark = <span className="text-danger"> *</span>;
  const required_error = (
    <div className="text-danger text-start small">Vui lòng nhập thông tin!</div>
  );
  const {
    register,
    formState: { errors },
    handleSubmit,
  } = useForm();
  const [isView, setIsView] = useState(false);
  const [msg, setMsg] = useState("");
  const nav = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const onSubmit = async (inf) => {
    inf.role = 0;
    setIsLoading(true);
    await authApi
      .login(inf)
      .then((res) => {
        localStorage.setItem("admin_jwt", res.authorization.token);
        toast.success("Đăng nhập thành công!");    
      })
      .catch(() => {
        setMsg("Email hoặc mật khẩu không chính xác!");
      });
    setIsLoading(false);
    await authApi.getMe(0).then((res) => {
      useAdminAuthStore.getState().setUser(res);
      nav("/admin");
    });
  };

  useEffect(() => {
    if (localStorage.getItem("admin_jwt")) {
      nav("/admin");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <div className="mx-auto" style={{ marginTop: "150px", width: "30%" }}>
        <form
          className="border px-4 py-3 rounded shadow"
          onSubmit={handleSubmit(onSubmit)}
        >
          <h4 className="mb-3 text-center">Trang quản trị</h4>
          <div>
            <label htmlFor="email" className="mb-1">
              Email{required_mark}
            </label>
            <input
              type="text"
              className="form-control"
              name="email"
              placeholder="Nhập email..."
              {...register("email", { required: true })}
            />
            {errors.email && required_error}
          </div>
          <div className="mt-2">
            <label htmlFor="passwd" className="mb-1">
              Password{required_mark}
            </label>
            <div className="input-group">
              <input
                type={isView ? "text" : "password"}
                className="form-control border-end-0"
                name="passwd"
                placeholder="Nhập password..."
                {...register("password", { required: true })}
              />
              <span
                className="input-group-text border-start-0 bg-white text-secondary"
                style={{ fontSize: "20px" }}
                onClick={() => setIsView(!isView)}
              >
                {isView ? <AiFillEye /> : <AiFillEyeInvisible />}
              </span>
            </div>
            {errors.password && required_error}
          </div>
          {msg && <div className="text-danger text-center mt-2">{msg}</div>}
          <button type="submit" className="btn btn-primary w-100 mt-2">
            Đăng nhập
            {isLoading && <div className="spinner-border spinner-border-sm ms-1"></div>}
          </button>
          <div className="mt-2 text-center">
            <Link to={`#`} className="text-decoration-none">
              Quên mật khẩu
            </Link>
          </div>
          {/* <hr />
          <div className="text-center">
            Bạn là nhà tuyển dụng mới?&nbsp;
            <Link to={`#`} className="text-decoration-none">
              Đăng ký tài khoản
            </Link>
          </div> */}
        </form>
      </div>
    </>
  );
}

export default Login;
