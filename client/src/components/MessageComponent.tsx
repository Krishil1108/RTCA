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
} from '@mui/material';
import {
  MoreVert as MoreIcon,
  Reply as ReplyIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ContentCopy as CopyIcon,
} from '@mui/icons-material';
import { Message } from '../services/chatService';

interface MessageComponentProps {
  message: Message;
  showAvatar?: boolean;
}

const MessageComponent: React.FC<MessageComponentProps> = ({
  message,
  showAvatar = true,
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
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
        gap: 1,
        p: 1,
        '&:hover': {
          backgroundColor: 'rgba(0, 0, 0, 0.02)',
        },
        '&:hover .message-actions': {
          visibility: 'visible',
        },
        borderRadius: 1,
      }}
    >
      {/* Avatar */}
      <Box sx={{ width: 40, display: 'flex', justifyContent: 'center', pt: 0.5 }}>
        {showAvatar ? (
          <Avatar
            src={message.sender.avatar}
            sx={{ width: 32, height: 32 }}
          >
            {message.sender.name.charAt(0).toUpperCase()}
          </Avatar>
        ) : null}
      </Box>

      {/* Message Content */}
      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
        {/* Header with name and time */}
        {showAvatar && (
          <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mb: 0.5 }}>
            <Typography
              variant="subtitle2"
              component="span"
              sx={{ fontWeight: 600, color: 'text.primary' }}
            >
              {message.sender.name}
            </Typography>
            <Typography
              variant="caption"
              component="span"
              sx={{ color: 'text.secondary' }}
            >
              {formatTime(message.createdAt)}
            </Typography>
            {message.edited && (
              <Typography
                variant="caption"
                component="span"
                sx={{ color: 'text.secondary', fontStyle: 'italic' }}
              >
                (edited)
              </Typography>
            )}
          </Box>
        )}

        {/* Reply To */}
        {message.replyTo && (
          <Paper
            variant="outlined"
            sx={{
              p: 1,
              mb: 1,
              backgroundColor: 'grey.50',
              borderLeft: 3,
              borderLeftColor: 'primary.main',
              borderRadius: 1,
            }}
          >
            <Typography variant="caption" color="primary" fontWeight="bold">
              Replying to {message.replyTo.sender.name}:
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.8 }}>
              {message.replyTo.content.length > 100
                ? `${message.replyTo.content.substring(0, 100)}...`
                : message.replyTo.content}
            </Typography>
          </Paper>
        )}

        {/* Message Text */}
        <Box sx={{ position: 'relative', display: 'flex', alignItems: 'flex-start', gap: 1 }}>
          <Typography
            variant="body2"
            component="div"
            sx={{
              flexGrow: 1,
              wordBreak: 'break-word',
              whiteSpace: 'pre-wrap',
            }}
          >
            {message.content}
          </Typography>

          {/* Message Actions */}
          <Box
            className="message-actions"
            sx={{
              visibility: 'hidden',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <IconButton
              size="small"
              onClick={handleMenuClick}
              sx={{ opacity: 0.6, '&:hover': { opacity: 1 } }}
            >
              <MoreIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>

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
        <MenuItem onClick={handleMenuClose}>
          <ListItemIcon>
            <ReplyIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Reply</ListItemText>
        </MenuItem>
        <MenuItem onClick={copyToClipboard}>
          <ListItemIcon>
            <CopyIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Copy text</ListItemText>
        </MenuItem>
        {/* Only show edit/delete for own messages */}
        {/* TODO: Add user ID check when implementing user management */}
        <MenuItem onClick={handleMenuClose}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit message</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleMenuClose} sx={{ color: 'error.main' }}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Delete message</ListItemText>
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default MessageComponent;
