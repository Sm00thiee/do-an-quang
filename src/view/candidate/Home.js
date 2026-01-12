import { useState, useRef, useEffect } from "react";
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
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { getFields, getMessages, createMessage, streamChatResponse, submitChatMessage } from '../../services/chatService';
import { getAllChatSessions, deleteChatSession, deleteAllChatSessions, createSession, generateSessionId, storeSessionId } from '../../services/sessionService';
import csvService from '../../services/csvService';

function Home() {
  const { t } = useTranslation();

  // Session management
  const [sessionId] = useState(() => {
    const stored = localStorage.getItem('currentSessionId');
    if (stored) return stored;
    const newId = `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 15)}`;
    localStorage.setItem('currentSessionId', newId);
    return newId;
  });

  // Chat state
  const [selectedField, setSelectedField] = useState(null);
  const [fields, setFields] = useState([]);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [questionCount, setQuestionCount] = useState(0);

  // UI state
  const [chatSessions, setChatSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [messageInput, setMessageInput] = useState("");
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const messagesEndRef = useRef(null);

  // Load all chat sessions on mount
  useEffect(() => {
    const loadChatSessions = async () => {
      try {
        const sessions = await getAllChatSessions();
        setChatSessions(sessions || []);
        
        // If we have a current sessionId and it exists in the list, set it as active
        if (sessionId && sessions.some(s => s.session_id === sessionId)) {
          setActiveSession(sessionId);
        } else if (sessions.length > 0) {
          setActiveSession(sessions[0].session_id);
        }
      } catch (error) {
        console.error('Error loading chat sessions:', error);
      }
    };
    loadChatSessions();
  }, [sessionId]);

  // Load fields on mount
  useEffect(() => {
    const loadFields = async () => {
      try {
        const fieldsData = await getFields();
        setFields(fieldsData || []);
      } catch (error) {
        console.error('Error loading fields:', error);
      }
    };
    loadFields();
  }, []);

  // Load messages when session changes
  useEffect(() => {
    const loadMessages = async () => {
      try {
        const msgs = await getMessages(sessionId);
        setMessages(msgs || []);
        setQuestionCount(msgs.filter(m => m.role === 'user').length);
      } catch (error) {
        console.error('Error loading messages:', error);
      }
    };
    if (sessionId) {
      loadMessages();
    }
  }, [sessionId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Map fields to topics for UI display
  const topics = fields.length > 0 
    ? fields.map(field => ({
        id: field.id,
        name: field.name,
        icon: field.icon || "📚"
      }))
    : [
        { id: "marketing", name: "Marketing", icon: "📊" },
        { id: "design", name: "Design", icon: "🎨" },
        { id: "development", name: "Development", icon: "💻" },
        { id: "digital-marketing", name: "Digital Marketing", icon: "📱" },
        { id: "ui-ux", name: "UI/UX Design", icon: "🎨" },
        { id: "graphic", name: "Graphic Design", icon: "🖼️" },
      ];

  // Convert messages for display
  const displayMessages = messages.map(msg => ({
    id: msg.id,
    type: msg.role === 'user' ? 'user' : 'bot',
    content: msg.content,
    time: new Date(msg.created_at).toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }));

  // Handle send message
  const handleSendMessage = async () => {
    if (!messageInput.trim() || isLoading) return;
    
    // Check question limit
    if (questionCount >= 10) {
      alert('Bạn đã hết lượt hỏi (10 câu hỏi/phiên). Vui lòng bắt đầu phiên mới.');
      return;
    }

    const userMessage = messageInput.trim();
    setMessageInput('');
    setIsLoading(true);

    try {
      // Save user message
      const userMsg = await createMessage(sessionId, 'user', userMessage);
      setMessages(prev => [...prev, userMsg]);
      setQuestionCount(prev => prev + 1);

      // Submit to service (handles CSV vs AI routing)
      const response = await submitChatMessage(
        sessionId, 
        userMessage, 
        selectedField?.id, 
        selectedField?.name,
        messages.map(m => ({ role: m.role, content: m.content }))
      );

      // Check if it's a CSV response
      if (response.isCSVResponse) {
        console.log('[Home] Got CSV learning path response');
        const learningPath = response.learningPaths[0];
        const formattedResponse = csvService.formatLearningPathForDisplay(learningPath);
        
        // Save AI message with formatted learning path
        const aiMsg = await createMessage(sessionId, 'assistant', formattedResponse);
        setMessages(prev => [...prev, aiMsg]);
        setIsLoading(false);
        return;
      }

      // Stream AI response
      let fullResponse = '';
      const tempMsgId = `temp-${Date.now()}`;
      const tempMsg = {
        id: tempMsgId,
        role: 'assistant',
        content: '',
        created_at: new Date().toISOString()
      };
      setMessages(prev => [...prev, tempMsg]);

      await streamChatResponse(
        sessionId,
        userMessage,
        selectedField?.id,
        (chunk) => {
          fullResponse += chunk;
          setMessages(prev =>
            prev.map(m =>
              m.id === tempMsgId ? { ...m, content: fullResponse } : m
            )
          );
        },
        async (data) => {
          console.log('[Home] Stream completed:', data);
          // Replace temp message with real one
          const aiMsg = await createMessage(sessionId, 'assistant', fullResponse);
          setMessages(prev =>
            prev.map(m =>
              m.id === tempMsgId ? aiMsg : m
            )
          );
          setIsLoading(false);
        },
        (error) => {
          console.error('[Home] Stream error:', error);
          setMessages(prev =>
            prev.map(m =>
              m.id === tempMsgId
                ? { ...m, content: `❌ Lỗi: ${error}` }
                : m
            )
          );
          setIsLoading(false);
        },
        selectedField?.name,
        messages.map(m => ({ role: m.role, content: m.content }))
      );
    } catch (error) {
      console.error('[Home] Error sending message:', error);
      const errorMsg = await createMessage(
        sessionId,
        'assistant',
        `❌ Xin lỗi, đã có lỗi xảy ra: ${error.message}`
      );
      setMessages(prev => [...prev, errorMsg]);
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleTopicClick = (topic) => {
    const field = fields.find(f => f.id === topic.id);
    if (field) {
      setSelectedField(field);
    }
  };

  // Handle creating a new chat session
  const handleCreateNewChat = async () => {
    try {
      if (!selectedField) {
        alert('Vui lòng chọn lĩnh vực học tập trước');
        return;
      }

      // Create new session
      const newSessionId = generateSessionId();
      const newSession = await createSession(selectedField.id);
      
      if (newSession) {
        // Store and set as active
        storeSessionId(newSessionId);
        
        // Reload chat sessions list
        const sessions = await getAllChatSessions();
        setChatSessions(sessions || []);
        setActiveSession(newSessionId);
        
        // Clear messages
        setMessages([]);
        setQuestionCount(0);
        
        // Close mobile sidebar if open
        if (window.innerWidth < 992) setShowMobileSidebar(false);
      }
    } catch (error) {
      console.error('Error creating new chat:', error);
      alert('Không thể tạo chat mới: ' + error.message);
    }
  };

  // Handle deleting a chat session
  const handleDeleteChat = async (e, session) => {
    e.stopPropagation(); // Prevent triggering the session click
    
    if (!window.confirm('Bạn có chắc chắn muốn xóa cuộc trò chuyện này?')) {
      return;
    }
    
    try {
      console.log('[Home] Deleting chat session:', session.id);
      await deleteChatSession(session.id);
      
      // Remove from local state
      setChatSessions(prev => prev.filter(s => s.id !== session.id));
      
      // If deleted session was active, switch to another or clear
      if (activeSession === session.session_id) {
        const remaining = chatSessions.filter(s => s.id !== session.id);
        if (remaining.length > 0) {
          setActiveSession(remaining[0].session_id);
        } else {
          setActiveSession(null);
          setMessages([]);
          setQuestionCount(0);
        }
      }
    } catch (error) {
      console.error('[Home] Delete exception:', error);
      alert('Đã xảy ra lỗi khi xóa cuộc trò chuyện');
    }
  };

  // Handle deleting all chat sessions
  const handleDeleteAllChats = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa TẤT CẢ cuộc trò chuyện? Hành động này không thể hoàn tác!')) {
      return;
    }
    
    try {
      console.log('[Home] Deleting all chat sessions');
      const result = await deleteAllChatSessions();
      
      console.log('[Home] Deleted', result.count, 'chat sessions');
      
      // Clear all local state
      setChatSessions([]);
      setActiveSession(null);
      setMessages([]);
      setQuestionCount(0);
      setSelectedField(null);
      
      alert(`Đã xóa thành công ${result.count} cuộc trò chuyện`);
    } catch (error) {
      console.error('[Home] Delete all exception:', error);
      alert('Đã xảy ra lỗi khi xóa tất cả cuộc trò chuyện');
    }
  };

  // Handle switching chat sessions
  const handleSwitchSession = async (session) => {
    try {
      setActiveSession(session.session_id);
      
      // Load messages for this session
      const msgs = await getMessages(session.session_id);
      setMessages(msgs || []);
      setQuestionCount(session.question_count || msgs.filter(m => m.role === 'user').length);
      
      // Set the field if available
      if (session.field) {
        setSelectedField(session.field);
      }
      
      // Close mobile sidebar if open
      if (window.innerWidth < 992) setShowMobileSidebar(false);
    } catch (error) {
      console.error('Error switching session:', error);
    }
  };

  // Format session name for display
  const getSessionName = (session) => {
    if (session.messages && session.messages.length > 0) {
      const firstUserMessage = session.messages.find(m => m.role === 'user');
      if (firstUserMessage) {
        return firstUserMessage.content.substring(0, 30) + (firstUserMessage.content.length > 30 ? '...' : '');
      }
    }
    return session.field ? `${session.field.name} Chat` : 'Chat Mới';
  };

  // Sidebar Content (UI only - no logic)
  const SidebarContent = () => (
    <div className='d-flex flex-column h-100 text-white p-3' style={{ backgroundColor: '#1E293B' }}>
      <div className='d-flex justify-content-between align-items-center mb-3'>
        <div className='d-flex align-items-center'>
          <BsChat className='me-2' size={18} />
          <span className='fw-bold'>Chat bot</span>
        </div>
        <small className='text-muted'>by Nextstep AI</small>
      </div>

      <div className='d-flex gap-2 mb-3'>
        <button
          className='btn btn-outline-light btn-sm flex-fill d-flex align-items-center justify-content-center'
          onClick={handleCreateNewChat}
        >
          <BsPlus className='me-2' />
          {t('newChat') || 'Tạo chat mới'}
        </button>
        <button
          className='btn btn-outline-danger btn-sm d-flex align-items-center justify-content-center'
          onClick={handleDeleteAllChats}
          title='Xóa tất cả chat'
          style={{ minWidth: '40px' }}
        >
          <BsTrash />
        </button>
      </div>

      <div className='flex-fill overflow-auto custom-scrollbar'>
        {chatSessions.map((session) => (
          <div
            key={session.id}
            className={`d-flex justify-content-between align-items-center p-3 rounded mb-2 cursor-pointer ${activeSession === session.session_id
              ? "bg-secondary"
              : "bg-transparent hover-bg-secondary"
              }`}
            style={{ cursor: "pointer" }}
            onClick={() => handleSwitchSession(session)}
          >
            <span
              className='text-truncate'
              style={{ fontSize: "14px", maxWidth: "160px" }}
              title={getSessionName(session)}
            >
              {getSessionName(session)}
            </span>
            <button
              className='btn btn-sm text-white p-0 opacity-75 hover-opacity-100'
              onClick={(e) => handleDeleteChat(e, session)}
              title="Xóa chat"
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
              {selectedField && (
                <span className='badge bg-primary mt-2'>
                  {selectedField.name}
                </span>
              )}
              {!selectedField && (
                <span className='badge bg-secondary mt-2'>
                  Chọn lĩnh vực để bắt đầu
                </span>
              )}
            </div>

            {/* Messages */}
            <div className='flex-fill p-3 p-md-4 overflow-auto' id='messagesContainer'>
              {displayMessages.length === 0 ? (
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
                        onClick={() => handleTopicClick(topic)}
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
                            {message.type !== "user" ? (
                              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {message.content}
                              </ReactMarkdown>
                            ) : (
                              message.content
                            )}
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

              {/* Loading indicator */}
              {isLoading && (
                <div className='mb-3 mb-md-4 d-flex'>
                  <div className='d-flex align-items-start' style={{ maxWidth: "90%" }}>
                    <div
                      className='rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 me-2 me-md-3 bg-light'
                      style={{ width: "32px", height: "32px" }}
                    >
                      <BsChat size={14} className='text-secondary' />
                    </div>
                    <div>
                      <div className='p-2 p-md-3 rounded-4 text-start bg-light text-dark' style={{ fontSize: "14px" }}>
                        <div className="d-flex gap-1">
                          <span className="spinner-grow spinner-grow-sm" role="status"></span>
                          <span className="spinner-grow spinner-grow-sm" role="status"></span>
                          <span className="spinner-grow spinner-grow-sm" role="status"></span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
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
                    placeholder={selectedField ? "Nhập tin nhắn..." : "Chọn lĩnh vực trước..."}
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    disabled={isLoading || !selectedField || questionCount >= 10}
                    style={{ fontSize: "16px", height: "40px", borderRadius: "20px" }}
                  />
                </div>
                <button
                  className='btn btn-primary btn-sm d-flex align-items-center justify-content-center flex-shrink-0 rounded-circle'
                  onClick={handleSendMessage}
                  disabled={isLoading || !messageInput.trim() || !selectedField || questionCount >= 10}
                  style={{ width: "40px", height: "40px" }}
                >
                  <BsSend size={16} />
                </button>
              </div>
              {selectedField && (
                <div className='text-center mt-2'>
                  <small className='text-muted'>
                    Còn lại: {10 - questionCount}/10 câu hỏi
                  </small>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Home;
