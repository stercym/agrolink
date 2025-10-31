import React from "react";
import styles from "./Chat.module.css";

const MessageBubble = ({ sender, text }) => {
  const bubbleClass =
    sender === "user"
      ? `${styles.messageBubble} ${styles.userBubble}`
      : `${styles.messageBubble} ${styles.otherBubble}`;

  return <div className={bubbleClass}>{text}</div>;
};

export default MessageBubble;
