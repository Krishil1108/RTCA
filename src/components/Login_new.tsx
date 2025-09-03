import React, { useState } from 'react';
import {
  Paper,
  Typography,
  Button,
  Box,
  TextField,
  Alert,
  CircularProgress,
  IconButton,
} from '@mui/material';
import { 
  Google as GoogleIcon, 
  Facebook as FacebookIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useAriztaTheme } from '../contexts/ThemeContext';
import authService from '../services/authService';

const Login: React.FC = () => {
  const { login } = useAuth();
  const { isDarkMode } = useAriztaTheme();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const handleGoogleLogin = () => {
    window.location.href = authService.getGoogleAuthUrl();
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #74b9ff 0%, #0984e3 50%, #a29bfe 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 2,
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 100 100\'%3E%3Cpath d=\'M20 30 Q30 20 40 30 T60 30 T80 30\' fill=\'none\' stroke=\'rgba(255,255,255,0.1)\' stroke-width=\'2\'/%3E%3C/svg%3E")',
          backgroundSize: '200px 200px',
          animation: 'float 20s ease-in-out infinite',
        },
        '@keyframes float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
      }}
    >
      {/* Decorative elements */}
      <Box
        sx={{
          position: 'absolute',
          top: '10%',
          left: '10%',
          width: 100,
          height: 100,
          background: 'linear-gradient(45deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))',
          borderRadius: '50%',
          filter: 'blur(1px)',
          animation: 'float 15s ease-in-out infinite reverse',
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: '15%',
          right: '15%',
          width: 80,
          height: 80,
          background: 'linear-gradient(45deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))',
          borderRadius: '50%',
          filter: 'blur(1px)',
          animation: 'float 18s ease-in-out infinite',
        }}
      />

      <Paper
        elevation={24}
        sx={{
          padding: { xs: 3, sm: 4, md: 5 },
          maxWidth: 420,
          width: '100%',
          borderRadius: 3,
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            mb: 4,
          }}
        >
          <Typography
            variant="h4"
            component="h1"
            sx={{
              fontWeight: 600,
              color: '#2d3748',
              mb: 1,
              fontSize: { xs: '1.75rem', sm: '2rem' },
            }}
          >
            Sign In
          </Typography>
        </Box>

        {error && (
          <Alert
            severity="error"
            sx={{
              width: '100%',
              mb: 3,
              borderRadius: 2,
            }}
          >
            {error}
          </Alert>
        )}

        <Box sx={{ mb: 3 }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="username or email"
            disabled
            sx={{
              mb: 2,
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                backgroundColor: '#f7fafc',
                '& fieldset': {
                  borderColor: '#e2e8f0',
                },
                '&:hover fieldset': {
                  borderColor: '#cbd5e0',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#667eea',
                },
              },
              '& .MuiInputBase-input': {
                color: '#4a5568',
                fontSize: '0.95rem',
              },
              '& .MuiInputBase-input::placeholder': {
                color: '#a0aec0',
                opacity: 1,
              },
            }}
          />
          <TextField
            fullWidth
            type="password"
            variant="outlined"
            placeholder="password"
            disabled
            sx={{
              mb: 3,
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                backgroundColor: '#f7fafc',
                '& fieldset': {
                  borderColor: '#e2e8f0',
                },
                '&:hover fieldset': {
                  borderColor: '#cbd5e0',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#667eea',
                },
              },
              '& .MuiInputBase-input': {
                color: '#4a5568',
                fontSize: '0.95rem',
              },
              '& .MuiInputBase-input::placeholder': {
                color: '#a0aec0',
                opacity: 1,
              },
            }}
          />
          
          <Button
            fullWidth
            variant="contained"
            disabled
            sx={{
              py: 1.5,
              borderRadius: 2,
              textTransform: 'none',
              fontSize: '1rem',
              fontWeight: 600,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
              opacity: 0.6,
              '&:hover': {
                background: 'linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)',
              },
            }}
          >
            SIGN IN
          </Button>
        </Box>

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            mb: 3,
          }}
        >
          <Box sx={{ flex: 1, height: 1, backgroundColor: '#e2e8f0' }} />
          <Typography
            variant="body2"
            sx={{
              px: 2,
              color: '#718096',
              fontWeight: 500,
            }}
          >
            Or login with
          </Typography>
          <Box sx={{ flex: 1, height: 1, backgroundColor: '#e2e8f0' }} />
        </Box>

        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            gap: 2,
            mb: 4,
          }}
        >
          <IconButton
            onClick={handleGoogleLogin}
            disabled={loading}
            sx={{
              width: 50,
              height: 50,
              border: '1px solid #e2e8f0',
              borderRadius: 2,
              backgroundColor: '#ffffff',
              color: '#db4437',
              '&:hover': {
                backgroundColor: '#f7fafc',
                borderColor: '#cbd5e0',
                transform: 'translateY(-2px)',
                boxShadow: '0 8px 25px rgba(0, 0, 0, 0.1)',
              },
              transition: 'all 0.3s ease',
            }}
          >
            {loading ? <CircularProgress size={24} /> : <GoogleIcon />}
          </IconButton>
          
          <IconButton
            disabled
            sx={{
              width: 50,
              height: 50,
              border: '1px solid #e2e8f0',
              borderRadius: 2,
              backgroundColor: '#ffffff',
              color: '#1877f2',
              opacity: 0.5,
              '&:hover': {
                backgroundColor: '#f7fafc',
                borderColor: '#cbd5e0',
              },
            }}
          >
            <FacebookIcon />
          </IconButton>
        </Box>

        <Typography
          variant="body2"
          sx={{
            textAlign: 'center',
            color: '#718096',
            cursor: 'pointer',
            textDecoration: 'underline',
            '&:hover': {
              color: '#4a5568',
            },
          }}
        >
          Sign Up
        </Typography>
      </Paper>
    </Box>
  );
};

export default Login;
