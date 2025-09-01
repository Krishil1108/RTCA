import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  useMediaQuery,
} from '@mui/material';
import { useTheme as useMuiTheme } from '@mui/material/styles';
import { useWhatsAppTheme } from '../contexts/ThemeContext';
import WhatsAppHeader from '../components/WhatsAppHeader';
import WhatsAppChatList from '../components/WhatsAppChatList';
import ChatArea from '../components/ChatArea';
import StartConversation from '../components/StartConversation';
import ProfileDialog from '../components/ProfileDialog';
import SettingsDialog from '../components/SettingsDialog';
import DebugPanel from '../components/DebugPanel';
import { useChat } from '../contexts/ChatContext';
import { useAuth } from '../contexts/AuthContext';

const WhatsAppMainPage: React.FC = () => {
  const muiTheme = useMuiTheme();
  const { themeMode, isDarkMode } = useWhatsAppTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('md'));
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [newChatOpen, setNewChatOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { rooms, joinRoom, leaveRoom, loadRooms, initializeSocket, isConnected } = useChat();
  const { user } = useAuth();

  // Initialize socket connection and load rooms on mount
  useEffect(() => {
    const initialize = async () => {
      console.log('Initializing WhatsApp main page...');
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
            console.warn('Socket connection failed, but app will work with polling:', socketError);
          }
        }
      } catch (error) {
        console.error('Failed to initialize:', error);
      }
    };

    // Only initialize once when user is available
    if (user) {
      initialize();
    }
  }, [user]); // Remove isConnected, initializeSocket, loadRooms from dependencies

  useEffect(() => {
    // Clean up room connections when component unmounts
    return () => {
      if (selectedRoomId) {
        leaveRoom(selectedRoomId);
      }
    };
  }, [selectedRoomId, leaveRoom]);

  const handleChatSelect = async (roomId: string) => {
    if (selectedRoomId && selectedRoomId !== roomId) {
      leaveRoom(selectedRoomId);
    }
    
    setSelectedRoomId(roomId);
    joinRoom(roomId);
  };

  const handleBackToList = () => {
    if (selectedRoomId) {
      leaveRoom(selectedRoomId);
    }
    setSelectedRoomId(null);
  };

  const handleNewChatClick = () => {
    setNewChatOpen(true);
  };

  const handleConversationCreated = async (roomId: string) => {
    setNewChatOpen(false);
    await loadRooms();
    handleChatSelect(roomId);
  };

  const handleProfileClick = () => {
    setProfileOpen(true);
  };

  const handleSettingsClick = () => {
    setSettingsOpen(true);
  };

  const selectedRoom = selectedRoomId ? rooms.find(room => room._id === selectedRoomId) : null;

  if (isMobile) {
    return (
      <Box sx={{ 
        height: '100vh', 
        bgcolor: muiTheme.palette.background.default,
        color: muiTheme.palette.text.primary
      }}>
        {/* Mobile Header - Only show when no room is selected */}
        {!selectedRoomId && (
          <WhatsAppHeader 
            title="WhatsApp"
            onNewChatClick={handleNewChatClick}
            onProfileClick={handleProfileClick}
            onSettingsClick={handleSettingsClick}
          />
        )}

        {/* Mobile Content */}
        <Box sx={{ height: selectedRoomId ? '100vh' : 'calc(100vh - 64px)', overflow: 'hidden' }}>
          {selectedRoomId ? (
            <ChatArea onBackClick={handleBackToList} />
          ) : (
            <WhatsAppChatList onChatSelect={handleChatSelect} />
          )}
        </Box>

        {/* Start Conversation Dialog */}
        <StartConversation
          open={newChatOpen}
          onClose={() => setNewChatOpen(false)}
          onConversationCreated={handleConversationCreated}
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
  }

  // Desktop Layout
  return (
    <Box sx={{ 
      height: '100vh', 
      bgcolor: muiTheme.palette.background.default,
      color: muiTheme.palette.text.primary,
      display: 'flex',
      overflow: 'hidden',
      maxWidth: '100vw',
    }}>
      {/* Debug Panel - Temporary */}
      <DebugPanel />
      
      {/* Left Panel - Chat List */}
      <Paper 
        sx={{ 
          width: 400, 
          height: '100vh',
          borderRadius: 0,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          bgcolor: muiTheme.palette.background.paper,
          color: muiTheme.palette.text.primary,
          borderRight: `1px solid ${muiTheme.palette.divider}`,
        }}
      >
        <WhatsAppHeader 
          title="RTCA Chat"
          onNewChatClick={handleNewChatClick}
          onProfileClick={handleProfileClick}
          onSettingsClick={handleSettingsClick}
        />
        <Box sx={{ flex: 1, overflow: 'hidden' }}>
          <WhatsAppChatList onChatSelect={handleChatSelect} />
        </Box>
      </Paper>

      {/* Right Panel - Chat Area */}
      <Box sx={{ flex: 1, height: '100vh', position: 'relative', overflow: 'hidden' }}>
        {selectedRoomId ? (
          <Paper sx={{ height: '100%', borderRadius: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <Box sx={{ flex: 1, overflow: 'hidden' }}>
              <ChatArea onBackClick={handleBackToList} />
            </Box>
          </Paper>
        ) : (
          <Box 
            sx={{ 
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: muiTheme.palette.background.paper,
            }}
          >
            <Box sx={{ textAlign: 'center', maxWidth: 400, px: 4 }}>
              <Box
                sx={{
                  width: 120,
                  height: 120,
                  margin: '0 auto 2rem',
                  borderRadius: 1,
                  backgroundColor: muiTheme.palette.primary.main,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mb: 4,
                }}
              >
                <Typography
                  variant="h4"
                  sx={{
                    color: 'white',
                    fontWeight: 600,
                  }}
                >
                  RC
                </Typography>
              </Box>
              <Typography
                variant="h5"
                sx={{
                  color: muiTheme.palette.text.primary,
                  fontWeight: 500,
                  mb: 2,
                }}
              >
                RTCA Chat
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  color: muiTheme.palette.text.secondary,
                  lineHeight: 1.6,
                }}
              >
                Select a conversation to start messaging or create a new chat to connect with your team.
              </Typography>
            </Box>
          </Box>
        )}
      </Box>

      {/* Start Conversation Dialog */}
      <StartConversation
        open={newChatOpen}
        onClose={() => setNewChatOpen(false)}
        onConversationCreated={handleConversationCreated}
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

  function getContactName(room: any) {
    if (room?.type === 'direct') {
      const otherMember = room.members?.find((member: any) => member.user._id !== user?.id);
      return otherMember?.user.name || 'Unknown Contact';
    }
    return room?.name || 'Chat';
  }
};

export default WhatsAppMainPage;
