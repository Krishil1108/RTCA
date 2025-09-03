import React from 'react';
import { Box, Button, Typography, Paper } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { LOCAL_STORAGE_KEYS } from '../config/constants';

const DebugAuth: React.FC = () => {
  const { user, isAuthenticated, isLoading, error, logout } = useAuth();

  const clearLocalStorage = () => {
    localStorage.removeItem(LOCAL_STORAGE_KEYS.AUTH_TOKEN);
    localStorage.removeItem(LOCAL_STORAGE_KEYS.USER_DATA);
    window.location.reload();
  };

  const checkLocalStorage = () => {
    const token = localStorage.getItem(LOCAL_STORAGE_KEYS.AUTH_TOKEN);
    const userData = localStorage.getItem(LOCAL_STORAGE_KEYS.USER_DATA);
    console.log('Token in localStorage:', !!token);
    console.log('User data in localStorage:', !!userData);
    if (token) console.log('Token length:', token.length);
    if (userData) console.log('User data:', JSON.parse(userData));
  };

  return (
    <Paper sx={{ p: 2, m: 2 }}>
      <Typography variant="h6" gutterBottom>
        Debug Authentication State
      </Typography>
      
      <Box sx={{ mb: 2 }}>
        <Typography variant="body2">
          <strong>Is Authenticated:</strong> {isAuthenticated ? 'Yes' : 'No'}
        </Typography>
        <Typography variant="body2">
          <strong>Is Loading:</strong> {isLoading ? 'Yes' : 'No'}
        </Typography>
        <Typography variant="body2">
          <strong>Error:</strong> {error || 'None'}
        </Typography>
        <Typography variant="body2">
          <strong>User:</strong> {user ? user.name : 'None'}
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        <Button 
          variant="outlined" 
          size="small" 
          onClick={checkLocalStorage}
        >
          Check LocalStorage
        </Button>
        <Button 
          variant="outlined" 
          size="small" 
          onClick={clearLocalStorage}
          color="warning"
        >
          Clear LocalStorage
        </Button>
        {isAuthenticated && (
          <Button 
            variant="outlined" 
            size="small" 
            onClick={logout}
            color="error"
          >
            Logout
          </Button>
        )}
      </Box>
    </Paper>
  );
};

export default DebugAuth;
