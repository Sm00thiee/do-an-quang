import Button from "react-bootstrap/Button";
import { useContext, useState } from "react";
import FrameLayout from "../frameLayout";
import dayjs from "dayjs";
import { FaUser } from "react-icons/fa";
import PersonalInforFormDialog from "./PersonalInforFormDialog";
import { CandidateContext } from "../../../layouts/CandidateLayout";

export default function PersonalInfor() {
  const { personal, getPersonal } = useContext(CandidateContext);
  const [isEdit, setIsEdit] = useState(false);
  const [hasImg, setHasImg] = useState(false);
  const none = <span>Chưa có</span>;
  const itemStyle = "border-0 border-bottom w-95 pb-1";

  const handleEdit = () => {
    setIsEdit(true);
  };

  return (
    <FrameLayout title="Thông tin cá nhân" hasaddbtn={false} className="mt-4">
      <hr />
      <div className="d-flex gap-5 flex-wrap align-items-center">
        <div className="ms-4" style={{ width: "150px", height: "150px" }}>
          {personal.avatar ? (
            <img
              src={personal.avatar}
              alt="image_error"
              width="100%"
              height="100%"
              className="rounded-pill avatar-img"
            />
          ) : (
            <FaUser
              className="rounded-pill text-bg-secondary p-1"
              style={{ fontSize: "130px" }}
            />
          )}
        </div>
        <div>
          <span className="ts-sm text-secondary">Mục tiêu nghề nghiệp</span>
          <br />
          <span className="ts-smd fw-500 whitespace-preline">
            {personal.objective || none}
          </span>
        </div>
      </div>
      <hr />
      <div className="row row-cols-md-2 row-cols-sm-1">
        <div>
          <div className={itemStyle}>
            <span className="ts-sm text-secondary">Họ tên</span> <br />
            <span className="ts-smd fw-500">
              {personal.lastname && personal.firstname ? (
                <>{personal.lastname + " " + personal.firstname}</>
              ) : (
                none
              )}
            </span>
          </div>
        </div>
        <div>
          <div className={itemStyle}>
            <span className="ts-sm text-secondary">Giới tính</span> <br />
            <span className="ts-smd fw-500">
              {personal.gender === 0 && "Nam"}
              {personal.gender === 1 && "Nữ"}
              {personal.gender === undefined && none}
            </span>
          </div>
        </div>
        <div>
          <div className={itemStyle}>
            <span className="ts-sm text-secondary">Ngày sinh</span> <br />
            <span className="ts-smd fw-500">
              {personal.dob ? dayjs(personal.dob).format("DD/MM/YYYY") : none}
            </span>
          </div>
        </div>
        <div>
          <div className={itemStyle}>
            <span className="ts-sm text-secondary">Số điện thoại</span> <br />
            <span className="ts-smd fw-500">{personal.phone || none}</span>
          </div>
        </div>
        <div>
          <div className={itemStyle}>
            <span className="ts-sm text-secondary">Email</span> <br />
            <span className="ts-smd fw-500">{personal.email || none}</span>
          </div>
        </div>
        <div>
          <div className={itemStyle}>
            <span className="ts-sm text-secondary">Địa chỉ</span> <br />
            <span className="ts-smd fw-500">{personal.address || none}</span>
          </div>
        </div>
        <div>
          <div className={itemStyle}>
            <span className="ts-sm text-secondary">Liên kết</span> <br />
            <a href={personal.link} className="ts-smd fw-500">
              {personal.link || none}
            </a>
          </div>
        </div>
      </div>
      <div className="clearfix">
        <Button
          variant="outline-primary"
          size="sm"
          className="me-3 float-md-end"
          onClick={handleEdit}
        >
          Cập nhật
        </Button>
      </div>
      {isEdit && (
        <PersonalInforFormDialog
          isEdit={isEdit}
          setIsEdit={setIsEdit}
          personal={personal}
          hasImg={hasImg}
          setHasImg={setHasImg}
          getPersonal={getPersonal}
        />
      )}
    </FrameLayout>
  );
}
