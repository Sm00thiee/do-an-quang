import React, { useState } from "react";
import candidateApi from "../../api/candidate";

function ContactForm() {
  const [selectedTopic, setSelectedTopic] = useState("");
  const [feedback, setFeedback] = useState("");
  const [satisfaction, setSatisfaction] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault(); // Ngăn form reload trang

    // Kiểm tra dữ liệu bắt buộc
    if (!selectedTopic || !feedback) {
      alert("Vui lòng chọn chủ đề và nhập mô tả góp ý.");
      return;
    }

    try {
      await candidateApi.createContact({
        topic: selectedTopic,
        feedback,
        satisfaction,
      });     
        alert("Gửi yêu cầu thành công!");
        window.location.reload();   
      
    } catch (error) {
      alert("Có lỗi xảy ra khi gửi phản hồi.");
      console.error(error.response?.data || error.message);
    }
  };

  return (
    <div
      className="d-flex justify-content-center"
      style={{ marginTop: "6em", marginBottom: "3em", backgroundColor: "#fff" }}
    >
      <form
        className="border p-4 rounded w-50 bg-white"
        onSubmit={handleSubmit}
      >
        <h5>Góp ý sản phẩm</h5>
        <p>
          Phản hồi của bạn rất quan trọng, mong nhận được nhiều góp ý từ bạn để
          cải thiện sản phẩm tốt hơn.
        </p>

        <div className="mb-3">
          <label className="form-label">
            Chủ đề cần góp ý{" "}
            <span style={{ backgroundColor: "white", color: "red" }}>*</span>
          </label>
          <div className="d-flex flex-wrap gap-2">
            {[
              "Công cụ tạo CV",
              "Công cụ tìm kiếm",
              "Tính năng/Giao diện trang web",
              "Thông báo việc làm",
              "Thông tin công ty",
              "Khác",
            ].map((topic) => (
              <button
                type="button"
                key={topic}
                className={`btn btn-sm ${
                  selectedTopic === topic ? "btn-primary" : "btn-outline-primary"
                }`}
                onClick={() => setSelectedTopic(topic)}
              >
                {topic}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-3">
          <label className="form-label">
            Mô tả góp ý{" "}
            <span style={{ backgroundColor: "white", color: "red" }}>*</span>
          </label>
          <textarea
            className="form-control"
            rows="4"
            placeholder="Mô tả góp ý của bạn..."
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            required
          />
        </div>

        <div className="mb-3">
          <label className="form-label">
            Bạn có hài lòng với sản phẩm không?
          </label>
          <div className="d-flex gap-3">
            {["Rất tệ", "Tệ", "Bình thường", "Tốt", "Tuyệt vời"].map((level) => (
              <div key={level} className="form-check">
                <input
                  className="form-check-input"
                  type="radio"
                  name="satisfaction"
                  value={level}
                  checked={satisfaction === level}
                  onChange={() => setSatisfaction(level)}
                />
                <label className="form-check-label">{level}</label>
              </div>
            ))}
          </div>
        </div>

        <button className="btn btn-success w-100" type="submit">
          Gửi phản hồi
        </button>
      </form>
    </div>
  );
}

export default ContactForm;
