import React, { useState, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Avatar,
  TextField,
  Box,
  IconButton,
  Typography,
  Divider,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  PhotoCamera as PhotoCameraIcon,
  Close as CloseIcon,
  Edit as EditIcon,
  Check as CheckIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

interface ProfileDialogProps {
  open: boolean;
  onClose: () => void;
}

const ProfileDialog: React.FC<ProfileDialogProps> = ({ open, onClose }) => {
  const { user, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [about, setAbout] = useState(user?.about || 'Hey there! I am using RTCA Chat.');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Name cannot be empty');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await updateProfile({ name: name.trim(), about: about.trim() });
      setSuccess(true);
      setIsEditing(false);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setName(user?.name || '');
    setAbout(user?.about || 'Hey there! I am using RTCA Chat.');
    setIsEditing(false);
    setError(null);
  };

  const handleAvatarClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size should be less than 5MB');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('avatar', file);
      
      // Here you would typically upload to your server
      // For now, we'll create a local URL
      const avatarUrl = URL.createObjectURL(file);
      
      await updateProfile({ avatar: avatarUrl });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile picture');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (isEditing) {
      handleCancel();
    }
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
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
          bgcolor: '#128c7e',
          color: 'white',
        }}
      >
        <Typography variant="h6">Profile</Typography>
        <IconButton onClick={handleClose} sx={{ color: 'white' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 3 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Profile updated successfully!
          </Alert>
        )}

        {/* Profile Picture Section */}
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Box sx={{ position: 'relative', display: 'inline-block' }}>
            <Avatar
              src={user?.avatar}
              sx={{
                width: 120,
                height: 120,
                fontSize: '3rem',
                bgcolor: '#128c7e',
                cursor: 'pointer',
                transition: 'opacity 0.2s',
                '&:hover': { opacity: 0.8 },
              }}
              onClick={handleAvatarClick}
            >
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </Avatar>
            <IconButton
              sx={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                bgcolor: '#128c7e',
                color: 'white',
                width: 32,
                height: 32,
                '&:hover': { bgcolor: '#075e54' },
              }}
              onClick={handleAvatarClick}
            >
              <PhotoCameraIcon fontSize="small" />
            </IconButton>
          </Box>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            style={{ display: 'none' }}
          />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Click to change profile picture
          </Typography>
        </Box>

        <Divider sx={{ mb: 3 }} />

        {/* Name Section */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Name
            </Typography>
            {!isEditing && (
              <IconButton size="small" onClick={() => setIsEditing(true)}>
                <EditIcon fontSize="small" />
              </IconButton>
            )}
          </Box>
          {isEditing ? (
            <TextField
              fullWidth
              value={name}
              onChange={(e) => setName(e.target.value)}
              variant="outlined"
              size="small"
              autoFocus
              inputProps={{ maxLength: 25 }}
              helperText={`${name.length}/25 characters`}
            />
          ) : (
            <Typography variant="body1">{user?.name}</Typography>
          )}
        </Box>

        {/* About Section */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            About
          </Typography>
          {isEditing ? (
            <TextField
              fullWidth
              value={about}
              onChange={(e) => setAbout(e.target.value)}
              variant="outlined"
              size="small"
              multiline
              rows={2}
              inputProps={{ maxLength: 139 }}
              helperText={`${about.length}/139 characters`}
            />
          ) : (
            <Typography variant="body1">{user?.about || 'Hey there! I am using RTCA Chat.'}</Typography>
          )}
        </Box>

        {/* Email Section (Read-only) */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Email
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {user?.email}
          </Typography>
        </Box>
      </DialogContent>

      {isEditing && (
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleCancel} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={loading || !name.trim()}
            sx={{
              bgcolor: '#128c7e',
              '&:hover': { bgcolor: '#075e54' },
            }}
            startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <CheckIcon />}
          >
            {loading ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      )}
    </Dialog>
  );
};

export default ProfileDialog;
