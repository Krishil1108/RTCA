import React from 'react';
import { Box, Typography, Alert, Button } from '@mui/material';
import { useChat } from '../contexts/ChatContext';
import { useAuth } from '../contexts/AuthContext';

const DebugPanel: React.FC = () => {
  const { rooms, isConnected, isLoading, error, currentRoom, initializeSocket, loadRooms } = useChat();
  const { user, isAuthenticated } = useAuth();

  return (
    <Box sx={{ p: 2, border: '1px solid #ccc', m: 2, borderRadius: 1 }}>
      <Typography variant="h6" gutterBottom>Debug Panel</Typography>
      
      <Typography variant="body2">
        <strong>Auth Status:</strong> {isAuthenticated ? 'Authenticated' : 'Not Authenticated'}
      </Typography>
      
      <Typography variant="body2">
        <strong>User:</strong> {user?.name || 'None'}
      </Typography>
      
      <Typography variant="body2">
        <strong>Socket Connected:</strong> {isConnected ? 'Yes' : 'No'}
      </Typography>
      
      <Typography variant="body2">
        <strong>Loading:</strong> {isLoading ? 'Yes' : 'No'}
      </Typography>
      
      <Typography variant="body2">
        <strong>Current Room:</strong> {currentRoom || 'None'}
      </Typography>
      
      <Typography variant="body2">
        <strong>Rooms Count:</strong> {rooms.length}
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mt: 1 }}>
          Error: {error}
        </Alert>
      )}
      
      <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
        <Button 
          size="small" 
          variant="outlined" 
          onClick={initializeSocket}
          disabled={isConnected}
        >
          Connect Socket
        </Button>
        
        <Button 
          size="small" 
          variant="outlined" 
          onClick={loadRooms}
        >
          Load Rooms
        </Button>
      </Box>
      
      {rooms.length > 0 && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2">Rooms:</Typography>
          {rooms.map(room => (
            <Typography key={room._id} variant="body2">
              - {room.name || `${room.type} room`} ({room._id})
            </Typography>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default DebugPanel;
