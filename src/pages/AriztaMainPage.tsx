import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  useMediaQuery,
} from '@mui/material';
import { useTheme as useMuiTheme } from '@mui/material/styles';
import { useAriztaTheme } from '../contexts/ThemeContext';
import AriztaHeader from '../components/AriztaHeader';
import AriztaChatList from '../components/AriztaChatList';
import ChatArea from '../components/ChatArea';
import StartConversation from '../components/StartConversation';
import ProfileDialog from '../components/ProfileDialog';
import SettingsDialog from '../components/SettingsDialog';
import { useChat } from '../contexts/ChatContext';
import { useAuth } from '../contexts/AuthContext';

const AriztaMainPage: React.FC = () => {
  const muiTheme = useMuiTheme();
  const { isDarkMode } = useAriztaTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('md'));
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [newChatOpen, setNewChatOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { joinRoom, leaveRoom, loadRooms, initializeSocket, isConnected } = useChat();
  const { user } = useAuth();

  // Initialize socket connection and load rooms on mount
  useEffect(() => {
    const initialize = async () => {
      console.log('Initializing Arizta main page...');
      console.log('User:', user);
      console.log('isConnected:', isConnected);
      
      if (!user) return;
      
      try {
        // Always try to load rooms first (REST API doesn't require socket)
        console.log('Loading rooms...');
        await loadRooms();
        console.log('Rooms loaded successfully');
        
        // Then try to connect socket for real-time features
        if (!isConnected) {
          console.log('Connecting to socket...');
          try {
            await initializeSocket();
            console.log('Socket connected successfully');
          } catch (socketError) {
            console.warn('Socket connection failed:', socketError);
          }
        }
      } catch (error) {
        console.error('Error initializing chat:', error);
      }
    };

    initialize();
  }, [user, loadRooms, initializeSocket, isConnected]);

  const handleChatSelect = (roomId: string) => {
    console.log('Chat selected:', roomId);
    
    if (selectedRoomId && selectedRoomId !== roomId) {
      console.log('Leaving previous room:', selectedRoomId);
      leaveRoom(selectedRoomId);
    }
    
    setSelectedRoomId(roomId);
    joinRoom(roomId);
  };

  const handleStartConversation = () => {
    setNewChatOpen(true);
  };

  const handleNewChatCreated = (roomId: string) => {
    setNewChatOpen(false);
    handleChatSelect(roomId);
  };

  if (!user) {
    return null;
  }

  const renderChatArea = () => {
    if (!selectedRoomId) {
      return (
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            p: 4,
            textAlign: 'center',
            background: isDarkMode 
              ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.3) 0%, rgba(51, 65, 85, 0.2) 100%)'
              : 'linear-gradient(135deg, rgba(241, 245, 249, 0.3) 0%, rgba(226, 232, 240, 0.2) 100%)',
          }}
        >
          <Typography
            variant="h5"
            sx={{
              mb: 2,
              color: isDarkMode ? '#e2e8f0' : '#475569',
              fontWeight: 300,
            }}
          >
            Welcome to Arizta
          </Typography>
          <Typography
            variant="body1"
            sx={{
              color: isDarkMode ? '#94a3b8' : '#64748b',
              maxWidth: 400,
              lineHeight: 1.6,
            }}
          >
            Select a conversation from the sidebar to start chatting, or create a new conversation.
          </Typography>
        </Box>
      );
    }

    return (
      <ChatArea
        onStartConversation={handleStartConversation}
        onBackClick={isMobile ? () => setSelectedRoomId(null) : undefined}
      />
    );
  };

  return (
    <Box
      sx={{
        height: '100vh',
        display: 'flex',
        bgcolor: 'background.default',
        overflow: 'hidden',
      }}
    >
      {/* Desktop Layout */}
      {!isMobile && (
        <>
          {/* Sidebar */}
          <Paper
            elevation={0}
            sx={{
              width: 380,
              minWidth: 320,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              borderRadius: 0,
              bgcolor: isDarkMode ? '#202c33' : '#ffffff',
              borderRight: `1px solid ${isDarkMode ? '#3b4a54' : '#e4e6ea'}`,
            }}
          >
            <AriztaHeader 
              title="Arizta"
              onNewChatClick={handleStartConversation}
              onProfileClick={() => setProfileOpen(true)}
              onSettingsClick={() => setSettingsOpen(true)}
            />
            
            <Box sx={{ flex: 1, overflow: 'hidden' }}>
              <AriztaChatList onChatSelect={handleChatSelect} />
            </Box>
          </Paper>

          {/* Chat Area */}
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            {renderChatArea()}
          </Box>
        </>
      )}

      {/* Mobile Layout */}
      {isMobile && (
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {!selectedRoomId ? (
            // Chat List View
            <Paper
              elevation={0}
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                borderRadius: 0,
                bgcolor: isDarkMode ? '#111b21' : '#f0f2f5',
              }}
            >
              <AriztaHeader 
                title="Arizta"
                onNewChatClick={handleStartConversation}
                onProfileClick={() => setProfileOpen(true)}
                onSettingsClick={() => setSettingsOpen(true)}
              />
              
              <Box sx={{ flex: 1, overflow: 'hidden' }}>
                <AriztaChatList onChatSelect={handleChatSelect} />
              </Box>
            </Paper>
          ) : (
            // Chat View
            renderChatArea()
          )}
        </Box>
      )}

      {/* Start New Conversation Dialog */}
      <StartConversation
        open={newChatOpen}
        onClose={() => setNewChatOpen(false)}
        onConversationCreated={handleNewChatCreated}
      />

      {/* Profile Dialog */}
      <ProfileDialog
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
      />

      {/* Settings Dialog */}
      <SettingsDialog
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </Box>
  );
};

export default AriztaMainPage;
