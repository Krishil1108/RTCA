import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Avatar,
  Box,
  Badge,
  useTheme,
  alpha,
} from '@mui/material';
import {
  MoreVert as MoreIcon,
  StarBorder as StarIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  ArrowBack as ArrowBackIcon,
  Chat as ChatIcon,
  Person as PersonIcon,
  Search as SearchIcon,
  VideoCall as VideoCallIcon,
  Call as CallIcon,
  Notifications as NotificationsIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useAriztaTheme } from '../contexts/ThemeContext';

interface AriztaHeaderProps {
  title?: string;
  showBackButton?: boolean;
  onBackClick?: () => void;
  onSettingsClick?: () => void;
  variant?: 'main' | 'chat';
  onNewChatClick?: () => void;
  onStarredClick?: () => void;
  onProfileClick?: () => void;
  avatar?: string;
  isOnline?: boolean;
  lastSeen?: string;
}

const AriztaHeader: React.FC<AriztaHeaderProps> = ({
  title = 'RTCA Chat',
  showBackButton = false,
  onBackClick,
  onSettingsClick,
  variant = 'main',
  onNewChatClick = () => {},
  onStarredClick = () => {},
  onProfileClick = () => {},
  avatar,
  isOnline,
  lastSeen,
}) => {
  const { logout } = useAuth();
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleMenuItemClick = (action: () => void) => {
    action();
    handleMenuClose();
  };

  return (
    <>
      <AppBar 
        position="static" 
        sx={{ 
          backgroundColor: theme.palette.primary.main,
          zIndex: 1201,
          boxShadow: 'none',
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Toolbar sx={{ px: { xs: 1, sm: 2 } }}>
          {/* Back Button for mobile */}
          {showBackButton && (
            <IconButton
              edge="start"
              color="inherit"
              onClick={onBackClick}
              sx={{ 
                mr: 2,
                '&:hover': {
                  backgroundColor: alpha(theme.palette.common.white, 0.1),
                },
              }}
            >
              <ArrowBackIcon />
            </IconButton>
          )}
          
          {/* Avatar and Title Section */}
          <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
            {variant === 'chat' && avatar && (
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
                  src={avatar} 
                  sx={{ 
                    width: 40, 
                    height: 40, 
                    mr: 2,
                    border: `2px solid ${alpha(theme.palette.common.white, 0.2)}`,
                  }} 
                />
              </Badge>
            )}
            
            <Box sx={{ flexGrow: 1 }}>
              <Typography 
                variant="h6" 
                component="div" 
                sx={{ 
                  fontWeight: 600,
                  fontSize: '1.1rem',
                  lineHeight: 1.2,
                  color: 'white',
                }}
              >
                {title}
              </Typography>
              
              {variant === 'chat' && (
                <Typography 
                  variant="caption" 
                  sx={{ 
                    color: alpha(theme.palette.common.white, 0.8),
                    fontSize: '0.75rem',
                  }}
                >
                  {isOnline ? 'Online' : lastSeen ? `Last seen ${lastSeen}` : 'Offline'}
                </Typography>
              )}
            </Box>
          </Box>

          {/* Action Buttons */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            {variant === 'chat' && (
              <>
                <IconButton
                  color="inherit"
                  sx={{
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.common.white, 0.1),
                    },
                  }}
                >
                  <VideoCallIcon />
                </IconButton>
                <IconButton
                  color="inherit"
                  sx={{
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.common.white, 0.1),
                    },
                  }}
                >
                  <CallIcon />
                </IconButton>
              </>
            )}
            
            <IconButton
              color="inherit"
              sx={{
                '&:hover': {
                  backgroundColor: alpha(theme.palette.common.white, 0.1),
                },
              }}
            >
              <SearchIcon />
            </IconButton>

            {/* Notifications */}
            <Badge badgeContent={3} color="error">
              <IconButton
                color="inherit"
                sx={{
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.common.white, 0.1),
                  },
                }}
              >
                <NotificationsIcon />
              </IconButton>
            </Badge>

            {/* Settings Menu */}
            <IconButton
              color="inherit"
              onClick={handleMenuOpen}
              sx={{
                '&:hover': {
                  backgroundColor: alpha(theme.palette.common.white, 0.1),
                },
              }}
            >
              <MoreIcon />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Settings Menu */}
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
        PaperProps={{
          sx: {
            mt: 1,
            minWidth: 200,
          },
        }}
      >
        <MenuItem onClick={() => handleMenuItemClick(onProfileClick)}>
          <ListItemIcon>
            <PersonIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Profile</ListItemText>
        </MenuItem>
        
        <Divider />
        
        <MenuItem onClick={() => handleMenuItemClick(onNewChatClick)}>
          <ListItemIcon>
            <ChatIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>New chat</ListItemText>
        </MenuItem>
        
        <MenuItem onClick={() => handleMenuItemClick(onStarredClick)}>
          <ListItemIcon>
            <StarIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Starred messages</ListItemText>
        </MenuItem>
        
        <MenuItem onClick={() => onSettingsClick && handleMenuItemClick(onSettingsClick)}>
          <ListItemIcon>
            <SettingsIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Settings</ListItemText>
        </MenuItem>
        
        <Divider />
        
        <MenuItem onClick={() => handleMenuItemClick(logout)}>
          <ListItemIcon>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Log out</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
};

export default AriztaHeader;
