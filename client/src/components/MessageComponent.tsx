import React, { useState } from 'react';
import {
  Box,
  Avatar,
  Typography,
  Paper,
  IconButton,
  Chip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
} from '@mui/material';
import {
  MoreVert as MoreIcon,
  Reply as ReplyIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ContentCopy as CopyIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { useWhatsAppTheme } from '../contexts/ThemeContext';
import { useChat } from '../contexts/ChatContext';
import { Message } from '../services/chatService';

interface MessageComponentProps {
  message: Message;
  currentUserId?: string;
  showAvatar?: boolean;
  onReply?: (message: Message) => void;
}

const MessageComponent: React.FC<MessageComponentProps> = ({
  message,
  currentUserId,
  showAvatar = true,
  onReply,
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const [isEditing, setIsEditing] = useState(false);
  const { isDarkMode } = useWhatsAppTheme();
  const { editMessage, deleteMessage } = useChat();

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleReply = () => {
    if (onReply) {
      onReply(message);
    }
    handleMenuClose();
  };

  const handleEdit = () => {
    setEditContent(message.content);
    setEditDialogOpen(true);
    handleMenuClose();
  };

  const handleEditSave = async () => {
    if (editContent.trim() && editContent.trim() !== message.content) {
      setIsEditing(true);
      try {
        editMessage(message._id, editContent.trim());
        setEditDialogOpen(false);
      } catch (error) {
        console.error('Failed to edit message:', error);
      } finally {
        setIsEditing(false);
      }
    } else {
      setEditDialogOpen(false);
    }
  };

  const handleEditCancel = () => {
    setEditContent(message.content);
    setEditDialogOpen(false);
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this message?')) {
      deleteMessage(message._id);
    }
    handleMenuClose();
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(message.content);
    handleMenuClose();
  };

  const isSystemMessage = message.messageType === 'system';
  const isDeletedMessage = message.messageType === 'deleted';
  const isOwnMessage = currentUserId && message.sender._id === currentUserId;

  // Check if message can be edited/deleted (within 24 hours)
  const messageAge = Date.now() - new Date(message.createdAt).getTime();
  const maxEditTime = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
  const canEditDelete = isOwnMessage && messageAge <= maxEditTime && !isDeletedMessage;

  if (isSystemMessage) {
    return (
      <Box sx={{ my: 1, textAlign: 'center' }}>
        <Chip
          label={message.content}
          size="small"
          variant="outlined"
          sx={{ backgroundColor: 'grey.100' }}
        />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: isOwnMessage ? 'row-reverse' : 'row',
        alignItems: 'flex-start',
        mb: 1,
        gap: 1,
        position: 'relative',
        '&:hover .message-menu': {
          opacity: 1,
        },
      }}
    >
      {/* Avatar */}
      {showAvatar && !isOwnMessage && (
        <Avatar
          src={message.sender.avatar}
          sx={{
            width: 32,
            height: 32,
            bgcolor: 'primary.main',
            order: isOwnMessage ? 2 : 1,
          }}
        >
          {message.sender.name?.charAt(0).toUpperCase()}
        </Avatar>
      )}

      {/* Message Content */}
      <Box sx={{ 
        flexGrow: 1, 
        minWidth: 0,
        maxWidth: '70%',
        order: isOwnMessage ? 1 : 2,
        display: 'flex',
        flexDirection: 'column',
        alignItems: isOwnMessage ? 'flex-end' : 'flex-start'
      }}>
        {/* Sender Name */}
        {showAvatar && !isOwnMessage && (
          <Typography variant="caption" sx={{ 
            ml: 1, 
            mb: 0.5,
            color: isDarkMode ? '#8696a0' : 'text.secondary'
          }}>
            {message.sender.name}
          </Typography>
        )}

        {/* Reply To */}
        {message.replyTo && (
          <Paper
            variant="outlined"
            sx={{
              p: 1,
              mb: 1,
              backgroundColor: isDarkMode ? '#182229' : 'grey.50',
              borderLeft: 3,
              borderLeftColor: 'primary.main',
              borderRadius: 1,
            }}
          >
            <Typography variant="caption" color="primary" fontWeight="bold">
              Replying to {message.replyTo.sender.name}:
            </Typography>
            <Typography variant="body2" sx={{ 
              opacity: 0.8,
              color: isDarkMode ? '#8696a0' : 'inherit'
            }}>
              {message.replyTo.content.length > 100
                ? `${message.replyTo.content.substring(0, 100)}...`
                : message.replyTo.content}
            </Typography>
          </Paper>
        )}

        {/* Message Bubble */}
        <Paper
          elevation={1}
          sx={{
            p: 1.5,
            maxWidth: '100%',
            backgroundColor: isOwnMessage 
              ? (isDarkMode ? '#005c4b' : '#dcf8c6') 
              : (isDarkMode ? '#202c33' : '#ffffff'),
            color: isOwnMessage 
              ? (isDarkMode ? '#e9edef' : '#000') 
              : (isDarkMode ? '#e9edef' : '#000'),
            borderRadius: 2,
            borderTopLeftRadius: !isOwnMessage && showAvatar ? 1 : 2,
            borderTopRightRadius: isOwnMessage ? 1 : 2,
            position: 'relative',
            fontStyle: isDeletedMessage ? 'italic' : 'normal',
            opacity: isDeletedMessage ? 0.7 : 1,
          }}
        >
          <Typography 
            variant="body1" 
            sx={{ 
              wordBreak: 'break-word',
              whiteSpace: 'pre-wrap',
              fontSize: '0.95rem',
              lineHeight: 1.4,
            }}
          >
            {message.content}
            {message.edited && !isDeletedMessage && (
              <span style={{ fontStyle: 'italic' }}> (edited)</span>
            )}
          </Typography>

          {/* Reactions */}
          {message.reactions && message.reactions.length > 0 && (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
              {message.reactions.reduce((acc: any[], reaction) => {
                const existing = acc.find(r => r.emoji === reaction.emoji);
                if (existing) {
                  existing.count++;
                  existing.users.push(reaction.user.name);
                } else {
                  acc.push({
                    emoji: reaction.emoji,
                    count: 1,
                    users: [reaction.user.name],
                  });
                }
                return acc;
              }, []).map((reactionGroup, index) => (
                <Chip
                  key={index}
                  size="small"
                  variant="outlined"
                  label={`${reactionGroup.emoji} ${reactionGroup.count}`}
                  sx={{
                    height: 24,
                    fontSize: '0.75rem',
                    '&:hover': {
                      backgroundColor: 'primary.light',
                    },
                  }}
                  title={`${reactionGroup.users.join(', ')} reacted with ${reactionGroup.emoji}`}
                />
              ))}
            </Box>
          )}
        </Paper>

        {/* Message Menu Button */}
        <Paper
          className="message-menu"
          sx={{
            position: 'absolute',
            top: 0,
            right: isOwnMessage ? 'auto' : -35,
            left: isOwnMessage ? -35 : 'auto',
            opacity: 0,
            transition: 'opacity 0.2s',
            zIndex: 1,
            display: 'flex',
            alignItems: 'center',
            bgcolor: isDarkMode ? '#2a3942' : 'background.paper',
            borderRadius: 1,
            boxShadow: 1,
          }}
        >
          <IconButton
            size="small"
            onClick={handleMenuClick}
            sx={{ opacity: 0.6, '&:hover': { opacity: 1 } }}
          >
            <MoreIcon fontSize="small" />
          </IconButton>
        </Paper>

        {/* Timestamp */}
        <Typography 
          variant="caption" 
          sx={{ 
            mt: 0.5,
            ml: isOwnMessage ? 0 : 1,
            mr: isOwnMessage ? 1 : 0,
            alignSelf: isOwnMessage ? 'flex-end' : 'flex-start',
            color: isDarkMode ? '#8696a0' : 'text.secondary'
          }}
        >
          {formatTime(message.createdAt)}
          {message.edited && (
            <span style={{ fontStyle: 'italic' }}> (edited)</span>
          )}
        </Typography>
      </Box>

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        {!isDeletedMessage && (
          <MenuItem onClick={handleReply}>
            <ListItemIcon>
              <ReplyIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Reply</ListItemText>
          </MenuItem>
        )}
        {!isDeletedMessage && (
          <MenuItem onClick={copyToClipboard}>
            <ListItemIcon>
              <CopyIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Copy text</ListItemText>
          </MenuItem>
        )}
        {canEditDelete && (
          <MenuItem onClick={handleEdit}>
            <ListItemIcon>
              <EditIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Edit message</ListItemText>
          </MenuItem>
        )}
        {canEditDelete && (
          <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
            <ListItemIcon>
              <DeleteIcon fontSize="small" color="error" />
            </ListItemIcon>
            <ListItemText>Delete message</ListItemText>
          </MenuItem>
        )}
      </Menu>

      {/* Edit Dialog */}
      <Dialog 
        open={editDialogOpen} 
        onClose={handleEditCancel}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Edit Message
          <IconButton onClick={handleEditCancel}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={3}
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            variant="outlined"
            autoFocus
            sx={{ mt: 1 }}
            inputProps={{ maxLength: 2000 }}
            helperText={`${editContent.length}/2000 characters`}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleEditCancel}>
            Cancel
          </Button>
          <Button
            onClick={handleEditSave}
            variant="contained"
            disabled={isEditing || !editContent.trim() || editContent.trim() === message.content}
          >
            {isEditing ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MessageComponent;
