import "bootstrap/dist/js/bootstrap.js";
import { Link, useNavigate } from "react-router-dom";
import { useContext, useState } from "react";
import { useTranslation } from "react-i18next";
import "./layout.css";
import { Navbar, Nav, Container, Dropdown } from "react-bootstrap";
import { AppContext } from "../../../App";
import clsx from "clsx";
import LanguageSwitcher from "../../../components/LanguageSwitcher";
import { useCandidateAuthStore } from "../../../stores/candidateAuthStore";
import { BsPersonCircle } from "react-icons/bs";

function Layout(props) {
  const { t } = useTranslation();
  const nav = useNavigate();
  const { currentPage, setCurrentPage } = useContext(AppContext);

  const candidate = useCandidateAuthStore(state => state.current);
  const isAuth = useCandidateAuthStore(state => state.isAuth);

  const handleLogout = () => {
    useCandidateAuthStore.getState().logout();
    localStorage.removeItem("candidate_jwt");
    nav("/login");
  };



  return (
    <>
      <Navbar bg="white" expand="lg" fixed="top" className="shadow-sm border-bottom py-2">
        <Container fluid="lg">
          <Navbar.Brand as={Link} to="/" onClick={() => setCurrentPage("home")}>
            <img src="/image/Logo 4.png" alt="logo" style={{ maxHeight: "35px" }} />
          </Navbar.Brand>

          <div className="d-flex align-items-center gap-2 d-lg-none">
            {!isAuth && <LanguageSwitcher />}
            <Navbar.Toggle aria-controls="main-navbar" className="border-0 p-1" />
          </div>

          <Navbar.Collapse id="main-navbar">
            <Nav className="me-auto my-3 my-lg-0 gap-lg-3 fw-500 text-secondary">
              <Nav.Link as={Link} to="/" className={currentPage === "home" ? "text-main" : ""} onClick={() => setCurrentPage("home")}>{t('home')}</Nav.Link>
              <Nav.Link as={Link} to="/roadmap" className={currentPage === "roadmap" ? "text-main" : ""} onClick={() => setCurrentPage("roadmap")}>{t('roadmap')}</Nav.Link>
              <Nav.Link as={Link} to="/jobs" className={currentPage === "jobs" ? "text-main" : ""} onClick={() => setCurrentPage("jobs")}>{t('jobs')}</Nav.Link>
            </Nav>

            <div className="d-flex flex-column flex-lg-row align-items-lg-center gap-3">
              <div className="d-none d-lg-block">
                <LanguageSwitcher />
              </div>

              {!isAuth ? (
                <div className="d-flex flex-column flex-lg-row align-items-lg-center gap-3 fw-500">
                  <Link to="/login" className="text-decoration-none text-secondary">{t('login')}</Link>
                  <div className="vr d-none d-lg-block"></div>
                  <Link to="/signup" className="text-decoration-none text-secondary">{t('signup')}</Link>
                </div>
              ) : (
                <div className="d-flex flex-lg-row flex-column align-items-lg-center gap-3">
                  {/* Avatar Menu Dropdown */}
                  <Dropdown align="end">
                    <Dropdown.Toggle 
                      variant="link" 
                      id="avatar-dropdown" 
                      className="p-0 border-0 text-decoration-none"
                      style={{ boxShadow: 'none' }}
                      bsPrefix="avatar-dropdown-toggle"
                    >
                      <div className="d-flex align-items-center gap-2">
                        {candidate?.image ? (
                          <img 
                            src={candidate.image} 
                            alt="Avatar" 
                            className="rounded-circle"
                            style={{ width: '40px', height: '40px', objectFit: 'cover' }}
                          />
                        ) : (
                          <BsPersonCircle size={32} className="text-secondary" />
                        )}
                        <span className="text-secondary d-none d-lg-inline fw-500">
                          {candidate?.fname || 'User'}
                        </span>
                      </div>
                    </Dropdown.Toggle>

                    <Dropdown.Menu
                      className="shadow border"
                      style={{
                        borderRadius: '8px',
                        padding: '8px',
                        minWidth: '200px',
                        marginTop: '8px'
                      }}
                    >
                      <Dropdown.Item
                        as={Link}
                        to="/candidate/applied-jobs"
                        className="py-2 px-3 rounded"
                        style={{
                          fontSize: '16px',
                          fontWeight: '500',
                          color: '#3d3d3d',
                          transition: 'background-color 0.2s'
                        }}
                      >
                        Việc làm đã ứng tuyển
                      </Dropdown.Item>
                      
                      <Dropdown.Item
                        as={Link}
                        to="/candidate/saved-jobs"
                        className="py-2 px-3 rounded"
                        style={{
                          fontSize: '16px',
                          fontWeight: '500',
                          color: '#3d3d3d',
                          transition: 'background-color 0.2s'
                        }}
                      >
                        Việc đã lưu
                      </Dropdown.Item>
                      
                      <Dropdown.Item
                        onClick={handleLogout}
                        className="py-2 px-3 rounded"
                        style={{
                          fontSize: '16px',
                          fontWeight: '700',
                          color: '#e11d48',
                          backgroundColor: '#e5e7eb',
                          transition: 'background-color 0.2s'
                        }}
                      >
                        Đăng xuất
                      </Dropdown.Item>
                    </Dropdown.Menu>
                  </Dropdown>
                </div>
              )}
            </div>
          </Navbar.Collapse>
        </Container>
      </Navbar>
      <main className='page-body' style={{ marginTop: "57px" }}>
        {props.children}
      </main>
    </>
  );
}

export default Layout;