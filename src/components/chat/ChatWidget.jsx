// src/components/chat/ChatWidget.jsx
import React, { useState } from "react";
import ChatWindow from "./ChatWindow";
import styles from "./Chat.module.css";

const ChatWidget = ({ messages, onSendMessage, onTyping, typing }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={styles.chatWidget}>
      {!isOpen ? (
        <button
          className={styles.chatButton}
          onClick={() => setIsOpen(true)}
          aria-label="Open chat"
        >
          💬
        </button>
      ) : (
        <ChatWindow
          messages={messages}
          onSendMessage={onSendMessage}
          onTyping={onTyping}
          typing={typing}
          onClose={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default ChatWidget;
