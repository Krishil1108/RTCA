import React, { useState } from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Badge,
  Avatar,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Divider,
  Toolbar,
} from '@mui/material';
import {
  Add as AddIcon,
  Group as GroupIcon,
  Public as PublicIcon,
  Lock as PrivateIcon,
  Tag as TagIcon,
} from '@mui/icons-material';
import { useChat } from '../contexts/ChatContext';
import { Room } from '../services/chatService';

interface SidebarProps {
  onRoomSelect?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onRoomSelect }) => {
  const { rooms, currentRoom, joinRoom, createRoom, isLoading } = useChat();
  const [createRoomOpen, setCreateRoomOpen] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomDescription, setNewRoomDescription] = useState('');
  const [newRoomType, setNewRoomType] = useState<'public' | 'private'>('public');
  const [createRoomLoading, setCreateRoomLoading] = useState(false);

  const handleRoomSelect = (roomId: string) => {
    joinRoom(roomId);
    onRoomSelect?.();
  };

  const handleCreateRoom = async () => {
    if (!newRoomName.trim()) return;

    setCreateRoomLoading(true);
    try {
      await createRoom({
        name: newRoomName.trim(),
        description: newRoomDescription.trim(),
        type: newRoomType,
      });
      setCreateRoomOpen(false);
      setNewRoomName('');
      setNewRoomDescription('');
      setNewRoomType('public');
    } catch (error) {
      console.error('Failed to create room:', error);
    } finally {
      setCreateRoomLoading(false);
    }
  };

  const formatLastMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString();
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Toolbar />
      
      {/* Header */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="h6" gutterBottom>
          Chat Rooms
        </Typography>
        <Typography variant="body2" color="textSecondary">
          {rooms.length} room{rooms.length !== 1 ? 's' : ''} available
        </Typography>
      </Box>

      {/* Rooms List */}
      <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
        {isLoading ? (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="textSecondary">
              Loading rooms...
            </Typography>
          </Box>
        ) : rooms.length === 0 ? (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              No rooms yet
            </Typography>
            <Typography variant="caption" color="textSecondary">
              Create your first room to get started!
            </Typography>
          </Box>
        ) : (
          <List sx={{ py: 0 }}>
            {rooms.map((room: Room) => {
              const isSelected = room._id === currentRoom;
              const hasUnreadMessages = false; // TODO: Implement unread count
              
              return (
                <ListItem key={room._id} disablePadding>
                  <ListItemButton
                    selected={isSelected}
                    onClick={() => handleRoomSelect(room._id)}
                    sx={{
                      borderRadius: 1,
                      mx: 1,
                      my: 0.25,
                      '&.Mui-selected': {
                        backgroundColor: 'primary.main',
                        color: 'primary.contrastText',
                        '&:hover': {
                          backgroundColor: 'primary.dark',
                        },
                      },
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      {room.type === 'private' ? (
                        <PrivateIcon 
                          fontSize="small" 
                          color={isSelected ? 'inherit' : 'action'}
                        />
                      ) : (
                        <PublicIcon 
                          fontSize="small" 
                          color={isSelected ? 'inherit' : 'action'}
                        />
                      )}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography
                            variant="subtitle2"
                            sx={{
                              fontWeight: hasUnreadMessages ? 'bold' : 'normal',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              flex: 1,
                            }}
                          >
                            {room.name}
                          </Typography>
                          {hasUnreadMessages && (
                            <Badge
                              color="error"
                              variant="dot"
                              sx={{ '& .MuiBadge-badge': { right: -6, top: 6 } }}
                            />
                          )}
                        </Box>
                      }
                      secondary={
                        room.lastMessage ? (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                            <Typography
                              variant="caption"
                              sx={{
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                flex: 1,
                                opacity: isSelected ? 0.8 : 0.7,
                              }}
                            >
                              {room.lastMessage.sender?.name}: {room.lastMessage.content}
                            </Typography>
                            <Typography
                              variant="caption"
                              sx={{
                                opacity: isSelected ? 0.8 : 0.6,
                                fontSize: '0.7rem',
                              }}
                            >
                              {formatLastMessageTime(room.lastMessage.createdAt)}
                            </Typography>
                          </Box>
                        ) : (
                          <Typography
                            variant="caption"
                            sx={{
                              opacity: isSelected ? 0.8 : 0.6,
                            }}
                          >
                            No messages yet
                          </Typography>
                        )
                      }
                    />
                  </ListItemButton>
                </ListItem>
              );
            })}
          </List>
        )}
      </Box>

      {/* Create Room FAB */}
      <Box sx={{ p: 2 }}>
        <Fab
          color="primary"
          aria-label="create room"
          onClick={() => setCreateRoomOpen(true)}
          size="medium"
          sx={{ width: '100%', borderRadius: 2 }}
        >
          <AddIcon sx={{ mr: 1 }} />
          New Room
        </Fab>
      </Box>

      {/* Create Room Dialog */}
      <Dialog
        open={createRoomOpen}
        onClose={() => setCreateRoomOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Create New Room</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Room Name"
            type="text"
            fullWidth
            variant="outlined"
            value={newRoomName}
            onChange={(e) => setNewRoomName(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Description (optional)"
            type="text"
            fullWidth
            variant="outlined"
            multiline
            rows={2}
            value={newRoomDescription}
            onChange={(e) => setNewRoomDescription(e.target.value)}
            sx={{ mb: 2 }}
          />
          <FormControl fullWidth>
            <InputLabel>Room Type</InputLabel>
            <Select
              value={newRoomType}
              label="Room Type"
              onChange={(e) => setNewRoomType(e.target.value as 'public' | 'private')}
            >
              <MenuItem value="public">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PublicIcon fontSize="small" />
                  Public - Anyone can join
                </Box>
              </MenuItem>
              <MenuItem value="private">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PrivateIcon fontSize="small" />
                  Private - Invite only
                </Box>
              </MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateRoomOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleCreateRoom}
            variant="contained"
            disabled={!newRoomName.trim() || createRoomLoading}
          >
            {createRoomLoading ? 'Creating...' : 'Create Room'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Sidebar;
