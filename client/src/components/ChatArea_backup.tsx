import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  IconButton,
  Avatar,
  Chip,
  useTheme,
  useMediaQuery,
  alpha,
  Zoom,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Menu,
  MenuItem,
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
  InsertDriveFile as FileIcon,
  Image as ImageIcon,
  Description as DocumentIcon,
  Delete as DeleteIcon,
  DeleteSweep as DeleteSweepIcon,
  ContentCopy as CopyIcon,
  Forward as ForwardIcon,
  SelectAll as SelectAllIcon,
  CheckBox as CheckBoxIcon,
} from '@mui/icons-material';
import { useChat } from '../contexts/ChatContext';
import { useAuth } from '../contexts/AuthContext';
import { useAriztaTheme } from '../contexts/ThemeContext';
import { Message } from '../services/chatService';
import socketService from '../services/socketService';
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
    clearMessages,
    deleteMessage,
  } = useChat();

  const { user } = useAuth();
  const { isDarkMode } = useAriztaTheme();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [messageInput, setMessageInput] = useState('');
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [filePreviewOpen, setFilePreviewOpen] = useState(false);
  const [headerMenuAnchor, setHeaderMenuAnchor] = useState<null | HTMLElement>(null);
  const [deleteAllDialogOpen, setDeleteAllDialogOpen] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [selectedMessages, setSelectedMessages] = useState<Set<string>>(new Set());
  const [isMessageSelectionMode, setIsMessageSelectionMode] = useState(false);
  const [forwardDialogOpen, setForwardDialogOpen] = useState(false);
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
    
    // If there are attached files, open preview instead of sending immediately
    if (attachedFiles.length > 0) {
      setFilePreviewOpen(true);
      return;
    }
    
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
    // Focus the input field when replying
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 100);
  };

  // File attachment handlers
  const handleAttachClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      // Limit to 5 files at once
      const selectedFiles = files.slice(0, 5);
      setAttachedFiles(prev => [...prev, ...selectedFiles]);
      setFilePreviewOpen(true);
    }
    // Reset input value to allow selecting the same file again
    if (e.target) {
      e.target.value = '';
    }
  };

  const handleRemoveFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSendWithFiles = async () => {
    if (!currentRoom) return;

    for (const file of attachedFiles) {
      // For now, we'll simulate file upload by sending file info as message
      // In a real app, you'd upload to a server and get a URL
      const messageContent = `📎 ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`;
      sendMessage(messageContent, 'file', replyingTo?._id);
    }

    // Send text message if there's any
    if (messageInput.trim()) {
      sendMessage(messageInput.trim(), 'text', replyingTo?._id);
    }

    // Reset state
    setAttachedFiles([]);
    setMessageInput('');
    setReplyingTo(null);
    setFilePreviewOpen(false);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Header menu handlers
  const handleHeaderMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setHeaderMenuAnchor(event.currentTarget);
  };

  const handleHeaderMenuClose = () => {
    setHeaderMenuAnchor(null);
  };

  const handleDeleteAllMessages = () => {
    setDeleteAllDialogOpen(true);
    handleHeaderMenuClose();
  };

  const confirmDeleteAllMessages = async () => {
    if (!currentRoom) return;
    
    try {
      await clearMessages(currentRoom);
      setDeleteAllDialogOpen(false);
    } catch (error) {
      console.error('Failed to clear messages:', error);
      // You could show a toast notification here
    }
  };

  // Removed unused message handlers since MessageComponent now only supports swipe-to-reply

  const handleSelectAllMessages = () => {
    if (currentRoom && messages[currentRoom]) {
      const allMessageIds = new Set(messages[currentRoom].map(m => m._id));
      setSelectedMessages(allMessageIds);
    }
  };

  const handleDeselectAllMessages = () => {
    setSelectedMessages(new Set());
    handleExitSelectionMode();
  };

  const handleExitSelectionMode = () => {
    setSelectedMessage(null);
    setSelectedMessages(new Set());
    setIsMessageSelectionMode(false);
  };

  // Commented out unused functions to resolve ESLint warnings
  // const handleReplyToSelected = () => {
  //   if (selectedMessage) {
  //     setReplyingTo(selectedMessage);
  //     handleExitSelectionMode();
  //     setTimeout(() => {
  //       if (inputRef.current) {
  //         inputRef.current.focus();
  //       }
  //     }, 100);
  //   }
  // };

  // const handleCopySelectedMessage = () => {
  //   if (selectedMessage) {
  //     navigator.clipboard.writeText(selectedMessage.content);
  //     handleExitSelectionMode();
  //   }
  // };

  const handleDeleteSelectedMessage = () => {
    if (selectedMessages.size > 0) {
      // Delete all selected messages
      selectedMessages.forEach(messageId => {
        deleteMessage(messageId);
      });
      handleExitSelectionMode();
    }
  };

  const handleForwardSelectedMessage = () => {
    if (selectedMessages.size > 0) {
      setForwardDialogOpen(true);
    }
  };

  const handleForwardToRoom = (roomId: string) => {
    if (selectedMessages.size > 0 && currentRoom) {
      try {
        // Forward all selected messages
        selectedMessages.forEach(messageId => {
          const message = messages[currentRoom]?.find(m => m._id === messageId);
          if (message) {
            const forwardedContent = `📤 Forwarded: ${message.content}`;
            socketService.sendMessage(roomId, forwardedContent, 'text');
          }
        });
        
        setForwardDialogOpen(false);
        handleExitSelectionMode();
      } catch (error) {
        console.error('Error forwarding message:', error);
        // You could show an error toast here
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
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
        // Mobile-first design
        background: isDarkMode 
          ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)'
          : 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
        // Prevent zoom on input focus (iOS)
        '@media (max-width: 768px)': {
          fontSize: '16px',
        },
      }}
    >
      {/* Mobile-First Header */}
      <Paper
        elevation={0}
        sx={{
          flexShrink: 0,
          background: isDarkMode 
            ? 'rgba(30, 41, 59, 0.95)' 
            : 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          borderBottom: `1px solid ${alpha(isDarkMode ? '#ffffff' : '#000000', 0.1)}`,
          zIndex: 10,
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
          {/* Left Section - Back button and Avatar */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
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

            {/* Simple Avatar */}
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
            <Box sx={{ minWidth: 0 }}>
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
              onClick={handleHeaderMenuClick}
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

      {/* Messages Area - Mobile Optimized */}
      <Box
        sx={{
          flex: 1,
          overflow: 'auto',
          overflowX: 'hidden',
          // Perfect mobile scrolling
          WebkitOverflowScrolling: 'touch',
          scrollBehavior: 'smooth',
          background: isDarkMode 
            ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)'
            : 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
          position: 'relative',
          // Mobile padding
          p: { xs: 1, md: 2 },
          // Hide scrollbar on mobile for cleaner look
          '&::-webkit-scrollbar': {
            width: { xs: '2px', md: '6px' },
          },
          '&::-webkit-scrollbar-track': {
            background: 'transparent',
          },
          '&::-webkit-scrollbar-thumb': {
            background: alpha(isDarkMode ? '#ffffff' : '#000000', 0.2),
            borderRadius: '10px',
          },
        }}
      >
                  <IconButton
                    onClick={handleExitSelectionMode}
                    sx={{ 
                      color: theme.palette.text.secondary,
                      bgcolor: alpha(theme.palette.text.secondary, 0.08),
                      '&:hover': {
                        bgcolor: alpha(theme.palette.text.secondary, 0.15),
                        transform: 'scale(1.05)',
                      },
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <CloseIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            ) : (
              // Normal Mode Actions
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                {/* Call Actions with Modern Styling */}
                <Tooltip title="Voice call" arrow>
                  <IconButton
                    sx={{ 
                      width: 44,
                      height: 44,
                      color: isDarkMode ? '#8696a0' : '#54656f',
                      bgcolor: alpha(theme.palette.primary.main, 0.05),
                      border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                      '&:hover': {
                        bgcolor: alpha(theme.palette.primary.main, 0.12),
                        color: theme.palette.primary.main,
                        transform: 'translateY(-2px)',
                        boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.25)}`,
                      },
                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    }}
                  >
                    <PhoneIcon sx={{ fontSize: 20 }} />
                  </IconButton>
                </Tooltip>

                <Tooltip title="Video call" arrow>
                  <IconButton
                    sx={{ 
                      width: 44,
                      height: 44,
                      color: isDarkMode ? '#8696a0' : '#54656f',
                      bgcolor: alpha(theme.palette.secondary.main, 0.05),
                      border: `1px solid ${alpha(theme.palette.secondary.main, 0.1)}`,
                      '&:hover': {
                        bgcolor: alpha(theme.palette.secondary.main, 0.12),
                        color: theme.palette.secondary.main,
                        transform: 'translateY(-2px)',
                        boxShadow: `0 4px 12px ${alpha(theme.palette.secondary.main, 0.25)}`,
                      },
                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    }}
                  >
                    <VideoCallIcon sx={{ fontSize: 20 }} />
                  </IconButton>
                </Tooltip>
                
                <Tooltip title="Chat options" arrow>
                  <IconButton
                    onClick={handleHeaderMenuClick}
                    sx={{ 
                      width: 44,
                      height: 44,
                      color: isDarkMode ? '#8696a0' : '#54656f',
                      bgcolor: alpha(theme.palette.text.secondary, 0.05),
                      border: `1px solid ${alpha(theme.palette.text.secondary, 0.1)}`,
                      '&:hover': {
                        bgcolor: alpha(theme.palette.text.secondary, 0.12),
                        color: theme.palette.text.primary,
                        transform: 'translateY(-2px)',
                        boxShadow: `0 4px 12px ${alpha(theme.palette.text.secondary, 0.25)}`,
                      },
                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    }}
                  >
                    <MoreIcon sx={{ fontSize: 20 }} />
                  </IconButton>
                </Tooltip>
              </Box>
            )}
          </Box>
        </Box>

        {/* Mobile Selection Actions Bar */}
        {isMobile && isMessageSelectionMode && (
          <Box
            sx={{
              px: 2,
              py: 1,
              bgcolor: alpha(theme.palette.primary.main, 0.03),
              borderTop: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
              display: 'flex',
              justifyContent: 'center',
              gap: 2,
            }}
          >
            <Tooltip title="Select all" arrow>
              <IconButton
                onClick={selectedMessages.size === (messages[currentRoom!]?.length || 0) ? handleDeselectAllMessages : handleSelectAllMessages}
                sx={{ 
                  color: theme.palette.primary.main,
                  bgcolor: alpha(theme.palette.primary.main, 0.08),
                  width: 48,
                  height: 48,
                  '&:hover': {
                    bgcolor: alpha(theme.palette.primary.main, 0.15),
                    transform: 'scale(1.05)',
                  },
                  transition: 'all 0.2s ease',
                }}
              >
                {selectedMessages.size === (messages[currentRoom!]?.length || 0) ? 
                  <CheckBoxIcon sx={{ fontSize: 22 }} /> : 
                  <SelectAllIcon sx={{ fontSize: 22 }} />
                }
              </IconButton>
            </Tooltip>

            <Tooltip title="Delete selected" arrow>
              <IconButton
                onClick={handleDeleteSelectedMessage}
                disabled={selectedMessages.size === 0}
                sx={{ 
                  color: selectedMessages.size > 0 ? theme.palette.error.main : theme.palette.text.disabled,
                  bgcolor: selectedMessages.size > 0 ? alpha(theme.palette.error.main, 0.08) : alpha(theme.palette.text.disabled, 0.05),
                  width: 48,
                  height: 48,
                  '&:hover': {
                    bgcolor: selectedMessages.size > 0 ? alpha(theme.palette.error.main, 0.15) : alpha(theme.palette.text.disabled, 0.08),
                    transform: selectedMessages.size > 0 ? 'scale(1.05)' : 'none',
                  },
                  transition: 'all 0.2s ease',
                }}
              >
                <DeleteIcon sx={{ fontSize: 22 }} />
              </IconButton>
            </Tooltip>

            <Tooltip title="Forward selected" arrow>
              <IconButton
                onClick={handleForwardSelectedMessage}
                disabled={selectedMessages.size === 0}
                sx={{ 
                  color: selectedMessages.size > 0 ? theme.palette.success.main : theme.palette.text.disabled,
                  bgcolor: selectedMessages.size > 0 ? alpha(theme.palette.success.main, 0.08) : alpha(theme.palette.text.disabled, 0.05),
                  width: 48,
                  height: 48,
                  '&:hover': {
                    bgcolor: selectedMessages.size > 0 ? alpha(theme.palette.success.main, 0.15) : alpha(theme.palette.text.disabled, 0.08),
                    transform: selectedMessages.size > 0 ? 'scale(1.05)' : 'none',
                  },
                  transition: 'all 0.2s ease',
                }}
              >
                <ForwardIcon sx={{ fontSize: 22 }} />
              </IconButton>
            </Tooltip>
          </Box>
        )}
      </Paper>

      {/* Messages Area with Enhanced Mobile Support */}
      <Box
        sx={{
          flexGrow: 1,
          overflow: 'auto',
          overflowX: 'hidden',
          position: 'relative',
          // Mobile-optimized scrolling
          WebkitOverflowScrolling: 'touch', // Smooth scrolling on iOS
          scrollBehavior: 'smooth',
          // Better touch handling on mobile
          touchAction: 'pan-y',
          background: isDarkMode 
            ? 'linear-gradient(135deg, rgba(11, 20, 26, 0.7) 0%, rgba(15, 23, 42, 0.8) 50%, rgba(30, 41, 59, 0.7) 100%)'
            : 'linear-gradient(135deg, rgba(240, 242, 245, 0.7) 0%, rgba(248, 250, 252, 0.8) 50%, rgba(241, 245, 249, 0.7) 100%)',
          backdropFilter: 'blur(15px) saturate(170%)',
          WebkitBackdropFilter: 'blur(15px) saturate(170%)',
          // Mobile-specific padding
          p: { xs: 0.5, sm: 1, md: 1.5 },
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: isDarkMode
              ? `
                radial-gradient(circle at 20% 20%, rgba(59, 130, 246, 0.08) 0%, transparent 50%),
                radial-gradient(circle at 80% 40%, rgba(139, 92, 246, 0.06) 0%, transparent 50%),
                radial-gradient(circle at 40% 80%, rgba(16, 185, 129, 0.04) 0%, transparent 50%),
                linear-gradient(135deg, rgba(255, 255, 255, 0.02) 0%, transparent 100%)
              `
              : `
                radial-gradient(circle at 20% 20%, rgba(59, 130, 246, 0.04) 0%, transparent 50%),
                radial-gradient(circle at 80% 40%, rgba(139, 92, 246, 0.03) 0%, transparent 50%),
                radial-gradient(circle at 40% 80%, rgba(16, 185, 129, 0.02) 0%, transparent 50%),
                linear-gradient(135deg, rgba(0, 0, 0, 0.02) 0%, transparent 100%)
              `,
            pointerEvents: 'none',
            zIndex: 0,
          },
          '&::after': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: isDarkMode
              ? 'url("data:image/svg+xml,%3Csvg width="60" height="60" xmlns="http://www.w3.org/2000/svg"%3E%3Cdefs%3E%3Cpattern id="glass-pattern" patternUnits="userSpaceOnUse" width="60" height="60"%3E%3Ccircle cx="30" cy="30" r="1" fill="rgba(255,255,255,0.03)"/%3E%3Ccircle cx="15" cy="15" r="0.5" fill="rgba(255,255,255,0.02)"/%3E%3Ccircle cx="45" cy="45" r="0.5" fill="rgba(255,255,255,0.02)"/%3E%3C/pattern%3E%3C/defs%3E%3Crect width="100%" height="100%" fill="url(%23glass-pattern)"/%3E%3C/svg%3E")'
              : 'url("data:image/svg+xml,%3Csvg width="60" height="60" xmlns="http://www.w3.org/2000/svg"%3E%3Cdefs%3E%3Cpattern id="glass-pattern" patternUnits="userSpaceOnUse" width="60" height="60"%3E%3Ccircle cx="30" cy="30" r="1" fill="rgba(0,0,0,0.02)"/%3E%3Ccircle cx="15" cy="15" r="0.5" fill="rgba(0,0,0,0.01)"/%3E%3Ccircle cx="45" cy="45" r="0.5" fill="rgba(0,0,0,0.01)"/%3E%3C/pattern%3E%3C/defs%3E%3Crect width="100%" height="100%" fill="url(%23glass-pattern)"/%3E%3C/svg%3E")',
            opacity: 0.6,
            pointerEvents: 'none',
            zIndex: 1,
          },
          '& > *': {
            position: 'relative',
            zIndex: 2,
          },
          // Enhanced scrollbar styling
          '&::-webkit-scrollbar': {
            width: { xs: '4px', md: '8px' },
          },
          '&::-webkit-scrollbar-track': {
            background: 'transparent',
          },
          '&::-webkit-scrollbar-thumb': {
            background: alpha(isDarkMode ? '#ffffff' : '#000000', 0.2),
            borderRadius: '10px',
            border: 'none',
            '&:hover': {
              background: alpha(isDarkMode ? '#ffffff' : '#000000', 0.3),
            },
          },
          '&::-webkit-scrollbar-corner': {
            background: 'transparent',
          },
          // Firefox scrollbar
          scrollbarWidth: 'thin',
          scrollbarColor: `${alpha(isDarkMode ? '#ffffff' : '#000000', 0.2)} transparent`,
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
          </Box>
        ) : (
          <Box sx={{ 
            pb: 2, 
            px: isMobile ? 1 : 2,
            display: 'flex',
            flexDirection: 'column',
            gap: 0.5,
            width: '100%',
            maxWidth: '100%',
            overflowX: 'hidden',
          }}>
            {roomMessages.map((message: Message, index: number) => {
              const prevMessage = index > 0 ? roomMessages[index - 1] : null;
              const nextMessage = index < roomMessages.length - 1 ? roomMessages[index + 1] : null;
              
              const showAvatar = !prevMessage || 
                prevMessage.sender._id !== message.sender._id ||
                new Date(message.createdAt).getTime() - new Date(prevMessage.createdAt).getTime() > 300000;
              
              const isConsecutive = nextMessage && 
                nextMessage.sender._id === message.sender._id &&
                new Date(nextMessage.createdAt).getTime() - new Date(message.createdAt).getTime() <= 300000;
              
              return (
                <Box 
                  key={`${message._id}-${index}`}
                  sx={{
                    width: '100%',
                    display: 'flex',
                    justifyContent: user?.id === message.sender._id ? 'flex-end' : 'flex-start',
                    mb: isConsecutive ? 0.25 : 0.75,
                    px: { xs: 1, sm: 2 },
                  }}
                >
                  <MessageComponent
                    message={message}
                    showAvatar={showAvatar}
                    currentUserId={user?.id}
                    onReply={handleReply}
                    isSelected={selectedMessages.has(message._id)}
                    isSelectionMode={isMessageSelectionMode}
                  />
                </Box>
              );
            })}
            
            {/* Typing Indicator */}
            {roomTypingUsers.length > 0 && (
              <Box sx={{
                display: 'flex',
                justifyContent: 'flex-start',
                px: 0,
                mt: 0.5,
              }}>
                <TypingIndicator users={roomTypingUsers} />
              </Box>
            )}
            
            <div ref={messagesEndRef} />
            </Box>
          )}
        </Box>

      {/* Fixed Bottom Message Input Area */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: 0,
          borderTop: `1px solid ${alpha(isDarkMode ? '#ffffff' : '#000000', 0.1)}`,
          background: isDarkMode 
            ? 'rgba(32, 44, 51, 0.95)'
            : 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px) saturate(150%)',
          WebkitBackdropFilter: 'blur(10px) saturate(150%)',
          position: 'sticky', // Changed from relative to sticky
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 1000, // High z-index to stay on top
          overflow: 'hidden',
          maxWidth: '100%',
          minHeight: { xs: 60, md: 'auto' }, // Consistent minimum height
          // Safe area insets for mobile notches
          paddingBottom: { xs: 'max(env(safe-area-inset-bottom, 0px), 8px)', md: 0 },
          transition: 'all 0.2s ease',
          boxShadow: isDarkMode 
            ? '0 -2px 8px rgba(0, 0, 0, 0.3)'
            : '0 -2px 8px rgba(0, 0, 0, 0.1)',
        }}
      >
        {/* Reply Bar */}
        {replyingTo && (
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
                  Replying to {replyingTo?.sender?.name || 'Unknown User'}
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
        )}

        {/* Attached Files Preview */}
        {attachedFiles.length > 0 && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              p: 1.5,
              mx: 2,
              mt: 1,
              bgcolor: alpha(theme.palette.warning.main, 0.08),
              borderRadius: 2,
              borderLeft: `4px solid ${theme.palette.warning.main}`,
              gap: 1,
            }}
          >
              <AttachFileIcon color="warning" fontSize="small" />
              <Typography variant="body2" sx={{ flex: 1, color: isDarkMode ? '#e9edef' : 'text.primary' }}>
                {attachedFiles.length} file{attachedFiles.length > 1 ? 's' : ''} attached
              </Typography>
              <Tooltip title="Preview files">
                <IconButton 
                  size="small" 
                  onClick={() => setFilePreviewOpen(true)}
                  sx={{ color: theme.palette.warning.main }}
                >
                  <FileIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Remove all files">
                <IconButton 
                  size="small" 
                  onClick={() => setAttachedFiles([])}
                  sx={{ 
                    color: theme.palette.error.main,
                    '&:hover': { bgcolor: alpha(theme.palette.error.main, 0.1) }
                  }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
        )}

        {/* Compact Input Form */}
        <Box 
          component="form" 
          onSubmit={handleMessageSubmit} 
          sx={{ 
            p: { xs: 8, sm: 12, md: 16 }, // Reduced padding significantly
            maxWidth: '100%',
            overflow: 'hidden',
          }}
        >
          <Box 
            sx={{ 
              display: 'flex', 
              alignItems: 'flex-end',
              gap: 1,
              width: '100%',
            }}
          >
            {/* Emoji Button */}
            <Tooltip title="Emoji">
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
            </Tooltip>

            {/* Message Input */}
            <TextField
              fullWidth
              multiline
              maxRows={3}
              placeholder="Type a message..."
              value={messageInput}
              onChange={handleInputChange}
              variant="outlined"
              size="small"
              inputRef={inputRef}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="sentences"
              inputMode="text"
              className={isMobile ? 'mobile-input' : ''}
              onTouchStart={() => {
                if (isMobile && inputRef.current) {
                  inputRef.current.focus();
                }
              }}
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
            <Tooltip title="Attach file">
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
            </Tooltip>

            {/* Send or Voice Button */}
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
            ) : (
              <Tooltip title="Voice message">
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
              </Tooltip>
            )}
          </Box>
        </Box>
        
        {/* Character count */}
        {messageInput.length > UI_CONSTANTS.MAX_MESSAGE_LENGTH * 0.7 && (
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

        {/* File Preview Dialog */}
        <Dialog
          open={filePreviewOpen}
          onClose={() => setFilePreviewOpen(false)}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              bgcolor: isDarkMode ? '#2a3942' : 'background.paper',
              borderRadius: 2,
            }
          }}
        >
          <DialogTitle sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1,
            color: isDarkMode ? '#e9edef' : 'text.primary',
          }}>
            <AttachFileIcon />
            Send Files ({attachedFiles.length})
          </DialogTitle>
          
          <DialogContent>
            <List>
              {attachedFiles.map((file, index) => {
                const isImage = file.type.startsWith('image/');
                const isDocument = file.type.includes('pdf') || file.type.includes('document') || file.type.includes('text');
                
                return (
                  <ListItem 
                    key={`${file.name}-${file.size}-${index}`}
                    sx={{ 
                      bgcolor: alpha(theme.palette.primary.main, 0.05),
                      borderRadius: 1,
                      mb: 1,
                    }}
                  >
                    <ListItemIcon>
                      {isImage ? (
                        <ImageIcon color="primary" />
                      ) : isDocument ? (
                        <DocumentIcon color="primary" />
                      ) : (
                        <FileIcon color="primary" />
                      )}
                    </ListItemIcon>
                    <ListItemText
                      primary={file.name}
                      secondary={formatFileSize(file.size)}
                      primaryTypographyProps={{
                        sx: { 
                          color: isDarkMode ? '#e9edef' : 'text.primary',
                          fontWeight: 500,
                        }
                      }}
                      secondaryTypographyProps={{
                        sx: { color: isDarkMode ? '#8696a0' : 'text.secondary' }
                      }}
                    />
                    <ListItemSecondaryAction>
                      <IconButton 
                        edge="end" 
                        onClick={() => handleRemoveFile(index)}
                        size="small"
                        sx={{ 
                          color: 'error.main',
                          '&:hover': { bgcolor: alpha(theme.palette.error.main, 0.1) }
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                );
              })}
            </List>
            
            {messageInput.trim() && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1, color: isDarkMode ? '#e9edef' : 'text.primary' }}>
                  Message:
                </Typography>
                <Paper 
                  sx={{ 
                    p: 2, 
                    bgcolor: alpha(theme.palette.primary.main, 0.05),
                    borderRadius: 1,
                  }}
                >
                  <Typography 
                    variant="body2" 
                    sx={{ color: isDarkMode ? '#e9edef' : 'text.primary' }}
                  >
                    {messageInput}
                  </Typography>
                </Paper>
              </Box>
            )}
          </DialogContent>
          
          <DialogActions sx={{ p: 2, gap: 1 }}>
            <Button 
              onClick={() => setFilePreviewOpen(false)}
              sx={{ color: isDarkMode ? '#8696a0' : 'text.secondary' }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSendWithFiles}
              variant="contained"
              startIcon={<SendIcon />}
              disabled={attachedFiles.length === 0}
              sx={{
                bgcolor: theme.palette.primary.main,
                '&:hover': { bgcolor: theme.palette.primary.dark },
                borderRadius: 2,
              }}
            >
              Send
            </Button>
          </DialogActions>
        </Dialog>

        {/* Header Menu */}
        <Menu
          anchorEl={headerMenuAnchor}
          open={Boolean(headerMenuAnchor)}
          onClose={handleHeaderMenuClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          PaperProps={{
            sx: {
              bgcolor: isDarkMode ? '#2a3942' : 'background.paper',
              borderRadius: 2,
              minWidth: 200,
            }
          }}
        >
          <MenuItem 
            onClick={handleDeleteAllMessages}
            sx={{ 
              color: 'error.main',
              '&:hover': { 
                bgcolor: alpha(theme.palette.error.main, 0.1) 
              }
            }}
          >
            <ListItemIcon>
              <DeleteSweepIcon fontSize="small" color="error" />
            </ListItemIcon>
            <ListItemText>Delete All Messages</ListItemText>
          </MenuItem>
        </Menu>

        {/* Delete All Messages Confirmation Dialog */}
        <Dialog
          open={deleteAllDialogOpen}
          onClose={() => setDeleteAllDialogOpen(false)}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              bgcolor: isDarkMode ? '#2a3942' : 'background.paper',
              borderRadius: 2,
            }
          }}
        >
          <DialogTitle sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1,
            color: isDarkMode ? '#e9edef' : 'text.primary',
          }}>
            <DeleteSweepIcon color="error" />
            Delete All Messages
          </DialogTitle>
          
          <DialogContent>
            <Typography sx={{ color: isDarkMode ? '#e9edef' : 'text.primary' }}>
              Are you sure you want to permanently delete all messages in this conversation? 
              This action will completely remove all messages from the database and cannot be undone. 
              All participants will see an empty conversation.
            </Typography>
            <Typography sx={{ 
              color: isDarkMode ? '#8696a0' : 'text.secondary', 
              mt: 2, 
              fontStyle: 'italic',
              fontSize: '0.9rem' 
            }}>
              Note: This is different from deleting individual messages, which show "This message was deleted". 
              Clear All will completely remove all message history.
            </Typography>
          </DialogContent>
          
          <DialogActions sx={{ p: 2, gap: 1 }}>
            <Button 
              onClick={() => setDeleteAllDialogOpen(false)}
              sx={{ color: isDarkMode ? '#8696a0' : 'text.secondary' }}
            >
              Cancel
            </Button>
            <Button 
              onClick={confirmDeleteAllMessages}
              variant="contained"
              color="error"
              startIcon={<DeleteSweepIcon />}
              sx={{
                '&:hover': { bgcolor: theme.palette.error.dark },
                borderRadius: 2,
              }}
            >
              Delete All
            </Button>
          </DialogActions>
        </Dialog>

        {/* Forward Message Dialog */}
        <Dialog
          open={forwardDialogOpen}
          onClose={() => setForwardDialogOpen(false)}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              bgcolor: isDarkMode ? 'grey.900' : 'background.paper',
              color: isDarkMode ? 'white' : 'text.primary',
              borderRadius: 3,
            }
          }}
        >
          <DialogTitle sx={{ 
            color: isDarkMode ? 'white' : 'text.primary',
            borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          }}>
            Forward Message To
          </DialogTitle>
          <DialogContent sx={{ p: 0 }}>
            <List>
              {rooms
                .filter(room => room && room._id !== currentRoom) // Don't show current room and filter null rooms
                .map((room) => {
                  if (!room || !room.name) return null; // Skip rooms with missing data
                  
                  return (
                    <ListItem 
                      key={room._id}
                      onClick={() => handleForwardToRoom(room._id)}
                      sx={{ 
                        cursor: 'pointer',
                        '&:hover': { 
                          bgcolor: alpha(theme.palette.primary.main, 0.1),
                        },
                        borderBottom: `1px solid ${alpha(theme.palette.divider, 0.05)}`,
                      }}
                    >
                      <ListItemIcon>
                        <Avatar sx={{ 
                          width: 40, 
                          height: 40,
                          bgcolor: theme.palette.primary.main,
                        }}>
                          {room.type === 'group' ? <GroupIcon /> : (room.name || 'U').charAt(0).toUpperCase()}
                        </Avatar>
                      </ListItemIcon>
                      <ListItemText 
                        primary={room.name || 'Unknown Room'}
                        secondary={room.type === 'group' ? `${room.members?.length || 0} members` : 'Direct message'}
                        primaryTypographyProps={{
                          color: isDarkMode ? 'white' : 'text.primary',
                          fontWeight: 500,
                        }}
                        secondaryTypographyProps={{
                          color: isDarkMode ? 'grey.400' : 'text.secondary',
                        }}
                      />
                    </ListItem>
                  );
                })}
            </List>
          </DialogContent>
          <DialogActions sx={{ 
            p: 2,
            borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          }}>
            <Button 
              onClick={() => setForwardDialogOpen(false)}
              sx={{ color: isDarkMode ? 'grey.300' : 'text.secondary' }}
            >
              Cancel
            </Button>
          </DialogActions>
        </Dialog>
      </Paper>
    </Box>
  );
};

export default ChatArea;