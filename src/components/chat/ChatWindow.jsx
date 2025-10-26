// src/components/chat/ChatWindow.jsx
import React, { useState, useRef, useEffect } from "react";
import MessageBubble from "./MessageBubble";
import TypingIndicator from "./TypingIndicator";
import styles from "./Chat.module.css";

const ChatWindow = ({ messages, onSendMessage, onTyping, typing, onClose }) => {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);

  const handleSend = () => {
    onSendMessage(input);
    setInput("");
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  return (
    <div className={styles.chatWindow}>
      <div className={styles.chatHeader}>
        <span>AgroLink Chat</span>
        <button className={styles.closeButton} onClick={onClose}>
          ✕
        </button>
      </div>

      <div className={styles.chatMessages}>
        {messages.map((msg, idx) => (
          <MessageBubble key={idx} sender={msg.sender} text={msg.text} />
        ))}
        {typing && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>

      <div className={styles.chatInputContainer}>
        <input
          type="text"
          className={styles.chatInput}
          placeholder="Type your message..."
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            onTyping();
          }}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
        />
        <button className={styles.sendButton} onClick={handleSend}>
          Send
        </button>
      </div>
    </div>
  );
};

export default ChatWindow;
