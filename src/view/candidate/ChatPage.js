/**
 * ChatPage Component - Full Functionality with CSV Learning Paths
 * Migrated from CourseAiChat with current UI preserved
 */

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { getFields, getMessages, createMessage, streamChatResponse, submitChatMessage } from '../../services/chatService';
import csvService from '../../services/csvService';
import './ChatPage.css';

const ChatPage = () => {
  const navigate = useNavigate();
  const [sessionId] = useState(() => {
    // Get or create session ID
    const stored = localStorage.getItem('currentSessionId');
    if (stored) return stored;
    const newId = `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 15)}`;
    localStorage.setItem('currentSessionId', newId);
    return newId;
  });

  const [selectedField, setSelectedField] = useState(null);
  const [fields, setFields] = useState([]);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [questionCount, setQuestionCount] = useState(0);
  const messagesEndRef = useRef(null);

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

  const handleBackToHome = () => {
    navigate('/');
  };

  const handleFieldSelect = (field) => {
    setSelectedField(field);
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;
    
    // Check question limit
    if (questionCount >= 10) {
      alert('Bạn đã hết lượt hỏi (10 câu hỏi/phiên). Vui lòng bắt đầu phiên mới.');
      return;
    }

    const userMessage = inputMessage.trim();
    setInputMessage('');
    setIsLoading(true);

    try {
      // Save user message
      const userMsg = await createMessage(sessionId, 'user', userMessage);
      setMessages(prev => [...prev, userMsg]);
      setQuestionCount(prev => prev + 1);

      // Submit to service (handles CSV vs AI routing)
      const response = await submitChatMessage(sessionId, userMessage, selectedField?.id);

      // Check if it's a CSV response
      if (response.isCSVResponse) {
        console.log('[ChatPage] Got CSV learning path response');
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
          console.log('[ChatPage] Stream completed:', data);
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
          console.error('[ChatPage] Stream error:', error);
          setMessages(prev =>
            prev.map(m =>
              m.id === tempMsgId
                ? { ...m, content: `❌ Lỗi: ${error}` }
                : m
            )
          );
          setIsLoading(false);
        }
      );
    } catch (error) {
      console.error('[ChatPage] Error sending message:', error);
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

  return (
    <div className="chat-page">
      <header className="chat-header">
        <button
          onClick={handleBackToHome}
          className="back-button touch-target"
        >
          ← Về trang chủ
        </button>
        <div className="header-info">
          <h1>Trò chuyện AI Khóa học</h1>
          {selectedField && (
            <span className="field-indicator">{selectedField.name}</span>
          )}
        </div>
      </header>

      <main className="chat-main">
        {!selectedField ? (
          <div className="field-selection">
            <h2>Chọn lĩnh vực bạn quan tâm</h2>
            <div className="field-grid">
              {fields.map(field => (
                <button
                  key={field.id}
                  className="field-card"
                  onClick={() => handleFieldSelect(field)}
                >
                  <h3>{field.name}</h3>
                  <p>{field.description}</p>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            <div className="chat-messages">
              {messages.length === 0 && (
                <div className="empty-state">
                  <div className="empty-icon">💬</div>
                  <h3>Bắt đầu trò chuyện</h3>
                  <p>Hỏi tôi về lộ trình học {selectedField.name} hoặc bất kỳ câu hỏi nào!</p>
                  <p className="question-counter">Còn lại: {10 - questionCount}/10 câu hỏi</p>
                </div>
              )}
              
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`message ${msg.role === 'user' ? 'message-user' : 'message-assistant'}`}
                >
                  <div className="message-content">
                    {msg.role === 'assistant' ? (
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {msg.content}
                      </ReactMarkdown>
                    ) : (
                      <p>{msg.content}</p>
                    )}
                  </div>
                  <div className="message-time">
                    {new Date(msg.created_at).toLocaleTimeString('vi-VN', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="message message-assistant">
                  <div className="message-content">
                    <div className="typing-indicator">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            <div className="chat-input-container">
              <div className="question-counter-inline">
                {10 - questionCount}/10 câu hỏi
              </div>
              <textarea
                className="chat-input"
                placeholder="Nhập câu hỏi của bạn..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isLoading || questionCount >= 10}
                rows={1}
              />
              <button
                className="send-button"
                onClick={handleSendMessage}
                disabled={isLoading || !inputMessage.trim() || questionCount >= 10}
              >
                {isLoading ? '...' : '➤'}
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default ChatPage;

