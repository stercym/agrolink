import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Minimize2 } from 'lucide-react';
import ChatWindow from "./ChatWindow";
import io from 'socket.io-client';
import styles from "./Chat.module.css";

export default function ChatWidget({ targetUserId = null, orderId = null }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [currentRoom, setCurrentRoom] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const connectSocket = () => {
    const token = localStorage.getItem('authToken');
    if (!token) return;

    const newSocket = io('http://localhost:5000', {
      auth: { token }
    });

    newSocket.on('connect', () => {
      setIsConnected(true);
      // Join appropriate chat room
      if (orderId) {
        newSocket.emit('join_chat', { order_id: orderId });
      } else if (targetUserId) {
        newSocket.emit('join_chat', { other_user_id: targetUserId });
      }
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
      setCurrentRoom(null);
    });

    newSocket.on('connected', (data) => {
      console.log('Connected as:', data.user_name);
    });

    newSocket.on('joined_chat', (data) => {
      setCurrentRoom(data.room_id);
      setMessages(data.messages || []);
    });

    newSocket.on('new_message', (message) => {
      setMessages(prev => [...prev, message]);
    });

    newSocket.on('user_typing', (data) => {
      if (data.is_typing) {
        setTypingUsers(prev => {
          if (!prev.includes(data.user_name)) {
            return [...prev, data.user_name];
          }
          return prev;
        });
      } else {
        setTypingUsers(prev => prev.filter(name => name !== data.user_name));
      }
    });

    newSocket.on('error', (error) => {
      console.error('Socket error:', error.message);
      alert(error.message);
    });

    setSocket(newSocket);
  };

  const disconnectSocket = () => {
    if (socket) {
      if (currentRoom) {
        socket.emit('leave_chat', { room_id: currentRoom });
      }
      socket.disconnect();
      setSocket(null);
      setIsConnected(false);
      setCurrentRoom(null);
    }
  };

  const sendMessage = () => {
    if (!socket || !newMessage.trim() || !currentRoom) return;

    const messageData = {
      room_id: currentRoom,
      content: newMessage,
      order_id: orderId
    };

    socket.emit('send_message', messageData);
    setNewMessage('');
    
    // Stop typing indicator
    if (isTyping) {
      socket.emit('typing', { room_id: currentRoom, is_typing: false });
      setIsTyping(false);
    }
  };

  const handleTyping = (e) => {
    setNewMessage(e.target.value);
    
    if (!socket || !currentRoom) return;
    
    if (!isTyping) {
      setIsTyping(true);
      socket.emit('typing', { room_id: currentRoom, is_typing: true });
    }
    
    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Set timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      if (socket && currentRoom) {
        socket.emit('typing', { room_id: currentRoom, is_typing: false });
        setIsTyping(false);
      }
    }, 1000);
  };

  const toggleChat = () => {
    if (!isOpen) {
      setIsOpen(true);
      connectSocket();
    } else {
      setIsOpen(false);
      disconnectSocket();
    }
  };

  const getChatTitle = () => {
    if (orderId) return `Order #${orderId} Chat`;
    if (targetUserId) return 'Direct Message';
    return 'Support Chat';
  };

  return (
    <>
      {/* Chat Widget Button */}
      <button
        onClick={toggleChat}
        className={styles.chatButton}
        aria-label="Open chat"
      >
        <MessageCircle size={24} />
        {!isOpen && messages.length > 0 && (
          <span className={styles.unreadBadge}>{messages.length}</span>
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className={`${styles.chatWindow} ${isMinimized ? styles.minimized : ''}`}>
          {/* Chat Header */}
          <div className={styles.chatHeader}>
            <h3>{getChatTitle()}</h3>
            <div className={styles.headerActions}>
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className={styles.actionButton}
                aria-label="Minimize chat"
              >
                <Minimize2 size={16} />
              </button>
              <button
                onClick={toggleChat}
                className={styles.actionButton}
                aria-label="Close chat"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Connection Status */}
              <div className={`${styles.connectionStatus} ${isConnected ? styles.connected : styles.disconnected}`}>
                {isConnected ? (currentRoom ? 'Connected' : 'Joining chat...') : 'Connecting...'}
              </div>

              {/* Messages */}
              <div className={styles.messagesContainer}>
                {messages.length === 0 ? (
                  <div className={styles.welcomeMessage}>
                    <p>Welcome to AgroLink Chat!</p>
                    <p>Start a conversation below.</p>
                  </div>
                ) : (
                  messages.map((message, index) => (
                    <div key={message.id || index} className={styles.message}>
                      <div className={styles.messageHeader}>
                        <span className={styles.senderName}>{message.sender_name}</span>
                        <span className={styles.messageTime}>
                          {new Date(message.created_at).toLocaleTimeString()}
                        </span>
                      </div>
                      <div className={styles.messageContent}>
                        {message.content}
                      </div>
                    </div>
                  ))
                )}
                
                {/* Typing Indicator */}
                {typingUsers.length > 0 && (
                  <div className={styles.typingIndicator}>
                    {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className={styles.messageInput}>
                <input
                  type="text"
                  value={newMessage}
                  onChange={handleTyping}
                  onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Type a message..."
                  className={styles.input}
                  disabled={!isConnected || !currentRoom}
                />
                <button
                  onClick={sendMessage}
                  disabled={!isConnected || !newMessage.trim() || !currentRoom}
                  className={styles.sendButton}
                  aria-label="Send message"
                >
                  <Send size={16} />
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
