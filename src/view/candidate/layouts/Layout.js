import "bootstrap/dist/js/bootstrap.js";
import { Link, useNavigate } from "react-router-dom";
import { useContext, useEffect, useState } from "react";
import { BsBell, BsFillCircleFill } from "react-icons/bs";
import { useTranslation } from "react-i18next";
import "./layout.css";
import authApi from "../../../api/auth";
import candMsgApi from "../../../api/candidateMessage";
import Pusher from "pusher-js";
import BellDialog from "./BellDialog";
import { Navbar, Nav, Container, Row, Col, Stack } from "react-bootstrap";
import { AppContext } from "../../../App";
import clsx from "clsx";
import LanguageSwitcher from "../../../components/LanguageSwitcher";
import { useCandidateAuthStore } from "../../../stores/candidateAuthStore";

const user_icon = process.env.PUBLIC_URL + "/image/user_icon.png";

function Layout(props) {
  const { t } = useTranslation();
  const nav = useNavigate();
  const [bellMsgs, setBellMsgs] = useState([]);
  const [msgStyles, setMsgStyles] = useState([]);
  const [hasNew, setHasNew] = useState(false);
  const [showBellDialog, setShowBellDialog] = useState(false);
  const [showListMsg, setShowListMsg] = useState(false);
  const [curNotification, setCurNotification] = useState({});
  const { currentPage, setCurrentPage } = useContext(AppContext);

  const candidate = useCandidateAuthStore(state => state.current);
  const isAuth = useCandidateAuthStore(state => state.isAuth);

  const handleLogout = () => {
    useCandidateAuthStore.getState().logout();
    localStorage.removeItem("candidate_jwt");
    nav("/");
  };

  const getAllMessages = async () => {
    const res = await candMsgApi.getMsgs(candidate.id);
    console.log("bell msgs:", res);
    setBellMsgs(res);
  };

  const handleReadMsg = async (inf) => {
    setShowBellDialog(true);
    setCurNotification(inf);
    // update read status
    if (inf.isRead === 0) {
      await candMsgApi.markAsRead(inf.id);
      getAllMessages();
    }
  };

  useEffect(() => {
    if (isAuth && candidate.id) {

      // Pusher configuration
      const pusher = new Pusher("a2b7b5a1cb8e6d17b7a0", {
        cluster: "ap1",
      });
      const channel = pusher.subscribe("nextstep");
      channel.bind("sendJobMsg", function (data) {
        console.log("pusher sending data: ", data);
        setHasNew(true);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuth]);

  useEffect(() => {
    if (bellMsgs.length > 0) {
      const msgCss = [];
      bellMsgs.forEach((item) => {
        if (item.isRead === 0) {
          msgCss.push(" text-primary fw-600");
        } else msgCss.push("");
      });
      setMsgStyles(msgCss);
      console.log("msgCss:", msgCss);
    }
  }, [bellMsgs]);

  return (
    <>
      <BellDialog
        show={showBellDialog}
        setShow={setShowBellDialog}
        current={curNotification}
      />
      <Navbar bg="white" expand="lg" fixed="top" className="shadow-sm border-bottom py-2">
        <Container fluid="lg">
          <Navbar.Brand as={Link} to="/" onClick={() => setCurrentPage("home")}>
            <img src="/image/Logo 4.png" alt="logo" style={{ maxHeight: "35px" }} />
          </Navbar.Brand>

          <div className="d-flex align-items-center gap-2 d-lg-none">
            {!isAuth && <LanguageSwitcher />}
            {isAuth && (
              <div className="position-relative" onClick={() => setShowListMsg(!showListMsg)}>
                <BsBell className="fs-4 pointer text-secondary" />
                {hasNew && (
                  <BsFillCircleFill className="text-danger position-absolute top-0 start-100 translate-middle p-1 rounded-circle" style={{ fontSize: "8px" }} />
                )}
              </div>
            )}
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
                  <a href="/employer/login" className="btn btn-info text-white fw-500">{t('forEmployers')}</a>
                </div>
              ) : (
                <div className="d-flex flex-lg-row flex-column align-items-lg-center gap-3">
                  {/* Desktop Notification */}
                  <div className="position-relative d-none d-lg-block" onMouseLeave={() => setShowListMsg(false)}>
                    <BsBell
                      className="fs-4 pointer text-secondary"
                      onClick={() => setShowListMsg(!showListMsg)}
                    />
                    {hasNew && <BsFillCircleFill className="bell-icon" />}

                    {/* Message List Dropdown */}
                    <div
                      className={clsx(
                        "position-absolute bg-white rounded z-index-1 msg-list fw-normal shadow end-0 mt-2",
                        showListMsg ? "d-block" : "d-none"
                      )}
                      style={{ width: "300px", maxHeight: "400px", overflowY: "auto" }}
                    >
                      {bellMsgs.length > 0 ? (
                        bellMsgs.map((item, index) => (
                          <div
                            key={"bell_msg" + index}
                            style={{ cursor: "pointer" }}
                            onClick={() => handleReadMsg(item)}
                            className={
                              "text-wrap px-3 py-2 border-bottom hover-bg-light " + (item.isRead === 0 ? "fw-bold text-primary bg-light" : "text-secondary")
                            }
                          >
                            {item.name}
                          </div>
                        ))
                      ) : (
                        <div className="p-3 text-center text-muted">{t('noNotifications')}</div>
                      )}
                    </div>
                  </div>

                  {/* User Menu */}
                  <div className="dropdown">
                    <div className="d-flex align-items-center gap-2 pointer dropdown-toggle" data-bs-toggle="dropdown">
                      <img
                        src={user_icon}
                        alt="user"
                        style={{ width: "32px", height: "32px" }}
                        className="rounded-circle border"
                      />
                      <span className="fw-500 text-secondary">
                        {candidate.name && candidate.name.firstname}
                      </span>
                    </div>
                    <ul className="dropdown-menu dropdown-menu-end shadow-sm border-0 mt-2">
                      <li><Link className="dropdown-item py-2" to="/candidate">{t('account')}</Link></li>
                      <li><hr className="dropdown-divider" /></li>
                      <li><button type="button" className="dropdown-item py-2 text-danger" onClick={handleLogout}>{t('logout')}</button></li>
                    </ul>
                  </div>
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