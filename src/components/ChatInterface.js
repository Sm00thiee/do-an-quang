/**
 * ChatInterface Component - UI Only (No Logic)
 */

import React, { useState } from 'react';
import './ChatInterface.css';

const ChatInterface = () => {
  const [inputMessage, setInputMessage] = useState('');

  return (
    <div className="chat-interface">
      <div className="chat-messages">
        <div className="empty-state">
          <div className="empty-icon">💬</div>
          <h3>Chat Interface (UI Only)</h3>
          <p>All logic has been removed. This is just the UI shell.</p>
        </div>
      </div>

      <div className="chat-input-container">
        <input
          type="text"
          className="chat-input"
          placeholder="Type a message..."
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          disabled
        />
        <button className="send-button" disabled>
          Send
        </button>
      </div>
    </div>
  );
};

export default ChatInterface;
