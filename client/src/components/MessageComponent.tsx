import React, { useState } from 'react';
import {
  Box,
  Avatar,
  Typography,
  Paper,
  Chip,
  alpha,
} from '@mui/material';
import { Reply as ReplyIcon } from '@mui/icons-material';
import { useAriztaTheme } from '../contexts/ThemeContext';
import { Message } from '../services/chatService';

interface MessageComponentProps {
  message: Message;
  currentUserId?: string;
  showAvatar?: boolean;
  onReply?: (message: Message) => void;
  isSelected?: boolean;
  isSelectionMode?: boolean;
}

const MessageComponent: React.FC<MessageComponentProps> = ({
  message,
  currentUserId,
  showAvatar = true,
  onReply,
  isSelected = false,
  isSelectionMode = false,
}) => {
  // Swipe detection state
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [touchEnd, setTouchEnd] = useState<{ x: number; y: number } | null>(null);
  const [swipeProgress, setSwipeProgress] = useState(0);
  
  const { isDarkMode } = useAriztaTheme();

  // Swipe to reply functionality
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart({ x: e.targetTouches[0].clientX, y: e.targetTouches[0].clientY });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStart) return;
    
    const currentTouch = { x: e.targetTouches[0].clientX, y: e.targetTouches[0].clientY };
    setTouchEnd(currentTouch);
    
    const deltaX = currentTouch.x - touchStart.x;
    const deltaY = Math.abs(currentTouch.y - touchStart.y);
    
    // Only track horizontal swipes
    if (deltaY < 50 && deltaX > 0 && deltaX < 100) {
      setSwipeProgress(deltaX);
    }
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const deltaX = touchEnd.x - touchStart.x;
    const deltaY = Math.abs(touchEnd.y - touchStart.y);
    
    // Check if it's a swipe to reply (swipe right)
    if (deltaX > 50 && deltaY < 50 && onReply) {
      onReply(message);
      setTimeout(() => {
        setSwipeProgress(0);
      }, 300);
    } else {
      setSwipeProgress(0);
    }
    
    setTouchStart(null);
    setTouchEnd(null);
  };

  const isOwnMessage = currentUserId && message.sender._id === currentUserId;

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        mb: 1,
        position: 'relative',
        transition: 'all 0.3s ease',
        transform: swipeProgress > 0 ? `translateX(${Math.min(swipeProgress, 50)}px)` : 'none',
        width: '100%',
        maxWidth: { xs: '85%', sm: '75%', md: '70%' },
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Reply animation indicator */}
      {swipeProgress > 20 && (
        <Box
          sx={{
            position: 'absolute',
            left: -40,
            top: '50%',
            transform: 'translateY(-50%)',
            opacity: Math.min(swipeProgress / 50, 1),
            transition: 'opacity 0.2s ease',
            color: isDarkMode ? '#90caf9' : '#1976d2',
            zIndex: 1,
          }}
        >
          <ReplyIcon />
        </Box>
      )}

      <Box
        sx={{
          display: 'flex',
          alignItems: 'flex-start',
          flexDirection: isOwnMessage ? 'row-reverse' : 'row',
          gap: 1,
          width: '100%',
        }}
      >
        {showAvatar && !isOwnMessage && (
          <Avatar
            src={message.sender.avatar}
            alt={message.sender.name}
            sx={{ 
              width: 32, 
              height: 32,
              fontSize: '0.875rem',
              flexShrink: 0,
            }}
          >
            {message.sender.name?.charAt(0).toUpperCase() || 'U'}
          </Avatar>
        )}

        {/* Invisible spacer when avatar is hidden to maintain alignment */}
        {!showAvatar && !isOwnMessage && (
          <Box sx={{ width: 32, height: 32, flexShrink: 0 }} />
        )}

        <Box 
          sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: isOwnMessage ? 'flex-end' : 'flex-start',
            maxWidth: '100%',
            minWidth: 0,
            flex: 1,
          }}
        >
          {!isOwnMessage && showAvatar && (
            <Typography
              variant="caption"
              sx={{
                color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)',
                mb: 0.5,
                px: 1,
              }}
            >
              {message.sender.name}
            </Typography>
          )}

          <Paper
            elevation={0}
            sx={{
              p: { xs: 1.5, sm: 2 },
              maxWidth: '100%',
              minWidth: 'fit-content',
              wordBreak: 'break-word',
              backgroundColor: isOwnMessage
                ? isDarkMode 
                  ? 'rgba(144, 202, 249, 0.15)'
                  : 'rgba(25, 118, 210, 0.1)'
                : isDarkMode
                  ? 'rgba(255, 255, 255, 0.08)'
                  : 'rgba(0, 0, 0, 0.04)',
              backdropFilter: 'blur(10px)',
              border: `1px solid ${
                isOwnMessage
                  ? isDarkMode 
                    ? 'rgba(144, 202, 249, 0.3)'
                    : 'rgba(25, 118, 210, 0.2)'
                  : isDarkMode
                    ? 'rgba(255, 255, 255, 0.15)'
                    : 'rgba(0, 0, 0, 0.08)'
              }`,
              borderRadius: isOwnMessage ? '18px 6px 18px 18px' : '6px 18px 18px 18px',
              position: 'relative',
              ...(isSelected && {
                backgroundColor: alpha(isDarkMode ? '#90caf9' : '#1976d2', 0.2),
                border: `2px solid ${isDarkMode ? '#90caf9' : '#1976d2'}`,
              }),
            }}
          >
            {/* Reply indicator */}
            {message.replyTo && (
              <Box
                sx={{
                  mb: 1,
                  p: 1,
                  backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                  borderRadius: 1,
                  borderLeft: `3px solid ${isDarkMode ? '#90caf9' : '#1976d2'}`,
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)',
                    display: 'block',
                    mb: 0.5,
                  }}
                >
                  {message.replyTo.sender.name}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: isDarkMode ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.7)',
                    fontStyle: 'italic',
                  }}
                >
                  {message.replyTo.content}
                </Typography>
              </Box>
            )}

            <Typography
              variant="body1"
              sx={{
                color: isDarkMode ? 'rgba(255, 255, 255, 0.95)' : 'rgba(0, 0, 0, 0.87)',
                lineHeight: 1.4,
                fontSize: { xs: '0.9rem', sm: '1rem' },
                fontFamily: '"Kohinoor Devanagari", "Noto Sans Devanagari", "Devanagari Sangam MN", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif',
              }}
            >
              {message.content}
            </Typography>

            {message.edited && (
              <Chip
                label="edited"
                size="small"
                variant="outlined"
                sx={{
                  mt: 0.5,
                  height: 20,
                  fontSize: '0.7rem',
                  color: isDarkMode ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.5)',
                  borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.23)',
                }}
              />
            )}
          </Paper>

          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              mt: 0.5,
              px: 1,
            }}
          >
            <Typography
              variant="caption"
              sx={{
                color: isDarkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
                fontSize: '0.75rem',
              }}
            >
              {new Date(message.createdAt).toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default MessageComponent;
