import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BsTrash3 } from "react-icons/bs";
import SavedJobPopup from "./SavedJobPopup";
import candidateApi from "../../../api/candidate";

import { useCandidateAuthStore } from "../../../stores/candidateAuthStore";

function SavedJobs() {
  const [jobs, setJobs] = useState([]);
  const [jobLocations, setJobLocations] = useState([]);
  const [curJob, setCurJob] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const user = useCandidateAuthStore(state => state.current);
  const isAuth = useCandidateAuthStore(state => state.isAuth);

  const getSavedJobs = async () => {
    try {
      setLoading(true);
      setError(null);
      const jobs = await candidateApi.getSavedJobs(user.id);
      let jobLocs = [];
      console.log(jobs);
      setJobs(jobs || []);
      for (let i = 0; i < (jobs || []).length; i++) {
        jobLocs[i] = "";
        for (let j = 0; j < jobs[i].locations.length; j++) {
          jobLocs[i] = jobLocs[i] + jobs[i].locations[j].name;
          if (j !== jobs[i].locations.length - 1) {
            jobLocs[i] = jobLocs[i] + ", ";
          }
        }
      }
      setJobLocations(jobLocs);
    } catch (err) {
      console.error('Error fetching saved jobs:', err);
      let errorMessage = 'Không thể tải danh sách việc làm đã lưu';
      
      // Check if it's a network error (backend not running)
      if (err.code === 'ERR_NETWORK' || err.message === 'Network Error') {
        errorMessage = 'Không thể kết nối với server. Vui lòng kiểm tra backend đang chạy trên http://localhost:3001';
      } else if (err.response?.status === 404) {
        errorMessage = 'API endpoint không tồn tại. Vui lòng kiểm tra backend server.';
      } else if (err.response?.status === 401) {
        errorMessage = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      }
      
      setError(errorMessage);
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuth) getSavedJobs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuth]);

  return (
    <>
      <div className="ms-4 mt-4 px-5 py-3 bg-white">
        <h4 className="mb-4 text-main">Việc làm đã lưu</h4>        
        {loading && (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-2">Đang tải danh sách...</p>
          </div>
        )}
        
        {error && (
          <div className="alert alert-danger" role="alert">
            <strong>Lỗi:</strong> {error}
            <button 
              className="btn btn-sm btn-outline-danger ms-3" 
              onClick={getSavedJobs}
            >
              Thử lại
            </button>
          </div>
        )}
        
        {!loading && !error && (
          <>        <div className="table-responsive">
          <table className="table border shadow-sm" style={{ minWidth: "800px" }}>
            <thead className="table-primary">
              <tr>
                <th className="fw-500" style={{ width: "26%" }}>
                  Vị trí
                </th>
                <th className="fw-500" style={{ width: "26%" }}>
                  Công ty
                </th>
                <th className="fw-500" style={{ width: "18%" }}>
                  Địa điểm
                </th>
                <th className="fw-500" style={{ width: "14%" }}>
                  Hạn nộp
                </th>
                <th className="fw-500">Hành động</th>
              </tr>
            </thead>
            <tbody className="ts-smd">
              {jobs.length > 0 &&
                jobs.map((item, index) => (
                  <tr key={"saveJob" + item.id}>
                    <td>{item.jname}</td>
                    <td>{item.employer?.name || 'N/A'} </td>
                    <td>{jobLocations[index]}</td>
                    <td>{item.deadline} </td>
                    <td>
                      <div className="d-flex flex-wrap align-items-center gap-lg-3 gap-1">
                        {item.is_active === 1 ? (
                          <Link to={`/jobs/${item.id}`}>
                            <button className="btn btn-sm btn-outline-primary">
                              Ứng tuyển
                            </button>
                          </Link>
                        ) : (
                          <button className="btn btn-sm btn-outline-primary disabled">
                            Đã đóng
                          </button>
                        )}
                        <div
                          className="text-danger bg-white border-0"
                          data-bs-toggle="modal"
                          data-bs-target="#jobDeletingModal"
                          onClick={() => setCurJob(item)}
                        >
                          <BsTrash3 className="fs-5" />
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        {jobs.length === 0 && <h5 className="">Không có bản ghi nào</h5>}          </>
        )}      </div>
      <SavedJobPopup job_id={curJob.id} />
    </>
  );
}

export default SavedJobs;
