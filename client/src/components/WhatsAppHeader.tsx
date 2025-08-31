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
} from '@mui/material';
import {
  MoreVert as MoreIcon,
  StarBorder as StarIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  ArrowBack as ArrowBackIcon,
  Chat as ChatIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useWhatsAppTheme } from '../contexts/ThemeContext';

interface WhatsAppHeaderProps {
  title?: string;
  showBackButton?: boolean;
  onBackClick?: () => void;
  onSettingsClick?: () => void;
  variant?: 'main' | 'chat';
  onNewChatClick?: () => void;
  onStarredClick?: () => void;
  onProfileClick?: () => void;
}

const WhatsAppHeader: React.FC<WhatsAppHeaderProps> = ({
  title = 'RTCA Chat',
  showBackButton = false,
  onBackClick,
  onSettingsClick,
  variant = 'main',
  onNewChatClick = () => {},
  onStarredClick = () => {},
  onProfileClick = () => {},
}) => {
  const { logout } = useAuth();
  const { isDarkMode } = useWhatsAppTheme();
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
          bgcolor: isDarkMode ? '#202c33' : '#075e54', // WhatsApp green/dark
          zIndex: 1201,
        }}
      >
        <Toolbar>
          {/* Back Button for mobile */}
          {showBackButton && (
            <IconButton
              edge="start"
              color="inherit"
              onClick={onBackClick}
              sx={{ mr: 2 }}
            >
              <ArrowBackIcon />
            </IconButton>
          )}
          
          {/* App Logo/Title */}
          <Typography 
            variant="h6" 
            component="div" 
            sx={{ 
              flexGrow: 1,
              fontWeight: 500,
              fontSize: '1.25rem',
            }}
          >
            {title}
          </Typography>

          {/* Settings Menu */}
          <IconButton
            color="inherit"
            onClick={handleMenuOpen}
            sx={{ ml: 2 }}
          >
            <MoreIcon />
          </IconButton>
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

export default WhatsAppHeader;
