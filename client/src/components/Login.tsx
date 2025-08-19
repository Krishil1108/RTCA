import React, { useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  Button,
  Box,
  Divider,
  Alert,
  CircularProgress,
} from '@mui/material';
import { Google as GoogleIcon, Chat as ChatIcon } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import authService from '../services/authService';

const Login: React.FC = () => {
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const handleGoogleLogin = () => {
    window.location.href = authService.getGoogleAuthUrl();
  };

  const handleDemoLogin = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await authService.demoLogin();
      await login(response.token);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="sm">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper
          elevation={3}
          sx={{
            padding: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
          }}
        >
          <Box sx={{ mb: 3 }}>
            <ChatIcon sx={{ fontSize: 60, color: 'primary.main' }} />
          </Box>
          
          <Typography component="h1" variant="h4" gutterBottom>
            Welcome to RTCA
          </Typography>
          
          <Typography variant="body1" color="text.secondary" align="center" sx={{ mb: 4 }}>
            Real-time chat application with secure authentication
          </Typography>

          {error && (
            <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
              {error}
            </Alert>
          )}

          <Button
            fullWidth
            variant="contained"
            startIcon={<GoogleIcon />}
            onClick={handleGoogleLogin}
            sx={{ mb: 2 }}
            size="large"
          >
            Sign in with Google
          </Button>

          <Divider sx={{ width: '100%', my: 2 }}>
            <Typography variant="body2" color="text.secondary">
              OR
            </Typography>
          </Divider>

          <Button
            fullWidth
            variant="outlined"
            onClick={handleDemoLogin}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : <ChatIcon />}
            sx={{ mb: 2 }}
            size="large"
          >
            {loading ? 'Connecting...' : 'Try Demo Mode'}
          </Button>

          <Typography variant="caption" color="text.secondary" align="center" sx={{ mt: 2 }}>
            Demo mode creates a temporary account for testing purposes
          </Typography>
        </Paper>

        <Box sx={{ mt: 4, p: 2, bgcolor: 'info.main', borderRadius: 1 }}>
          <Typography variant="body2" color="white" align="center">
            <strong>Note:</strong> To use Google OAuth, you need to set up Google Cloud credentials.
            See <code>GOOGLE_OAUTH_SETUP.md</code> for instructions.
          </Typography>
        </Box>
      </Box>
    </Container>
  );
};

export default Login;
