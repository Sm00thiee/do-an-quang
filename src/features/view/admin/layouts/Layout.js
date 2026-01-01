import { AiFillProfile, AiTwotoneAppstore } from "react-icons/ai";
import {
  BsFillBriefcaseFill,
  BsFillPeopleFill,
  BsFillPersonFill,
  // BsMessenger,
} from "react-icons/bs";
import { useNavigate } from "react-router-dom";
import "./layout_style.css";
import { useContext, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import authApi from "../../../../../api/auth";
import { adminAuthActions } from "../../../../../redux/slices/adminAuthSlice";
import { AppContext } from "../../../../App";
import clsx from "clsx";

function Layout(props) {
  const nav = useNavigate();
  const { currentPage, setCurrentPage } = useContext(AppContext);

  const company = useSelector((state) => state.adminAuth.current.admin);
  const isAuth = useSelector((state) => state.adminAuth.isAuth);
  const dispatch = useDispatch();

  const handleLogout = async () => {
    await authApi.logout(0);
    dispatch(adminAuthActions.logout());
    localStorage.removeItem("admin_jwt");
    nav("/admin/login");
  };
  const getMe = async () => {
    const res = await authApi.getMe(2);
    dispatch(adminAuthActions.setUser(res));
  };
  const handleChangePage = (url) => {
    nav(url);
    setCurrentPage(url);
  };

  useEffect(() => {
    if (!localStorage.getItem("admin_jwt")) {
      nav("/admin/login");
    } else {
      getMe();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <nav className="navbar border-bottom shadow-sm fixed-top">
        <div className="navbar-brand ms-3 text-secondary">Admin</div>
        <div className="dropdown" style={{ cursor: "pointer" }}>
          <div
            className="d-flex align-items-center me-5 dropdown-toggle"
            data-bs-toggle="dropdown"
          >
            <BsFillPersonFill style={{ fontSize: "26px" }} />
            Trang quản trị
          </div>
          <ul className="dropdown-menu">
            <li className="dropdown-item" onClick={handleLogout}>
              Đăng xuất
            </li>
          </ul>
        </div>
      </nav>
      <div
        className="d-flex flex-column flex-lg-row"
        style={{ marginTop: "57px" }}
      >
        <div className="ts-smd fw-500 text-secondary menu-part d-flex flex-row flex-lg-column bg-white border-bottom border-lg-end">
          
          <div
            className={clsx(
              "d-flex align-items-center ps-lg-5 py-lg-2 px-2 pointer hover-bgt-light",
              currentPage === "/admin" && "bg-mlight text-main"
            )}
            onClick={() => handleChangePage("/admin")}
          >
            <AiTwotoneAppstore className="fs-5 me-1" />
            Dashboard
          </div>
          <div
            className={clsx(
              "d-flex align-items-center ps-lg-5 py-lg-2 px-2 pointer hover-bgt-light",
              currentPage === "/admin/employers" && "bg-mlight text-main"
            )}
            onClick={() => handleChangePage("/admin/employers")}
          >
            <BsFillPeopleFill className="fs-5 me-1" />
            Quản lý tài khoản tuyển dụng
          </div>
          <div
            className={clsx(
              "d-flex align-items-center ps-lg-5 py-lg-2 px-2 pointer hover-bgt-light",
              currentPage === "/admin/candidates" && "bg-mlight text-main"
            )}
            onClick={() => handleChangePage("/admin/candidates")}
          >
            <BsFillPeopleFill className="ts-lg me-1" /> Quản lý tài khoản ứng viên
          </div>
          <div
            className={clsx(
              "d-flex align-items-center ps-lg-5 py-lg-2 px-2 pointer hover-bgt-light",
              currentPage === "/admin/contact" && "bg-mlight text-main"
            )}
            onClick={() => handleChangePage("/admin/contact")}
          >
            <BsFillBriefcaseFill className="ts-lg me-1" />
            Quản lý yêu cầu tư vấn
          </div>
      
        </div>
        <div className="content-part page-body">{props.children}</div>
      </div>
    </>
  );
}
export default Layout;
