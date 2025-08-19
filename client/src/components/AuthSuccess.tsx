import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Container, Typography, CircularProgress, Alert, Box } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { LOCAL_STORAGE_KEYS } from '../config/constants';

const AuthSuccess: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const handleAuthSuccess = async () => {
      try {
        // Extract token from URL parameters
        const params = new URLSearchParams(location.search);
        const token = params.get('token');
        const error = params.get('error');

        if (error) {
          setError(`Authentication failed: ${error}`);
          setTimeout(() => navigate('/login'), 3000);
          return;
        }

        if (!token) {
          setError('No authentication token received');
          setTimeout(() => navigate('/login'), 3000);
          return;
        }

        // Login with the token
        await login(token);
        navigate('/chat');
      } catch (error: any) {
        console.error('Auth success error:', error);
        setError('Failed to complete authentication');
        setTimeout(() => navigate('/login'), 3000);
      }
    };

    handleAuthSuccess();
  }, [location, login, navigate]);

  if (error) {
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
          <Alert severity="error" sx={{ width: '100%' }}>
            {error}
          </Alert>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Redirecting to login page...
          </Typography>
        </Box>
      </Container>
    );
  }

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
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Completing authentication...
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Please wait while we log you in
        </Typography>
      </Box>
    </Container>
  );
};

export default AuthSuccess;
