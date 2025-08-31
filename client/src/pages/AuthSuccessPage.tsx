import React, { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Box, Typography, CircularProgress, Alert } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';

const AuthSuccessPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, isLoading } = useAuth();
  const hasHandled = useRef(false);

  useEffect(() => {
    if (hasHandled.current) return;
    
    const handleAuthSuccess = async () => {
      hasHandled.current = true;
      const token = searchParams.get('token');
      const error = searchParams.get('error');

      console.log('AuthSuccessPage: token=', !!token, 'error=', error);

      if (error) {
        console.log('AuthSuccessPage: Auth error detected, redirecting to login');
        // Handle auth error
        setTimeout(() => navigate('/login'), 3000);
        return;
      }

      if (token) {
        try {
          console.log('AuthSuccessPage: Calling login with token...');
          await login(token);
          console.log('AuthSuccessPage: Login successful, navigating to home');
          navigate('/', { replace: true });
        } catch (error) {
          console.error('AuthSuccessPage: Login failed:', error);
          setTimeout(() => navigate('/login'), 3000);
        }
      } else {
        console.log('AuthSuccessPage: No token found, redirecting to login');
        // No token found, redirect to login
        navigate('/login', { replace: true });
      }
    };

    handleAuthSuccess();
  }, []);

  if (isLoading) {
    return <LoadingSpinner message="Authenticating..." />;
  }

  const error = searchParams.get('error');

  if (error) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        height="100vh"
        gap={2}
        p={3}
      >
        <Alert severity="error" sx={{ mb: 2 }}>
          Authentication failed. Redirecting to login page...
        </Alert>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      height="100vh"
      gap={2}
    >
      <CircularProgress size={50} />
      <Typography variant="h6" color="primary">
        Authentication successful!
      </Typography>
      <Typography variant="body2" color="textSecondary">
        Redirecting to chat...
      </Typography>
    </Box>
  );
};

export default AuthSuccessPage;
