import { BrowserRouter, Route, Routes } from "react-router-dom";
import { createContext, useState } from "react";
import { ToastContainer } from "react-toastify";
import Home from "./view/candidate/Home";
import CompanyList from "./view/candidate/CompanyList";
import Company from "./view/candidate/Company";
import JobList from "./view/candidate/JobList";
import Job from "./view/candidate/Job";
import EmployerLayout from "./view/employer/layouts/Layout";
import EmployerLogin from "./view/employer/auth/Login";
import EmployerRegister from "./view/employer/auth/Register";
import AdminLayout from "./view/admin/layouts/Layout";
import AdminLogin from "./view/admin/auth/Login";
import CandidatesManagement from "./view/admin/candidates/CandidatesManagement";
import CandidatesContact from "./view/admin/candidates/CandidatesContact";
import EmployersManagement from "./view/admin/employers/EmployersManagement";
import CandidateManagement from "./view/employer/candidates/CandidateManagement";
import RecruitmentManagement from "./view/employer/jobs/RecruitmentManagement";
import JobCreate from "./view/employer/jobs/JobCreate";
import CompanySettings from "./view/employer/company/CompanySettings";
import CandidateLayout from "./view/candidate/management/layouts/CandidateLayout";
import AppliedJobs from "./view/candidate/management/AppliedJobs";
import SavedJobs from "./view/candidate/management/SavedJobs";
import Signup from "./view/candidate/auth/Signup";
import Login from "./view/candidate/auth/Login";
import Contact from "./view/candidate/Contact";
import Layout from "./view/candidate/layouts/Layout";
import Profile from "./view/candidate/management/profile";
import Resume from "./view/candidate/management/resumes";
import Template from "./view/candidate/management/resumes/templates";
import RoadmapDetail from "./view/candidate/RoadmapDetail";
import RoadmapList from "./view/candidate/RoadmapList";
import RoleSelection from "./view/common/auth/RoleSelection";
import { AppProvider } from "./contexts/AppContext";

export const AppContext = createContext();

function App() {
  const [currentPage, setCurrentPage] = useState("home");

  return (
    <AppProvider>
      <AppContext.Provider value={{ currentPage, setCurrentPage }}>
        <ToastContainer autoClose={500} position="bottom-right" />
        <BrowserRouter>
          <Routes>
            {/* Candidate authentication routes - without Layout (no header) */}
            <Route path="login" element={<Login />} />
            <Route path="signup" element={<Signup />} />

            {/* Main candidate routes - with Layout (has header) */}
            <Route
              path="*"
              element={
                <Layout>
                  <Routes>
                    <Route exact path="" element={<Home />} />
                    <Route path="companies" element={<CompanyList />} />
                    <Route path="contact" element={<Contact />} />
                    <Route path="companies/:id" element={<Company />} />
                    <Route path="jobs" element={<JobList />} />
                    <Route path="jobs/:id" element={<Job />} />
                    <Route path="roadmap" element={<RoadmapList />} />
                    <Route path="roadmap/:id" element={<RoadmapDetail />} />
                    <Route
                      path="candidate/*"
                      element={
                        <CandidateLayout>
                          <Routes>
                            <Route
                              path="applied-jobs"
                              element={<AppliedJobs />}
                            />
                            <Route path="saved-jobs" element={<SavedJobs />} />
                            <Route path="profile" element={<Profile />} />
                            <Route path="resumes" element={<Resume />} />
                            <Route
                              path="resumes/create"
                              element={<Template />}
                            />
                            <Route path="resumes/:id" element={<Template />} />
                          </Routes>
                        </CandidateLayout>
                      }
                    />
                  </Routes>
                </Layout>
              }
            />

          {/* Employer routes */}
          <Route
            path="employer/*"
            element={
              <EmployerLayout>
                <Routes>
                  <Route index element={<RecruitmentManagement />} />
                  <Route path="candidates" element={<CandidateManagement />} />
                  <Route path="jobs" element={<RecruitmentManagement />} />
                  <Route path="jobs/create" element={<JobCreate />} />
                  <Route path="company" element={<CompanySettings />} />
                </Routes>
              </EmployerLayout>
            }
          />
          <Route path="get-started" element={<RoleSelection />} />
          <Route path="employer/login" element={<EmployerLogin />} />
          <Route path="employer/register" element={<EmployerRegister />} />

          {/* Admin routes */}
          <Route
            path="admin/*"
            element={
              <AdminLayout>
                <Routes>
                  <Route path="candidates" element={<CandidatesManagement />} />
                  <Route path="employers" element={<EmployersManagement />} />
                  <Route path="contact" element={<CandidatesContact />} />
                </Routes>
              </AdminLayout>
            }
          />
          <Route path="admin/login" element={<AdminLogin />} />

        </Routes>
      </BrowserRouter>
      </AppContext.Provider>
    </AppProvider>
  );
}

export default App;
