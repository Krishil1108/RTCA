import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  IconButton,
  Avatar,
  useTheme,
  useMediaQuery,
  alpha,
  Zoom,
} from '@mui/material';
import {
  Send as SendIcon,
  MoreVert as MoreIcon,
  AttachFile as AttachFileIcon,
  EmojiEmotions as EmojiIcon,
  Mic as MicIcon,
  ArrowBack as ArrowBackIcon,
  Phone as PhoneIcon,
  VideoCall as VideoCallIcon,
  Group as GroupIcon,
} from '@mui/icons-material';
import { useChat } from '../contexts/ChatContext';
import { useAuth } from '../contexts/AuthContext';
import { useAriztaTheme } from '../contexts/ThemeContext';
import { Message } from '../services/chatService';
import MessageComponent from './MessageComponent';
import TypingIndicator from './TypingIndicator';
import WelcomeMessage from './WelcomeMessage';
import { UI_CONSTANTS } from '../config/constants';

interface ChatAreaProps {
  onStartConversation?: () => void;
  onBackClick?: () => void;
}

const ChatArea: React.FC<ChatAreaProps> = ({ onStartConversation, onBackClick }) => {
  const {
    currentRoom,
    rooms,
    messages,
    sendMessage,
    setTyping,
    typingUsers,
  } = useChat();

  const { user } = useAuth();
  const { isDarkMode } = useAriztaTheme();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [messageInput, setMessageInput] = useState('');
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
  const allRoomMessages = currentRoom ? messages[currentRoom] || [] : [];
  
  // Deduplicate messages by ID to prevent duplicate keys
  const roomMessages = allRoomMessages.filter((message, index, self) => 
    index === self.findIndex(m => m._id === message._id)
  );
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
      setAttachedFiles([]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value.length <= UI_CONSTANTS.MAX_MESSAGE_LENGTH) {
      setMessageInput(value);
      
      // Handle typing indicator
      if (currentRoom) {
        setTyping(true);
        
        if (typingTimeout) {
          clearTimeout(typingTimeout);
        }
        
        const timeout = setTimeout(() => {
          setTyping(false);
        }, 1000);
        
        setTypingTimeout(timeout);
      }
    }
  };

  const handleAttachClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAttachedFiles(prev => [...prev, ...files]);
  };

  // Cleanup typing timeout
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
        height: ['100vh', '100dvh'], // Fallback for browsers that don't support dvh
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed', // Fix the entire chat area
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        overflow: 'hidden',
        background: isDarkMode 
          ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)'
          : 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
        // Prevent zoom on input focus and handle mobile keyboards
        '@media (max-width: 768px)': {
          fontSize: '16px',
          // Prevent viewport scaling when keyboard appears
          position: 'fixed',
          height: '100vh', // Use viewport height on mobile
          '& input, & textarea': {
            fontSize: '16px', // Prevents zoom on iOS
            resize: 'none',
          },
          // Handle iOS keyboard
          '@supports (-webkit-touch-callout: none)': {
            height: '100vh',
            minHeight: '100vh',
            maxHeight: '100vh',
          },
        },
      }}
    >
      {/* Fixed Header */}
      <Paper
        elevation={0}
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          flexShrink: 0,
          background: isDarkMode 
            ? 'rgba(30, 41, 59, 0.95)' 
            : 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          borderBottom: `1px solid ${alpha(isDarkMode ? '#ffffff' : '#000000', 0.1)}`,
          // Handle safe areas for mobile devices
          paddingTop: 'env(safe-area-inset-top, 0px)',
          // Ensure header stays fixed on mobile
          '@supports (-webkit-touch-callout: none)': {
            // iOS specific styles
            position: 'fixed',
            top: 0,
          },
          // For mobile devices with notches/safe areas
          '@media (max-width: 768px)': {
            paddingTop: 'env(safe-area-inset-top, 0px)',
          },
        }}
      >
        <Box sx={{ 
          px: { xs: 2, md: 3 },
          py: { xs: 1.5, md: 2 },
          display: 'flex',
          alignItems: 'center',
          gap: { xs: 1.5, md: 2 },
          minHeight: { xs: 60, md: 70 },
        }}>
          {/* Left Section */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1, minWidth: 0 }}>
            {/* Back Button for Mobile */}
            {isMobile && (
              <IconButton
                onClick={onBackClick}
                sx={{ 
                  width: 40,
                  height: 40,
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  color: theme.palette.primary.main,
                  '&:hover': {
                    bgcolor: alpha(theme.palette.primary.main, 0.2),
                  },
                }}
              >
                <ArrowBackIcon />
              </IconButton>
            )}

            {/* Avatar */}
            <Avatar 
              src={room?.type === 'direct' ? otherUser?.avatar : undefined}
              sx={{ 
                width: { xs: 40, md: 48 },
                height: { xs: 40, md: 48 },
                bgcolor: theme.palette.primary.main,
              }}
            >
              {room?.type === 'direct' 
                ? otherUser?.name?.charAt(0).toUpperCase() 
                : <GroupIcon />
              }
            </Avatar>

            {/* User Info */}
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography 
                variant="h6"
                sx={{ 
                  fontWeight: 600,
                  fontSize: { xs: '1rem', md: '1.1rem' },
                  color: isDarkMode ? '#ffffff' : '#1f2937',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {room?.type === 'direct' ? otherUser?.name : room?.name}
              </Typography>
              {room?.type === 'direct' && (
                <Typography 
                  variant="caption"
                  sx={{ 
                    color: isDarkMode ? '#94a3b8' : '#6b7280',
                    fontSize: '0.75rem',
                  }}
                >
                  {otherUser?.isOnline ? 'Online' : `Last seen ${formatLastSeen(otherUser?.lastSeen)}`}
                </Typography>
              )}
            </Box>
          </Box>

          {/* Right Section - Action Buttons */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton
              sx={{ 
                color: isDarkMode ? '#8696a0' : '#6b7280',
                '&:hover': { color: theme.palette.primary.main },
              }}
            >
              <PhoneIcon />
            </IconButton>
            
            <IconButton
              sx={{ 
                color: isDarkMode ? '#8696a0' : '#6b7280',
                '&:hover': { color: theme.palette.primary.main },
              }}
            >
              <VideoCallIcon />
            </IconButton>
            
            <IconButton
              sx={{ 
                color: isDarkMode ? '#8696a0' : '#6b7280',
                '&:hover': { color: theme.palette.primary.main },
              }}
            >
              <MoreIcon />
            </IconButton>
          </Box>
        </Box>
      </Paper>

      {/* Messages Area - Positioned between fixed header and bottom bar */}
      <Box
        sx={{
          position: 'fixed',
          top: { 
            xs: 'calc(60px + env(safe-area-inset-top, 0px))', 
            md: 'calc(70px + env(safe-area-inset-top, 0px))' 
          }, // Height of header + safe area
          bottom: { xs: 80, md: 90 }, // Height of bottom input area
          left: 0,
          right: 0,
          overflow: 'auto',
          overflowX: 'hidden',
          // Perfect mobile scrolling
          WebkitOverflowScrolling: 'touch',
          scrollBehavior: 'smooth',
          background: isDarkMode 
            ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)'
            : 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
          // Mobile padding
          p: { xs: 1, md: 2 },
          // Clean scrollbar styling - hidden on mobile for cleaner look
          '&::-webkit-scrollbar': {
            width: { xs: '0px', md: '6px' },
          },
          '&::-webkit-scrollbar-track': {
            background: 'transparent',
          },
          '&::-webkit-scrollbar-thumb': {
            background: alpha(isDarkMode ? '#ffffff' : '#000000', 0.2),
            borderRadius: '10px',
          },
          // Better touch scrolling on mobile
          scrollbarWidth: 'none', // Firefox
          msOverflowStyle: 'none', // IE
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
              p: { xs: 3, md: 4 },
            }}
          >
            <Box>
              {/* Beautiful Mobile-First Empty State */}
              <Box
                sx={{
                  width: { xs: 80, md: 120 },
                  height: { xs: 80, md: 120 },
                  borderRadius: '50%',
                  background: isDarkMode 
                    ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)'
                    : 'linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(139, 92, 246, 0.08) 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: { xs: 2, md: 3 },
                  border: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                }}
              >
                <EmojiIcon 
                  sx={{ 
                    fontSize: { xs: 40, md: 60 }, 
                    color: theme.palette.primary.main,
                    opacity: 0.7,
                  }} 
                />
              </Box>
              
              <Typography 
                variant="h6" 
                sx={{ 
                  mb: 1, 
                  color: 'text.secondary',
                  fontSize: { xs: '1.1rem', md: '1.25rem' },
                  fontWeight: 600,
                }}
              >
                No messages yet
              </Typography>
              
              <Typography 
                variant="body2" 
                sx={{ 
                  color: 'text.secondary',
                  fontSize: { xs: '0.875rem', md: '0.9rem' },
                  opacity: 0.8,
                  maxWidth: { xs: 250, md: 300 },
                  mx: 'auto',
                }}
              >
                Start the conversation by sending a message below!
              </Typography>
            </Box>
          </Box>
        ) : (
          <>
            {roomMessages.map((message) => (
              <MessageComponent
                key={message._id}
                message={message}
                currentUserId={user?.id}
                onReply={() => setReplyingTo(message)}
              />
            ))}
            
            {roomTypingUsers.length > 0 && (
              <TypingIndicator users={roomTypingUsers} />
            )}
            
            <div ref={messagesEndRef} />
          </>
        )}
      </Box>

      {/* Fixed Bottom Input Area - Stays at bottom even with keyboard */}
      <Paper
        elevation={0}
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          background: isDarkMode 
            ? 'rgba(30, 41, 59, 0.95)' 
            : 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          borderTop: `1px solid ${alpha(isDarkMode ? '#ffffff' : '#000000', 0.1)}`,
          p: { xs: 1.5, md: 2 },
          // Prevent keyboard from pushing this up on mobile
          '@supports (-webkit-touch-callout: none)': {
            // iOS specific styles
            paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))',
          },
          // Android specific
          '@media (max-width: 768px)': {
            paddingBottom: 'max(1.5rem, env(keyboard-inset-height, 0px))',
          },
        }}
      >
        {/* Reply Preview */}
        {replyingTo && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              p: 1.5,
              mb: 1,
              bgcolor: alpha(theme.palette.primary.main, 0.08),
              borderRadius: 2,
              borderLeft: `4px solid ${theme.palette.primary.main}`,
            }}
          >
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="caption" color="primary" sx={{ fontWeight: 600 }}>
                Replying to {replyingTo?.sender?.name || 'Unknown User'}
              </Typography>
              <Typography 
                variant="body2" 
                sx={{ 
                  color: 'text.secondary',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {replyingTo.content}
              </Typography>
            </Box>
            <IconButton 
              size="small" 
              onClick={() => setReplyingTo(null)}
              sx={{ 
                '&:hover': {
                  bgcolor: alpha(theme.palette.error.main, 0.1),
                  color: theme.palette.error.main,
                },
              }}
            >
              <ArrowBackIcon fontSize="small" />
            </IconButton>
          </Box>
        )}

        {/* Input Form */}
        <Box 
          component="form" 
          onSubmit={handleMessageSubmit} 
          sx={{ 
            display: 'flex',
            alignItems: 'flex-end',
            gap: 1,
          }}
        >
          {/* Emoji Button */}
          <IconButton
            size="small"
            sx={{ 
              color: isDarkMode ? '#8696a0' : '#54656f',
              mb: 0.5,
              '&:hover': {
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                color: theme.palette.primary.main,
              },
            }}
          >
            <EmojiIcon fontSize="small" />
          </IconButton>

          {/* Message Input */}
          <TextField
            fullWidth
            multiline
            maxRows={4}
            placeholder="Type a message..."
            value={messageInput}
            onChange={handleInputChange}
            variant="outlined"
            size="small"
            inputRef={inputRef}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="sentences"
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 3,
                bgcolor: isDarkMode 
                  ? alpha(theme.palette.common.white, 0.08) 
                  : alpha(theme.palette.common.black, 0.04),
                '& fieldset': {
                  border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                },
                '&:hover fieldset': {
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
                },
                '&.Mui-focused fieldset': {
                  border: `2px solid ${theme.palette.primary.main}`,
                },
                '& .MuiInputBase-input': {
                  fontSize: '0.9rem',
                  '&::placeholder': {
                    color: alpha(theme.palette.text.secondary, 0.6),
                    fontStyle: 'italic',
                  },
                },
              },
            }}
          />

          {/* Attach Button */}
          <IconButton
            size="small"
            onClick={handleAttachClick}
            sx={{ 
              color: isDarkMode ? '#8696a0' : '#54656f',
              mb: 0.5,
              '&:hover': {
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                color: theme.palette.primary.main,
                transform: 'rotate(15deg)',
              },
            }}
          >
            <AttachFileIcon fontSize="small" />
          </IconButton>

          {/* Voice Button - Always visible */}
          <IconButton
            sx={{ 
              color: isDarkMode ? '#8696a0' : '#54656f',
              mb: 0.5,
              '&:hover': {
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                color: theme.palette.primary.main,
              },
            }}
          >
            <MicIcon fontSize="small" />
          </IconButton>

          {/* Send Button - Only visible when there's content */}
          {messageInput.trim() || attachedFiles.length > 0 ? (
            <Zoom in timeout={200}>
              <IconButton
                type="submit"
                sx={{
                  bgcolor: theme.palette.primary.main,
                  color: 'white',
                  width: 40,
                  height: 40,
                  mb: 0.5,
                  '&:hover': {
                    bgcolor: theme.palette.primary.dark,
                    transform: 'scale(1.1)',
                  },
                }}
              >
                <SendIcon fontSize="small" />
              </IconButton>
            </Zoom>
          ) : null}
        </Box>

        {/* Character count */}
        {messageInput.length > UI_CONSTANTS.MAX_MESSAGE_LENGTH * 0.7 && (
          <Typography
            variant="caption"
            color={messageInput.length > UI_CONSTANTS.MAX_MESSAGE_LENGTH * 0.9 ? 'error' : 'text.secondary'}
            sx={{ 
              pt: 1,
              display: 'block', 
              textAlign: 'right',
              fontSize: '0.75rem',
            }}
          >
            {messageInput.length}/{UI_CONSTANTS.MAX_MESSAGE_LENGTH}
          </Typography>
        )}

        {/* Hidden File Input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          multiple
          accept="image/*,video/*,audio/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.txt,.csv,.zip,.rar"
          style={{ display: 'none' }}
        />
      </Paper>
    </Box>
  );
};

export default ChatArea;
