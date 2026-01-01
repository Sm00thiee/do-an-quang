
import { useEffect, useState } from "react";
import "./style.css";
import { AiOutlinePlus } from "react-icons/ai";
import adminApi from "../../../api/admin";

function ContactsManagement() {
  const [contacts, setContacts] = useState([]);

  const getContactList = async () => {
    const res = await adminApi.getContact();
    setContacts(res);
  };

  const ratingLabels = {
    1: "Rất tệ",
    2: "Tệ",
    3: "Bình thường",
    4: "Tốt",
    5: "Tuyệt vời",
  };
  

  useEffect(() => {
    getContactList();
  }, []);

  return (
    <>
      <div className="bg-white ms-4 mt-3" style={{ height: "90%" }}>
        <div className="pt-3" style={{ marginLeft: "45px" }}>
          <h5 className="text-main">Danh sách yêu cầu</h5>

          <table className="table border text-center shadow-sm" style={{ width: "93%" }}>
            <thead className="table-primary ts-smd">
              <tr>
                <th style={{ width: "10%" }}>Tiêu đề</th>
                <th style={{ width: "30%" }}>Nội dung</th>
                <th style={{ width: "15%" }}>Đánh giá</th>
              </tr>
            </thead>
            <tbody style={{ fontSize: "14px" }}>
              {contacts.length > 0 ? (
                contacts.map((item) => (
                  <tr key={"contacts" + item.id}>
                    <td>{item.title}</td>
                    <td>{item.content}</td>
                    <td>{ratingLabels[item.rate] || "Không xác định"}</td>
                   
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3">Không có bản ghi nào</td>
                </tr>
              )}
            </tbody>
          </table>

          
        </div>
      </div>
    </>
  );
}

export default ContactsManagement;
