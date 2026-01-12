/**
 * HOME.JS - EXAMPLE INTEGRATION WITH AI CHATBOT
 * 
 * Đây là ví dụ cách tích hợp AI Chatbot vào component Home.js hiện tại
 * Bạn có thể copy toàn bộ hoặc một phần code này vào Home.js
 */

import { useState, useEffect, useRef } from "react";
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

// Import AI Chatbot hook
import useAIChatbot from "../../hooks/useAIChatbot";

function HomeWithAIChatbot() {
    const { t } = useTranslation();

    // ===========================================================================
    // AI CHATBOT INTEGRATION - Sử dụng custom hook
    // ===========================================================================
    const {
        session,
        messages: aiMessages,
        fields,
        loading: aiLoading,
        sending: aiSending,
        error: aiError,
        questionLimit,
        streamingMessage,
        sendMessage: sendAIMessage,
        resetSession
    } = useAIChatbot(); // Sử dụng hook thay vì mock data

    // ===========================================================================
    // LOCAL STATE - Giữ nguyên state management hiện tại
    // ===========================================================================
    const [chatSessions, setChatSessions] = useState(() => {
        // Load from localStorage on mount
        const saved = localStorage.getItem('chatSessions');
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                console.error('Error parsing saved sessions:', e);
            }
        }
        // Default first session
        return [{
            id: Date.now().toString(),
            name: "Chat mới",
            messages: [],
            sessionId: session?.session_id || null,
            createdAt: new Date().toISOString()
        }];
    });
    const [activeSession, setActiveSession] = useState(() => {
        const saved = localStorage.getItem('activeSession');
        if (saved && saved !== 'null') return saved;
        return chatSessions[0]?.id || Date.now().toString();
    });
    const [messageInput, setMessageInput] = useState("");
    const [showMobileSidebar, setShowMobileSidebar] = useState(false);
    const messagesEndRef = useRef(null);

    // ===========================================================================
    // EFFECTS
    // ===========================================================================

    // Scroll to bottom khi có tin nhắn mới
    useEffect(() => {
        scrollToBottom();
    }, [aiMessages, streamingMessage]);

    // Sync AI messages với local chat sessions
    useEffect(() => {
        if (aiMessages.length > 0) {
            setChatSessions(prev => {
                const updated = prev.map(s => {
                    if (s.id === activeSession) {
                        const convertedMessages = convertAIMessagesToLocal(aiMessages);
                        // Auto-generate name from first user message
                        const firstUserMsg = aiMessages.find(m => m.role === 'user');
                        const autoName = firstUserMsg 
                            ? firstUserMsg.content.substring(0, 30) + (firstUserMsg.content.length > 30 ? '...' : '')
                            : s.name;
                        
                        return {
                            ...s,
                            messages: convertedMessages,
                            name: s.name === "Chat mới" ? autoName : s.name,
                            sessionId: session?.session_id
                        };
                    }
                    return s;
                });
                localStorage.setItem('chatSessions', JSON.stringify(updated));
                return updated;
            });
        }
    }, [aiMessages, activeSession, session]);

    // Save active session to localStorage
    useEffect(() => {
        localStorage.setItem('activeSession', activeSession);
    }, [activeSession]);

    // Initialize first session with current AI session
    useEffect(() => {
        if (session?.session_id && chatSessions.length > 0) {
            setChatSessions(prev => {
                const firstSession = prev[0];
                if (!firstSession.sessionId) {
                    const updated = [{
                        ...firstSession,
                        sessionId: session.session_id
                    }, ...prev.slice(1)];
                    localStorage.setItem('chatSessions', JSON.stringify(updated));
                    return updated;
                }
                return prev;
            });
        }
    }, [session?.session_id]);

    // ===========================================================================
    // HELPER FUNCTIONS
    // ===========================================================================

    /**
     * Chuyển đổi AI messages sang format local
     */
    const convertAIMessagesToLocal = (messages) => {
        return messages.map(msg => ({
            id: msg.id,
            type: msg.role, // 'user' hoặc 'assistant'
            content: msg.content,
            time: new Date(msg.created_at).toLocaleTimeString("vi-VN", {
                hour: "2-digit",
                minute: "2-digit",
            })
        }));
    };

    /**
     * Scroll to bottom of messages
     */
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    // ===========================================================================
    // HANDLERS - Được cập nhật để sử dụng AI
    // ===========================================================================

    /**
     * Xử lý gửi tin nhắn - SỬ DỤNG AI
     */
    const handleSendMessage = async () => {
        if (!messageInput.trim()) return;

        // Kiểm tra question limit
        if (!questionLimit) {
            alert(t('questionLimitReached') || 'Bạn đã hết lượt hỏi cho session này');
            return;
        }

        const userMessageContent = messageInput;
        setMessageInput("");

        try {
            // Gửi tin nhắn đến AI
            await sendAIMessage(userMessageContent);
        } catch (error) {
            console.error('Error sending message:', error);
            alert(t('errorSendingMessage') || 'Có lỗi khi gửi tin nhắn');
        }
    };

    /**
     * Xử lý chọn topic
     */
    const handleTopicSelect = async (topic) => {
        const welcomeMessage = `${t('chatWelcome')} ${topic.name} ${topic.icon}

${t('growingField')}

${t('wantToExplore')} ${topic.name} không?`;

        try {
            await sendAIMessage(welcomeMessage);
        } catch (error) {
            console.error('Error selecting topic:', error);
        }
    };

    /**
     * Xử lý tạo chat mới
     */
    const addNewChat = async () => {
        try {
            await resetSession(); // Tạo session mới

            const newSession = {
                id: Date.now().toString(),
                name: `Chat mới`,
                messages: [],
                sessionId: null, // Will be set when messages are synced
                createdAt: new Date().toISOString()
            };

            setChatSessions(prev => {
                const updated = [newSession, ...prev]; // Add to beginning
                localStorage.setItem('chatSessions', JSON.stringify(updated));
                return updated;
            });
            setActiveSession(newSession.id);

            if (window.innerWidth < 992) setShowMobileSidebar(false);
        } catch (error) {
            console.error('Error creating new chat:', error);
        }
    };

    /**
     * Xử lý xóa chat
     */
    const deleteChat = (sessionId) => {
        if (chatSessions.length <= 1) {
            alert('Không thể xóa chat cuối cùng!');
            return;
        }

        setChatSessions(prev => {
            const filtered = prev.filter(s => s.id !== sessionId);
            if (sessionId === activeSession && filtered.length > 0) {
                setActiveSession(filtered[0].id);
            }
            localStorage.setItem('chatSessions', JSON.stringify(filtered));
            return filtered;
        });
    };

    /**
     * Xử lý xóa tất cả chat
     */
    const deleteAllChats = async () => {
        if (window.confirm('Bạn có chắc chắn muốn xóa tất cả lịch sử chat?')) {
            try {
                // Reset to single new chat
                await resetSession();
                const newSession = {
                    id: Date.now().toString(),
                    name: "Chat mới",
                    messages: [],
                    sessionId: null,
                    createdAt: new Date().toISOString()
                };
                setChatSessions([newSession]);
                setActiveSession(newSession.id);
                localStorage.setItem('chatSessions', JSON.stringify([newSession]));
                localStorage.setItem('activeSession', newSession.id);
            } catch (error) {
                console.error('Error deleting all chats:', error);
            }
        }
    };

    /**
     * Xử lý Enter key
     */
    const handleKeyPress = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    // ===========================================================================
    // TOPICS - Có thể được thay thế bằng fields từ AI
    // ===========================================================================

    const topics = fields.length > 0
        ? fields.map(field => ({
            id: field.id,
            name: field.name,
            icon: "📚", // Có thể thêm icon mapping
        }))
        : [
            { id: "marketing", name: t('marketing'), icon: "📊" },
            { id: "digital-marketing", name: t('digitalMarketing'), icon: "💻" },
            { id: "ui-ux", name: t('uiuxDesign'), icon: "🎨" },
            { id: "graphic-design", name: t('graphicDesign'), icon: "🖌️" },
            { id: "mobile-dev", name: t('mobileAppDev'), icon: "📱" },
            { id: "communication", name: t('communicationSkills'), icon: "💬" },
            { id: "content-creation", name: t('contentCreation'), icon: "✍️" },
        ];

    // ===========================================================================
    // RENDER
    // ===========================================================================

    const currentSession = chatSessions.find(s => s.id === activeSession);
    const displayMessages = currentSession?.messages || [];

    // Sidebar Content Component
    const SidebarContent = () => (
        <div className='d-flex flex-column h-100 text-white p-3' style={{ backgroundColor: '#1E293B' }}>
            <div className='d-flex justify-content-between align-items-center mb-3'>
                <div className='d-flex align-items-center'>
                    <BsChat className='me-2' size={18} />
                    <span className='fw-bold'>Chat bot</span>
                </div>
                <small className='text-muted'>by Nextstep AI</small>
            </div>

            {/* Session Info */}
            {session && (
                <div className='mb-2 p-2 bg-secondary bg-opacity-25 rounded'>
                    <small className='text-muted'>Session: {session.session_id?.substring(0, 8)}...</small>
                    <br />
                    <small className='text-muted'>
                        Questions: {questionLimit ? '✅' : '❌ Limit reached'}
                    </small>
                </div>
            )}

            <div className='d-flex gap-2 mb-3'>
                <button
                    className='btn btn-outline-light btn-sm flex-fill d-flex align-items-center justify-content-center'
                    onClick={addNewChat}
                    disabled={aiLoading}
                >
                    <BsPlus className='me-2' />
                    {t('newChat') || 'Tạo chat mới'}
                </button>
                <button
                    className='btn btn-outline-danger btn-sm d-flex align-items-center justify-content-center'
                    onClick={deleteAllChats}
                    title="Xóa tất cả chat"
                    style={{ minWidth: '40px' }}
                >
                    <BsTrash />
                </button>
            </div>

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
        .streaming-indicator {
          display: inline-block;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #22c55e;
          animation: pulse 1.5s ease-in-out infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        @media (max-width: 991.98px) {
          .chat-layout { height: calc(100vh - 56px) !important; }
        }
      `}</style>

            {/* Chat Interface Section */}
            <div className='container-fluid p-0 chat-layout' style={{ height: 'calc(100vh - 57px)' }}>
                <div className='d-flex h-100'>

                    {/* Desktop Sidebar */}
                    <div className='d-none d-lg-block' style={{ width: "320px", minWidth: "320px" }}>
                        <SidebarContent />
                    </div>

                    {/* Mobile Sidebar (Offcanvas) */}
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
                                Nextstep AI Chatbot
                            </h5>
                            <p className='text-muted mb-0 small contact-subtitle d-none d-md-block'>
                                Người Bạn Đồng Hành AI Định Hướng Sự Nghiệp
                            </p>
                            <span className={`badge ${aiLoading ? 'bg-warning' : 'bg-success'} mt-2`}>
                                {aiLoading ? 'Initializing...' : 'Online'}
                            </span>
                        </div>

                        {/* Messages */}
                        <div
                            className='flex-fill p-3 p-md-4 overflow-auto'
                            id='messagesContainer'
                        >
                            {/* Show error if any */}
                            {aiError && (
                                <div className="alert alert-danger" role="alert">
                                    {aiError}
                                </div>
                            )}

                            {/* Loading state */}
                            {aiLoading && displayMessages.length === 0 ? (
                                <div className='text-center py-5'>
                                    <div className="spinner-border text-primary" role="status">
                                        <span className="visually-hidden">Loading...</span>
                                    </div>
                                    <p className="mt-3 text-muted">Đang khởi tạo phiên chat...</p>
                                </div>
                            ) : displayMessages.length === 0 ? (
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
                                                disabled={aiSending || !questionLimit}
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

                                    {/* Streaming message */}
                                    {streamingMessage && (
                                        <div className='mb-3 mb-md-4 d-flex'>
                                            <div className='d-flex align-items-start' style={{ maxWidth: "90%" }}>
                                                <div
                                                    className='rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 me-2 me-md-3 bg-light'
                                                    style={{ width: "32px", height: "32px" }}
                                                >
                                                    <BsChat size={14} className='text-secondary' />
                                                </div>
                                                <div>
                                                    <div
                                                        className='p-2 p-md-3 rounded-4 text-start bg-light text-dark'
                                                        style={{ whiteSpace: "pre-line", fontSize: "14px", lineHeight: "1.5" }}
                                                    >
                                                        {streamingMessage}
                                                        <span className="streaming-indicator ms-2"></span>
                                                    </div>
                                                    <small className='text-muted d-block mt-1' style={{ fontSize: "11px" }}>
                                                        Đang trả lời...
                                                    </small>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div ref={messagesEndRef} />
                                </>
                            )}
                        </div>

                        {/* Input Area */}
                        <div className='border-top p-2 p-md-4 bg-light'>
                            {/* Question limit warning */}
                            {!questionLimit && (
                                <div className="alert alert-warning mb-2 py-2 px-3 small" role="alert">
                                    ⚠️ Bạn đã hết lượt hỏi cho session này. Vui lòng tạo chat mới.
                                </div>
                            )}

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
                                        disabled={aiSending || !questionLimit}
                                        style={{ fontSize: "16px", height: "40px", borderRadius: "20px" }}
                                    />
                                </div>
                                <button
                                    className='btn btn-outline-secondary btn-sm d-none d-md-flex align-items-center justify-content-center flex-shrink-0'
                                    style={{ width: "40px", height: "40px" }}
                                    disabled
                                >
                                    <BsMic size={16} />
                                </button>
                                <button
                                    className='btn btn-primary btn-sm d-flex align-items-center justify-content-center flex-shrink-0 rounded-circle'
                                    onClick={handleSendMessage}
                                    disabled={!messageInput.trim() || aiSending || !questionLimit}
                                    style={{ width: "40px", height: "40px" }}
                                >
                                    {aiSending ? (
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

export default HomeWithAIChatbot;
