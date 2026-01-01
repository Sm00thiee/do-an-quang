import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  BsChat,
  BsSend,
  BsPaperclip,
  BsMic,
} from "react-icons/bs";
import "./Roadmap.css";

function RoadmapHome() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [messageInput, setMessageInput] = useState("");
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: "bot",
      content: "Xin chào! Tôi là trợ lý AI của Nextstep. Tôi sẽ giúp bạn tạo lộ trình phát triển sự nghiệp phù hợp. Bạn quan tâm đến lĩnh vực nào?",
      time: new Date().toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    },
  ]);

  // Topics for quick selection
  const topics = [
    { id: "marketing", name: "Marketing", icon: "📊", color: "#667eea" },
    { id: "it", name: "IT & Technology", icon: "💻", color: "#764ba2" },
    { id: "design", name: "UI/UX Design", icon: "🎨", color: "#f093fb" },
    { id: "data", name: "Data Science", icon: "📈", color: "#4facfe" },
    { id: "business", name: "Business", icon: "💼", color: "#43e97b" },
    { id: "content", name: "Content Creation", icon: "✍️", color: "#fa709a" },
  ];

  const handleTopicSelect = (topic) => {
    const userMessage = {
      id: Date.now(),
      type: "user",
      content: `Tôi quan tâm đến lĩnh vực ${topic.name}`,
      time: new Date().toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setMessages((prev) => [...prev, userMessage]);

    // Simulate bot response
    setTimeout(() => {
      const botMessage = {
        id: Date.now() + 1,
        type: "bot",
        content: `Tuyệt vời! ${topic.icon} ${topic.name} là một lĩnh vực rất thú vị và đang phát triển mạnh mẽ.\n\nĐể tạo lộ trình phù hợp nhất cho bạn, hãy cho tôi biết:\n• Trình độ hiện tại của bạn (mới bắt đầu, trung cấp, cao cấp)\n• Mục tiêu nghề nghiệp trong 1-2 năm tới\n• Kỹ năng bạn đã có (nếu có)`,
        time: new Date().toLocaleTimeString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
      setMessages((prev) => [...prev, botMessage]);
    }, 1000);
  };

  const handleSendMessage = () => {
    if (!messageInput.trim()) return;

    const userMessage = {
      id: Date.now(),
      type: "user",
      content: messageInput,
      time: new Date().toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setMessageInput("");

    // Simulate bot response
    setTimeout(() => {
      const botMessage = {
        id: Date.now() + 1,
        type: "bot",
        content: "Cảm ơn bạn đã chia sẻ! Dựa trên thông tin này, tôi đang tạo lộ trình phát triển sự nghiệp phù hợp cho bạn...",
        time: new Date().toLocaleTimeString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
      setMessages((prev) => [...prev, botMessage]);

      // Simulate roadmap creation
      setTimeout(() => {
        navigate("/roadmap/1");
      }, 2000);
    }, 1000);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="roadmap-container">
      <div className="roadmap-chat-wrapper">
        {/* Chat Header */}
        <div className="roadmap-chat-header">
          <div className="chat-header-icon">
            <BsChat size={28} />
          </div>
          <div className="chat-header-content">
            <h4 className="chat-header-title">AI Career Roadmap Creator</h4>
            <p className="chat-header-subtitle">
              Trợ lý AI giúp bạn xây dựng lộ trình sự nghiệp
            </p>
          </div>
        </div>

        {/* Messages Area */}
        <div className="roadmap-messages-area">
          {messages.length === 1 ? (
            // Initial state with topic selection
            <div className="topic-selection-area">
              <div className="topic-welcome">
                <div className="topic-icon">🎯</div>
                <h3>Chọn lĩnh vực bạn quan tâm</h3>
                <p>Chúng tôi sẽ giúp bạn tạo lộ trình phát triển sự nghiệp phù hợp</p>
              </div>
              <div className="topic-chips">
                {topics.map((topic) => (
                  <button
                    key={topic.id}
                    className="topic-chip"
                    onClick={() => handleTopicSelect(topic)}
                    style={{ borderColor: topic.color }}
                  >
                    <span className="topic-chip-icon">{topic.icon}</span>
                    <span className="topic-chip-name">{topic.name}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            // Chat messages
            messages.map((message) => (
              <div
                key={message.id}
                className={`message-wrapper ${
                  message.type === "user" ? "message-user" : "message-bot"
                }`}
              >
                <div className="message-avatar">
                  {message.type === "bot" ? (
                    <BsChat size={20} />
                  ) : (
                    <span className="user-avatar-text">U</span>
                  )}
                </div>
                <div className="message-content-wrapper">
                  <div className="message-bubble">{message.content}</div>
                  <div className="message-time">{message.time}</div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Input Area */}
        <div className="roadmap-input-area">
          <button className="input-action-btn" title="Đính kèm file">
            <BsPaperclip size={20} />
          </button>
          <input
            type="text"
            className="roadmap-input"
            placeholder="Nhập tin nhắn của bạn..."
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            onKeyPress={handleKeyPress}
          />
          <button className="input-action-btn" title="Ghi âm">
            <BsMic size={20} />
          </button>
          <button
            className="input-send-btn"
            onClick={handleSendMessage}
            disabled={!messageInput.trim()}
          >
            <BsSend size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default RoadmapHome;
