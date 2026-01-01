import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  BsChat,
  BsPlus,
  BsTrash,
  BsPaperclip,
  BsMic,
  BsSend,
  BsList,
  BsX
} from "react-icons/bs";
import { Offcanvas } from "react-bootstrap";

function Home() {
  const { t } = useTranslation();
  const [chatSessions, setChatSessions] = useState([
    {
      id: 1,
      name: "Nextstep Chat",
      messages: [],
    },
  ]);
  const [activeSession, setActiveSession] = useState(1);
  const [messageInput, setMessageInput] = useState("");
  const [showMobileSidebar, setShowMobileSidebar] = useState(false); // Mobile sidebar state

  // Available topics
  const topics = [
    { id: "marketing", name: t('marketing'), icon: "📊" },
    { id: "digital-marketing", name: t('digitalMarketing'), icon: "💻" },
    { id: "ui-ux", name: t('uiuxDesign'), icon: "🎨" },
    { id: "graphic-design", name: t('graphicDesign'), icon: "🖌️" },
    { id: "mobile-dev", name: t('mobileAppDev'), icon: "📱" },
    { id: "communication", name: t('communicationSkills'), icon: "💬" },
    { id: "content-creation", name: t('contentCreation'), icon: "✍️" },
  ];

  // Mock bot responses based on topic
  const getBotResponses = (topicId) => {
    const responses = {
      marketing: [
        "Marketing là một lĩnh vực rất thú vị! Bạn muốn tìm hiểu về digital marketing hay traditional marketing?",
        "Tôi có thể giúp bạn tìm các khóa học Marketing phù hợp với trình độ hiện tại.",
        "Bạn có muốn biết về các vị trí Marketing Entry-level không?",
      ],
      "digital-marketing": [
        "Digital Marketing là xu hướng tương lai! Bạn quan tâm đến SEO, Social Media hay Google Ads?",
        "Tôi có thể gợi ý lộ trình học Digital Marketing từ cơ bản đến nâng cao.",
        "Các công cụ Digital Marketing nào bạn đã biết?",
      ],
      "ui-ux": [
        "UI/UX Design rất hot hiện tại! Bạn đã có kinh nghiệm với Figma chưa?",
        "Tôi có thể giúp bạn tìm hiểu về User Research và Wireframing.",
        "Portfolio UI/UX rất quan trọng, bạn cần hỗ trợ gì không?",
      ],
      default: [
        "Đó là một câu hỏi rất hay! Tôi sẽ giúp bạn tìm hiểu về điều đó.",
        "Tôi có thể gợi ý một số vị trí việc làm phù hợp với bạn.",
        "Hãy để tôi tìm thông tin phù hợp nhất cho bạn!",
      ],
    };
    return responses[topicId] || responses["default"];
  };

  const handleTopicSelect = (topic) => {
    const welcomeMessage = {
      id: Date.now(),
      type: "bot",
      content: `${t('chatWelcome')} ${topic.name} ${topic.icon}\n\n${t('growingField')}\n\n${t('wantToExplore')} ${topic.name} không?`,
      time: new Date().toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setChatSessions((prev) =>
      prev.map((session) =>
        session.id === activeSession
          ? { ...session, name: topic.name, messages: [welcomeMessage] }
          : session,
      ),
    );
  };

  const handleSendMessage = () => {
    if (!messageInput.trim()) return;

    const currentSession = chatSessions.find((s) => s.id === activeSession);
    if (!currentSession) return;

    // Add user message
    const userMessage = {
      id: Date.now(),
      type: "user",
      content: messageInput,
      time: new Date().toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    // Simulate bot response
    setTimeout(() => {
      const botResponses = getBotResponses("default");
      const botMessage = {
        id: Date.now() + 1,
        type: "bot",
        content: botResponses[Math.floor(Math.random() * botResponses.length)],
        time: new Date().toLocaleTimeString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };

      setChatSessions((prev) =>
        prev.map((session) =>
          session.id === activeSession
            ? {
              ...session,
              messages: [...session.messages, userMessage, botMessage],
            }
            : session,
        ),
      );
    }, 1000);

    setChatSessions((prev) =>
      prev.map((session) =>
        session.id === activeSession
          ? { ...session, messages: [...session.messages, userMessage] }
          : session,
      ),
    );

    setMessageInput("");
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const addNewChat = () => {
    const newSession = {
      id: Date.now(),
      name: `Chat ${chatSessions.length + 1}`,
      messages: [
        {
          id: Date.now(),
          type: "bot",
          content: `${t('welcomeToNextstep')}\n${t('canHelpYou')}`,
          time: new Date().toLocaleTimeString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
          }),
        },
      ],
    };
    setChatSessions((prev) => [...prev, newSession]);
    setActiveSession(newSession.id);
    if (window.innerWidth < 992) setShowMobileSidebar(false); // Close sidebar on mobile
  };

  const deleteChat = (sessionId) => {
    setChatSessions((prev) => {
      const filtered = prev.filter((s) => s.id !== sessionId);
      if (sessionId === activeSession && filtered.length > 0) {
        setActiveSession(filtered[0].id);
      }
      return filtered;
    });
  };

  const currentSession = chatSessions.find((s) => s.id === activeSession);

  // Sidebar Content Component
  const SidebarContent = () => (
    <div className='d-flex flex-column h-100 text-white p-3' style={{ backgroundColor: '#1E293B' }}>
      <div className='d-flex justify-content-between align-items-center mb-3'>
        <div className='d-flex align-items-center'>
          <BsChat className='me-2' size={18} />
          <span className='fw-bold'>Chat bot</span>
        </div>
        <small className='text-muted'>by Nextstep</small>
      </div>

      <button
        className='btn btn-outline-light btn-sm w-100 mb-3 d-flex align-items-center justify-content-center'
        onClick={addNewChat}
      >
        <BsPlus className='me-2' />
        {t('newChat')}
      </button>

      {/* Chat Sessions */}
      <div className='flex-fill overflow-auto custom-scrollbar'>
        {chatSessions.map((session) => (
          <div
            key={session.id}
            className={`d-flex justify-content-between align-items-center p-3 rounded mb-2 cursor-pointer ${activeSession === session.id
              ? "bg-secondary"
              : "bg-transparent hover-bg-secondary"
              }`}
            onClick={() => {
              setActiveSession(session.id);
              if (window.innerWidth < 992) setShowMobileSidebar(false);
            }}
            style={{ cursor: "pointer" }}
          >
            <span
              className='text-truncate'
              style={{ fontSize: "14px", maxWidth: "160px" }}
            >
              {session.name}
            </span>
            <button
              className='btn btn-sm text-white p-0 opacity-75 hover-opacity-100'
              onClick={(e) => {
                e.stopPropagation();
                deleteChat(session.id);
              }}
            >
              <BsTrash size={12} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <>
      <style>{`
        .cursor-pointer { cursor: pointer; }
        .hover-bg-secondary:hover { background-color: rgba(108, 117, 125, 0.2) !important; }
        .hover-opacity-100:hover { opacity: 1 !important; }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #475569; border-radius: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #64748b; }
        #messagesContainer { scroll-behavior: smooth; }
        
        @media (max-width: 991.98px) {
           .chat-layout { height: calc(100vh - 56px) !important; } /* Adjust for Navbar */
        }
      `}</style>

      {/* Chat Interface Section */}
      <div className='container-fluid p-0 chat-layout' style={{ height: 'calc(100vh - 57px)' }}>
        <div className='d-flex h-100'>

          {/* Desktop Sidebar (hidden on mobile) */}
          <div className='d-none d-lg-block' style={{ width: "320px", minWidth: "320px" }}>
            <SidebarContent />
          </div>

          {/* Mobile Sidebar (Offcanvas) */}
          <Offcanvas show={showMobileSidebar} onHide={() => setShowMobileSidebar(false)} className="bg-dark text-white border-0" style={{ width: "280px", maxWidth: "80%" }}>
            <Offcanvas.Header closeButton closeVariant="white" className="border-bottom border-secondary">
              <Offcanvas.Title className="fs-6">Chat Menu</Offcanvas.Title>
            </Offcanvas.Header>
            <Offcanvas.Body className="p-0">
              <SidebarContent />
            </Offcanvas.Body>
          </Offcanvas>

          {/* Chat Area */}
          <div className='flex-fill d-flex flex-column w-100 position-relative'>
            {/* Chat Header */}
            <div className='text-center p-3 p-md-4 border-bottom bg-light d-flex flex-column align-items-center position-relative'>
              {/* Mobile Sidebar Toggle Button */}
              <button
                className="btn btn-link text-dark d-lg-none position-absolute top-0 start-0 m-2 p-2"
                onClick={() => setShowMobileSidebar(true)}
              >
                <BsList size={28} />
              </button>

              <div className='mb-2 mb-md-3 mt-3 mt-md-0'>
                <div
                  className='rounded-circle bg-secondary d-flex align-items-center justify-content-center mx-auto'
                  style={{ width: "50px", height: "50px" }}
                >
                  <BsChat className='text-white' size={20} />
                </div>
              </div>
              <h5 className='fw-bold mb-1 fs-6 fs-md-5'>
                Nextstep Chatbot
              </h5>
              <p className='text-muted mb-0 small contact-subtitle d-none d-md-block'>
                Người Bạn Đồng Hành AI Định Hướng Sự Nghiệp
              </p>
              <span className='badge bg-success mt-2'>Online</span>
            </div>

            {/* Messages */}
            <div
              className='flex-fill p-3 p-md-4 overflow-auto'
              id='messagesContainer'
            >
              {currentSession?.messages.length === 0 ? (
                // Topic suggestions
                <div className='text-center py-4 py-md-5'>
                  <div className='mb-4'>
                    <span className='bg-light rounded-circle p-3 d-inline-flex fs-4'>
                      🎯
                    </span>
                  </div>
                  <h4 className='fw-bold mb-3 text-dark fs-5 fs-md-4 px-2'>
                    {t('welcomeToNextstep')}
                  </h4>

                  <div className='d-flex flex-wrap justify-content-center gap-2 mt-4 px-2'>
                    {topics.map((topic) => (
                      <button
                        key={topic.id}
                        className='btn btn-outline-secondary rounded-pill px-3 py-2 border'
                        onClick={() => handleTopicSelect(topic)}
                        style={{ fontSize: "13px", fontWeight: "500" }}
                      >
                        <span className='me-1'>{topic.icon}</span>
                        {topic.name}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                // Messages list
                currentSession?.messages.map((message) => (
                  <div
                    key={message.id}
                    className={`mb-3 mb-md-4 d-flex ${message.type === "user" ? "justify-content-end" : ""}`}
                  >
                    <div
                      className={`d-flex align-items-start ${message.type === "user" ? "flex-row-reverse" : ""}`}
                      style={{ maxWidth: "90%" }}
                    >
                      <div
                        className={`rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 ${message.type === "user" ? "ms-2 ms-md-3 bg-primary" : "me-2 me-md-3 bg-light"}`}
                        style={{ width: "32px", height: "32px" }}
                      >
                        {message.type === "bot" ? (
                          <BsChat size={14} className='text-secondary' />
                        ) : (
                          <div className='text-white fw-bold small'>U</div>
                        )}
                      </div>
                      <div className={`${message.type === "user" ? "text-end" : ""}`}>
                        <div
                          className={`p-2 p-md-3 rounded-4 text-start ${message.type === "user" ? "bg-primary text-white" : "bg-light text-dark"}`}
                          style={{ whiteSpace: "pre-line", fontSize: "14px", lineHeight: "1.5" }}
                        >
                          {message.content}
                        </div>
                        <small className='text-muted d-block mt-1' style={{ fontSize: "11px" }}>
                          {message.time}
                        </small>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Input Area */}
            <div className='border-top p-2 p-md-4 bg-light'>
              <div className='d-flex align-items-center gap-2'>
                <button
                  className='btn btn-outline-secondary btn-sm d-none d-md-flex align-items-center justify-content-center flex-shrink-0'
                  style={{ width: "40px", height: "40px" }}
                  title="Attach"
                >
                  <BsPaperclip size={16} />
                </button>
                <div className='flex-fill'>
                  <input
                    type='text'
                    className='form-control'
                    placeholder="Nhập tin nhắn..."
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    style={{ fontSize: "16px", height: "40px", borderRadius: "20px" }}
                  />
                </div>
                {/* Mobile: Hide Mic if space is tight, or keep it icon only */}
                <button
                  className='btn btn-outline-secondary btn-sm d-none d-md-flex align-items-center justify-content-center flex-shrink-0'
                  style={{ width: "40px", height: "40px" }}
                >
                  <BsMic size={16} />
                </button>
                <button
                  className='btn btn-primary btn-sm d-flex align-items-center justify-content-center flex-shrink-0 rounded-circle'
                  onClick={handleSendMessage}
                  disabled={!messageInput.trim()}
                  style={{ width: "40px", height: "40px" }}
                >
                  <BsSend size={16} />
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
export default Home;
