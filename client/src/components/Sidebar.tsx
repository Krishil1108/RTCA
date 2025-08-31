import React, { useState } from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Avatar,
  Fab,
  Divider,
  Toolbar,
} from '@mui/material';
import {
  Add as AddIcon,
  Chat as ChatIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { useChat } from '../contexts/ChatContext';
import { useAuth } from '../contexts/AuthContext';
import { Room } from '../services/chatService';
import StartConversation from './StartConversation';

interface SidebarProps {
  onRoomSelect?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onRoomSelect }) => {
  const { rooms, currentRoom, joinRoom, loadRooms, isLoading } = useChat();
  const { user } = useAuth();
  const [startConversationOpen, setStartConversationOpen] = useState(false);

  const handleRoomSelect = (roomId: string) => {
    joinRoom(roomId);
    if (onRoomSelect) {
      onRoomSelect();
    }
  };

  const handleConversationCreated = async (roomId: string) => {
    await loadRooms(); // Refresh the rooms list
    joinRoom(roomId); // Join the new conversation
    if (onRoomSelect) {
      onRoomSelect();
    }
  };

  const getConversationName = (room: Room) => {
    if (room.type === 'direct') {
      // For direct conversations, show the other person's name
      const otherMember = room.members.find(member => member.user._id !== user?.id);
      return otherMember?.user.name || 'Unknown User';
    }
    return room.name;
  };

  const getConversationAvatar = (room: Room) => {
    if (room.type === 'direct' && room.members.length === 2) {
      // Show the other person's avatar
      const otherMember = room.members.find(member => member.user._id !== user?.id);
      return otherMember?.user.avatar || null;
    }
    return null;
  };

  const getLastSeen = (room: Room) => {
    if (room.type === 'direct' && room.members.length === 2) {
      const otherMember = room.members.find(member => member.user._id !== user?.id);
      return otherMember?.user.isOnline ? 'Online' : 'Offline';
    }
    return '';
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Toolbar>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          Conversations
        </Typography>
        <Fab
          size="small"
          color="primary"
          onClick={() => setStartConversationOpen(true)}
          sx={{ ml: 1 }}
        >
          <AddIcon />
        </Fab>
      </Toolbar>
      
      <Divider />
      
      <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
        {isLoading ? (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Loading conversations...
            </Typography>
          </Box>
        ) : rooms.length === 0 ? (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <ChatIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              No conversations yet
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Click the + button to start your first conversation with a friend
            </Typography>
          </Box>
        ) : (
          <List>
            {rooms.map((room: Room) => (
              <ListItem key={room._id} disablePadding>
                <ListItemButton
                  selected={currentRoom === room._id}
                  onClick={() => handleRoomSelect(room._id)}
                  sx={{
                    borderRadius: 1,
                    mx: 1,
                    mb: 0.5,
                  }}
                >
                  <ListItemIcon>
                    {getConversationAvatar(room) ? (
                      <Avatar
                        src={getConversationAvatar(room) || undefined}
                        sx={{ width: 40, height: 40 }}
                      />
                    ) : (
                      <Avatar sx={{ width: 40, height: 40 }}>
                        {room.type === 'direct' ? (
                          <PersonIcon />
                        ) : (
                          <ChatIcon />
                        )}
                      </Avatar>
                    )}
                  </ListItemIcon>
                  
                  <ListItemText
                    primary={
                      <Typography variant="subtitle2" noWrap>
                        {getConversationName(room)}
                      </Typography>
                    }
                    secondary={
                      <Typography variant="caption" color="text.secondary">
                        {getLastSeen(room)}
                      </Typography>
                    }
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        )}
      </Box>

      <StartConversation
        open={startConversationOpen}
        onClose={() => setStartConversationOpen(false)}
        onConversationCreated={handleConversationCreated}
      />
    </Box>
  );
};

export default Sidebar;
