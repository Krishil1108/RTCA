import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
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
    
    initialize();
  }, [user, initializeSocket, loadRooms, isConnected]);

  // Additional effect to load rooms when user is authenticated
  useEffect(() => {
    if (user && isConnected) {
      console.log('User authenticated and connected, loading rooms...');
      loadRooms();
    }
  }, [user, isConnected, loadRooms]);

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
        bgcolor: isDarkMode ? '#111b21' : '#f7f8fa',
        color: isDarkMode ? '#e9edef' : '#000'
      }}>
        {/* Mobile Header */}
        <WhatsAppHeader 
          title={selectedRoom ? getContactName(selectedRoom) : 'WhatsApp'}
          showBackButton={!!selectedRoomId}
          onBackClick={handleBackToList}
          onNewChatClick={handleNewChatClick}
          onProfileClick={handleProfileClick}
          onSettingsClick={handleSettingsClick}
        />

        {/* Mobile Content */}
        <Box sx={{ height: 'calc(100vh - 64px)', overflow: 'hidden' }}>
          {selectedRoomId ? (
            <ChatArea />
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
      bgcolor: isDarkMode ? '#111b21' : '#f7f8fa',
      color: isDarkMode ? '#e9edef' : '#000',
      display: 'flex' 
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
          bgcolor: isDarkMode ? '#202c33' : '#ffffff',
          color: isDarkMode ? '#e9edef' : '#000',
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
      <Box sx={{ flex: 1, height: '100vh', position: 'relative' }}>
        {selectedRoomId ? (
          <Paper sx={{ height: '100%', borderRadius: 0, display: 'flex', flexDirection: 'column' }}>
            <WhatsAppHeader 
              title={getContactName(selectedRoom!)}
              variant="chat"
              onNewChatClick={handleNewChatClick}
              onProfileClick={handleProfileClick}
            />
            <Box sx={{ flex: 1, overflow: 'hidden' }}>
              <ChatArea />
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
              backgroundImage: `url(data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000"%3E%3Cg opacity="0.1"%3E%3Cpath d="M500 0L1000 500L500 1000L0 500z" fill="${encodeURIComponent(muiTheme.palette.primary.main)}"/%3E%3C/g%3E%3C/svg%3E)`,
              backgroundSize: '200px 200px',
              backgroundRepeat: 'repeat',
            }}
          >
            <Box sx={{ textAlign: 'center', maxWidth: 400, px: 4 }}>
              <Box
                sx={{
                  width: 200,
                  height: 200,
                  margin: '0 auto 2rem',
                  backgroundImage: 'url(data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"%3E%3Ccircle cx="100" cy="100" r="80" fill="%23e0e0e0"/%3E%3Ctext x="100" y="110" text-anchor="middle" font-family="Arial" font-size="60" fill="%23888"%3ERTCA%3C/text%3E%3C/svg%3E)',
                  backgroundSize: 'contain',
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'center',
                }}
              />
              <h2 style={{ color: '#41525d', fontWeight: 300, marginBottom: '1rem' }}>
                WhatsApp Web
              </h2>
              <p style={{ color: '#667781', lineHeight: 1.5 }}>
                Send and receive messages without keeping your phone online.<br />
                Use WhatsApp on up to 4 linked devices and 1 phone at the same time.
              </p>
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
