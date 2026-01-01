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
import Stack from "react-bootstrap/Stack";
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
            {t('home')}
          </Link>
          <Link
            className={clsx(
              "nav-link py-3 px-2",
              currentPage === "roadmap" && "text-main",
            )}
            to='/roadmap'
            onClick={() => setCurrentPage("roadmap")}
          >
            {t('roadmap')}
          </Link>
          <Link
            className={clsx(
              "nav-link py-3 px-2",
              currentPage === "jobs" && "text-main",
            )}
            to='/jobs'
            onClick={() => setCurrentPage("jobs")}
          >
            {t('jobs')}
          </Link>

          <div className='me-auto'></div>

          {/* Language Switcher */}
          <div className='me-3'>
            <LanguageSwitcher />
          </div>

          {!isAuth ? (
            <div className='d-flex align-items-center fw-normal ts-md pointer'>
              <Link
                to='/login'
                className='text-decoration-none text-secondary'
              >
                {t('login')}
              </Link>
              <div className='vr mx-2 border-2' />
              <Link
                to='/signup'
                className='text-decoration-none text-secondary'
              >
                {t('signup')}
              </Link>

              <div className='ms-3 me-2'>
                <a
                  href='/employer/login'
                  className='btn bg-info text-white fw-500'
                >
                  {t('forEmployers')}
                </a>
              </div>
            </div>
          ) : (
            <div className='d-flex align-items-center sidebar-right'>
              <div
                className='position-relative'
                onMouseLeave={() => setShowListMsg(false)}
              >
                <BsBell
                  className='fs-3 me-4 pointer'
                  onClick={() => setShowListMsg(!showListMsg)}
                />
                {hasNew && <BsFillCircleFill className='bell-icon' />}
                <div
                  className={clsx(
                    "position-absolute bg-white rounded z-index-1 msg-list fw-normal shadow",
                    showListMsg ? "d-block" : "d-none",
                  )}
                >
                  {bellMsgs.length > 0 ? (
                    bellMsgs.map((item, index) => (
                      <div
                        key={"bell_msg" + index}
                        style={{ cursor: "pointer" }}
                        onClick={() => handleReadMsg(item)}
                        className={
                          "text-wrap px-2 py-1 hover-bg-1" + msgStyles[index]
                        }
                      >
                        {item.name}
                      </div>
                    ))
                  ) : (
                    <span className='ms-3'>{t('noNotifications')}</span>
                  )}
                </div>
              </div>

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
                      {t('account')}
                    </Link>
                  </li>
                  <li>
                    <button
                      type='button'
                      className='dropdown-item'
                      onClick={handleLogout}
                    >
                      {t('logout')}
                    </button>
                  </li>
                </ul>
              </div>
            </div>
          )}
        </Stack>
      </header>
      <main className='page-body' style={{ marginTop: "57px" }}>
        {props.children}
      </main>
      <footer className='border-top' style={{ paddingTop: "35px" }}>
        <div className='container'>
          <div className='row'>
            <div
              className='col-md-4'
              style={{ fontSize: "15.6px", paddingLeft: "27px" }}
            >
              <h5>{t('contactInfo')}</h5>
              <p>{t('contactEmail')}</p>
              <p>{t('contactPhone')}</p>
              <p>{t('contactAddress')}</p>
            </div>
            <div className='col-md-4' style={{ paddingLeft: "125px" }}>
              <h5>{t('categories')}</h5>
              <ul className='list-unstyled'>
                <li>
                  <Link
                    to={"#"}
                    className='text-secondary text-decoration-none'
                  >
                    {t('itJobs')}
                  </Link>
                </li>
                <li>
                  <Link
                    to={"#"}
                    className='text-secondary text-decoration-none'
                  >
                    {t('accountingJobs')}
                  </Link>
                </li>
                <li>
                  <Link
                    to={"#"}
                    className='text-secondary text-decoration-none'
                  >
                    {t('businessJobs')}
                  </Link>
                </li>
                <li>
                  <Link
                    to={"#"}
                    className='text-secondary text-decoration-none'
                  >
                    {t('marketingJobs')}
                  </Link>
                </li>
              </ul>
            </div>
            <div className='col-md-4' style={{ paddingLeft: "120px" }}>
              <h5>{t('links')}</h5>
              <ul className='list-unstyled'>
                <li>
                  <Link
                    to={"/"}
                    className='text-secondary text-decoration-none'
                  >
                    {t('home')}
                  </Link>
                </li>
                <li>
                  <Link
                    to={"/jobs"}
                    className='text-secondary text-decoration-none'
                  >
                    {t('jobs')}
                  </Link>
                </li>
                <li>
                  <Link
                    to={"/companies"}
                    className='text-secondary text-decoration-none'
                  >
                    {t('companies')}
                  </Link>
                </li>
                <li>
                  <Link
                    to={"#"}
                    className='text-secondary text-decoration-none'
                  >
                    {t('blog')}
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <hr />
          <div className='row'>
            <div className='col-12 text-center'>
              <p className='text-muted'>
                {t('allRightsReserved')}
              </p>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}

export default Layout;