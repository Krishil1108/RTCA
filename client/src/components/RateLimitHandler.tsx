import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Button,
  Box,
  LinearProgress,
  Alert,
  Chip,
} from '@mui/material';
import {
  HourglassEmpty as HourglassIcon,
  Refresh as RefreshIcon,
  Info as InfoIcon,
} from '@mui/icons-material';

interface RateLimitHandlerProps {
  open: boolean;
  onClose: () => void;
  retryAfter?: number; // seconds
  message?: string;
  onRetry?: () => void;
}

const RateLimitHandler: React.FC<RateLimitHandlerProps> = ({
  open,
  onClose,
  retryAfter = 60,
  message = "Too many requests. Please wait before trying again.",
  onRetry
}) => {
  const [timeLeft, setTimeLeft] = useState(retryAfter);
  const [canRetry, setCanRetry] = useState(false);

  useEffect(() => {
    if (!open) {
      setTimeLeft(retryAfter);
      setCanRetry(false);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setCanRetry(true);
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [open, retryAfter]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    }
    onClose();
  };

  const progress = ((retryAfter - timeLeft) / retryAfter) * 100;

  return (
    <Dialog 
      open={open} 
      onClose={canRetry ? onClose : undefined}
      maxWidth="sm" 
      fullWidth
      disableEscapeKeyDown={!canRetry}
    >
      <DialogTitle sx={{ textAlign: 'center', pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
          <HourglassIcon color="warning" />
          <Typography variant="h6">Rate Limit Reached</Typography>
        </Box>
      </DialogTitle>
      
      <DialogContent sx={{ textAlign: 'center', pt: 1 }}>
        <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography variant="body1" sx={{ mb: 1 }}>
            {message}
          </Typography>
        </Alert>

        <Box sx={{ mb: 3 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            This helps us maintain service quality for all users.
          </Typography>
          
          {!canRetry ? (
            <Box>
              <Chip 
                icon={<HourglassIcon />}
                label={`Please wait ${formatTime(timeLeft)}`}
                color="warning"
                sx={{ mb: 2 }}
              />
              <LinearProgress 
                variant="determinate" 
                value={progress} 
                sx={{ height: 8, borderRadius: 4 }}
              />
            </Box>
          ) : (
            <Chip 
              icon={<RefreshIcon />}
              label="Ready to retry"
              color="success"
              sx={{ mb: 2 }}
            />
          )}
        </Box>

        <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <InfoIcon fontSize="small" />
            Tip: Refreshing the page multiple times may increase the wait time.
          </Typography>
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
        <Button 
          variant="outlined" 
          onClick={onClose}
          disabled={!canRetry}
        >
          Close
        </Button>
        {onRetry && (
          <Button 
            variant="contained" 
            onClick={handleRetry}
            disabled={!canRetry}
            startIcon={<RefreshIcon />}
          >
            {canRetry ? 'Try Again' : `Wait ${formatTime(timeLeft)}`}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default RateLimitHandler;
