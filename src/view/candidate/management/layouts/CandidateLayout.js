import "./layout.css";
import { useNavigate } from "react-router-dom";
// import { AiTwotoneAppstore } from "react-icons/ai";
import { createContext, useContext, useEffect, useState } from "react";
;
import candidateApi from "../../../../api/candidate";
import educationApi from "../../../../api/education";
import experienceApi from "../../../../api/experience";
import projectApi from "../../../../api/project";
import skillApi from "../../../../api/skill";
import certificateApi from "../../../../api/certificate";
import prizeApi from "../../../../api/prize";
import activityApi from "../../../../api/activity";
import otherApi from "../../../../api/other";
import clsx from "clsx";
import { AppContext } from "../../../../App";

import { useCandidateAuthStore } from "../../../../stores/candidateAuthStore";
export const CandidateContext = createContext();

function CandidateLayout(props) {
  const nav = useNavigate();
  const { currentPage, setCurrentPage } = useContext(AppContext);
  const isAuth = useCandidateAuthStore(state => state.isAuth);
  
  const [personal, setPersonal] = useState({});
  const [educations, setEducations] = useState([]);
  const [experiences, setExperiences] = useState([]);
  const [projects, setProjects] = useState([]);
  const [skills, setSkills] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [prizes, setPrizes] = useState([]);
  const [activities, setActivities] = useState([]);
  const [others, setOthers] = useState([]);
  const [cvMode, setCvMode] = useState("CREATE_0");

  const getPersonal = async () => {
    const res = await candidateApi.getCurrent();
    setPersonal(res);
  };
  const getEducations = async () => {
    const res = await educationApi.getByCurrentCandidateProfile();
    setEducations(res);
  };
  const getExperiences = async () => {
    const res = await experienceApi.getByCurrentCandidateProfile();
    setExperiences(res);
  };
  const getProjects = async () => {
    const res = await projectApi.getByCurrentCandidateProfile();
    setProjects(res);
  };
  const getSkills = async () => {
    const res = await skillApi.getByCurrentCandidateProfile();
    setSkills(res);
  };
  const getCertificates = async () => {
    const res = await certificateApi.getByCurrentCandidateProfile();
    setCertificates(res);
  };
  const getPrizes = async () => {
    const res = await prizeApi.getByCurrentCandidateProfile();
    setPrizes(res);
  };
  const getActivities = async () => {
    const res = await activityApi.getByCurrentCandidateProfile();
    setActivities(res);
  };
  const getOthers = async () => {
    const res = await otherApi.getByCurrentCandidateProfile();
    setOthers(res);
  };
  useEffect(() => {
    if (isAuth) {
      getPersonal();
      getEducations();
      getExperiences();
      getProjects();
      getSkills();
      getCertificates();
      getPrizes();
      getActivities();
      getOthers();
    }
  }, [isAuth]);
  const handleChangePage = (url) => {
    nav(url);
    setCurrentPage(url);
  };

  return (
    <CandidateContext.Provider
      value={{
        personal,
        setPersonal,
        educations,
        setEducations,
        experiences,
        setExperiences,
        projects,
        setProjects,
        skills,
        setSkills,
        certificates,
        setCertificates,
        prizes,
        setPrizes,
        activities,
        setActivities,
        others,
        setOthers,
        getPersonal,
        getEducations,
        getExperiences,
        getProjects,
        getSkills,
        getCertificates,
        getPrizes,
        getActivities,
        getOthers,
        cvMode,
        setCvMode,
      }}
    >
      <div className="d-flex flex-column flex-lg-row">
        <div className="ts-smd fw-500 text-secondary menu-part d-flex flex-row flex-lg-column bg-white border-end">
          <div className="text-center text-main border-bottom py-3 px-2 ts-lg fw-500">
            Tài khoản của tôi
          </div>
          <div
            className={clsx(
              "d-flex align-items-center ps-lg-5 py-lg-2 px-2 pointer hover-bgt-light",
              currentPage === "/candidate" && "bg-mlight text-main"
            )}
            onClick={() => handleChangePage("/candidate")}
          >
            Dashboard
          </div>
          <div
            className={clsx(
              "d-flex align-items-center ps-lg-5 py-lg-2 px-2 pointer hover-bgt-light",
              currentPage === "/candidate/profile" && "bg-mlight text-main"
            )}
            onClick={() => handleChangePage("/candidate/profile")}
          >
            Profile cá nhân
          </div>
          <div
            className={clsx(
              "d-flex align-items-center ps-lg-5 py-lg-2 px-2 pointer hover-bgt-light",
              currentPage === "/candidate/resumes" && "bg-mlight text-main"
            )}
            onClick={() => handleChangePage("/candidate/resumes")}
          >
            Quản lý hồ sơ
          </div>
          <div
            className={clsx(
              "d-flex align-items-center ps-lg-5 py-lg-2 px-2 pointer hover-bgt-light",
              currentPage === "/candidate/applied-jobs" && "bg-mlight text-main"
            )}
            onClick={() => handleChangePage("/candidate/applied-jobs")}
          >
            Việc làm đã nộp
          </div>
          <div
            className={clsx(
              "d-flex align-items-center ps-lg-5 py-lg-2 px-2 pointer hover-bgt-light",
              currentPage === "/candidate/saved-jobs" && "bg-mlight text-main"
            )}
            onClick={() => handleChangePage("/candidate/saved-jobs")}
          >
            Việc làm đã lưu
          </div>
        </div>
        <div className="content-part">{props.children}</div>
      </div>
    </CandidateContext.Provider>
  );
}

export default CandidateLayout;
