import { useForm } from "react-hook-form";
import employerApi from "../../../api/employer";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import Modal from "react-bootstrap/Modal";
import { toast } from "react-toastify";
import { useState } from "react";
import emailjs from "@emailjs/browser";
import { emailjsConfig } from "../../../config/emailjs.config";

import { useEmployerAuthStore } from "../../../stores/employerAuthStore";
function MessagePopup({
  candidate,
  showDialog,
  setShowDialog,
  getCandidateList,
}) {
  let prefix_msg = "";
  const step = candidate.step;
  const actType = candidate.actType;
  if (step === "step1") {
    if (actType === "ACCEPT") prefix_msg = "Chấp nhận hồ sơ ứng viên ";
    else if (actType === "REJECT") prefix_msg = "Từ chối hồ sơ ứng viên ";
  } else if (step === "step2") {
    if (actType === "ACCEPT") prefix_msg = "Tiếp nhận ứng viên ";
    else if (actType === "REJECT") prefix_msg = "Không tiếp nhận ứng viên ";
  }
  const company = useEmployerAuthStore(state => state.current.employer);

  const {
    register,
    formState: { errors },
    handleSubmit,
  } = useForm();
  const requiredMsg = "Không được để trống!";
  const [isSendMail, setIsSendMail] = useState(false);
  const onSubmit = async (data) => {
    try {
      await employerApi.processApplying({ ...candidate, ...data });

      toast.success("Gửi thông báo thành công!");
      getCandidateList();
      setShowDialog(false);
    } catch (e) {
      toast.error("Gửi thông báo thất bại!");
    }
    if (isSendMail) {
      var templateParams = {
        to_email: candidate.email,
        title: data.title,
        candidate_name: candidate.firstname,
        company_name: company.name,
        content: data.content,
      };
      try {
        await emailjs.send(
          emailjsConfig.serviceId,
          emailjsConfig.templateId1,
          templateParams,
          emailjsConfig.publicKey
        );
        toast.success("Gửi email thành công!");
      } catch (e) {
        toast.error("Gửi email thất bại!");
      }
    }
  };
  const handleClose = () => {
    setShowDialog(false);
  };

  return (
    <Modal
      show={showDialog}
      onShow={() => {
        document.getElementById("reset").click();
        setIsSendMail(false);
      }}
      onHide={handleClose}
      size="lg"
      fullscreen="md-down"
    >
      <Modal.Body>
        <div className="ts-xl fw-500 text-center border-bottom pb-1">
          Gửi thông báo
        </div>
        <div className="text-center bg-mlight">
          <div className="pt-1 pb-2">
            {prefix_msg}
            <span className="fw-500">
              {candidate.lastname + " " + candidate.firstname}
            </span>
            <div>
              Vị trí <span className="fw-500">{candidate.jname}</span>
            </div>
          </div>
        </div>
        <Form className="mt-2" noValidate onSubmit={handleSubmit(onSubmit)}>
          <Form.Check
            type="checkbox"
            label="Gửi email thông báo"
            onClick={() => setIsSendMail(!isSendMail)}
          />
          <Form.Group>
            <Form.Label className="fw-500">Tiêu đề</Form.Label>
            <Form.Control
              type="text"
              size="sm"
              {...register("title", { required: requiredMsg })}
              isInvalid={errors.title}
            />
            <Form.Control.Feedback type="invalid">
              {errors.title?.message}
            </Form.Control.Feedback>
          </Form.Group>
          <Form.Group className="mt-1">
            <Form.Label className="fw-500">Nội dung</Form.Label>
            <Form.Control
              as="textarea"
              size="sm"
              rows={10}
              {...register("content", { required: requiredMsg })}
              isInvalid={errors.content}
            />
            <Form.Control.Feedback type="invalid">
              {errors.content?.message}
            </Form.Control.Feedback>
          </Form.Group>
          <div className="d-flex gap-2 justify-content-end mt-3 me-3">
            <Button type="submit" variant="primary" size="sm">
              Xác nhận
            </Button>
            <Button variant="secondary" size="sm" onClick={handleClose}>
              Hủy
            </Button>
            <button type="reset" id="reset" className="d-none" />
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
}
export { MessagePopup };
