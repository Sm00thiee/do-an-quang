import { useNavigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import {
  BsGrid,
  BsBriefcase,
  BsPeople,
  BsSearch,
  BsBuilding
} from "react-icons/bs";
import { useEmployerAuthStore } from "../../../stores/employerAuthStore";
import "./EmployerLayout.css";

function EmployerLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();

  const employer = useEmployerAuthStore(state => state.current?.employer);

  const menuItems = [
    { path: "/employer", icon: BsGrid, label: "Quản lý tin tuyển dụng" },
    { path: "/employer/candidates", icon: BsPeople, label: "Quản lý hồ sơ ứng viên" },
    { path: "/employer/company", icon: BsBuilding, label: "Thông tin công ty" },
  ];

  // Redirect if not authenticated
  useEffect(() => {
    if (!localStorage.getItem("employer_jwt")) {
      navigate("/employer/login");
    }
  }, [navigate]);

  const isActive = (path) => {
    if (path === "/employer") {
      return location.pathname === path || location.pathname === "/employer/jobs";
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="employer-layout">
      {/* Top Header */}
      <header className="employer-top-header">
        <div className="header-logo">NEXTSTEP</div>
        <div className="header-right-section">
          <div className="header-search-icon">
            <BsSearch />
          </div>
          <div className="header-company-name">
            {employer?.name || "Công ty của bạn"}
          </div>
        </div>
      </header>

      {/* Main Wrapper */}
      <div className="employer-main-wrapper">
        {/* Left Sidebar */}
        <aside className="employer-left-sidebar">
          <div className="sidebar-company-section">
            <div className="sidebar-company-name">
              {employer?.name || "Công ty của bạn"}
            </div>
          </div>

          {/* Menu */}
          <nav className="sidebar-menu">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.path}
                  className={`sidebar-menu-item ${isActive(item.path) ? 'active' : ''}`}
                  onClick={() => navigate(item.path)}
                >
                  <Icon />
                  <span>{item.label}</span>
                </div>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="employer-main-content">
          {children}
        </main>
      </div>
    </div>
  );
}

export default EmployerLayout;
