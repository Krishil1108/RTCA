import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  TextField,
  Avatar,
  useTheme,
  alpha,
  IconButton,
  Stack,
  Chip,
  LinearProgress,
} from '@mui/material';
import {
  Close as CloseIcon,
  Send as SendIcon,
  Image as ImageIcon,
  VideoFile as VideoIcon,
  AudioFile as AudioIcon,
  AttachFile as FileIcon,
  Delete as DeleteIcon,
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
} from '@mui/icons-material';

interface FilePreviewDialogProps {
  open: boolean;
  files: File[];
  onClose: () => void;
  onSend: (files: File[], message?: string) => void;
  onRemoveFile: (index: number) => void;
  isUploading?: boolean;
  uploadProgress?: number;
}

const FilePreviewDialog: React.FC<FilePreviewDialogProps> = ({
  open,
  files,
  onClose,
  onSend,
  onRemoveFile,
  isUploading = false,
  uploadProgress = 0,
}) => {
  const theme = useTheme();
  const [message, setMessage] = useState('');
  const [audioPlaying, setAudioPlaying] = useState<number | null>(null);

  const handleSend = () => {
    onSend(files, message.trim() || undefined);
    setMessage('');
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return <ImageIcon />;
    if (file.type.startsWith('video/')) return <VideoIcon />;
    if (file.type.startsWith('audio/')) return <AudioIcon />;
    return <FileIcon />;
  };

  const handleAudioPlay = (index: number, audioElement: HTMLAudioElement) => {
    if (audioPlaying === index) {
      audioElement.pause();
      setAudioPlaying(null);
    } else {
      // Pause any currently playing audio
      if (audioPlaying !== null) {
        const currentAudio = document.getElementById(`audio-${audioPlaying}`) as HTMLAudioElement;
        if (currentAudio) currentAudio.pause();
      }
      audioElement.play();
      setAudioPlaying(index);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          maxHeight: '80vh',
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
        <Typography variant="h6">Send Files ({files.length})</Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Preview your files before sending:
          </Typography>
          {files.some(f => f.size > 10 * 1024 * 1024) && (
            <Typography variant="caption" color="warning.main" sx={{ mb: 2, display: 'block' }}>
              💡 Large files detected. Original quality will be preserved - upload may take a moment.
            </Typography>
          )}

          <Stack spacing={2}>
            {files.map((file, index) => (
              <Box
                key={index}
                sx={{
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: 2,
                  p: 2,
                  bgcolor: alpha(theme.palette.background.paper, 0.5),
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                  {/* File Preview */}
                  <Box sx={{ flexShrink: 0 }}>
                    {file.type.startsWith('image/') && (
                      <Box
                        component="img"
                        src={URL.createObjectURL(file)}
                        alt={file.name}
                        sx={{
                          width: 80,
                          height: 80,
                          objectFit: 'cover',
                          borderRadius: 1,
                          border: `1px solid ${theme.palette.divider}`,
                        }}
                      />
                    )}
                    {file.type.startsWith('video/') && (
                      <Box
                        component="video"
                        src={URL.createObjectURL(file)}
                        sx={{
                          width: 80,
                          height: 80,
                          objectFit: 'cover',
                          borderRadius: 1,
                          border: `1px solid ${theme.palette.divider}`,
                        }}
                      />
                    )}
                    {file.type.startsWith('audio/') && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <IconButton
                          size="small"
                          onClick={() => {
                            const audio = document.getElementById(`audio-${index}`) as HTMLAudioElement;
                            handleAudioPlay(index, audio);
                          }}
                          sx={{
                            bgcolor: theme.palette.primary.main,
                            color: 'white',
                            width: 40,
                            height: 40,
                            '&:hover': { bgcolor: theme.palette.primary.dark },
                          }}
                        >
                          {audioPlaying === index ? <PauseIcon fontSize="small" /> : <PlayIcon fontSize="small" />}
                        </IconButton>
                        <audio
                          id={`audio-${index}`}
                          src={URL.createObjectURL(file)}
                          onEnded={() => setAudioPlaying(null)}
                          style={{ display: 'none' }}
                        />
                      </Box>
                    )}
                    {!file.type.startsWith('image/') && 
                     !file.type.startsWith('video/') && 
                     !file.type.startsWith('audio/') && (
                      <Avatar
                        sx={{
                          width: 80,
                          height: 80,
                          bgcolor: theme.palette.primary.main,
                        }}
                      >
                        {getFileIcon(file)}
                      </Avatar>
                    )}
                  </Box>

                  {/* File Info */}
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                      variant="subtitle2"
                      sx={{
                        fontWeight: 600,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {file.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {file.type} • {formatFileSize(file.size)}
                    </Typography>
                    <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                      <Chip
                        label={file.type.split('/')[0]}
                        size="small"
                        variant="outlined"
                        color="primary"
                      />
                    </Stack>
                  </Box>

                  {/* Remove Button */}
                  <IconButton
                    onClick={() => onRemoveFile(index)}
                    size="small"
                    sx={{
                      color: theme.palette.error.main,
                      '&:hover': {
                        bgcolor: alpha(theme.palette.error.main, 0.1),
                      },
                    }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Box>
            ))}
          </Stack>
        </Box>

        {/* Upload Progress */}
        {isUploading && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="primary" sx={{ mb: 1 }}>
              📤 Uploading files in original quality... {Math.round(uploadProgress)}%
            </Typography>
            <LinearProgress 
              variant="determinate" 
              value={uploadProgress} 
              sx={{ borderRadius: 1 }}
            />
          </Box>
        )}

        {/* Message Input */}
        <TextField
          fullWidth
          multiline
          rows={3}
          placeholder="Add a message (optional)..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          variant="outlined"
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
            },
          }}
        />
      </DialogContent>

      <DialogActions sx={{ p: 2, pt: 1 }}>
        <Button onClick={onClose} variant="outlined">
          Cancel
        </Button>
        <Button
          onClick={handleSend}
          variant="contained"
          startIcon={<SendIcon />}
          disabled={files.length === 0 || isUploading}
          sx={{
            '&:disabled': {
              bgcolor: theme.palette.action.disabled,
            },
          }}
        >
          {isUploading ? 'Uploading...' : `Send ${files.length > 0 ? `(${files.length})` : ''}`}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default FilePreviewDialog;
