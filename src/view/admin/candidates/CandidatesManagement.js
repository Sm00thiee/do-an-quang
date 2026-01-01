import { BsEye, BsTrash3 } from "react-icons/bs";
import { useEffect, useState } from "react";
import "./style.css";
import { AiOutlinePlus } from "react-icons/ai";
import CandidatesCreating from "./CandidatesCreating";
import CandidatesDeleting from "./CandidatesDeleting";
import CandidatesDetail from "./CandidatesDetail";
import adminApi from "../../../api/admin";

function CandidatesManagement() {
  const [candidates, setCandidates] = useState([]);
  const [currentCandidate, setCurrentCandidate] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const getCandidateList = async () => {
    const res = await adminApi.getAllCandidates();
    setCandidates(res);
  };

  const handleDeleteCandidate = (candidate) => {
    setCurrentCandidate(candidate);
  };

  const handleViewDetail = (candidate) => {
    setCurrentCandidate(candidate);
    setShowDetailModal(true);
  };

  const handleCandidateUpdated = () => {
    getCandidateList(); // Refresh danh sách sau khi cập nhật
    setShowDetailModal(false);
  };

  useEffect(() => {
    getCandidateList();
  }, []);

  return (
    <>
      <div className="bg-white ms-4 mt-3" style={{ height: "90%" }}>
        <div className="pt-3" style={{ marginLeft: "45px" }}>
          <h5 className="text-main">Danh sách tài khoản ứng viên</h5>

          <div className="clearfix my-3" style={{ width: "93%" }}>
            <button
              type="button"
              className="float-end d-flex align-items-center btn btn-info btn-sm text-white me-3"
              data-bs-toggle="modal"
              data-bs-target="#candidatesCreating"
            >
              <AiOutlinePlus />
              Tạo mới
            </button>
          </div>

          <table className="table border text-center shadow-sm" style={{ width: "93%" }}>
            <thead className="table-primary ts-smd">
              <tr>
                <th style={{ width: "10%" }}>Tên</th>
                <th style={{ width: "10%" }}>Email</th>
                <th style={{ width: "15%" }}>Số điện thoại</th>
                <th style={{ width: "10%" }}>Giới tính</th>
                <th style={{ width: "25%" }}>Địa chỉ</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody style={{ fontSize: "14px" }}>
              {candidates.length > 0 ? (
                candidates.map((item) => (
                  <tr key={"candidates" + item.id}>
                    <td>{item.lastname + " " + item.firstname}</td>
                    <td>{item.email}</td>
                    <td>{item.phone}</td>
                    <td>{item.gender === 0 ? "Nam" : "Nữ"}</td>
                    <td>{item.address}</td>
                    <td style={{ fontSize: "17px" }}>
                      <BsEye
                        className="ms-2 text-info"
                        style={{ cursor: "pointer" }}
                        onClick={() => handleViewDetail(item)}
                      />
                      <BsTrash3
                        className="ms-2 text-danger"
                        style={{ cursor: "pointer" }}
                        data-bs-toggle="modal"
                        data-bs-target="#CandidatesDeleting"
                        onClick={() => handleDeleteCandidate(item)}
                      />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6">Không có bản ghi nào</td>
                </tr>
              )}
            </tbody>
          </table>

          <CandidatesCreating />
          <CandidatesDeleting
            candidate={currentCandidate}
            onDeleted={getCandidateList}
          />
          {showDetailModal && (
            <CandidatesDetail
              candidate={currentCandidate}
              onClose={() => setShowDetailModal(false)}
              onUpdated={handleCandidateUpdated}
            />
          )}
        </div>
      </div>
    </>
  );
}

export default CandidatesManagement;
