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
  Divider,
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
  CheckCircle as CheckCircleIcon,
  InsertDriveFile as FileIcon,
  Image as ImageIcon,
  Description as DocumentIcon,
  Delete as DeleteIcon,
  DeleteSweep as DeleteSweepIcon,
  Reply as ReplyIcon,
  ContentCopy as CopyIcon,
  Forward as ForwardIcon,
  SelectAll as SelectAllIcon,
  CheckBox as CheckBoxIcon,
  CheckBoxOutlineBlank as CheckBoxOutlineBlankIcon,
} from '@mui/icons-material';
import { useChat } from '../contexts/ChatContext';
import { useAuth } from '../contexts/AuthContext';
import { useWhatsAppTheme } from '../contexts/ThemeContext';
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
  const { isDarkMode } = useWhatsAppTheme();
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
      const fileInfo = {
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified,
      };
      
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

  // Message selection handlers
  const handleMessageLongPress = (message: Message) => {
    // Long press no longer triggers selection - it's handled by the MessageComponent's context menu
    // This handler can be removed or used for other purposes
  };

  const handleMessageDoubleClick = (message: Message) => {
    // Double click triggers message selection
    setSelectedMessage(message);
    setSelectedMessages(new Set([message._id]));
    setIsMessageSelectionMode(true);
  };

  const handleMessageClick = (message: Message) => {
    // Only handle clicks when already in selection mode
    if (!isMessageSelectionMode) return;
    
    const newSelectedMessages = new Set(selectedMessages);
    if (newSelectedMessages.has(message._id)) {
      newSelectedMessages.delete(message._id);
    } else {
      newSelectedMessages.add(message._id);
    }
    setSelectedMessages(newSelectedMessages);
    
    // If no messages selected, exit selection mode
    if (newSelectedMessages.size === 0) {
      handleExitSelectionMode();
    } else {
      // Update the primary selected message to the most recently selected
      setSelectedMessage(message);
    }
  };

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

  const handleReplyToSelected = () => {
    if (selectedMessage) {
      setReplyingTo(selectedMessage);
      handleExitSelectionMode();
      // Focus the input field
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 100);
    }
  };

  const handleCopySelectedMessage = () => {
    if (selectedMessage) {
      navigator.clipboard.writeText(selectedMessage.content);
      handleExitSelectionMode();
      // You could show a toast notification here
    }
  };

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
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: isDarkMode ? '#0b141a' : '#f0f2f5',
        backgroundImage: isDarkMode 
          ? 'url("data:image/svg+xml,%3Csvg width="100" height="100" xmlns="http://www.w3.org/2000/svg"%3E%3Cdefs%3E%3Cpattern id="a" patternUnits="userSpaceOnUse" width="100" height="100"%3E%3Cpath d="M0 0h100v100H0z" fill="%23182229"/%3E%3C/pattern%3E%3C/defs%3E%3Crect width="100%" height="100%" fill="url(%23a)"/%3E%3C/svg%3E")'
          : 'url("data:image/svg+xml,%3Csvg width="100" height="100" xmlns="http://www.w3.org/2000/svg"%3E%3Cdefs%3E%3Cpattern id="a" patternUnits="userSpaceOnUse" width="100" height="100"%3E%3Cpath d="M0 0h100v100H0z" fill="%23ffffff"/%3E%3C/pattern%3E%3C/defs%3E%3Crect width="100%" height="100%" fill="url(%23a)"/%3E%3C/svg%3E")',
        overflow: 'hidden', // Prevent horizontal scrolling
        maxWidth: '100%', // Ensure no overflow
      }}
    >
      {/* Professional Chat Header */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          borderRadius: 0,
          borderBottom: `1px solid ${theme.palette.divider}`,
          backgroundColor: isMessageSelectionMode 
            ? alpha(theme.palette.primary.main, 0.1)
            : theme.palette.background.paper,
          color: isMessageSelectionMode 
            ? theme.palette.primary.main 
            : theme.palette.text.primary,
          position: 'relative',
          overflow: 'hidden',
          borderLeft: isMessageSelectionMode ? `3px solid ${theme.palette.primary.main}` : 'none',
        }}
      >
        {/* Mobile-Optimized Header Layout */}
        <Box sx={{ 
          display: 'flex', 
          flexDirection: isMobile ? 'column' : 'row', 
          gap: isMobile ? 1 : 2 
        }}>
          {/* Main Header Row */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
            {/* Back Button for Mobile */}
            <Tooltip title="Back to chats">
              <IconButton
                size="small"
                onClick={onBackClick}
                sx={{ 
                  display: { xs: 'flex', md: 'none' },
                  color: 'inherit',
                  width: isMobile ? 36 : 40,
                  height: isMobile ? 36 : 40,
                  '&:hover': {
                    bgcolor: theme.palette.action.hover,
                  },
                }}
              >
                <ArrowBackIcon sx={{ fontSize: isMobile ? 18 : 20 }} />
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
                    width: isMobile ? 40 : 48, 
                    height: isMobile ? 40 : 48,
                    fontSize: isMobile ? '1rem' : '1.2rem',
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
                    : <GroupIcon sx={{ fontSize: isMobile ? 18 : 20 }} />
                  }
                </Avatar>
              </Zoom>
              
              {/* Online Status Indicator */}
              {room?.type === 'direct' && otherUser?.isOnline && (
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: 1,
                    right: 1,
                    width: isMobile ? 10 : 14,
                    height: isMobile ? 10 : 14,
                    borderRadius: '50%',
                    bgcolor: '#4caf50',
                    border: `2px solid ${theme.palette.background.paper}`,
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
              <Typography 
                variant={isMobile ? "body1" : "h6"} 
                sx={{ 
                  fontWeight: isMessageSelectionMode ? 700 : 600,
                  fontSize: isMobile ? (isMessageSelectionMode ? '1.1rem' : '0.95rem') : '1.1rem',
                  color: isMessageSelectionMode 
                    ? theme.palette.primary.main
                    : 'inherit',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  cursor: 'pointer',
                  '&:hover': {
                    color: theme.palette.primary.main,
                  },
                  transition: 'color 0.2s ease',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {isMessageSelectionMode 
                  ? selectedMessages.size > 0 
                    ? `${selectedMessages.size} selected`
                    : "Select messages"
                  : (room?.type === 'direct' ? otherUser?.name : room?.name)
                }
                {room?.type === 'group' && !isMessageSelectionMode && !isMobile && (
                  <Chip 
                    label={`${room.members.length} members`}
                    size="small"
                    sx={{ 
                      height: 20,
                      fontSize: '0.65rem',
                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                      color: theme.palette.primary.main,
                      fontWeight: 500,
                    }}
                  />
                )}
                {room?.type === 'direct' && otherUser?.isOnline && !isMobile && (
                  <CheckCircleIcon sx={{ fontSize: 14, color: '#4caf50' }} />
                )}
              </Typography>
              
              {!isMessageSelectionMode && (
                <Typography 
                  variant="caption" 
                  sx={{ 
                    color: alpha(isDarkMode ? '#e9edef' : '#111b21', 0.7),
                    fontSize: isMobile ? '0.7rem' : '0.8rem',
                    display: 'block',
                    fontWeight: 500,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
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
                    isMobile 
                      ? `${room?.members?.length || 0} members`
                      : `${room?.members?.filter(m => m?.user?.name).map(m => m.user.name).slice(0, 3).join(', ')}${(room?.members?.length || 0) > 3 ? `... and ${(room?.members?.length || 0) - 3} more` : ''}`
                  )}
                </Typography>
              )}
            </Box>

            {/* Desktop Actions */}
            {!isMobile && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {!isMessageSelectionMode && (
                  <>
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
                        onClick={handleHeaderMenuClick}
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
                </>
              )}
            </Box>
          )}
          </Box>
          
          {/* Mobile Action Bar - Stacked Below Main Header */}
          {isMobile && (
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: isMessageSelectionMode ? 'center' : 'flex-end',
              gap: 1,
              mt: 0.5
            }}>
              {isMessageSelectionMode ? (
                // Mobile Selection Bar
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    borderRadius: 3,
                    px: 3,
                    py: 1,
                    backgroundColor: alpha(theme.palette.primary.main, 0.08),
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
                    width: '100%',
                    maxWidth: 400,
                  }}
                >
                  {/* Mobile Action Buttons */}
                  <Tooltip title={selectedMessages.size === (messages[currentRoom!]?.length || 0) ? "Deselect all" : "Select all"}>
                    <IconButton
                      size="small"
                      onClick={selectedMessages.size === (messages[currentRoom!]?.length || 0) ? handleDeselectAllMessages : handleSelectAllMessages}
                      sx={{ 
                        color: theme.palette.primary.main,
                        width: 42,
                        height: 42,
                        '&:hover': {
                          backgroundColor: alpha(theme.palette.primary.main, 0.12),
                        },
                      }}
                    >
                      {selectedMessages.size === (messages[currentRoom!]?.length || 0) ? 
                        <CheckBoxIcon sx={{ fontSize: 20 }} /> : 
                        <CheckBoxOutlineBlankIcon sx={{ fontSize: 20 }} />
                      }
                    </IconButton>
                  </Tooltip>

                  <Tooltip title="Delete selected">
                    <IconButton
                      size="small"
                      onClick={handleDeleteSelectedMessage}
                      disabled={selectedMessages.size === 0}
                      sx={{ 
                        color: selectedMessages.size > 0 ? theme.palette.error.main : theme.palette.text.disabled,
                        width: 42,
                        height: 42,
                        '&:hover': {
                          backgroundColor: selectedMessages.size > 0 ? alpha(theme.palette.error.main, 0.08) : 'transparent',
                        },
                      }}
                    >
                      <DeleteIcon sx={{ fontSize: 20 }} />
                    </IconButton>
                  </Tooltip>

                  <Tooltip title="Forward selected">
                    <IconButton
                      size="small"
                      onClick={handleForwardSelectedMessage}
                      disabled={selectedMessages.size === 0}
                      sx={{ 
                        color: selectedMessages.size > 0 ? theme.palette.success.main : theme.palette.text.disabled,
                        width: 42,
                        height: 42,
                        '&:hover': {
                          backgroundColor: selectedMessages.size > 0 ? alpha(theme.palette.success.main, 0.08) : 'transparent',
                        },
                      }}
                    >
                      <ForwardIcon sx={{ fontSize: 20 }} />
                    </IconButton>
                  </Tooltip>

                  {/* Spacer */}
                  <Box sx={{ flexGrow: 1 }} />

                  <Tooltip title="Exit selection">
                    <IconButton
                      size="small"
                      onClick={handleExitSelectionMode}
                      sx={{ 
                        color: theme.palette.text.secondary,
                        width: 42,
                        height: 42,
                        '&:hover': {
                          backgroundColor: theme.palette.action.hover,
                        },
                      }}
                    >
                      <CloseIcon sx={{ fontSize: 20 }} />
                    </IconButton>
                  </Tooltip>
                </Box>
              ) : (
                // Mobile Normal Actions
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Tooltip title="Voice call">
                    <IconButton
                      size="small"
                      sx={{ 
                        color: 'inherit',
                        width: 40,
                        height: 40,
                        '&:hover': {
                          bgcolor: alpha(theme.palette.primary.main, 0.1),
                          color: theme.palette.primary.main,
                        },
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <PhoneIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                  </Tooltip>

                  <Tooltip title="Video call">
                    <IconButton
                      size="small"
                      sx={{ 
                        color: 'inherit',
                        width: 40,
                        height: 40,
                        '&:hover': {
                          bgcolor: alpha(theme.palette.primary.main, 0.1),
                          color: theme.palette.primary.main,
                        },
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <VideoCallIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                  </Tooltip>
                  
                  <Tooltip title="More options">
                    <IconButton
                      size="small"
                      onClick={handleHeaderMenuClick}
                      sx={{ 
                        color: 'inherit',
                        width: 40,
                        height: 40,
                        '&:hover': {
                          bgcolor: alpha(theme.palette.primary.main, 0.1),
                          color: theme.palette.primary.main,
                        },
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <MoreIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                  </Tooltip>
                </Box>
              )}
            </Box>
          )}
        </Box>
      </Paper>

      {/* Messages Area with Enhanced Styling */}
      <Box
        sx={{
          flexGrow: 1,
          overflow: 'auto',
          overflowX: 'hidden', // Prevent horizontal scrolling
          p: 1,
          maxWidth: '100%', // Ensure no overflow
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
          <Box sx={{ pb: 2 }}>
            {roomMessages.map((message: Message, index: number) => {
              const prevMessage = index > 0 ? roomMessages[index - 1] : null;
              const showAvatar = !prevMessage || 
                prevMessage.sender._id !== message.sender._id ||
                new Date(message.createdAt).getTime() - new Date(prevMessage.createdAt).getTime() > 300000;
              
              return (
                <Box key={`${message._id}-${index}`}>
                  <MessageComponent
                    message={message}
                    showAvatar={showAvatar}
                    currentUserId={user?.id}
                    onReply={handleReply}
                    onLongPress={handleMessageLongPress}
                    onClick={handleMessageClick}
                    onDoubleClick={handleMessageDoubleClick}
                    isSelected={selectedMessages.has(message._id)}
                    isSelectionMode={isMessageSelectionMode}
                  />
                </Box>
              );
            })}
            
            {/* Typing Indicator */}
            {roomTypingUsers.length > 0 && (
              <Box>
                <TypingIndicator users={roomTypingUsers} />
              </Box>
            )}
            
            <div ref={messagesEndRef} />
            </Box>
          )}
        </Box>      {/* Modern Message Input */}
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
          overflow: 'hidden', // Prevent horizontal scrolling
          maxWidth: '100%', // Ensure no overflow
          minHeight: { xs: 60, md: 'auto' }, // Smaller on mobile
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

        {/* Input Form */}
        <Box component="form" onSubmit={handleMessageSubmit} sx={{ p: { xs: 1, md: 2 }, overflow: 'hidden', maxWidth: '100%' }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: { xs: 0.5, md: 1 }, overflow: 'hidden', maxWidth: '100%' }}>
            {/* Emoji Button */}
            <Tooltip title="Emoji">
              <IconButton
                size="small"
                sx={{ 
                  color: 'text.secondary',
                  mb: 0.2,
                  minWidth: { xs: 36, md: 40 },
                  height: { xs: 36, md: 40 },
                  '&:hover': {
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    color: theme.palette.primary.main,
                    transform: 'scale(1.1)',
                  },
                  transition: 'all 0.2s ease',
                }}
              >
                <EmojiIcon fontSize={isMobile ? 'small' : 'medium'} />
              </IconButton>
            </Tooltip>

            {/* Message Input */}
            <TextField
              fullWidth
              multiline
              maxRows={isMobile ? 3 : 4}
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
              onTouchStart={() => {
                // Ensure input gets focus on mobile touch
                if (isMobile && inputRef.current) {
                  inputRef.current.focus();
                }
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: { xs: 20, md: 6 },
                  minHeight: { xs: 40, md: 48 },
                  backgroundColor: isDarkMode 
                    ? '#374151' 
                    : '#f9fafb',
                  '& fieldset': {
                    border: `1px solid ${isDarkMode ? '#4b5563' : '#d1d5db'}`,
                  },
                  '&:hover': {
                    '& fieldset': {
                      border: `1px solid ${isDarkMode ? '#6b7280' : '#9ca3af'}`,
                    },
                    transform: 'scale(1.01)',
                  },
                  '&.Mui-focused': {
                    '& fieldset': {
                      border: `2px solid #3b82f6`,
                    },
                    boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)',
                  },
                  '& .MuiInputBase-input': {
                    py: { xs: 1, md: 2 },
                    px: { xs: 2, md: 2 },
                    fontSize: { xs: '0.9rem', md: '0.95rem' },
                    color: isDarkMode ? '#ffffff' : '#374151',
                    fontWeight: 400,
                    lineHeight: 1.4,
                    '&::placeholder': {
                      color: alpha(theme.palette.text.secondary, 0.6),
                      fontStyle: 'italic',
                    },
                    // Mobile-specific touch optimizations
                    WebkitAppearance: 'none',
                    WebkitUserSelect: 'text',
                    WebkitTouchCallout: 'default',
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
                  color: 'text.secondary',
                  mb: 0.2,
                  minWidth: { xs: 36, md: 40 },
                  height: { xs: 36, md: 40 },
                  '&:hover': {
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    color: theme.palette.primary.main,
                    transform: 'rotate(15deg) scale(1.1)',
                  },
                  transition: 'all 0.3s ease',
                }}
              >
                <AttachFileIcon fontSize={isMobile ? 'small' : 'medium'} />
              </IconButton>
            </Tooltip>

            {/* Send or Voice Button */}
            {messageInput.trim() || attachedFiles.length > 0 ? (
              <Zoom in timeout={200}>
                <IconButton
                  type="submit"
                  sx={{
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    width: { xs: 40, md: 48 },
                    height: { xs: 40, md: 48 },
                    minWidth: { xs: 40, md: 48 },
                    borderRadius: '50%',
                    '&:hover': {
                      backgroundColor: '#2563eb',
                      transform: 'scale(1.05)',
                      boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
                    },
                    '&:active': {
                      transform: 'scale(0.95)',
                    },
                    transition: 'all 0.2s ease',
                    boxShadow: '0 2px 8px rgba(59, 130, 246, 0.2)',
                  }}
                >
                  <SendIcon fontSize={isMobile ? 'small' : 'medium'} />
                </IconButton>
              </Zoom>
            ) : (
              <Tooltip title="Voice message">
                <IconButton
                  sx={{ 
                    color: 'text.secondary',
                    width: { xs: 40, md: 48 },
                    height: { xs: 40, md: 48 },
                    minWidth: { xs: 40, md: 48 },
                    '&:hover': {
                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                      color: theme.palette.primary.main,
                      transform: 'scale(1.05)',
                    },
                    transition: 'all 0.2s ease',
                  }}
                >
                  <MicIcon fontSize={isMobile ? 'small' : 'medium'} />
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