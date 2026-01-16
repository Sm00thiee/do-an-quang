import "bootstrap/dist/js/bootstrap.js";
import { Link, useNavigate } from "react-router-dom";
import { useContext, useState } from "react";
import "./layout.css";
import { useDispatch, useSelector } from "react-redux";
import { candAuthActions } from "../../../../../redux/slices/candAuthSlice";
import Login from "../auth/Login";
import Stack from "react-bootstrap/Stack";
import { AppContext } from "../../../../App";
import clsx from "clsx";

const user_icon = process.env.PUBLIC_URL + "/image/user_icon.png";

function Layout(props) {
  const nav = useNavigate();
  const { currentPage, setCurrentPage } = useContext(AppContext);

  const dispatch = useDispatch();
  const candidate = useSelector((state) => state.candAuth.current);
  const isAuth = useSelector((state) => state.candAuth.isAuth);

  const handleLogout = () => {
    dispatch(candAuthActions.logout());
    localStorage.removeItem("candidate_jwt");
    nav("/");
  };


  return (
    <>
      <header>
        <Stack
          direction='horizontal'
          gap={1}
          className='fixed-top bg-white text-secondary shadow-sm ts-17 fw-500'
        >
          <Link
            className='nav-link ms-2 pe-2 ts-xl pb-1'
            to='/'
            onClick={() => setCurrentPage("home")}
          >
            <img src='/image/Logo 4.png' alt='logo' />
          </Link>
          <Link
            className={clsx(
              "nav-link py-3 px-2",
              currentPage === "home" && "text-main",
            )}
            to='/'
            onClick={() => setCurrentPage("home")}
          >
            Trang chủ
          </Link>
          <Link
            className={clsx(
              "nav-link py-3 px-2",
              currentPage === "companies" && "text-main",
            )}
            to='/companies'
            onClick={() => setCurrentPage("companies")}
          >
            lộ trình
          </Link>
          <Link
            className={clsx(
              "nav-link py-3 px-2",
              currentPage === "jobs" && "text-main",
            )}
            to='/jobs'
            onClick={() => setCurrentPage("jobs")}
          >
            Việc làm
          </Link>

          <div className='me-auto'></div>

          {!isAuth ? (
            <div className='d-flex align-items-center fw-normal ts-md pointer'>
              <Link
                to='/login'
                className='text-decoration-none text-secondary'
              >
                Đăng nhập
              </Link>
              <div className='vr mx-2 border-2' />
              <Link
                to='/signup'
                className='text-decoration-none text-secondary'
              >
                Đăng ký
              </Link>

              <div className='ms-3 me-2'>
                <a
                  href='/employer/login'
                  className='btn bg-info text-white fw-500'
                >
                  Đăng tuyển, tìm ứng viên
                </a>
              </div>
            </div>
          ) : (
            <div className='d-flex align-items-center sidebar-right'>

              <div className='dropdown pt-1'>
                <img
                  src={user_icon}
                  alt='user_icon'
                  style={{ width: "35px" }}
                  className='rounded-pill border border-2'
                />
                &nbsp;
                <span
                  style={{ fontSize: "16px", cursor: "pointer" }}
                  className='dropdown-toggle'
                  data-bs-toggle='dropdown'
                >
                  {candidate.name && candidate.name.firstname}
                </span>
                <ul className='dropdown-menu'>
                  <li>
                    <Link className='dropdown-item' to='/candidate'>
                      Tài khoản
                    </Link>
                  </li>
                  <li>
                    <button
                      type='button'
                      className='dropdown-item'
                      onClick={handleLogout}
                    >
                      Đăng xuất
                    </button>
                  </li>
                </ul>
              </div>
            </div>
          )}
        </Stack>
      </header>
      <main className='page-body' style={{ marginTop: "57px" }}>
        {!isAuth && <Login />}
        {props.children}
      </main>
    </>
  );
}

export default Layout;