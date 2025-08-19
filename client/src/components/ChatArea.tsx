import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  IconButton,
  Avatar,
  Chip,
  Divider,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  Send as SendIcon,
  EmojiEmotions as EmojiIcon,
  MoreVert as MoreIcon,
} from '@mui/icons-material';
import { useChat } from '../contexts/ChatContext';
import { Message } from '../services/chatService';
import MessageComponent from './MessageComponent';
import TypingIndicator from './TypingIndicator';
import { UI_CONSTANTS } from '../config/constants';

const ChatArea: React.FC = () => {
  const {
    currentRoom,
    rooms,
    messages,
    sendMessage,
    setTyping,
    typingUsers,
  } = useChat();

  const [messageInput, setMessageInput] = useState('');
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Current room data
  const room = rooms.find(r => r._id === currentRoom);
  const roomMessages = currentRoom ? messages[currentRoom] || [] : [];
  const roomTypingUsers = currentRoom ? typingUsers[currentRoom] || [] : [];

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [roomMessages]);

  const handleMessageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (messageInput.trim() && currentRoom) {
      sendMessage(messageInput.trim());
      setMessageInput('');
      
      // Clear typing indicator
      setTyping(false);
      if (typingTimeout) {
        clearTimeout(typingTimeout);
        setTypingTimeout(null);
      }
    }
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
      <Box
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          p: 3,
          textAlign: 'center',
        }}
      >
        <Typography variant="h4" color="textSecondary" gutterBottom>
          Welcome to RTCA
        </Typography>
        <Typography variant="body1" color="textSecondary" paragraph>
          Select a room from the sidebar to start chatting, or create a new room to get the conversation started.
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Real-time messaging • Team collaboration • Secure communication
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Room Header */}
      <Paper
        elevation={1}
        sx={{
          p: 2,
          borderRadius: 0,
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: 'primary.main' }}>
              {room?.name.charAt(0).toUpperCase()}
            </Avatar>
            <Box>
              <Typography variant="h6" component="h2">
                {room?.name}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {room?.memberCount || 0} member{(room?.memberCount || 0) !== 1 ? 's' : ''}
                {room?.description && ` • ${room.description}`}
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip
              size="small"
              label={room?.type}
              color={room?.type === 'public' ? 'primary' : 'secondary'}
              variant="outlined"
            />
            <IconButton size="small">
              <MoreIcon />
            </IconButton>
          </Box>
        </Box>
      </Paper>

      {/* Messages Area */}
      <Box
        sx={{
          flexGrow: 1,
          overflow: 'auto',
          p: 1,
          backgroundColor: 'grey.50',
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
          p: 2,
          borderRadius: 0,
          borderTop: 1,
          borderColor: 'divider',
        }}
      >
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
