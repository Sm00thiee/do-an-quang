import { useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  BsGrid,
  BsPeople,
  BsSearch,
  BsBuilding,
  BsPerson,
  BsBoxArrowRight
} from "react-icons/bs";
import { useEmployerAuthStore } from "../../../stores/employerAuthStore";
import authApi from "../../../api/auth";

const styles = {
  layout: {
    minHeight: '100vh',
    background: '#f8f9fa'
  },
  header: {
    background: 'white',
    borderBottom: '1px solid #e5e5e5',
    padding: '1rem 2rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'sticky',
    top: 0,
    zIndex: 100,
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
  },
  logo: {
    fontSize: '1.5rem',
    fontWeight: 700,
    color: '#2F80ED',
    letterSpacing: '-0.5px'
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '1.5rem'
  },
  searchIcon: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    background: '#f5f7fa',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: '#666',
    transition: 'all 0.2s'
  },
  userSection: {
    position: 'relative'
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.875rem',
    padding: '0.5rem 1rem',
    borderRadius: '10px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    background: 'transparent'
  },
  avatar: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.25rem',
    fontWeight: 600,
    overflow: 'hidden',
    boxShadow: '0 2px 8px rgba(102, 126, 234, 0.25)'
  },
  userName: {
    fontSize: '0.95rem',
    color: '#1a1a1a',
    fontWeight: 600,
    maxWidth: '150px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },
  dropdown: {
    position: 'absolute',
    top: 'calc(100% + 0.75rem)',
    right: 0,
    background: 'white',
    borderRadius: '12px',
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
    minWidth: '220px',
    zIndex: 1000,
    overflow: 'hidden',
    border: '1px solid rgba(0, 0, 0, 0.08)'
  },
  dropdownItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.875rem',
    padding: '0.875rem 1.25rem',
    cursor: 'pointer',
    transition: 'all 0.15s',
    color: '#333',
    fontSize: '0.95rem',
    fontWeight: 500,
    background: 'white',
    border: 'none',
    width: '100%',
    textAlign: 'left'
  },
  dropdownItemLogout: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.875rem',
    padding: '0.875rem 1.25rem',
    cursor: 'pointer',
    transition: 'all 0.15s',
    fontSize: '0.95rem',
    fontWeight: 500,
    background: 'white',
    color: '#dc3545',
    border: 'none',
    width: '100%',
    textAlign: 'left'
  },
  divider: {
    height: '1px',
    background: '#e8ecf1',
    margin: '0.5rem 0'
  },
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
    background: 'transparent'
  },
  mainWrapper: {
    display: 'flex',
    minHeight: 'calc(100vh - 70px)'
  },
  sidebar: {
    width: '280px',
    background: 'white',
    borderRight: '1px solid #e5e5e5',
    padding: '2rem 1rem'
  },
  companySection: {
    paddingBottom: '1.5rem',
    borderBottom: '1px solid #e5e5e5',
    marginBottom: '1.5rem'
  },
  companyName: {
    fontSize: '1.125rem',
    fontWeight: 600,
    color: '#333'
  },
  menu: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem'
  },
  menuItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.875rem 1rem',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    color: '#666',
    fontSize: '0.95rem'
  },
  menuItemActive: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.875rem 1rem',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    fontSize: '0.95rem',
    background: '#E6F0FF',
    color: '#2F80ED',
    fontWeight: 500
  },
  mainContent: {
    flex: 1,
    padding: '2rem'
  }
};

function EmployerLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [showDropdown, setShowDropdown] = useState(false);
  const [hoverItem, setHoverItem] = useState(null);

  const { user, logout } = useEmployerAuthStore();

  const menuItems = [
    { path: "/employer", icon: BsGrid, label: "Quản lý tin tuyển dụng" },
    { path: "/employer/candidates", icon: BsPeople, label: "Quản lý hồ sơ ứng viên" },
    { path: "/employer/company", icon: BsBuilding, label: "Thông tin công ty" },
  ];

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

  const handleLogout = async () => {
    try {
      await authApi.logout(2);
    } catch (error) {
      console.error("Logout API error:", error);
    }
    logout();
    navigate("/employer/login");
  };

  const getDisplayName = () => {
    if (!user) return "User";
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    if (user.email) {
      return user.email.split('@')[0];
    }
    return "User";
  };

  const getHoverStyle = (base, isHovered) => {
    if (!isHovered) return base;
    return { ...base, background: '#f5f7fa' };
  };

  return (
    <div style={styles.layout}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.logo}>NEXTSTEP</div>
        <div style={styles.headerRight}>
          <div style={styles.searchIcon}>
            <BsSearch />
          </div>

          {/* User Dropdown */}
          <div style={styles.userSection}>
            <div
              style={styles.userInfo}
              onClick={() => setShowDropdown(!showDropdown)}
            >
              <div style={styles.avatar}>
                {user?.avatar_url ? (
                  <img src={user.avatar_url} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <BsPerson />
                )}
              </div>
              <span style={styles.userName}>{getDisplayName()}</span>
            </div>

            {showDropdown && (
              <div style={styles.dropdown}>
                <button
                  style={getHoverStyle(styles.dropdownItem, hoverItem === 'company')}
                  onMouseEnter={() => setHoverItem('company')}
                  onMouseLeave={() => setHoverItem(null)}
                  onClick={() => {
                    setShowDropdown(false);
                    navigate('/employer/company');
                  }}
                >
                  <BsPerson />
                  <span>Thông tin công ty</span>
                </button>
                <div style={styles.divider}></div>
                <button
                  style={hoverItem === 'logout'
                    ? { ...styles.dropdownItemLogout, background: '#fff5f5' }
                    : styles.dropdownItemLogout
                  }
                  onMouseEnter={() => setHoverItem('logout')}
                  onMouseLeave={() => setHoverItem(null)}
                  onClick={handleLogout}
                >
                  <BsBoxArrowRight />
                  <span>Đăng xuất</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main */}
      <div style={styles.mainWrapper}>
        {/* Sidebar */}
        <aside style={styles.sidebar}>
          <div style={styles.companySection}>
            <div style={styles.companyName}>
              {user?.companyName || "Công ty của bạn"}
            </div>
          </div>

          {/* Menu */}
          <nav style={styles.menu}>
            {menuItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <div
                  key={item.path}
                  style={active ? styles.menuItemActive : styles.menuItem}
                  onClick={() => navigate(item.path)}
                >
                  <Icon style={{ fontSize: '1.25rem', minWidth: '20px' }} />
                  <span>{item.label}</span>
                </div>
              );
            })}
          </nav>
        </aside>

        {/* Content */}
        <main style={styles.mainContent}>
          {children}
        </main>
      </div>

      {/* Overlay */}
      {showDropdown && (
        <div
          style={styles.overlay}
          onClick={() => setShowDropdown(false)}
        ></div>
      )}
    </div>
  );
}

export default EmployerLayout;
