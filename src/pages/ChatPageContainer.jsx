// src/pages/ChatPageContainer.jsx
import React, { useEffect, useState } from "react";

import ChatWidget from "../components/chat/ChatWidget";

//const socket = io("http://localhost:5000", { transports: ["websocket"] });

const ChatPageContainer = () => {
  const [messages, setMessages] = useState([]);
  const [typing, setTyping] = useState(false);

  useEffect(() => {
    // Listen for messages from server
    ("receive_message", (msg) => {
      setMessages((prev) => [...prev, { sender: "other", text: msg }]);
    });

    // Listen for typing event
    ("user_typing", () => {
      setTyping(true);
      setTimeout(() => setTyping(false), 1500);
    });

    return () => {
      ("receive_message");
      ("user_typing");
    };
  }, []);

  const sendMessage = (text) => {
    if (text.trim() === "") return;
    setMessages((prev) => [...prev, { sender: "user", text }]);
    ("send_message", text);
  };

  const handleTyping = () => {
    ("typing");
  };

  return (
    <div style={{ padding: "20px" }}>
      <ChatWidget
        messages={messages}
        onSendMessage={sendMessage}
        onTyping={handleTyping}
        typing={typing}
      />
    </div>
  );
};

export default ChatPageContainer;
