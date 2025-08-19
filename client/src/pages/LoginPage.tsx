import React, { useState } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  Card,
  CardContent,
  Avatar,
  Divider,
  Alert,
  CircularProgress,
} from '@mui/material';
import { Google as GoogleIcon, Chat as ChatIcon, Science as DemoIcon } from '@mui/icons-material';
import { GOOGLE_OAUTH_URL } from '../config/constants';
import { useAuth } from '../contexts/AuthContext';
import authService from '../services/authService';
import DebugAuth from '../components/DebugAuth';

const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const handleGoogleLogin = () => {
    window.location.href = GOOGLE_OAUTH_URL;
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
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 2,
      }}
    >
      <Container maxWidth="sm">
        <Card
          elevation={8}
          sx={{
            borderRadius: 4,
            overflow: 'hidden',
          }}
        >
          <Box
            sx={{
              background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
              color: 'white',
              py: 4,
              px: 3,
              textAlign: 'center',
            }}
          >
            <Avatar
              sx={{
                width: 80,
                height: 80,
                margin: '0 auto 16px',
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
              }}
            >
              <ChatIcon sx={{ fontSize: 40 }} />
            </Avatar>
            <Typography variant="h3" component="h1" gutterBottom fontWeight="bold">
              RTCA
            </Typography>
            <Typography variant="h6" component="h2" sx={{ opacity: 0.9 }}>
              Real-Time Chat Application
            </Typography>
          </Box>

          <CardContent sx={{ p: 4 }}>
            <Typography
              variant="h5"
              component="h3"
              gutterBottom
              textAlign="center"
              color="textPrimary"
            >
              Welcome Back!
            </Typography>
            <Typography
              variant="body1"
              textAlign="center"
              color="textSecondary"
              paragraph
            >
              Sign in with your Gmail account to start chatting with your team in real-time.
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <Box sx={{ mt: 4, mb: 3 }}>
              <Button
                variant="contained"
                size="large"
                fullWidth
                startIcon={<GoogleIcon />}
                onClick={handleGoogleLogin}
                sx={{
                  py: 1.5,
                  fontSize: '1.1rem',
                  backgroundColor: '#db4437',
                  '&:hover': {
                    backgroundColor: '#c23321',
                  },
                  borderRadius: 2,
                }}
              >
                Sign in with Gmail
              </Button>

              <Divider sx={{ my: 2 }}>
                <Typography variant="body2" color="textSecondary">
                  OR
                </Typography>
              </Divider>

              <Button
                variant="outlined"
                size="large"
                fullWidth
                startIcon={loading ? <CircularProgress size={20} /> : <DemoIcon />}
                onClick={handleDemoLogin}
                disabled={loading}
                sx={{
                  py: 1.5,
                  fontSize: '1.1rem',
                  borderRadius: 2,
                }}
              >
                {loading ? 'Connecting...' : 'Try Demo Mode'}
              </Button>
            </Box>

            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="caption">
                <strong>Demo Mode:</strong> Test the application without setting up OAuth. 
                For Gmail authentication, you need to configure Google Cloud credentials 
                (see GOOGLE_OAUTH_SETUP.md).
              </Typography>
            </Alert>

            <Typography
              variant="caption"
              display="block"
              textAlign="center"
              color="textSecondary"
              sx={{ mt: 2 }}
            >
              By signing in, you agree to our Terms of Service and Privacy Policy
            </Typography>
          </CardContent>
        </Card>

        {/* Debug Component - only in development */}
        {process.env.NODE_ENV === 'development' && <DebugAuth />}

        {/* Features Section */}
        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom color="white" sx={{ opacity: 0.9 }}>
            Features
          </Typography>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
              gap: 2,
              mt: 2,
            }}
          >
            <Paper
              elevation={2}
              sx={{
                p: 2,
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                borderRadius: 2,
              }}
            >
              <Typography variant="subtitle2" gutterBottom color="primary">
                🚀 Real-Time Messaging
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Instant messaging with live typing indicators
              </Typography>
            </Paper>
            <Paper
              elevation={2}
              sx={{
                p: 2,
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                borderRadius: 2,
              }}
            >
              <Typography variant="subtitle2" gutterBottom color="primary">
                👥 Team Rooms
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Organize conversations by topics and teams
              </Typography>
            </Paper>
            <Paper
              elevation={2}
              sx={{
                p: 2,
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                borderRadius: 2,
              }}
            >
              <Typography variant="subtitle2" gutterBottom color="primary">
                📱 Responsive Design
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Works perfectly on desktop and mobile
              </Typography>
            </Paper>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default LoginPage;
