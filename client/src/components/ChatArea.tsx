import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  IconButton,
  Avatar,
  Chip,
  Fade,
  Slide,
  useTheme,
  alpha,
  Zoom,
  Tooltip,
  Divider,
} from '@mui/material';
import {
  Send as SendIcon,
  MoreVert as MoreIcon,
  Close as CloseIcon,
  AttachFile as AttachFileIcon,
  EmojiEmotions as EmojiIcon,
  Mic as MicIcon,
  ArrowBack as ArrowBackIcon,
  Phone as PhoneIcon,
  VideoCall as VideoCallIcon,
  Group as GroupIcon,
  CheckCircle as CheckCircleIcon,
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
  const theme = useTheme();

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
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value.length <= UI_CONSTANTS.MAX_MESSAGE_LENGTH) {
      setMessageInput(value);
    }

    // Handle typing indicator
    if (currentRoom) {
      setTyping(true);
      
      // Clear existing timeout
      if (typingTimeout) {
        clearTimeout(typingTimeout);
      }

      // Set new timeout to stop typing after 3 seconds
      const newTimeout = setTimeout(() => {
        setTyping(false);
      }, 3000);
      
      setTypingTimeout(newTimeout);
    }
  };

  const handleReply = (message: Message) => {
    setReplyingTo(message);
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
      {/* Modern Chat Header */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          borderRadius: 0,
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          bgcolor: isDarkMode 
            ? alpha('#202c33', 0.95) 
            : alpha('#ffffff', 0.95),
          backdropFilter: 'blur(10px)',
          color: isDarkMode ? '#e9edef' : '#111b21',
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: isDarkMode 
              ? 'linear-gradient(135deg, rgba(37, 211, 102, 0.05) 0%, rgba(18, 140, 126, 0.05) 100%)'
              : 'linear-gradient(135deg, rgba(37, 211, 102, 0.02) 0%, rgba(18, 140, 126, 0.02) 100%)',
            zIndex: -1,
          },
        }}
      >
        <Fade in timeout={500}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {/* Back Button for Mobile */}
            <Tooltip title="Back to chats">
              <IconButton
                size="small"
                sx={{ 
                  display: { xs: 'flex', md: 'none' },
                  color: 'inherit',
                  '&:hover': {
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    transform: 'scale(1.1)',
                  },
                  transition: 'all 0.2s ease',
                }}
              >
                <ArrowBackIcon />
              </IconButton>
            </Tooltip>

            {/* Enhanced Avatar with Status Indicator */}
            <Box sx={{ position: 'relative' }}>
              <Zoom in timeout={300}>
                <Avatar 
                  src={room?.type === 'direct' ? otherUser?.avatar : undefined}
                  sx={{ 
                    bgcolor: room?.type === 'group' 
                      ? theme.palette.secondary.main 
                      : theme.palette.primary.main, 
                    width: 48, 
                    height: 48,
                    fontSize: '1.2rem',
                    fontWeight: 600,
                    border: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                    boxShadow: theme.shadows[3],
                    cursor: 'pointer',
                    '&:hover': {
                      transform: 'scale(1.05)',
                    },
                    transition: 'all 0.2s ease',
                  }}
                >
                  {room?.type === 'direct' 
                    ? otherUser?.name?.charAt(0).toUpperCase() 
                    : <GroupIcon />
                  }
                </Avatar>
              </Zoom>
              
              {/* Online Status Indicator */}
              {room?.type === 'direct' && otherUser?.isOnline && (
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: 2,
                    right: 2,
                    width: 14,
                    height: 14,
                    borderRadius: '50%',
                    bgcolor: '#4caf50',
                    border: `3px solid ${theme.palette.background.paper}`,
                    animation: 'pulse 2s infinite',
                    '@keyframes pulse': {
                      '0%': { transform: 'scale(1)', opacity: 1 },
                      '50%': { transform: 'scale(1.2)', opacity: 0.8 },
                      '100%': { transform: 'scale(1)', opacity: 1 },
                    },
                  }}
                />
              )}
            </Box>

            {/* User Info */}
            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
              <Slide direction="right" in timeout={400}>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    fontWeight: 600,
                    fontSize: '1.1rem',
                    color: 'inherit',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    cursor: 'pointer',
                    '&:hover': {
                      color: theme.palette.primary.main,
                    },
                    transition: 'color 0.2s ease',
                  }}
                >
                  {room?.type === 'direct' ? otherUser?.name : room?.name}
                  {room?.type === 'group' && (
                    <Chip 
                      label={`${room.members.length} members`}
                      size="small"
                      sx={{ 
                        height: 22,
                        fontSize: '0.7rem',
                        bgcolor: alpha(theme.palette.primary.main, 0.1),
                        color: theme.palette.primary.main,
                        fontWeight: 500,
                      }}
                    />
                  )}
                  {room?.type === 'direct' && otherUser?.isOnline && (
                    <CheckCircleIcon sx={{ fontSize: 16, color: '#4caf50' }} />
                  )}
                </Typography>
              </Slide>
              
              <Fade in timeout={600}>
                <Typography 
                  variant="caption" 
                  sx={{ 
                    color: alpha(isDarkMode ? '#e9edef' : '#111b21', 0.7),
                    fontSize: '0.8rem',
                    display: 'block',
                    fontWeight: 500,
                  }}
                >
                  {room?.type === 'direct' ? (
                    otherUser?.isOnline ? (
                      <Box component="span" sx={{ color: '#4caf50', fontWeight: 600 }}>
                        Online
                      </Box>
                    ) : (
                      `Last seen ${formatLastSeen(otherUser?.lastSeen)}`
                    )
                  ) : (
                    `${room?.members?.map(m => m.user.name).slice(0, 3).join(', ')}${(room?.members?.length || 0) > 3 ? `... and ${(room?.members?.length || 0) - 3} more` : ''}`
                  )}
                </Typography>
              </Fade>
            </Box>

            {/* Action Buttons */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Tooltip title="Voice call">
                <IconButton
                  size="small"
                  sx={{ 
                    color: 'inherit',
                    '&:hover': {
                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                      color: theme.palette.primary.main,
                      transform: 'scale(1.1)',
                    },
                    transition: 'all 0.2s ease',
                  }}
                >
                  <PhoneIcon fontSize="small" />
                </IconButton>
              </Tooltip>

              <Tooltip title="Video call">
                <IconButton
                  size="small"
                  sx={{ 
                    color: 'inherit',
                    '&:hover': {
                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                      color: theme.palette.primary.main,
                      transform: 'scale(1.1)',
                    },
                    transition: 'all 0.2s ease',
                  }}
                >
                  <VideoCallIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              
              <Tooltip title="More options">
                <IconButton
                  size="small"
                  sx={{ 
                    color: 'inherit',
                    '&:hover': {
                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                      color: theme.palette.primary.main,
                      transform: 'scale(1.1)',
                    },
                    transition: 'all 0.2s ease',
                  }}
                >
                  <MoreIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        </Fade>
      </Paper>

      {/* Messages Area with Enhanced Styling */}
      <Box
        sx={{
          flexGrow: 1,
          overflow: 'auto',
          p: 1,
          backgroundColor: isDarkMode ? '#0b141a' : '#f0f2f5',
          backgroundImage: isDarkMode 
            ? 'url("data:image/svg+xml,%3Csvg width="40" height="40" xmlns="http://www.w3.org/2000/svg"%3E%3Cdefs%3E%3Cpattern id="a" patternUnits="userSpaceOnUse" width="40" height="40"%3E%3Cpath d="M0 0h40v40H0z" fill="none" stroke="%23182229" stroke-width="0.5" opacity="0.3"/%3E%3C/pattern%3E%3C/defs%3E%3Crect width="100%" height="100%" fill="url(%23a)"/%3E%3C/svg%3E")'
            : 'url("data:image/svg+xml,%3Csvg width="40" height="40" xmlns="http://www.w3.org/2000/svg"%3E%3Cdefs%3E%3Cpattern id="a" patternUnits="userSpaceOnUse" width="40" height="40"%3E%3Cpath d="M0 0h40v40H0z" fill="none" stroke="%23e9edef" stroke-width="0.5" opacity="0.1"/%3E%3C/pattern%3E%3C/defs%3E%3Crect width="100%" height="100%" fill="url(%23a)"/%3E%3C/svg%3E")',
          '&::-webkit-scrollbar': {
            width: '6px',
          },
          '&::-webkit-scrollbar-track': {
            bgcolor: 'transparent',
          },
          '&::-webkit-scrollbar-thumb': {
            bgcolor: alpha(theme.palette.text.secondary, 0.2),
            borderRadius: '3px',
          },
          '&::-webkit-scrollbar-thumb:hover': {
            bgcolor: alpha(theme.palette.text.secondary, 0.3),
          },
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
              p: 4,
            }}
          >
            <Fade in timeout={500}>
              <Box>
                <Box
                  sx={{
                    width: 120,
                    height: 120,
                    borderRadius: '50%',
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mx: 'auto',
                    mb: 3,
                    border: `3px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                  }}
                >
                  <Avatar
                    src={room?.type === 'direct' ? otherUser?.avatar : undefined}
                    sx={{
                      width: 80,
                      height: 80,
                      bgcolor: theme.palette.primary.main,
                      fontSize: '2rem',
                      fontWeight: 600,
                    }}
                  >
                    {room?.type === 'direct' 
                      ? otherUser?.name?.charAt(0).toUpperCase() 
                      : <GroupIcon sx={{ fontSize: '2rem' }} />
                    }
                  </Avatar>
                </Box>
                
                <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
                  {room?.type === 'direct' ? otherUser?.name : room?.name}
                </Typography>
                
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3, maxWidth: 300 }}>
                  {room?.type === 'direct' 
                    ? `This is the beginning of your conversation with ${otherUser?.name}. Say hello!`
                    : `Welcome to ${room?.name}! This is the start of your group conversation.`
                  }
                </Typography>

                <Chip
                  label="Start messaging"
                  sx={{
                    bgcolor: theme.palette.primary.main,
                    color: 'white',
                    fontWeight: 500,
                    px: 2,
                    '&:hover': {
                      bgcolor: theme.palette.primary.dark,
                    },
                  }}
                />
              </Box>
            </Fade>
          </Box>
        ) : (
          <Box sx={{ pb: 2 }}>
            {roomMessages.map((message: Message, index: number) => {
              const prevMessage = index > 0 ? roomMessages[index - 1] : null;
              const showAvatar = !prevMessage || 
                prevMessage.sender._id !== message.sender._id ||
                new Date(message.createdAt).getTime() - new Date(prevMessage.createdAt).getTime() > 300000;
              
              return (
                <Slide
                  key={message._id}
                  direction={message.sender._id === user?.id ? "left" : "right"}
                  in
                  timeout={300 + index * 50}
                >
                  <Box>
                    <MessageComponent
                      message={message}
                      showAvatar={showAvatar}
                      currentUserId={user?.id}
                      onReply={handleReply}
                    />
                  </Box>
                </Slide>
              );
            })}
            
            {/* Typing Indicator */}
            {roomTypingUsers.length > 0 && (
              <Slide direction="up" in timeout={200}>
                <Box>
                  <TypingIndicator users={roomTypingUsers} />
                </Box>
              </Slide>
            )}
            
            <div ref={messagesEndRef} />
          </Box>
        )}
      </Box>

      {/* Modern Message Input */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: 0,
          borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          bgcolor: isDarkMode 
            ? alpha('#202c33', 0.95) 
            : alpha('#ffffff', 0.95),
          backdropFilter: 'blur(10px)',
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: isDarkMode 
              ? 'linear-gradient(45deg, rgba(37, 211, 102, 0.02) 0%, rgba(18, 140, 126, 0.02) 100%)'
              : 'linear-gradient(45deg, rgba(37, 211, 102, 0.01) 0%, rgba(18, 140, 126, 0.01) 100%)',
            zIndex: -1,
          },
        }}
      >
        {/* Reply Bar */}
        {replyingTo && (
          <Slide direction="up" in timeout={300}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                p: 2,
                mx: 2,
                mt: 2,
                bgcolor: alpha(theme.palette.primary.main, 0.08),
                borderRadius: 3,
                borderLeft: `4px solid ${theme.palette.primary.main}`,
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="caption" color="primary" sx={{ fontWeight: 600, fontSize: '0.8rem' }}>
                  Replying to {replyingTo.sender.name}
                </Typography>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: 'text.secondary',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    mt: 0.5,
                  }}
                >
                  {replyingTo.content}
                </Typography>
              </Box>
              <Tooltip title="Cancel reply">
                <IconButton 
                  size="small" 
                  onClick={() => setReplyingTo(null)}
                  sx={{ 
                    ml: 1,
                    '&:hover': {
                      bgcolor: alpha(theme.palette.error.main, 0.1),
                      color: theme.palette.error.main,
                    },
                  }}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          </Slide>
        )}

        {/* Input Form */}
        <Box component="form" onSubmit={handleMessageSubmit} sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1 }}>
            {/* Emoji Button */}
            <Tooltip title="Emoji">
              <IconButton
                size="small"
                sx={{ 
                  color: 'text.secondary',
                  mb: 0.5,
                  '&:hover': {
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    color: theme.palette.primary.main,
                    transform: 'scale(1.1)',
                  },
                  transition: 'all 0.2s ease',
                }}
              >
                <EmojiIcon />
              </IconButton>
            </Tooltip>

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
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 6,
                  bgcolor: isDarkMode 
                    ? alpha(theme.palette.common.white, 0.05) 
                    : alpha(theme.palette.common.black, 0.02),
                  '& fieldset': {
                    border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                  },
                  '&:hover fieldset': {
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
                  },
                  '&.Mui-focused fieldset': {
                    border: `2px solid ${theme.palette.primary.main}`,
                    boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.1)}`,
                  },
                  '& .MuiInputBase-input': {
                    py: 2,
                    fontSize: '0.95rem',
                    '&::placeholder': {
                      color: alpha(theme.palette.text.secondary, 0.6),
                      fontStyle: 'italic',
                    },
                  },
                },
              }}
            />

            {/* Attach Button */}
            <Tooltip title="Attach file">
              <IconButton
                size="small"
                sx={{ 
                  color: 'text.secondary',
                  mb: 0.5,
                  '&:hover': {
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    color: theme.palette.primary.main,
                    transform: 'rotate(15deg) scale(1.1)',
                  },
                  transition: 'all 0.3s ease',
                }}
              >
                <AttachFileIcon />
              </IconButton>
            </Tooltip>

            {/* Send or Voice Button */}
            {messageInput.trim() ? (
              <Zoom in timeout={200}>
                <IconButton
                  type="submit"
                  sx={{
                    bgcolor: theme.palette.primary.main,
                    color: 'white',
                    width: 48,
                    height: 48,
                    '&:hover': {
                      bgcolor: theme.palette.primary.dark,
                      transform: 'scale(1.05)',
                      boxShadow: theme.shadows[8],
                    },
                    '&:active': {
                      transform: 'scale(0.95)',
                    },
                    transition: 'all 0.2s ease',
                    boxShadow: theme.shadows[6],
                  }}
                >
                  <SendIcon />
                </IconButton>
              </Zoom>
            ) : (
              <Tooltip title="Voice message">
                <IconButton
                  sx={{ 
                    color: 'text.secondary',
                    width: 48,
                    height: 48,
                    '&:hover': {
                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                      color: theme.palette.primary.main,
                      transform: 'scale(1.05)',
                    },
                    transition: 'all 0.2s ease',
                  }}
                >
                  <MicIcon />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </Box>
        
        {/* Character count */}
        <Fade in={messageInput.length > UI_CONSTANTS.MAX_MESSAGE_LENGTH * 0.7} timeout={300}>
          <Typography
            variant="caption"
            color={messageInput.length > UI_CONSTANTS.MAX_MESSAGE_LENGTH * 0.9 ? 'error' : 'text.secondary'}
            sx={{ 
              pb: 1,
              px: 2, 
              display: 'block', 
              textAlign: 'right',
              fontSize: '0.75rem',
              fontWeight: 500,
            }}
          >
            {messageInput.length}/{UI_CONSTANTS.MAX_MESSAGE_LENGTH}
          </Typography>
        </Fade>
      </Paper>
    </Box>
  );
};

export default ChatArea;