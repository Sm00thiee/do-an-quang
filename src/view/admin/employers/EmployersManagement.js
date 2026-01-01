import { BsEye, BsTrash3 } from "react-icons/bs";
import { useEffect, useState } from "react";
import "./style.css";
import { AiOutlinePlus } from "react-icons/ai";
import EmployersCreating from "./EmployersCreating";
import EmployersDeleting from "./EmployersDeleting";
import EmployersDetail from "./EmployersDetail";
import adminApi from "../../../api/admin";

function Employers() {
  const [employers, setEmployers] = useState([]);
  const [currentEmployer, setCurrentEmployer] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const getEmployerList = async () => {
    const res = await adminApi.getAllEmployers();
    setEmployers(res);
  };

  const handleDeleteEmployer = (employer) => {
    setCurrentEmployer(employer);
  };

  const handleViewDetail = (employer) => {
    setCurrentEmployer(employer);
    setShowDetailModal(true);
  };

  const handleEmployerUpdated = () => {
    getEmployerList(); // Refresh danh sách sau khi cập nhật
    setShowDetailModal(false);
  };

  useEffect(() => {
    getEmployerList();
  }, []);

  return (
    <>
      <div className="bg-white ms-4 mt-3" style={{ height: "90%" }}>
        <div className="pt-3" style={{ marginLeft: "45px" }}>
          <h5 className="text-main">Danh sách nhà tuyển dụng</h5>

          <div className="clearfix my-3" style={{ width: "93%" }}>
            <button
              type="button"
              className="float-end d-flex align-items-center btn btn-info btn-sm text-white me-3"
              data-bs-toggle="modal"
              data-bs-target="#employersCreating"
            >
              <AiOutlinePlus />
              Tạo mới
            </button>
          </div>

          <table className="table border text-center shadow-sm" style={{ width: "93%" }}>
            <thead className="table-primary ts-smd">
              <tr>
                <th style={{ width: "10%" }}>Tên</th>
                <th style={{ width: "10%" }}>Nhân sự</th>
                <th style={{ width: "15%" }}>Số điện thoại</th>
                <th style={{ width: "10%" }}>Liên hệ</th>
                <th style={{ width: "25%" }}>Địa chỉ</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody style={{ fontSize: "14px" }}>
              {employers.length > 0 ? (
                employers.map((item) => (
                  <tr key={"employers" + item.id}>
                    <td>{item.name}</td>
                    <td>{item.min_employees + " - " + item.max_employees}</td>
                    <td>{item.phone}</td>
                    <td>{item.contact_name}</td>
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
                        data-bs-target="#EmployersDeleting"
                        onClick={() => handleDeleteEmployer(item)}
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

          <EmployersCreating />
          <EmployersDeleting
            employer={currentEmployer}
            onDeleted={getEmployerList}
          />
          {showDetailModal && (
            <EmployersDetail
              employer={currentEmployer}
              onClose={() => setShowDetailModal(false)}
              onUpdated={handleEmployerUpdated}
            />
          )}
        </div>
      </div>
    </>
  );
}

export default Employers;
