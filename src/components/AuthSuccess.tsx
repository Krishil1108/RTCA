import React, { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Container, Typography, CircularProgress, Alert, Box } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { LOCAL_STORAGE_KEYS } from '../config/constants';

const AuthSuccess: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [error, setError] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const hasProcessed = useRef(false);

  useEffect(() => {
    const handleAuthSuccess = async () => {
      // Prevent multiple executions
      if (hasProcessed.current || isProcessing) {
        console.log('AuthSuccess: Already processed, skipping...');
        return;
      }

      hasProcessed.current = true;
      setIsProcessing(true);

      try {
        console.log('AuthSuccess: Processing authentication...');
        // Extract token from URL parameters
        const params = new URLSearchParams(location.search);
        const token = params.get('token');
        const error = params.get('error');

        console.log('AuthSuccess: Token found?', !!token);
        console.log('AuthSuccess: Error found?', !!error);

        if (error) {
          console.error('AuthSuccess: OAuth error:', error);
          setError(`Authentication failed: ${error}`);
          setTimeout(() => navigate('/login'), 3000);
          return;
        }

        if (!token) {
          console.error('AuthSuccess: No token received');
          setError('No authentication token received');
          setTimeout(() => navigate('/login'), 3000);
          return;
        }

        // Login with the token
        console.log('AuthSuccess: Attempting login...');
        await login(token);
        console.log('AuthSuccess: Login successful, redirecting to chat...');
        navigate('/chat', { replace: true });
      } catch (error: any) {
        console.error('Auth success error:', error);
        setError('Failed to complete authentication');
        setTimeout(() => navigate('/login'), 3000);
      } finally {
        setIsProcessing(false);
      }
    };

    handleAuthSuccess();
  }, []); // Remove dependencies to prevent re-execution

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
