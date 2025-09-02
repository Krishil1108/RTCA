import React from 'react';
import { Box, Typography } from '@mui/material';
import { TypingData } from '../services/socketService';

interface TypingIndicatorProps {
  users: TypingData[];
}

const TypingIndicator: React.FC<TypingIndicatorProps> = ({ users }) => {
  if (users.length === 0) return null;

  const typingUsers = users.filter(user => user.isTyping);
  
  if (typingUsers.length === 0) return null;

  const getTypingText = () => {
    const names = typingUsers.map(user => user.userName);
    
    if (names.length === 1) {
      return `${names[0]} is typing...`;
    } else if (names.length === 2) {
      return `${names[0]} and ${names[1]} are typing...`;
    } else if (names.length === 3) {
      return `${names[0]}, ${names[1]}, and ${names[2]} are typing...`;
    } else {
      return `${names[0]}, ${names[1]}, and ${names.length - 2} others are typing...`;
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        p: 1,
        mx: 1,
        opacity: 0.7,
        animation: 'fadeIn 0.3s ease-in-out',
      }}
    >
      {/* Typing dots animation */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.5,
          ml: 5, // Align with message content
        }}
      >
        <Box
          sx={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            backgroundColor: 'primary.main',
            animation: 'typing 1.4s infinite ease-in-out',
            animationDelay: '0s',
          }}
        />
        <Box
          sx={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            backgroundColor: 'primary.main',
            animation: 'typing 1.4s infinite ease-in-out',
            animationDelay: '0.2s',
          }}
        />
        <Box
          sx={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            backgroundColor: 'primary.main',
            animation: 'typing 1.4s infinite ease-in-out',
            animationDelay: '0.4s',
          }}
        />
        <Typography
          variant="caption"
          color="textSecondary"
          sx={{ ml: 1, fontStyle: 'italic' }}
        >
          {getTypingText()}
        </Typography>
      </Box>

      {/* Add CSS animation styles to the document */}
      <style>
        {`
          @keyframes typing {
            0%, 60%, 100% {
              transform: translateY(0);
              opacity: 0.3;
            }
            30% {
              transform: translateY(-10px);
              opacity: 1;
            }
          }
          
          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateY(10px);
            }
            to {
              opacity: 0.7;
              transform: translateY(0);
            }
          }
        `}
      </style>
    </Box>
  );
};

export default TypingIndicator;
