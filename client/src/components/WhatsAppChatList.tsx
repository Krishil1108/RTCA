import React, { useState } from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Typography,
  Fab,
} from '@mui/material';
import {
  Chat as ChatIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { useChat } from '../contexts/ChatContext';
import { useAuth } from '../contexts/AuthContext';
import { useWhatsAppTheme } from '../contexts/ThemeContext';
import { Room } from '../services/chatService';
import StartConversation from './StartConversation';

interface WhatsAppChatListProps {
  onChatSelect: (roomId: string) => void;
}

const WhatsAppChatList: React.FC<WhatsAppChatListProps> = ({ onChatSelect }) => {
  const { rooms, loadRooms, isLoading } = useChat();
  const { user } = useAuth();
  const theme = useTheme();
  const { isDarkMode } = useWhatsAppTheme();
  const [startConversationOpen, setStartConversationOpen] = useState(false);

  const handleConversationCreated = async (roomId: string) => {
    await loadRooms();
    onChatSelect(roomId);
  };

  const getContactName = (room: Room) => {
    if (room.type === 'direct') {
      const otherMember = room.members.find(member => member.user._id !== user?.id);
      return otherMember?.user.name || 'Unknown Contact';
    }
    return room.name;
  };

  const getContactAvatar = (room: Room) => {
    if (room.type === 'direct' && room.members.length === 2) {
      const otherMember = room.members.find(member => member.user._id !== user?.id);
      return otherMember?.user.avatar || null;
    }
    return null;
  };

  const getLastMessageTime = () => {
    // For now, return current time. Later you can implement actual last message time
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getLastMessagePreview = () => {
    // For now, return a placeholder. Later you can implement actual last message
    return "Tap to chat";
  };

  const getOtherUserStatus = (room: Room) => {
    if (room.type === 'direct') {
      const otherMember = room.members.find(member => member.user._id !== user?.id);
      if (otherMember?.user.isOnline) {
        return 'online';
      } else if (otherMember?.user.lastSeen) {
        const lastSeen = new Date(otherMember.user.lastSeen);
        const now = new Date();
        const diffMs = now.getTime() - lastSeen.getTime();
        const diffMins = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        
        if (diffMins < 1) return 'just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        return lastSeen.toLocaleDateString();
      }
    }
    return '';
  };

  if (isLoading) {
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography variant="body2" sx={{ color: isDarkMode ? '#8696a0' : 'text.secondary' }}>
          Loading chats...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      height: '100%', 
      bgcolor: isDarkMode ? '#111b21' : '#ffffff', 
      color: isDarkMode ? '#e9edef' : '#000',
      position: 'relative' 
    }}>
      {rooms.length === 0 ? (
        <Box 
          sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center',
            height: '40vh',
            px: 4,
            textAlign: 'center',
            mt: 8,
          }}
        >
          <ChatIcon sx={{ fontSize: 60, color: isDarkMode ? '#3b4a54' : '#e0e0e0', mb: 2 }} />
          <Typography variant="h6" sx={{ color: isDarkMode ? '#e9edef' : 'text.secondary' }} gutterBottom>
            No chats yet
          </Typography>
          <Typography variant="body2" sx={{ color: isDarkMode ? '#8696a0' : 'text.secondary', mb: 3 }}>
            Start a conversation by tapping the + button
          </Typography>
        </Box>
      ) : (
        <List sx={{ p: 0 }}>
          {rooms.map((room: Room) => (
            <ListItem key={room._id} disablePadding>
              <ListItemButton 
                onClick={() => onChatSelect(room._id)}
                sx={{
                  py: 1.5,
                  px: 2,
                  '&:hover': {
                    bgcolor: '#f5f5f5',
                  },
                }}
              >
                <ListItemAvatar>
                  {getContactAvatar(room) ? (
                    <Avatar 
                      src={getContactAvatar(room) || undefined}
                      sx={{ width: 50, height: 50 }}
                    />
                  ) : (
                    <Avatar sx={{ width: 50, height: 50, bgcolor: '#128c7e' }}>
                      <PersonIcon />
                    </Avatar>
                  )}
                </ListItemAvatar>
                
                <ListItemText
                  primary={
                    <Typography 
                      variant="subtitle1" 
                      sx={{ 
                        fontWeight: 500,
                        fontSize: '1rem',
                        color: isDarkMode ? '#e9edef' : '#000000',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <span>{getContactName(room)}</span>
                      <Typography 
                        component="span"
                        variant="caption" 
                        sx={{ 
                          color: isDarkMode ? '#8696a0' : '#667781',
                          fontSize: '0.75rem',
                        }}
                      >
                        {getLastMessageTime()}
                      </Typography>
                    </Typography>
                  }
                  secondary={
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: isDarkMode ? '#8696a0' : '#667781',
                        fontSize: '0.875rem',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        maxWidth: '200px',
                        mt: 0.5,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5,
                      }}
                    >
                      {room.type === 'direct' ? (
                        <>
                          {getOtherUserStatus(room) === 'online' && (
                            <Box sx={{
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              bgcolor: '#25d366',
                              flexShrink: 0
                            }} />
                          )}
                          {getOtherUserStatus(room) || 'Tap to chat'}
                        </>
                      ) : (
                        getLastMessagePreview()
                      )}
                    </Typography>
                  }
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      )}

      {/* Floating Action Button for New Chat */}
      <Fab
        color="primary"
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          bgcolor: theme.palette.primary.main,
          '&:hover': {
            bgcolor: theme.palette.primary.dark,
          },
          zIndex: 1000,
        }}
        onClick={() => setStartConversationOpen(true)}
      >
        <ChatIcon />
      </Fab>

      <StartConversation
        open={startConversationOpen}
        onClose={() => setStartConversationOpen(false)}
        onConversationCreated={handleConversationCreated}
      />
    </Box>
  );
};

export default WhatsAppChatList;
