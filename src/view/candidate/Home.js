import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import {
  BsChat,
  BsPlus,
  BsTrash,
  BsPaperclip,
  BsSend,
  BsList
} from "react-icons/bs";
import { Offcanvas } from "react-bootstrap";

// Import Supabase services
import { getOrCreateSession } from '../../services/sessionService';
import { getMessages, sendMessageWithResponse, getFields } from '../../services/chatService.intelligent';

function Home() {
  const { t } = useTranslation();

  // Supabase session
  const [supabaseSession, setSupabaseSession] = useState(null);
  const [loading, setLoading] = useState(true);

  // Chat state
  const [chatSessions, setChatSessions] = useState([
    {
      id: 1,
      name: "Nextstep Chat",
      messages: [],
    },
  ]);
  const [activeSession, setActiveSession] = useState(1);
  const [messageInput, setMessageInput] = useState("");
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [sending, setSending] = useState(false);
  const [topics, setTopics] = useState([]);
  const messagesEndRef = useRef(null);


  // Initialize Supabase session
  useEffect(() => {
    const initSession = async () => {
      try {
        setLoading(true);
        const session = await getOrCreateSession();
        setSupabaseSession(session);

        // Load existing messages
        const messages = await getMessages(session.session_id);
        if (messages.length > 0) {
          setChatSessions(prev =>
            prev.map(s =>
              s.id === activeSession
                ? {
                  ...s,
                  messages: messages.map(msg => ({
                    id: msg.id,
                    type: msg.role,
                    content: msg.content,
                    time: new Date(msg.created_at).toLocaleTimeString("vi-VN", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  }))
                }
                : s
            )
          );
        }
      } catch (error) {
        console.error('Error initializing session:', error);
      } finally {
        setLoading(false);
      }
    };

    initSession();
    loadTopics();
  }, [activeSession]);

  // Load topics from database
  const loadTopics = async () => {
    try {
      const fields = await getFields();
      const topicIcons = { Marketing: "📊", Design: "🎨", Development: "💻", "Digital Marketing": "📱" };
      setTopics(fields.map(f => ({
        id: f.id,
        name: f.name,
        icon: topicIcons[f.name] || "📚"
      })));
    } catch (error) {
      console.error('Error loading topics:', error);
    }
  };

  // Scroll to bottom
  useEffect(() => {
    scrollToBottom();
  }, [chatSessions]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Handle send message with Supabase
  const handleSendMessage = async () => {
    if (!messageInput.trim() || !supabaseSession || sending) return;

    const userMessageContent = messageInput;
    setMessageInput("");
    setSending(true);

    // Add user message to UI immediately
    const tempUserMsg = {
      id: `temp-${Date.now()}`,
      type: "user",
      content: userMessageContent,
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
            messages: [...session.messages, tempUserMsg],
          }
          : session
      )
    );

    try {
      // Send message and get AI response (saves to Supabase)
      const updatedMessages = await sendMessageWithResponse(
        supabaseSession.session_id,
        userMessageContent,
        supabaseSession.field_id
      );

      // Update UI with all messages from database
      setChatSessions((prev) =>
        prev.map((session) =>
          session.id === activeSession
            ? {
              ...session,
              messages: updatedMessages.map(msg => ({
                id: msg.id,
                type: msg.role,
                content: msg.content,
                time: new Date(msg.created_at).toLocaleTimeString("vi-VN", {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              }))
            }
            : session
        )
      );
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Có lỗi khi gửi tin nhắn. Vui lòng thử lại.');
    } finally {
      setSending(false);
    }
  };

  // Handle topic select
  const handleTopicSelect = async (topic) => {
    const welcomeMessage = `Xin chào! Tôi muốn tìm hiểu về ${topic.name} ${topic.icon}. Bạn có thể giúp tôi không?`;
    setMessageInput(welcomeMessage);
  };

  // Handle new chat
  const addNewChat = async () => {
    try {
      const newSession = await getOrCreateSession();
      setSupabaseSession(newSession);

      const newChatSession = {
        id: Date.now(),
        name: `Chat ${chatSessions.length + 1}`,
        messages: []
      };

      setChatSessions(prev => [...prev, newChatSession]);
      setActiveSession(newChatSession.id);

      if (window.innerWidth < 992) setShowMobileSidebar(false);
    } catch (error) {
      console.error('Error creating new chat:', error);
    }
  };

  // Handle delete chat
  const deleteChat = (sessionId) => {
    setChatSessions(prev => {
      const filtered = prev.filter(s => s.id !== sessionId);
      if (sessionId === activeSession && filtered.length > 0) {
        setActiveSession(filtered[0].id);
      }
      return filtered;
    });
  };

  // Handle key press
  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const currentSession = chatSessions.find(s => s.id === activeSession);
  const displayMessages = currentSession?.messages || [];

  // Sidebar Content
  const SidebarContent = () => (
    <div className='d-flex flex-column h-100 text-white p-3' style={{ backgroundColor: '#1E293B' }}>
      <div className='d-flex justify-content-between align-items-center mb-3'>
        <div className='d-flex align-items-center'>
          <BsChat className='me-2' size={18} />
          <span className='fw-bold'>Chat bot</span>
        </div>
        <small className='text-muted'>by Nextstep AI</small>
      </div>

      {supabaseSession && (
        <div className='mb-2 p-2 bg-secondary bg-opacity-25 rounded'>
          <small className='text-muted'>Session: {supabaseSession.session_id?.substring(0, 8)}...</small>
          <br />
          <small className='text-success'>✅ Connected to Supabase</small>
        </div>
      )}

      <button
        className='btn btn-outline-light btn-sm w-100 mb-3 d-flex align-items-center justify-content-center'
        onClick={addNewChat}
        disabled={loading}
      >
        <BsPlus className='me-2' />
        {t('newChat') || 'Tạo chat mới'}
      </button>

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
          .chat-layout { height: calc(100vh - 56px) !important; }
        }
      `}</style>

      <div className='container-fluid p-0 chat-layout' style={{ height: 'calc(100vh - 57px)' }}>
        <div className='d-flex h-100'>
          {/* Desktop Sidebar */}
          <div className='d-none d-lg-block' style={{ width: "320px", minWidth: "320px" }}>
            <SidebarContent />
          </div>

          {/* Mobile Sidebar */}
          <Offcanvas
            show={showMobileSidebar}
            onHide={() => setShowMobileSidebar(false)}
            className="bg-dark text-white border-0"
            style={{ width: "280px", maxWidth: "80%" }}
          >
            <Offcanvas.Header closeButton closeVariant="white" className="border-bottom border-secondary">
              <Offcanvas.Title className="fs-6">Chat Menu</Offcanvas.Title>
            </Offcanvas.Header>
            <Offcanvas.Body className="p-0">
              <SidebarContent />
            </Offcanvas.Body>
          </Offcanvas>

          {/* Chat Area */}
          <div className='flex-fill d-flex flex-column w-100 position-relative'>
            {/* Header */}
            <div className='text-center p-3 p-md-4 border-bottom bg-light d-flex flex-column align-items-center position-relative'>
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
                Nextstep AI Chatbot
              </h5>
              <p className='text-muted mb-0 small d-none d-md-block'>
                Người Bạn Đồng Hành AI Định Hướng Sự Nghiệp
              </p>
              <span className={`badge ${loading ? 'bg-warning' : 'bg-success'} mt-2`}>
                {loading ? 'Đang kết nối...' : supabaseSession ? 'Supabase Connected ✓' : 'Online'}
              </span>
            </div>

            {/* Messages */}
            <div className='flex-fill p-3 p-md-4 overflow-auto' id='messagesContainer'>
              {loading ? (
                <div className='text-center py-5'>
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Đang tải...</span>
                  </div>
                  <p className="mt-3 text-muted">Đang kết nối Supabase...</p>
                </div>
              ) : displayMessages.length === 0 ? (
                <div className='text-center py-4 py-md-5'>
                  <div className='mb-4'>
                    <span className='bg-light rounded-circle p-3 d-inline-flex fs-4'>
                      🎯
                    </span>
                  </div>
                  <h4 className='fw-bold mb-3 text-dark fs-5 fs-md-4 px-2'>
                    {t('welcomeToNextstep') || 'Chào mừng đến với Nextstep!'}
                  </h4>

                  <div className='d-flex flex-wrap justify-content-center gap-2 mt-4 px-2'>
                    {topics.map((topic) => (
                      <button
                        key={topic.id}
                        className='btn btn-outline-secondary rounded-pill px-3 py-2 border'
                        onClick={() => handleTopicSelect(topic)}
                        disabled={sending}
                        style={{ fontSize: "13px", fontWeight: "500" }}
                      >
                        <span className='me-1'>{topic.icon}</span>
                        {topic.name}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  {displayMessages.map((message) => (
                    <div
                      key={message.id}
                      className={`mb-3 mb-md-4 d-flex ${message.type === "user" ? "justify-content-end" : ""}`}
                    >
                      <div
                        className={`d-flex align-items-start ${message.type === "user" ? "flex-row-reverse" : ""}`}
                        style={{ maxWidth: "90%" }}
                      >
                        <div
                          className={`rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 ${message.type === "user" ? "ms-2 ms-md-3 bg-primary" : "me-2 me-md-3 bg-light"
                            }`}
                          style={{ width: "32px", height: "32px" }}
                        >
                          {message.type !== "user" ? (
                            <BsChat size={14} className='text-secondary' />
                          ) : (
                            <div className='text-white fw-bold small'>U</div>
                          )}
                        </div>
                        <div className={`${message.type === "user" ? "text-end" : ""}`}>
                          <div
                            className={`p-2 p-md-3 rounded-4 text-start ${message.type === "user" ? "bg-primary text-white" : "bg-light text-dark"
                              }`}
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
                  ))}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Input Area */}
            <div className='border-top p-2 p-md-4 bg-light'>
              <div className='d-flex align-items-center gap-2'>
                <button
                  className='btn btn-outline-secondary btn-sm d-none d-md-flex align-items-center justify-content-center flex-shrink-0'
                  style={{ width: "40px", height: "40px" }}
                  title="Attach"
                  disabled
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
                    disabled={sending || loading}
                    style={{ fontSize: "16px", height: "40px", borderRadius: "20px" }}
                  />
                </div>
                <button
                  className='btn btn-primary btn-sm d-flex align-items-center justify-content-center flex-shrink-0 rounded-circle'
                  onClick={handleSendMessage}
                  disabled={!messageInput.trim() || sending || loading}
                  style={{ width: "40px", height: "40px" }}
                >
                  {sending ? (
                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                  ) : (
                    <BsSend size={16} />
                  )}
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
