import "bootstrap/dist/js/bootstrap.js";
import { Link, useNavigate } from "react-router-dom";
import { useContext, useState } from "react";
import { useTranslation } from "react-i18next";
import "./layout.css";
import { Navbar, Nav, Container, Row, Col } from "react-bootstrap";
import { AppContext } from "../../../App";
import clsx from "clsx";
import LanguageSwitcher from "../../../components/LanguageSwitcher";
import { useCandidateAuthStore } from "../../../stores/candidateAuthStore";

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
                  {/* Logout Button */}
                  <button
                    type="button"
                    className="btn btn-outline-danger btn-sm"
                    onClick={handleLogout}
                    style={{
                      padding: "8px 16px",
                      borderRadius: "8px",
                      fontWeight: "500"
                    }}
                  >
                    {t('logout')}
                  </button>
                </div>
              )}
            </div>
          </Navbar.Collapse>
        </Container>
      </Navbar>
      <main className='page-body' style={{ marginTop: "57px" }}>
        {props.children}
      </main>
      <footer className="border-top bg-white pt-5 pb-3">
        <Container>
          <Row className="gy-4">
            <Col md={4} className="ps-md-4">
              <h5 className="mb-3 text-secondary">{t('contactInfo')}</h5>
              <div className="text-secondary d-flex flex-column gap-2">
                <p className="mb-0">{t('contactEmail')}</p>
                <p className="mb-0">{t('contactPhone')}</p>
                <p className="mb-0">{t('contactAddress')}</p>
              </div>
            </Col>
            <Col md={4} className="ps-md-5">
              <h5 className="mb-3 text-secondary">{t('categories')}</h5>
              <ul className="list-unstyled d-flex flex-column gap-2">
                <li><Link to="#" className="text-secondary text-decoration-none hover-text-main">{t('itJobs')}</Link></li>
                <li><Link to="#" className="text-secondary text-decoration-none hover-text-main">{t('accountingJobs')}</Link></li>
                <li><Link to="#" className="text-secondary text-decoration-none hover-text-main">{t('businessJobs')}</Link></li>
                <li><Link to="#" className="text-secondary text-decoration-none hover-text-main">{t('marketingJobs')}</Link></li>
              </ul>
            </Col>
            <Col md={4} className="ps-md-5">
              <h5 className="mb-3 text-secondary">{t('links')}</h5>
              <ul className="list-unstyled d-flex flex-column gap-2">
                <li><Link to="/" className="text-secondary text-decoration-none hover-text-main">{t('home')}</Link></li>
                <li><Link to="/jobs" className="text-secondary text-decoration-none hover-text-main">{t('jobs')}</Link></li>
                <li><Link to="/companies" className="text-secondary text-decoration-none hover-text-main">{t('companies')}</Link></li>
                <li><Link to="#" className="text-secondary text-decoration-none hover-text-main">{t('blog')}</Link></li>
              </ul>
            </Col>
          </Row>
          <hr className="my-4 text-secondary" />
          <div className="text-center text-muted">
            {t('allRightsReserved')}
          </div>
        </Container>
      </footer>
    </>
  );
}

export default Layout;