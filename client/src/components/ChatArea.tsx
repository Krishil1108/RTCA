import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  IconButton,
  Avatar,
  Chip,
} from '@mui/material';
import {
  Send as SendIcon,
  MoreVert as MoreIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { useChat } from '../contexts/ChatContext';
import { useAuth } from '../contexts/AuthContext';
import { useWhatsAppTheme } from '../contexts/ThemeContext';
import { Message } from '../services/chatService';
import MessageComponent from './MessageComponent';
import TypingIndicator from './TypingIndicator';
import WelcomeMessage from './WelcomeMessage';
import { UI_CONSTANTS } from '../config/constants';

interface ChatAreaProps {
  onStartConversation?: () => void;
}

const ChatArea: React.FC<ChatAreaProps> = ({ onStartConversation }) => {
  const {
    currentRoom,
    rooms,
    messages,
    sendMessage,
    setTyping,
    typingUsers,
  } = useChat();

  const { user } = useAuth();
  const { isDarkMode } = useWhatsAppTheme();

  const [messageInput, setMessageInput] = useState('');
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Format last seen time
  const formatLastSeen = (lastSeen: string | Date | undefined) => {
    if (!lastSeen) return 'some time ago';
    
    const now = new Date();
    const lastSeenDate = new Date(lastSeen);
    const diffMs = now.getTime() - lastSeenDate.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 7) return `${diffDays} days ago`;
    
    return lastSeenDate.toLocaleDateString();
  };

  // Current room data
  const room = rooms.find(r => r._id === currentRoom);
  const roomMessages = currentRoom ? messages[currentRoom] || [] : [];
  const roomTypingUsers = currentRoom ? typingUsers[currentRoom] || [] : [];
  
  // Get the other user in direct messages (not the current user)
  const getOtherUser = () => {
    if (room?.type === 'direct' && room.members.length >= 2) {
      return room.members.find(member => member.user._id !== user?.id)?.user;
    }
    return null;
  };
  
  const otherUser = getOtherUser();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [roomMessages]);

  const handleMessageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (messageInput.trim() && currentRoom) {
      sendMessage(messageInput.trim(), 'text', replyingTo?._id);
      setMessageInput('');
      setReplyingTo(null);
      
      // Clear typing indicator
      setTyping(false);
      if (typingTimeout) {
        clearTimeout(typingTimeout);
        setTypingTimeout(null);
      }
    }
  };

  const handleReply = (message: Message) => {
    setReplyingTo(message);
  };

  const handleCancelReply = () => {
    setReplyingTo(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setMessageInput(value);

    // Handle typing indicator
    if (currentRoom) {
      if (value.trim()) {
        setTyping(true);
        
        // Clear existing timeout
        if (typingTimeout) {
          clearTimeout(typingTimeout);
        }
        
        // Set new timeout to stop typing
        const timeout = setTimeout(() => {
          setTyping(false);
        }, UI_CONSTANTS.TYPING_TIMEOUT);
        
        setTypingTimeout(timeout);
      } else {
        setTyping(false);
        if (typingTimeout) {
          clearTimeout(typingTimeout);
          setTypingTimeout(null);
        }
      }
    }
  };

  // Cleanup typing timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeout) {
        clearTimeout(typingTimeout);
      }
    };
  }, [typingTimeout]);

  if (!currentRoom) {
    return (
      <WelcomeMessage onStartConversation={onStartConversation || (() => {})} />
    );
  }

  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: isDarkMode ? '#0b141a' : '#f0f2f5',
        backgroundImage: isDarkMode 
          ? 'url("data:image/svg+xml,%3Csvg width="100" height="100" xmlns="http://www.w3.org/2000/svg"%3E%3Cdefs%3E%3Cpattern id="a" patternUnits="userSpaceOnUse" width="100" height="100"%3E%3Cpath d="M0 0h100v100H0z" fill="%23182229"/%3E%3C/pattern%3E%3C/defs%3E%3Crect width="100%" height="100%" fill="url(%23a)"/%3E%3C/svg%3E")'
          : 'url("data:image/svg+xml,%3Csvg width="100" height="100" xmlns="http://www.w3.org/2000/svg"%3E%3Cdefs%3E%3Cpattern id="a" patternUnits="userSpaceOnUse" width="100" height="100"%3E%3Cpath d="M0 0h100v100H0z" fill="%23ffffff"/%3E%3C/pattern%3E%3C/defs%3E%3Crect width="100%" height="100%" fill="url(%23a)"/%3E%3C/svg%3E")',
      }}
    >
      {/* Chat Header with Status */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          borderRadius: 0,
          borderBottom: 1,
          borderColor: isDarkMode ? '#3b4a54' : 'divider',
          bgcolor: isDarkMode ? '#202c33' : '#f0f2f5',
          color: isDarkMode ? '#e9edef' : '#000',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar 
            src={room?.type === 'direct' ? otherUser?.avatar : undefined}
            sx={{ bgcolor: 'primary.main', width: 40, height: 40 }}
          >
            {room?.type === 'direct' 
              ? otherUser?.name?.charAt(0).toUpperCase() 
              : room?.name?.charAt(0).toUpperCase()
            }
          </Avatar>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6" component="h2" sx={{ 
              color: isDarkMode ? '#e9edef' : '#000',
              fontSize: '1.1rem',
              fontWeight: 500
            }}>
              {room?.type === 'direct' ? otherUser?.name || 'Unknown Contact' : room?.name}
            </Typography>
            <Typography variant="body2" sx={{ 
              color: isDarkMode ? '#8696a0' : '#54656f',
              fontSize: '0.85rem'
            }}>
              {room?.type === 'direct' ? (
                // For direct messages, show online status or last seen
                otherUser?.isOnline ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Box sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      bgcolor: '#25d366',
                      flexShrink: 0
                    }} />
                    online
                  </Box>
                ) : (
                  `last seen ${formatLastSeen(otherUser?.lastSeen)}`
                )
              ) : (
                // For group chats, show member count
                `${room?.memberCount || 0} members`
              )}
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* Messages Area */}
      <Box
        sx={{
          flexGrow: 1,
          overflow: 'auto',
          p: 1,
          backgroundColor: isDarkMode ? '#0b141a' : '#f0f2f5',
        }}
      >
        {roomMessages.length === 0 ? (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              textAlign: 'center',
              p: 3,
            }}
          >
            <Box>
              <Typography variant="h6" color="textSecondary" gutterBottom>
                No messages yet
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Be the first to send a message in #{room?.name}
              </Typography>
            </Box>
          </Box>
        ) : (
          <Box sx={{ pb: 2 }}>
            {roomMessages.map((message: Message, index: number) => {
              const prevMessage = index > 0 ? roomMessages[index - 1] : null;
              const showAvatar = !prevMessage || 
                prevMessage.sender._id !== message.sender._id ||
                new Date(message.createdAt).getTime() - new Date(prevMessage.createdAt).getTime() > 300000; // 5 minutes
              
              return (
                <MessageComponent
                  key={message._id}
                  message={message}
                  showAvatar={showAvatar}
                  currentUserId={user?.id}
                  onReply={handleReply}
                />
              );
            })}
            
            {/* Typing Indicator */}
            {roomTypingUsers.length > 0 && (
              <TypingIndicator users={roomTypingUsers} />
            )}
            
            <div ref={messagesEndRef} />
          </Box>
        )}
      </Box>

      {/* Message Input */}
      <Paper
        elevation={3}
        sx={{
          borderRadius: 0,
          borderTop: 1,
          borderColor: isDarkMode ? '#3b4a54' : 'divider',
          bgcolor: isDarkMode ? '#202c33' : '#ffffff',
        }}
      >
        {/* Reply Preview */}
        {replyingTo && (
          <Box
            sx={{
              p: 2,
              pb: 0,
              borderBottom: 1,
              borderBottomColor: isDarkMode ? '#3b4a54' : 'divider',
            }}
          >
            <Paper
              variant="outlined"
              sx={{
                p: 2,
                backgroundColor: isDarkMode ? '#182229' : 'grey.50',
                borderLeft: 3,
                borderLeftColor: 'primary.main',
                borderRadius: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                <Typography variant="caption" color="primary" fontWeight="bold">
                  Replying to {replyingTo.sender.name}:
                </Typography>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    opacity: 0.8,
                    color: isDarkMode ? '#8696a0' : 'inherit',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {replyingTo.content.length > 50
                    ? `${replyingTo.content.substring(0, 50)}...`
                    : replyingTo.content}
                </Typography>
              </Box>
              <IconButton size="small" onClick={handleCancelReply}>
                <CloseIcon fontSize="small" />
              </IconButton>
            </Paper>
          </Box>
        )}
        
        <Box sx={{ p: 2 }}>
          <Box
            component="form"
            onSubmit={handleMessageSubmit}
            sx={{ display: 'flex', alignItems: 'flex-end', gap: 1 }}
          >
          <TextField
            fullWidth
            multiline
            maxRows={4}
            placeholder={`Message #${room?.name}`}
            value={messageInput}
            onChange={handleInputChange}
            variant="outlined"
            size="small"
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 3,
                backgroundColor: isDarkMode ? '#2a3942' : '#ffffff',
                color: isDarkMode ? '#e9edef' : '#000',
                '& fieldset': {
                  borderColor: isDarkMode ? '#3b4a54' : 'rgba(0, 0, 0, 0.23)',
                },
                '&:hover fieldset': {
                  borderColor: isDarkMode ? '#53bdeb' : 'rgba(0, 0, 0, 0.87)',
                },
                '&.Mui-focused fieldset': {
                  borderColor: isDarkMode ? '#53bdeb' : '#128c7e',
                },
              },
              '& .MuiInputBase-input::placeholder': {
                color: isDarkMode ? '#8696a0' : 'rgba(0, 0, 0, 0.6)',
                opacity: 1,
              },
            }}
          />
          <IconButton
            type="submit"
            color="primary"
            disabled={!messageInput.trim()}
            sx={{
              bgcolor: 'primary.main',
              color: 'white',
              '&:hover': {
                bgcolor: 'primary.dark',
              },
              '&:disabled': {
                bgcolor: 'grey.300',
                color: 'grey.500',
              },
            }}
          >
            <SendIcon />
          </IconButton>
          </Box>
        </Box>
        
        {/* Character count */}
        <Typography
          variant="caption"
          color={messageInput.length > UI_CONSTANTS.MAX_MESSAGE_LENGTH * 0.9 ? 'error' : 'textSecondary'}
          sx={{ mt: 0.5, display: 'block', textAlign: 'right' }}
        >
          {messageInput.length}/{UI_CONSTANTS.MAX_MESSAGE_LENGTH}
        </Typography>
      </Paper>
    </Box>
  );
};

export default ChatArea;
