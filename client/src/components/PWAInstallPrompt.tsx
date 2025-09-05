import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  IconButton,
  useTheme,
} from '@mui/material';
import {
  GetApp as InstallIcon,
  Close as CloseIcon,
  PhoneIphone as PhoneIcon,
  Computer as ComputerIcon,
} from '@mui/icons-material';

interface PWAInstallPromptProps {
  onInstall?: () => void;
  onDismiss?: () => void;
}

const PWAInstallPrompt: React.FC<PWAInstallPromptProps> = ({
  onInstall,
  onDismiss,
}) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const theme = useTheme();

  useEffect(() => {
    // Check if running in standalone mode
    const standalone = window.matchMedia('(display-mode: standalone)').matches;
    setIsStandalone(standalone);

    // Check if iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later
      setDeferredPrompt(e);
      // Show the install prompt after a delay
      setTimeout(() => {
        if (!standalone && !localStorage.getItem('pwa-dismissed')) {
          setShowInstallPrompt(true);
        }
      }, 3000); // Show after 3 seconds
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      // Show the install prompt
      deferredPrompt.prompt();
      // Wait for the user to respond to the prompt
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('User accepted the install prompt');
        onInstall?.();
      } else {
        console.log('User dismissed the install prompt');
      }
      
      // Clear the deferredPrompt variable
      setDeferredPrompt(null);
    }
    setShowInstallPrompt(false);
  };

  const handleDismiss = () => {
    setShowInstallPrompt(false);
    localStorage.setItem('pwa-dismissed', 'true');
    onDismiss?.();
  };

  // Don't show if already installed or dismissed
  if (isStandalone || !showInstallPrompt) {
    return null;
  }

  return (
    <Dialog
      open={showInstallPrompt}
      onClose={handleDismiss}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          background: theme.palette.mode === 'dark'
            ? 'linear-gradient(145deg, #1e293b 0%, #334155 100%)'
            : 'linear-gradient(145deg, #f8fafc 0%, #e2e8f0 100%)',
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          pb: 1,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <InstallIcon color="primary" />
          <Typography variant="h6">Install RTCA</Typography>
        </Box>
        <IconButton onClick={handleDismiss} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ textAlign: 'center', py: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
            {isIOS ? (
              <PhoneIcon sx={{ fontSize: 48, color: theme.palette.primary.main }} />
            ) : (
              <ComputerIcon sx={{ fontSize: 48, color: theme.palette.primary.main }} />
            )}
          </Box>
          
          <Typography variant="h6" gutterBottom>
            Install RTCA for a better experience!
          </Typography>
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Get faster access, offline functionality, and native app experience.
          </Typography>

          {isIOS ? (
            <Box sx={{ textAlign: 'left', mt: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                To install on iOS:
              </Typography>
              <Typography variant="body2" color="text.secondary" component="ol" sx={{ pl: 2 }}>
                <li>Tap the Share button in Safari</li>
                <li>Scroll down and tap "Add to Home Screen"</li>
                <li>Tap "Add" to install RTCA</li>
              </Typography>
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary">
              Click "Install" to add RTCA to your device!
            </Typography>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2, pt: 0 }}>
        <Button onClick={handleDismiss} variant="outlined">
          Maybe Later
        </Button>
        {!isIOS && (
          <Button
            onClick={handleInstallClick}
            variant="contained"
            startIcon={<InstallIcon />}
            disabled={!deferredPrompt}
          >
            Install App
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default PWAInstallPrompt;
