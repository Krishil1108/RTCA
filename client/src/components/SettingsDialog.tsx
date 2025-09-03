import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Switch,
  Divider,
  Typography,
  IconButton,
  Box,
  useTheme,
} from '@mui/material';
import {
  Close as CloseIcon,
  Notifications as NotificationsIcon,
  VolumeUp as VolumeIcon,
  Palette as ThemeIcon,
  Security as PrivacyIcon,
  Storage as DataIcon,
  Help as HelpIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useAriztaTheme } from '../contexts/ThemeContext';
import ThemeSelectorDialog from './ThemeSelectorDialog';

interface SettingsDialogProps {
  open: boolean;
  onClose: () => void;
}

const SettingsDialog: React.FC<SettingsDialogProps> = ({ open, onClose }) => {
  const { user } = useAuth();
  const { themeMode } = useAriztaTheme();
  const theme = useTheme();
  const [notifications, setNotifications] = useState(user?.settings?.notifications ?? true);
  const [soundEnabled, setSoundEnabled] = useState(user?.settings?.soundEnabled ?? true);
  const [themeDialogOpen, setThemeDialogOpen] = useState(false);

  const getThemeDisplayText = () => {
    switch (themeMode) {
      case 'light':
        return 'Light';
      case 'dark':
        return 'Dark';
      case 'auto':
        return 'System Default';
      default:
        return 'System Default';
    }
  };

  // Commented out unused function to resolve ESLint warnings
  // const getThemeIcon = () => {
  //   switch (themeMode) {
  //     case 'light':
  //       return <Brightness7Icon />;
  //     case 'dark':
  //       return <Brightness4Icon />;
  //     case 'auto':
  //       return <BrightnessAutoIcon />;
  //     default:
  //       return <BrightnessAutoIcon />;
  //   }
  // };

  const handleNotificationChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setNotifications(event.target.checked);
    // TODO: Update user settings
  };

  const handleSoundChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSoundEnabled(event.target.checked);
    // TODO: Update user settings
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          bgcolor: theme.palette.primary.main,
          color: 'white',
        }}
      >
        <Typography variant="h6">Settings</Typography>
        <IconButton onClick={onClose} sx={{ color: 'white' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        <List>
          {/* Notifications Section */}
          <ListItem>
            <ListItemIcon>
              <NotificationsIcon color="action" />
            </ListItemIcon>
            <ListItemText
              primary="Notifications"
              secondary="Receive notifications for new messages"
            />
            <ListItemSecondaryAction>
              <Switch
                checked={notifications}
                onChange={handleNotificationChange}
                color="primary"
              />
            </ListItemSecondaryAction>
          </ListItem>

          {/* Sound Section */}
          <ListItem>
            <ListItemIcon>
              <VolumeIcon color="action" />
            </ListItemIcon>
            <ListItemText
              primary="Message sounds"
              secondary="Play sound when receiving messages"
            />
            <ListItemSecondaryAction>
              <Switch
                checked={soundEnabled}
                onChange={handleSoundChange}
                color="primary"
              />
            </ListItemSecondaryAction>
          </ListItem>

          <Divider />

          {/* Theme Section */}
          <ListItemButton onClick={() => setThemeDialogOpen(true)}>
            <ListItemIcon>
              <ThemeIcon color="action" />
            </ListItemIcon>
            <ListItemText
              primary="Theme"
              secondary={getThemeDisplayText()}
            />
          </ListItemButton>

          <Divider />

          {/* Privacy Section */}
          <ListItemButton onClick={() => {/* TODO: Implement privacy settings */}}>
            <ListItemIcon>
              <PrivacyIcon color="action" />
            </ListItemIcon>
            <ListItemText
              primary="Privacy"
              secondary="Manage your privacy settings"
            />
          </ListItemButton>

          {/* Data Usage Section */}
          <ListItemButton onClick={() => {/* TODO: Implement data settings */}}>
            <ListItemIcon>
              <DataIcon color="action" />
            </ListItemIcon>
            <ListItemText
              primary="Data and storage usage"
              secondary="Network usage, auto-download"
            />
          </ListItemButton>

          <Divider />

          {/* Help Section */}
          <ListItemButton onClick={() => {/* TODO: Implement help */}}>
            <ListItemIcon>
              <HelpIcon color="action" />
            </ListItemIcon>
            <ListItemText
              primary="Help"
              secondary="Help center, contact us, terms and privacy policy"
            />
          </ListItemButton>
        </List>

        {/* App Info */}
        <Box sx={{ p: 2, textAlign: 'center', color: 'text.secondary' }}>
          <Typography variant="body2">
            RTCA Chat v1.0.0
          </Typography>
          <Typography variant="caption" display="block">
            Made with ❤️ for real-time communication
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} variant="contained" sx={{
          bgcolor: theme.palette.primary.main,
          '&:hover': { bgcolor: theme.palette.primary.dark },
        }}>
          Done
        </Button>
      </DialogActions>
      
      {/* Theme Selector Dialog */}
      <ThemeSelectorDialog
        open={themeDialogOpen}
        onClose={() => setThemeDialogOpen(false)}
      />
    </Dialog>
  );
};

export default SettingsDialog;
