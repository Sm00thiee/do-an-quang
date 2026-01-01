import { useEffect, useState } from "react";
import { BsCheckCircle, BsEye, BsSearch, BsXCircle } from "react-icons/bs";
import "./custom.css";
import { useForm } from "react-hook-form";
;
import { MessagePopup } from "./popup";
import employerApi from "../../../api/employer";
import Form from "react-bootstrap/Form";
import Nav from "react-bootstrap/Nav";
import Tab from "react-bootstrap/Tab";
import clsx from "clsx";

import { useEmployerAuthStore } from "../../../stores/employerAuthStore";
function CandidateList() {
  const {
    register,
    // formState: { errors },
    handleSubmit,
  } = useForm();
  const [candidates, setCandidates] = useState([]);
  const [curCandidate, setCurCandidate] = useState({});
  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState("WAITING");
  const [step, setStep] = useState("step1");
  const [showDialog, setShowDialog] = useState(false);

  const isAuth = useEmployerAuthStore(state => state.isAuth);

  const makeTabStyle = (tabName) => {
    return clsx(
      "fw-600 pb-1 me-5",
      step === tabName
        ? "border-2 border-bottom border-primary"
        : "text-secondary"
    );
  };
  const getCandidateList = async () => {
    const res = await employerApi.getCandidateList(keyword, status);
    setCandidates(res);
  };

  useEffect(() => {
    getCandidateList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyword, status]);
  useEffect(() => {
    if (step === "step1") setStatus("WAITING");
    else if (step === "step2") setStatus("BROWSING_INTERVIEW");
    else if (step === "step3") setStatus("PASSED");
  }, [step]);

  const handleClickActionBtn = async (candidate, actType) => {
    if (actType === "VIEWED" && candidate.status === "WAITING") {
      await employerApi
        .processApplying({ ...candidate, actType })
        .then((res) => {
          console.log(res);
        });
    }
    if (actType !== "VIEWED") {
      setShowDialog(true);
      setCurCandidate({ ...candidate, actType, step });
    }
  };

  useEffect(() => {
    if (isAuth) getCandidateList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuth]);

  return (
    <>
      <div className="bg-white ms-4 mt-3" style={{ height: "90%" }}>
        <h5 className="mb-1 pt-3 text-main" style={{ marginLeft: "45px" }}>
          Danh sách ứng viên
        </h5>
        <Tab.Container onSelect={(k) => setStep(k)}>
          <Nav className="bg-mlight w-50 mx-auto pb-1 justify-content-center border">
            <Nav.Item>
              <Nav.Link eventKey="step1">
                <span className={makeTabStyle("step1")}>Duyệt hồ sơ</span>
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="step2">
                <span className={makeTabStyle("step2")}>Duyệt phỏng vấn</span>
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="step3">
                <span className={makeTabStyle("step3")}>Đã tiếp nhận</span>
              </Nav.Link>
            </Nav.Item>
          </Nav>
        </Tab.Container>
        <div className="mt-3" style={{ marginLeft: "45px" }}>
          <Form onSubmit={handleSubmit((data) => setKeyword(data.keyword))}>
            <Form.Group className="input-group" style={{ width: "35%" }}>
              <Form.Control
                size="sm"
                type="text"
                className="border-end-0"
                placeholder="Nhập tên, email ứng viên, việc làm"
                {...register("keyword")}
              />
              <button type="submit" className="input-group-text bg-white">
                <BsSearch />
              </button>
            </Form.Group>
            {step !== "step3" && (
              <div className="d-flex align-items-center mt-2 ts-smd">
                <div className="fw-500">Trạng thái: </div>&nbsp;
                <Form.Select
                  size="sm"
                  className="rounded"
                  style={{ width: "17%" }}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  {step === "step1" && (
                    <>
                      <option value="WAITING">Chưa duyệt hồ sơ</option>
                      <option value="RESUME_FAILED">Hồ sơ bị loại</option>
                    </>
                  )}
                  {step === "step2" && (
                    <>
                      <option value="BROWSING_INTERVIEW">
                        Chưa duyệt phỏng vấn
                      </option>
                      <option value="INTERVIEW_FAILED">
                        Phỏng vấn bị loại
                      </option>
                    </>
                  )}
                </Form.Select>
              </div>
            )}
          </Form>
          <div className="mt-3" style={{ width: "90%" }}>
            <table className="table table-borderless border text-center shadow-sm">
              <thead className="table-primary ts-smd">
                <tr>
                  <th style={{ width: "17%" }}>Họ tên</th>
                  <th>Vị trí ứng tuyển</th>
                  <th style={{ width: "15%" }}>Thời gian</th>
                  <th style={{ width: "12%" }}>Số điện thoại</th>
                  <th style={{ width: "18%" }}>Email</th>
                  <th style={{ width: "13%" }}>Hành động</th>
                </tr>
              </thead>
              <tbody className="ts-sm">
                {candidates.length > 0 &&
                  candidates.map((item) => (
                    <tr key={item.jname + item.phone}>
                      <td>{item.lastname + " " + item.firstname}</td>
                      <td>{item.jname}</td>
                      <td>{item.appliedTime}</td>
                      <td>{item.phone}</td>
                      <td>{item.email}</td>
                      <td style={{ fontSize: "17px" }}>
                        {status !== "PASSED" &&
                        status !== "RESUME_FAILED" &&
                        status !== "INTERVIEW_FAILED" ? (
                          <>
                            <button
                              className="border-0 bg-white"
                              onClick={() =>
                                handleClickActionBtn(item, "ACCEPT")
                              }
                            >
                              <BsCheckCircle className="text-success" />
                            </button>
                            <button
                              className="border-0 bg-white"
                              onClick={() =>
                                handleClickActionBtn(item, "REJECT")
                              }
                            >
                              <BsXCircle className="ms-2 text-danger" />
                            </button>
                          </>
                        ) : null}
                        <a
                          className="ms-2"
                          style={{ textDecoration: "none" }}
                          href={item.cv_link}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <BsEye
                            type="button"
                            className="text-primary"
                            onClick={() => handleClickActionBtn(item, "VIEWED")}
                          />
                        </a>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
            {candidates.length === 0 && (
              <h5 className="">Không có bản ghi nào</h5>
            )}
            <MessagePopup
              candidate={curCandidate}
              showDialog={showDialog}
              setShowDialog={setShowDialog}
              getCandidateList={getCandidateList}
            />
          </div>
        </div>
      </div>
    </>
  );
}

export default CandidateList;
