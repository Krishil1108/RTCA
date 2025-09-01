import React, { useState } from 'react';
import {
  Box,
  Avatar,
  Typography,
  Paper,
  IconButton,
  Chip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Tooltip,
} from '@mui/material';
import {
  MoreVert as MoreIcon,
  Reply as ReplyIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ContentCopy as CopyIcon,
  Close as CloseIcon,
  CheckBox as CheckBoxIcon,
  CheckBoxOutlineBlank as CheckBoxOutlineBlankIcon,
} from '@mui/icons-material';
import { useWhatsAppTheme } from '../contexts/ThemeContext';
import { useChat } from '../contexts/ChatContext';
import { Message } from '../services/chatService';

interface MessageComponentProps {
  message: Message;
  currentUserId?: string;
  showAvatar?: boolean;
  onReply?: (message: Message) => void;
  onLongPress?: (message: Message) => void;
  onClick?: (message: Message) => void;
  onDoubleClick?: (message: Message) => void;
  isSelected?: boolean;
  isSelectionMode?: boolean;
}

const MessageComponent: React.FC<MessageComponentProps> = ({
  message,
  currentUserId,
  showAvatar = true,
  onReply,
  onLongPress,
  onClick,
  onDoubleClick,
  isSelected = false,
  isSelectionMode = false,
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const [isEditing, setIsEditing] = useState(false);
  
  // Swipe detection state
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [touchEnd, setTouchEnd] = useState<{ x: number; y: number } | null>(null);
  const [isReplyAnimating, setIsReplyAnimating] = useState(false);
  const [swipeProgress, setSwipeProgress] = useState(0);
  
  // Long press state
  const [isLongPressing, setIsLongPressing] = useState(false);
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
  const [longPressProgress, setLongPressProgress] = useState(0);
  const [clickCount, setClickCount] = useState(0);
  const [clickTimer, setClickTimer] = useState<NodeJS.Timeout | null>(null);
  
  const { isDarkMode } = useWhatsAppTheme();
  const { editMessage, deleteMessage } = useChat();

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleReply = () => {
    if (onReply) {
      onReply(message);
    }
    handleMenuClose();
  };

  // Swipe detection functions
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY,
    });
    
    // Start long press detection
    handleLongPressStart(e);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const currentTouch = {
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY,
    };
    setTouchEnd(currentTouch);

    // Calculate swipe progress for visual feedback
    if (touchStart) {
      const deltaX = currentTouch.x - touchStart.x;
      const deltaY = currentTouch.y - touchStart.y;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      
      // Cancel long press if user moves too much (more than 10px)
      if (distance > 10) {
        handleLongPressCancel();
      }
      
      const maxSwipeDistance = 100;
      const progress = Math.min(Math.abs(deltaX) / maxSwipeDistance, 1);
      
      // Only show progress for valid swipe directions
      const isValidSwipe = (!isOwnMessage && deltaX > 0) || (isOwnMessage && deltaX < 0);
      setSwipeProgress(isValidSwipe ? progress : 0);
    }
  };

  const handleTouchEnd = () => {
    // End long press
    handleLongPressEnd();
    
    if (!touchStart || !touchEnd) {
      setSwipeProgress(0);
      return;
    }

    const deltaX = touchEnd.x - touchStart.x;
    const deltaY = touchEnd.y - touchStart.y;
    const minSwipeDistance = 50;
    const maxVerticalDistance = 100;

    // Check if it's a horizontal swipe (not vertical)
    if (Math.abs(deltaY) > maxVerticalDistance) {
      setSwipeProgress(0);
      return;
    }

    // Check swipe direction and distance
    const isLeftSwipe = deltaX < -minSwipeDistance;
    const isRightSwipe = deltaX > minSwipeDistance;

    // Reply logic based on message ownership and swipe direction
    if (
      (!isOwnMessage && isRightSwipe) || // Other's message: swipe right to reply
      (isOwnMessage && isLeftSwipe)      // Own message: swipe left to reply
    ) {
      setIsReplyAnimating(true);
      setTimeout(() => {
        handleReply();
        setIsReplyAnimating(false);
      }, 200);
    }

    // Reset touch state
    setTouchStart(null);
    setTouchEnd(null);
    setSwipeProgress(0);
  };

  // Mouse events for desktop long press
  const handleMouseDown = (e: React.MouseEvent) => {
    // Only handle left mouse button
    if (e.button === 0) {
      handleLongPressStart(e);
    }
  };

  const handleMouseUp = () => {
    handleLongPressEnd();
  };

  const handleMouseLeave = () => {
    handleLongPressCancel();
  };

  // Long press handlers
  const handleLongPressStart = (event: React.TouchEvent | React.MouseEvent) => {
    // Only prevent default for mouse events, not touch events
    if (event.type === 'mousedown') {
      event.preventDefault();
    }
    
    setIsLongPressing(true);
    setLongPressProgress(0);

    // Light haptic feedback when starting long press
    if (navigator.vibrate) {
      navigator.vibrate(20);
    }

    let progress = 0;
    const progressInterval = setInterval(() => {
      progress += 100 / 4; // 4 intervals over 0.2 seconds (50ms each)
      setLongPressProgress(Math.min(progress, 100));
      
      if (progress >= 100) {
        clearInterval(progressInterval);
      }
    }, 50);

    const timer = setTimeout(() => {
      clearInterval(progressInterval);
      setIsLongPressing(false);
      setLongPressProgress(0);
      
      // Stronger haptic feedback when action triggers
      if (navigator.vibrate) {
        navigator.vibrate(75);
      }
      
      // Open context menu on long press
      const target = event.currentTarget as HTMLElement;
      setAnchorEl(target);
    }, 200);

    setLongPressTimer(timer);
  };

  const handleLongPressEnd = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
    setIsLongPressing(false);
    setLongPressProgress(0);
  };

  const handleLongPressCancel = () => {
    handleLongPressEnd();
  };

  // Clean up on unmount
  React.useEffect(() => {
    return () => {
      if (longPressTimer) {
        clearTimeout(longPressTimer);
      }
      if (clickTimer) {
        clearTimeout(clickTimer);
      }
    };
  }, [longPressTimer, clickTimer]);

  const handleEdit = () => {
    setEditContent(message.content);
    setEditDialogOpen(true);
    handleMenuClose();
  };

  const handleEditSave = async () => {
    if (editContent.trim() && editContent.trim() !== message.content) {
      setIsEditing(true);
      try {
        editMessage(message._id, editContent.trim());
        setEditDialogOpen(false);
      } catch (error) {
        console.error('Failed to edit message:', error);
      } finally {
        setIsEditing(false);
      }
    } else {
      setEditDialogOpen(false);
    }
  };

  const handleEditCancel = () => {
    setEditContent(message.content);
    setEditDialogOpen(false);
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this message?')) {
      deleteMessage(message._id);
    }
    handleMenuClose();
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(message.content);
    handleMenuClose();
  };

  const isSystemMessage = message.messageType === 'system';
  const isDeletedMessage = message.messageType === 'deleted';
  const isOwnMessage = currentUserId && message.sender._id === currentUserId;

  // Check if message can be edited/deleted (within 24 hours)
  const messageAge = Date.now() - new Date(message.createdAt).getTime();
  const maxEditTime = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
  const canEditDelete = isOwnMessage && messageAge <= maxEditTime && !isDeletedMessage;

  if (isSystemMessage) {
    return (
      <Box sx={{ my: 1, textAlign: 'center' }}>
        <Chip
          label={message.content}
          size="small"
          variant="outlined"
          sx={{ backgroundColor: 'grey.100' }}
        />
      </Box>
    );
  }

  return (
    <Box
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onClick={() => {
        setClickCount(prev => {
          const newCount = prev + 1;
          
          if (newCount === 1) {
            // Start timer for double-click detection
            const timer = setTimeout(() => {
              // Single click - only process if in selection mode
              if (isSelectionMode && onClick) {
                onClick(message);
              }
              setClickCount(0);
            }, 300); // 300ms window for double-click
            setClickTimer(timer);
          } else if (newCount === 2) {
            // Double click detected
            if (clickTimer) {
              clearTimeout(clickTimer);
              setClickTimer(null);
            }
            setClickCount(0);
            
            // Call double-click handler to select message
            if (onDoubleClick) {
              onDoubleClick(message);
            }
          }
          
          return newCount;
        });
      }}
      sx={{
        display: 'flex',
        flexDirection: isOwnMessage ? 'row-reverse' : 'row',
        alignItems: 'flex-start',
        mb: 1,
        gap: 1,
        position: 'relative',
        cursor: isSelectionMode ? 'pointer' : 'default',
        userSelect: 'none', // Prevent text selection
        WebkitUserSelect: 'none', // Safari
        MozUserSelect: 'none', // Firefox
        msUserSelect: 'none', // IE/Edge
        WebkitTouchCallout: 'none', // iOS Safari
        WebkitTapHighlightColor: 'transparent', // Remove tap highlight
        transform: isReplyAnimating 
          ? `translateX(${isOwnMessage ? '-10px' : '10px'})` 
          : swipeProgress > 0 
            ? `translateX(${isOwnMessage ? -swipeProgress * 20 : swipeProgress * 20}px)`
            : 'translateX(0)',
        transition: isReplyAnimating ? 'transform 0.2s ease' : 'all 0.2s ease',
        bgcolor: 'transparent', // Remove background - using overlay instead
        borderRadius: 2,
        p: 0,
        '&::before': {}, // Remove old selection indicator
        '&:hover .message-menu': {
          opacity: 1,
          transform: 'scale(1.05)',
        },
        // Show menu on touch devices by default
        '@media (hover: none)': {
          '& .message-menu': {
            opacity: 0.8,
          },
        },
      }}
    >
      {/* Modern Selection Indicator */}
      {isSelectionMode && (
        <Box
          sx={{
            position: 'absolute',
            top: -2,
            left: -2,
            right: -2,
            bottom: -2,
            borderRadius: 2,
            border: isSelected ? `2px solid ${isDarkMode ? '#3b82f6' : '#3b82f6'}` : '2px solid transparent',
            backgroundColor: isSelected ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
            zIndex: 0,
            transition: 'all 0.2s ease',
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Avatar */}
      {showAvatar && !isOwnMessage && (
        <Avatar
          src={message.sender.avatar}
          sx={{
            width: 32,
            height: 32,
            bgcolor: 'primary.main',
            order: isOwnMessage ? 2 : 1,
          }}
        >
          {message.sender.name?.charAt(0).toUpperCase()}
        </Avatar>
      )}

      {/* Swipe Reply Indicator */}
      {(isReplyAnimating || swipeProgress > 0.3) && (
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            [isOwnMessage ? 'right' : 'left']: `${-40 + (swipeProgress * 20)}px`,
            transform: 'translateY(-50%)',
            bgcolor: 'primary.main',
            borderRadius: '50%',
            width: 32,
            height: 32,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            zIndex: 2,
            boxShadow: 2,
            opacity: Math.max(swipeProgress, isReplyAnimating ? 1 : 0),
            scale: isReplyAnimating ? '1.1' : `${0.8 + (swipeProgress * 0.3)}`,
            transition: isReplyAnimating ? 'all 0.3s ease' : 'none',
          }}
        >
          <ReplyIcon fontSize="small" />
        </Box>
      )}

      {/* Message Content */}
      <Box sx={{ 
        flexGrow: 1, 
        minWidth: 0,
        maxWidth: '70%',
        order: isOwnMessage ? 1 : 2,
        display: 'flex',
        flexDirection: 'column',
        alignItems: isOwnMessage ? 'flex-end' : 'flex-start'
      }}>
        {/* Sender Name */}
        {showAvatar && !isOwnMessage && (
          <Typography variant="caption" sx={{ 
            ml: 1, 
            mb: 0.5,
            color: isDarkMode ? '#8696a0' : 'text.secondary'
          }}>
            {message.sender.name}
          </Typography>
        )}

        {/* Reply To */}
        {message.replyTo && (
          <Paper
            variant="outlined"
            sx={{
              p: 1,
              mb: 1,
              backgroundColor: isDarkMode ? '#182229' : 'grey.50',
              borderLeft: 3,
              borderLeftColor: 'primary.main',
              borderRadius: 1,
            }}
          >
            <Typography variant="caption" color="primary" fontWeight="bold">
              Replying to {message.replyTo.sender.name}:
            </Typography>
            <Typography variant="body2" sx={{ 
              opacity: 0.8,
              color: isDarkMode ? '#8696a0' : 'inherit'
            }}>
              {message.replyTo.content.length > 100
                ? `${message.replyTo.content.substring(0, 100)}...`
                : message.replyTo.content}
            </Typography>
          </Paper>
        )}

        {/* Modern Message Bubble */}
        <Paper
          elevation={0}
          sx={{
            p: isDeletedMessage ? 1 : 1.5,
            maxWidth: '100%',
            backgroundColor: isDeletedMessage 
              ? 'transparent'
              : isOwnMessage 
                ? (isDarkMode ? '#3b82f6' : '#3b82f6') 
                : (isDarkMode ? '#374151' : '#ffffff'),
            color: isDeletedMessage
              ? (isDarkMode ? '#6b7280' : '#9ca3af')
              : isOwnMessage 
                ? '#ffffff'
                : (isDarkMode ? '#ffffff' : '#1f2937'),
            borderRadius: 2,
            borderTopLeftRadius: !isOwnMessage && showAvatar ? 0.5 : 2,
            borderTopRightRadius: isOwnMessage ? 0.5 : 2,
            position: 'relative',
            fontStyle: isDeletedMessage ? 'italic' : 'normal',
            opacity: isDeletedMessage ? 0.8 : 1,
            transition: 'all 0.2s ease',
            border: isDeletedMessage 
              ? `1px dashed ${isDarkMode ? '#4b5563' : '#d1d5db'}`
              : isOwnMessage
                ? 'none'
                : `1px solid ${isDarkMode ? '#4b5563' : '#e5e7eb'}`,
            boxShadow: isDeletedMessage 
              ? 'none'
              : isSelectionMode && isSelected 
                ? `0 0 0 2px ${isDarkMode ? '#3b82f6' : '#3b82f6'}`
                : '0 1px 2px rgba(0,0,0,0.1)',
          }}
        >
          <Typography 
            variant="body1" 
            sx={{ 
              wordBreak: 'break-word',
              whiteSpace: 'pre-wrap',
              fontSize: isDeletedMessage ? '0.85rem' : '0.95rem',
              lineHeight: 1.4,
              fontWeight: isDeletedMessage ? 400 : 500,
            }}
          >
            {isDeletedMessage ? '🗑️ This message was deleted' : message.content}
            {message.edited && !isDeletedMessage && (
              <span style={{ 
                fontStyle: 'italic', 
                opacity: 0.7, 
                fontSize: '0.8rem',
                marginLeft: '4px'
              }}> (edited)</span>
            )}
          </Typography>

          {/* Reactions */}
          {message.reactions && message.reactions.length > 0 && (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
              {message.reactions.reduce((acc: any[], reaction) => {
                const existing = acc.find(r => r.emoji === reaction.emoji);
                if (existing) {
                  existing.count++;
                  existing.users.push(reaction.user.name);
                } else {
                  acc.push({
                    emoji: reaction.emoji,
                    count: 1,
                    users: [reaction.user.name],
                  });
                }
                return acc;
              }, []).map((reactionGroup, index) => (
                <Chip
                  key={index}
                  size="small"
                  variant="outlined"
                  label={`${reactionGroup.emoji} ${reactionGroup.count}`}
                  sx={{
                    height: 24,
                    fontSize: '0.75rem',
                    '&:hover': {
                      backgroundColor: 'primary.light',
                    },
                  }}
                  title={`${reactionGroup.users.join(', ')} reacted with ${reactionGroup.emoji}`}
                />
              ))}
            </Box>
          )}
        </Paper>

        {/* Message Menu Button */}
        <Paper
          className="message-menu"
          sx={{
            position: 'absolute',
            top: 0,
            right: isOwnMessage ? 'auto' : -40,
            left: isOwnMessage ? -40 : 'auto',
            opacity: 0.3,
            transition: 'all 0.2s ease',
            zIndex: 1,
            display: 'flex',
            alignItems: 'center',
            bgcolor: isDarkMode ? '#2a3942' : 'background.paper',
            borderRadius: 1,
            boxShadow: 2,
            // Make more visible on mobile
            '@media (max-width: 768px)': {
              right: isOwnMessage ? 'auto' : -35,
              left: isOwnMessage ? -35 : 'auto',
              opacity: 0.8,
            },
          }}
        >
          <Tooltip title="Message options" placement="top">
            <IconButton
              size="small"
              onClick={handleMenuClick}
              sx={{ 
                opacity: 0.8, 
                '&:hover': { 
                  opacity: 1,
                  backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                },
                color: isDarkMode ? '#8696a0' : 'text.secondary',
              }}
            >
              <MoreIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Paper>

        {/* Long Press Progress Indicator - Hidden */}
        {false && isLongPressing && (
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 60,
              height: 60,
              borderRadius: '50%',
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              zIndex: 3,
              backdropFilter: 'blur(4px)',
            }}
          >
            <Box
              sx={{
                position: 'relative',
                width: 50,
                height: 50,
                borderRadius: '50%',
                background: 'rgba(0, 0, 0, 0.8)',
                border: '3px solid rgba(255, 255, 255, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {/* Progress Circle */}
              <Box
                sx={{
                  position: 'absolute',
                  width: '100%',
                  height: '100%',
                  borderRadius: '50%',
                  background: `conic-gradient(
                    from 0deg,
                    #2196f3 ${longPressProgress * 360}deg,
                    transparent ${longPressProgress * 360}deg
                  )`,
                  transform: 'rotate(-90deg)',
                }}
              />
              {/* Center content */}
              <Box
                sx={{
                  position: 'relative',
                  zIndex: 1,
                  background: 'rgba(0, 0, 0, 0.9)',
                  borderRadius: '50%',
                  width: '75%',
                  height: '75%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    fontSize: '12px',
                    fontWeight: 'bold',
                    color: 'white',
                  }}
                >
                  {Math.ceil((1 - longPressProgress) * 3)}
                </Typography>
              </Box>
            </Box>
          </Box>
        )}

        {/* Timestamp */}
        <Typography 
          variant="caption" 
          sx={{ 
            mt: 0.5,
            ml: isOwnMessage ? 0 : 1,
            mr: isOwnMessage ? 1 : 0,
            alignSelf: isOwnMessage ? 'flex-end' : 'flex-start',
            color: isDarkMode ? '#8696a0' : 'text.secondary'
          }}
        >
          {formatTime(message.createdAt)}
          {message.edited && (
            <span style={{ fontStyle: 'italic' }}> (edited)</span>
          )}
        </Typography>
      </Box>

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        {!isDeletedMessage && (
          <MenuItem onClick={handleReply}>
            <ListItemIcon>
              <ReplyIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Reply</ListItemText>
          </MenuItem>
        )}
        {!isDeletedMessage && (
          <MenuItem onClick={copyToClipboard}>
            <ListItemIcon>
              <CopyIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Copy text</ListItemText>
          </MenuItem>
        )}
        {canEditDelete && (
          <MenuItem onClick={handleEdit}>
            <ListItemIcon>
              <EditIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Edit message</ListItemText>
          </MenuItem>
        )}
        {canEditDelete && (
          <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
            <ListItemIcon>
              <DeleteIcon fontSize="small" color="error" />
            </ListItemIcon>
            <ListItemText>Delete message</ListItemText>
          </MenuItem>
        )}
      </Menu>

      {/* Edit Dialog */}
      <Dialog 
        open={editDialogOpen} 
        onClose={handleEditCancel}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Edit Message
          <IconButton onClick={handleEditCancel}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={3}
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            variant="outlined"
            autoFocus
            sx={{ mt: 1 }}
            inputProps={{ maxLength: 2000 }}
            helperText={`${editContent.length}/2000 characters`}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleEditCancel}>
            Cancel
          </Button>
          <Button
            onClick={handleEditSave}
            variant="contained"
            disabled={isEditing || !editContent.trim() || editContent.trim() === message.content}
          >
            {isEditing ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MessageComponent;
