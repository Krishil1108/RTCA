import React from 'react';
import { Box, useTheme } from '@mui/material';
import {
  Check as CheckIcon,
  DoneAll as DoneAllIcon,
} from '@mui/icons-material';

interface ReadReceiptProps {
  status: 'sent' | 'delivered' | 'read';
  size?: 'small' | 'medium';
  showTooltip?: boolean;
}

const ReadReceipt: React.FC<ReadReceiptProps> = ({ 
  status, 
  size = 'small',
  showTooltip = true 
}) => {
  const theme = useTheme();
  
  const iconSize = size === 'small' ? 14 : 16;
  const marginLeft = size === 'small' ? 0.5 : 1;

  const getStatusColor = () => {
    switch (status) {
      case 'sent':
        return theme.palette.text.secondary;
      case 'delivered':
        return theme.palette.text.secondary;
      case 'read':
        return '#1976d2'; // Blue color for read
      default:
        return theme.palette.text.secondary;
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'sent':
        return (
          <CheckIcon 
            sx={{ 
              fontSize: iconSize,
              color: getStatusColor(),
              opacity: 0.7
            }} 
          />
        );
      case 'delivered':
        return (
          <DoneAllIcon 
            sx={{ 
              fontSize: iconSize,
              color: getStatusColor(),
              opacity: 0.7
            }} 
          />
        );
      case 'read':
        return (
          <DoneAllIcon 
            sx={{ 
              fontSize: iconSize,
              color: getStatusColor()
            }} 
          />
        );
      default:
        return null;
    }
  };

  const getTooltipText = () => {
    switch (status) {
      case 'sent':
        return 'Sent';
      case 'delivered':
        return 'Delivered';
      case 'read':
        return 'Read';
      default:
        return '';
    }
  };

  return (
    <Box
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        ml: marginLeft,
        opacity: 0.8,
      }}
      title={showTooltip ? getTooltipText() : undefined}
    >
      {getStatusIcon()}
    </Box>
  );
};

export default ReadReceipt;
