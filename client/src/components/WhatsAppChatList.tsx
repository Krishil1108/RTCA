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
  Badge,
  Chip,
  IconButton,
  InputAdornment,
  TextField,
  Divider,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Chat as ChatIcon,
  Person as PersonIcon,
  Search as SearchIcon,
  MoreVert as MoreVertIcon,
  PushPin as PushPinIcon,
  Group as GroupIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
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
  const [searchQuery, setSearchQuery] = useState('');

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
    return "Tap to start chatting";
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

  const isUserOnline = (room: Room) => {
    if (room.type === 'direct') {
      const otherMember = room.members.find(member => member.user._id !== user?.id);
      return otherMember?.user.isOnline || false;
    }
    return false;
  };

  const filteredRooms = rooms.filter(room =>
    getContactName(room).toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="body1" sx={{ color: 'text.secondary' }}>
          Loading conversations...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      height: '100%', 
      bgcolor: isDarkMode ? '#111b21' : '#f8f9fa',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative'
    }}>
      {/* Search Bar */}
      <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
        <TextField
          fullWidth
          placeholder="Search conversations..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          size="small"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
              </InputAdornment>
            ),
            sx: {
              borderRadius: 3,
              bgcolor: isDarkMode ? alpha(theme.palette.common.white, 0.05) : alpha(theme.palette.common.black, 0.05),
              '& .MuiOutlinedInput-notchedOutline': {
                border: 'none',
              },
              '&:hover .MuiOutlinedInput-notchedOutline': {
                border: 'none',
              },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                border: `2px solid ${theme.palette.primary.main}`,
              },
            },
          }}
        />
      </Box>

      {/* Quick Actions */}
      <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Chip 
            label="All" 
            size="small" 
            color="primary" 
            sx={{ borderRadius: 2 }}
          />
          <Chip 
            label="Unread" 
            size="small" 
            variant="outlined" 
            sx={{ borderRadius: 2 }}
          />
          <Chip 
            label="Groups" 
            size="small" 
            variant="outlined" 
            sx={{ borderRadius: 2 }}
          />
        </Box>
      </Box>

      {filteredRooms.length === 0 ? (
        <Box 
          sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center',
            flex: 1,
            px: 4,
            textAlign: 'center',
          }}
        >
          <Box>
            <ChatIcon sx={{ 
              fontSize: 80, 
              color: alpha(theme.palette.primary.main, 0.3), 
              mb: 2 
            }} />
            <Typography variant="h6" color="text.primary" gutterBottom>
              {searchQuery ? 'No results found' : 'No conversations yet'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {searchQuery 
                ? 'Try searching with different keywords'
                : 'Start a new conversation to begin chatting'
                }
              </Typography>
              {!searchQuery && (
                <Chip
                  label="Start New Chat"
                  onClick={() => setStartConversationOpen(true)}
                  sx={{
                    bgcolor: theme.palette.primary.main,
                    color: 'white',
                    '&:hover': {
                      bgcolor: theme.palette.primary.dark,
                    },
                  }}
                />
              )}
            </Box>
        </Box>
      ) : (
        <List sx={{ flex: 1, overflow: 'auto', py: 0 }}>
          {filteredRooms.map((room, index) => {
            const contactName = getContactName(room);
            const contactAvatar = getContactAvatar(room);
            const lastMessageTime = getLastMessageTime();
            const lastMessagePreview = getLastMessagePreview();
            const otherUserStatus = getOtherUserStatus(room);
            const isOnline = isUserOnline(room);

            return (
              <ListItem
                key={room._id}
                disablePadding
                sx={{
                  borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                  '&:hover': {
                    bgcolor: alpha(theme.palette.primary.main, 0.05),
                  },
                  }}
                >
                  <ListItemButton
                    onClick={() => onChatSelect(room._id)}
                    sx={{
                      py: 2,
                      px: 2,
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        bgcolor: 'transparent',
                      },
                    }}
                  >
                    <ListItemAvatar>
                      <Badge
                        overlap="circular"
                        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                        variant="dot"
                        sx={{
                          '& .MuiBadge-dot': {
                            backgroundColor: isOnline ? '#4caf50' : 'transparent',
                            width: 12,
                            height: 12,
                            borderRadius: '50%',
                            border: `2px solid ${theme.palette.background.paper}`,
                          },
                        }}
                      >
                        <Avatar
                          src={contactAvatar || undefined}
                          sx={{
                            width: 50,
                            height: 50,
                            bgcolor: room.type === 'group' ? theme.palette.secondary.main : theme.palette.primary.main,
                            fontSize: '1.2rem',
                            fontWeight: 600,
                          }}
                        >
                          {room.type === 'group' ? (
                            <GroupIcon />
                          ) : (
                            contactName.charAt(0).toUpperCase()
                          )}
                        </Avatar>
                      </Badge>
                    </ListItemAvatar>
                    
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography
                            variant="subtitle1"
                            sx={{
                              fontWeight: 600,
                              fontSize: '1rem',
                              color: 'text.primary',
                            }}
                          >
                            {contactName}
                          </Typography>
                          {room.type === 'group' && (
                            <GroupIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                          )}
                          {isOnline && (
                            <CheckCircleIcon sx={{ fontSize: 16, color: '#4caf50' }} />
                          )}
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography
                            variant="body2"
                            sx={{
                              color: 'text.secondary',
                              fontSize: '0.875rem',
                              mb: 0.5,
                            }}
                          >
                            {lastMessagePreview}
                          </Typography>
                          {otherUserStatus && (
                            <Typography
                              variant="caption"
                              sx={{
                                color: isOnline ? '#4caf50' : 'text.secondary',
                                fontSize: '0.75rem',
                                fontWeight: isOnline ? 600 : 400,
                              }}
                            >
                              {isOnline ? 'Online' : otherUserStatus}
                            </Typography>
                          )}
                        </Box>
                      }
                    />
                    
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
                      <Typography
                        variant="caption"
                        sx={{
                          color: 'text.secondary',
                          fontSize: '0.75rem',
                        }}
                      >
                        {lastMessageTime}
                      </Typography>
                      
                      {/* Unread messages badge */}
                      <Badge
                        badgeContent={Math.floor(Math.random() * 5) + 1}
                        color="primary"
                        sx={{
                          '& .MuiBadge-badge': {
                            fontSize: '0.75rem',
                            height: 20,
                            minWidth: 20,
                          },
                        }}
                      />
                      
                      {/* Pinned indicator */}
                      {index === 0 && (
                        <PushPinIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                      )}
                    </Box>
                  </ListItemButton>
                </ListItem>
            );
          })}
        </List>
      )}

      {/* Floating Action Button */}
      <Fab
        color="primary"
        onClick={() => setStartConversationOpen(true)}
        sx={{
          position: 'absolute',
          bottom: 20,
          right: 20,
          background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
          '&:hover': {
            background: `linear-gradient(45deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`,
            transform: 'scale(1.1)',
          },
          transition: 'all 0.3s ease',
          boxShadow: theme.shadows[8],
        }}
      >
        <ChatIcon />
      </Fab>

      {/* Start Conversation Dialog */}
      <StartConversation
        open={startConversationOpen}
        onClose={() => setStartConversationOpen(false)}
        onConversationCreated={handleConversationCreated}
      />
    </Box>
  );
};

export default WhatsAppChatList;
