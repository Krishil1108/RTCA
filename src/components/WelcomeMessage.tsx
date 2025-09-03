import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { Chat as ChatIcon, Add as AddIcon } from '@mui/icons-material';

interface WelcomeMessageProps {
  onStartConversation: () => void;
}

const WelcomeMessage: React.FC<WelcomeMessageProps> = ({ onStartConversation }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        p: 4,
        textAlign: 'center',
      }}
    >
      <ChatIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
      
      <Typography variant="h4" gutterBottom>
        Welcome to RTCA Chat
      </Typography>
      
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 400 }}>
        Start a private conversation with your friend by entering their email address. 
        Only you and your friend will be able to see your messages.
      </Typography>
      
      <Button
        variant="contained"
        size="large"
        startIcon={<AddIcon />}
        onClick={onStartConversation}
        sx={{ borderRadius: 2 }}
      >
        Start Your First Conversation
      </Button>
      
      <Typography variant="caption" color="text.secondary" sx={{ mt: 2 }}>
        Simple, private, and secure messaging
      </Typography>
    </Box>
  );
};

export default WelcomeMessage;
