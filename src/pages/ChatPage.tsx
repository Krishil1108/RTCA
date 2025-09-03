import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  Drawer,
  useTheme,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  AccountCircle,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useChat } from '../contexts/ChatContext';
import Sidebar from '../components/Sidebar';
import ChatArea from '../components/ChatArea';
import LoadingSpinner from '../components/LoadingSpinner';
import { UI_CONSTANTS } from '../config/constants';

const ChatPage: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const theme = useTheme();
  
  const { user, logout } = useAuth();
  const { initializeSocket, loadRooms, isConnected, setCurrentRoom, currentRoom } = useChat();
  
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [, setStartConversationOpen] = useState(false);
  const hasInitialized = useRef(false);

  // Initialize socket and load data
  useEffect(() => {
    const initialize = async () => {
      if (hasInitialized.current) {
        console.log('ChatPage: Already initialized, skipping...');
        return;
      }
      
      hasInitialized.current = true;
      
      try {
        console.log('ChatPage: Starting socket initialization...');
        // Small delay to ensure auth is fully complete
        await new Promise(resolve => setTimeout(resolve, 1000));
        console.log('ChatPage: Connecting to socket...');
        await initializeSocket();
        console.log('ChatPage: Socket connected, loading rooms...');
        await loadRooms();
        console.log('ChatPage: Initialization complete');
      } catch (error) {
        console.error('Failed to initialize chat:', error);
        hasInitialized.current = false; // Reset on error
      }
    };
    initialize();
  }, [initializeSocket, loadRooms]); // Add missing dependencies

  // Set current room from URL
  useEffect(() => {
    if (roomId && roomId !== currentRoom) {
      setCurrentRoom(roomId);
    }
  }, [roomId, currentRoom, setCurrentRoom]);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleMenuItemClick = (action: () => void) => {
    action();
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    handleProfileMenuClose();
  };

  const handleStartConversation = () => {
    setStartConversationOpen(true);
  };

  if (!isConnected) {
    return <LoadingSpinner message="Connecting to chat server..." />;
  }

  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      {/* App Bar */}
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${UI_CONSTANTS.SIDEBAR_WIDTH}px)` },
          ml: { md: `${UI_CONSTANTS.SIDEBAR_WIDTH}px` },
          zIndex: theme.zIndex.drawer + 1,
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            Real-Time Chat Application
          </Typography>

          {/* Connection Status */}
          <Box
            sx={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: isConnected ? 'success.main' : 'error.main',
              mr: 2,
            }}
          />

          {/* User Menu */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" sx={{ display: { xs: 'none', sm: 'block' } }}>
              {user?.name}
            </Typography>
            <IconButton
              id="profile-button"
              size="large"
              edge="end"
              aria-label="account of current user"
              aria-haspopup="true"
              aria-controls={Boolean(anchorEl) ? 'profile-menu' : undefined}
              onClick={handleProfileMenuOpen}
              color="inherit"
            >
              {user?.avatar ? (
                <Avatar src={user.avatar} sx={{ width: 32, height: 32 }} />
              ) : (
                <AccountCircle />
              )}
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      {/* User Profile Menu */}
      <Menu
        id="profile-menu"
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleProfileMenuClose}
        disableAutoFocusItem
        keepMounted={false}
        MenuListProps={{
          'aria-labelledby': 'profile-button',
          role: 'menu',
        }}
        PaperProps={{
          elevation: 0,
          sx: {
            overflow: 'visible',
            filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
            mt: 1.5,
            '& .MuiAvatar-root': {
              width: 32,
              height: 32,
              ml: -0.5,
              mr: 1,
            },
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem disabled>
          <Avatar src={user?.avatar} />
          <Box>
            <Typography variant="body2" fontWeight="bold">
              {user?.name}
            </Typography>
            <Typography variant="caption" color="textSecondary">
              {user?.email}
            </Typography>
          </Box>
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => handleMenuItemClick(() => {})}>
          <SettingsIcon fontSize="small" sx={{ mr: 2 }} />
          Settings
        </MenuItem>
        <MenuItem onClick={() => handleMenuItemClick(handleLogout)}>
          <LogoutIcon fontSize="small" sx={{ mr: 2 }} />
          Logout
        </MenuItem>
      </Menu>

      {/* Sidebar */}
      <Box
        component="nav"
        sx={{ width: { md: UI_CONSTANTS.SIDEBAR_WIDTH }, flexShrink: { md: 0 } }}
      >
        {/* Mobile drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: UI_CONSTANTS.SIDEBAR_WIDTH,
            },
          }}
        >
          <Sidebar onRoomSelect={() => setMobileOpen(false)} />
        </Drawer>
        
        {/* Desktop drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: UI_CONSTANTS.SIDEBAR_WIDTH,
            },
          }}
          open
        >
          <Sidebar />
        </Drawer>
      </Box>

      {/* Main content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${UI_CONSTANTS.SIDEBAR_WIDTH}px)` },
        }}
      >
        <Toolbar />
        <ChatArea onStartConversation={handleStartConversation} />
      </Box>
    </Box>
  );
};

export default ChatPage;
