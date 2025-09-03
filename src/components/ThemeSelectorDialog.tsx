import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Radio,
  IconButton,
  Typography,
} from '@mui/material';
import {
  Close as CloseIcon,
  LightMode as LightIcon,
  DarkMode as DarkIcon,
  SettingsBrightness as AutoIcon,
} from '@mui/icons-material';
import { useAriztaTheme } from '../contexts/ThemeContext';

interface ThemeSelectorDialogProps {
  open: boolean;
  onClose: () => void;
}

const ThemeSelectorDialog: React.FC<ThemeSelectorDialogProps> = ({ open, onClose }) => {
  const { themeMode, setThemeMode } = useAriztaTheme();

  const themeOptions = [
    {
      value: 'auto' as const,
      label: 'System default',
      description: 'Use system setting',
      icon: <AutoIcon />,
    },
    {
      value: 'light' as const,
      label: 'Light',
      description: 'Use light theme',
      icon: <LightIcon />,
    },
    {
      value: 'dark' as const,
      label: 'Dark',
      description: 'Use dark theme',
      icon: <DarkIcon />,
    },
  ];

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'auto') => {
    setThemeMode(newTheme);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
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
          bgcolor: 'primary.main',
          color: 'white',
          py: 2,
        }}
      >
        <Typography variant="h6">Choose theme</Typography>
        <IconButton onClick={onClose} sx={{ color: 'white' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        <List sx={{ py: 0 }}>
          {themeOptions.map((option) => (
            <ListItem key={option.value} disablePadding>
              <ListItemButton
                onClick={() => handleThemeChange(option.value)}
                sx={{
                  py: 2,
                  px: 3,
                  '&:hover': {
                    bgcolor: 'action.hover',
                  },
                }}
              >
                <div style={{ marginRight: 16, color: 'text.secondary' }}>
                  {option.icon}
                </div>
                <ListItemText
                  primary={option.label}
                  secondary={option.description}
                  sx={{
                    flex: 1,
                    '& .MuiListItemText-primary': {
                      fontWeight: themeMode === option.value ? 600 : 400,
                    },
                  }}
                />
                <Radio
                  checked={themeMode === option.value}
                  onChange={() => handleThemeChange(option.value)}
                  sx={{
                    color: 'primary.main',
                    '&.Mui-checked': {
                      color: 'primary.main',
                    },
                  }}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </DialogContent>
    </Dialog>
  );
};

export default ThemeSelectorDialog;
