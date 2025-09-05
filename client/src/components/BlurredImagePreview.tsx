import React, { useState } from 'react';
import {
  Box,
  IconButton,
  Typography,
  CircularProgress,
  Tooltip,
  alpha,
  useTheme,
} from '@mui/material';
import {
  Download as DownloadIcon,
  Lock as LockIcon,
} from '@mui/icons-material';
import { fileApi } from '../services/api';

interface BlurredImagePreviewProps {
  fileData: {
    filename: string;
    originalName: string;
    mimetype: string;
    size: number;
    url: string;
    publicId?: string;
    blurredThumbnail?: string;
  };
  messageId: string;
  isOwnMessage: boolean;
  className?: string;
  style?: React.CSSProperties;
}

const BlurredImagePreview: React.FC<BlurredImagePreviewProps> = ({
  fileData,
  messageId,
  isOwnMessage,
  className,
  style,
}) => {
  const theme = useTheme();
  const [isDownloading, setIsDownloading] = useState(false);
  const [hasDownloaded, setHasDownloaded] = useState(false);
  const [fullImageUrl, setFullImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Check if already downloaded from localStorage
  React.useEffect(() => {
    const downloaded = localStorage.getItem(`downloaded_${messageId}`);
    const cachedUrl = localStorage.getItem(`image_${messageId}`);
    
    if (downloaded === 'true' && cachedUrl) {
      setHasDownloaded(true);
      setFullImageUrl(cachedUrl);
    }
  }, [messageId]);

  // Show full image immediately for own messages
  if (isOwnMessage) {
    return (
      <Box
        component="img"
        src={fileData.url}
        alt={fileData.originalName}
        className={className}
        style={style}
        sx={{
          maxWidth: '100%',
          maxHeight: 300,
          borderRadius: 2,
          cursor: 'pointer',
          objectFit: 'cover',
        }}
      />
    );
  }

  const handleDownload = async () => {
    if (hasDownloaded || isDownloading) return;

    setIsDownloading(true);
    setError(null);

    try {
      const response = await fileApi.downloadFile(messageId);
      
      if (response.success) {
        setFullImageUrl(response.downloadUrl);
        setHasDownloaded(true);
        
        // Store in localStorage for future visits
        localStorage.setItem(`downloaded_${messageId}`, 'true');
        localStorage.setItem(`image_${messageId}`, response.downloadUrl);
      } else {
        setError(response.error || 'Failed to download image');
      }
    } catch (error: any) {
      console.error('Download failed:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to download image';
      setError(errorMessage);
    } finally {
      setIsDownloading(false);
    }
  };

  // If downloaded, show the full image
  if (hasDownloaded && fullImageUrl) {
    return (
      <Box
        component="img"
        src={fullImageUrl}
        alt={fileData.originalName}
        className={className}
        style={style}
        sx={{
          maxWidth: '100%',
          maxHeight: 300,
          borderRadius: 2,
          cursor: 'pointer',
          objectFit: 'cover',
        }}
      />
    );
  }

  // Show blurred preview with download overlay
  return (
    <Box
      sx={{
        position: 'relative',
        maxWidth: '100%',
        maxHeight: 300,
        borderRadius: 2,
        overflow: 'hidden',
        backgroundColor: alpha(theme.palette.background.paper, 0.1),
        ...style,
      }}
      className={className}
    >
      {/* Blurred background image */}
      {fileData.blurredThumbnail && (
        <Box
          component="img"
          src={fileData.blurredThumbnail}
          alt="Blurred preview"
          sx={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: 0.7,
          }}
        />
      )}
      
      {/* Download overlay */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: alpha(theme.palette.background.default, 0.8),
          backdropFilter: 'blur(2px)',
          gap: 1,
        }}
      >
        <LockIcon 
          sx={{ 
            fontSize: 32, 
            color: theme.palette.text.secondary,
            mb: 1 
          }} 
        />
        
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ textAlign: 'center', px: 2 }}
        >
          {fileData.originalName}
        </Typography>
        
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ textAlign: 'center', px: 2, mb: 2 }}
        >
          Click to download and view the full image
        </Typography>

        {error && (
          <Typography
            variant="caption"
            color="error"
            sx={{ textAlign: 'center', px: 2, mb: 1 }}
          >
            {error}
          </Typography>
        )}

        <Tooltip title="Download and view full image">
          <IconButton
            onClick={handleDownload}
            disabled={isDownloading}
            sx={{
              backgroundColor: theme.palette.primary.main,
              color: 'white',
              '&:hover': {
                backgroundColor: theme.palette.primary.dark,
              },
              '&.Mui-disabled': {
                backgroundColor: alpha(theme.palette.primary.main, 0.5),
                color: alpha(theme.palette.common.white, 0.5),
              },
            }}
          >
            {isDownloading ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              <DownloadIcon />
            )}
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );
};

export default BlurredImagePreview;
