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
  useTheme,
} from '@mui/material';
import { 
  Google as GoogleIcon, 
  Chat as ChatIcon, 
  Security as SecurityIcon,
  Speed as SpeedIcon,
  Group as GroupIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import authService from '../services/authService';

const Login: React.FC = () => {
  const { login } = useAuth();
  const theme = useTheme();
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

  const features = [
    { icon: <SpeedIcon />, title: 'Real-time Messaging', desc: 'Instant message delivery' },
    { icon: <SecurityIcon />, title: 'Secure Authentication', desc: 'Google OAuth & JWT security' },
    { icon: <GroupIcon />, title: 'Group Chats', desc: 'Create and manage group conversations' },
  ];

  return (
    <Container component="main" maxWidth="lg">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          py: 4,
        }}
      >
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
            gap: 4,
            width: '100%',
            alignItems: 'center',
          }}
        >
          {/* Left side - Features */}
          <Box sx={{ textAlign: { xs: 'center', md: 'left' } }}>
              <Typography
                variant="h2"
                component="h1"
                sx={{
                  fontWeight: 700,
                  color: theme.palette.primary.main,
                  mb: 2,
                  fontSize: { xs: '2.5rem', md: '3.5rem' },
                }}
              >
                RTCA Chat
              </Typography>
              
              <Typography
                variant="h5"
                color="text.secondary"
                sx={{ mb: 4, fontWeight: 400 }}
              >
                Connect, communicate, and collaborate in real-time
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 4 }}>
                {features.map((feature, index) => (
                  <Box
                    key={index}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                      p: 2,
                      borderRadius: 1,
                      backgroundColor: theme.palette.action.hover,
                      border: `1px solid ${theme.palette.divider}`,
                    }}
                  >
                    <Box
                      sx={{
                        color: theme.palette.primary.main,
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      {feature.icon}
                    </Box>
                    <Box>
                      <Typography variant="subtitle1" fontWeight={600}>
                        {feature.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {feature.desc}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            </Box>

          {/* Right side - Login Form */}
          <Paper
            elevation={2}
            sx={{
              padding: 4,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              borderRadius: 1,
              backgroundColor: theme.palette.background.paper,
              border: `1px solid ${theme.palette.divider}`,
            }}
          >
            <Box
              sx={{
                mb: 3,
                p: 2,
                borderRadius: 1,
                backgroundColor: theme.palette.primary.main,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ChatIcon sx={{ fontSize: 40, color: 'white' }} />
            </Box>
              
              <Typography
                component="h2"
                variant="h4"
                gutterBottom
                sx={{ fontWeight: 600 }}
              >
                Welcome Back
              </Typography>
              
              <Typography
                variant="body1"
                color="text.secondary"
                align="center"
                sx={{ mb: 4, maxWidth: 300 }}
              >
                Sign in to continue your conversations and connect with your team
              </Typography>

              {error && (
                <Alert
                  severity="error"
                  sx={{
                    width: '100%',
                    mb: 2,
                    borderRadius: 1,
                  }}
                >
                  {error}
                </Alert>
              )}

              <Button
                fullWidth
                variant="contained"
                startIcon={<GoogleIcon />}
                onClick={handleGoogleLogin}
                sx={{
                  mb: 2,
                  py: 1.5,
                  borderRadius: 1,
                  textTransform: 'none',
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  backgroundColor: theme.palette.primary.main,
                  '&:hover': {
                    backgroundColor: theme.palette.primary.dark,
                  },
                }}
                size="large"
              >
                Continue with Google
              </Button>

              <Divider sx={{ width: '100%', my: 2 }}>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    px: 2,
                    background: theme.palette.background.paper,
                  }}
                >
                  OR
                </Typography>
              </Divider>

              <Button
                fullWidth
                variant="outlined"
                onClick={handleDemoLogin}
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : <ChatIcon />}
                sx={{
                  py: 1.5,
                  borderRadius: 1,
                  textTransform: 'none',
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  borderWidth: 1,
                  borderColor: theme.palette.primary.main,
                  '&:hover': {
                    borderWidth: 1,
                    backgroundColor: theme.palette.action.hover,
                  },
                }}
                size="large"
              >
                {loading ? 'Connecting...' : 'Try Demo Account'}
              </Button>

              <Typography
                variant="caption"
                color="text.secondary"
                align="center"
                sx={{ mt: 3, px: 2 }}
              >
                By signing in, you agree to our Terms of Service and Privacy Policy
              </Typography>
            </Paper>
        </Box>
      </Box>
    </Container>
  );
};

export default Login;
