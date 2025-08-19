import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  Alert, 
  Button, 
  Card, 
  CardContent,
  Container 
} from '@mui/material';
import { Warning, Refresh, Home } from '@mui/icons-material';

const AuthErrorPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const error = searchParams.get('error');

  const getErrorMessage = (errorType: string | null) => {
    switch (errorType) {
      case 'rate_limit':
        return {
          title: 'Rate Limit Exceeded',
          message: 'Too many authentication requests. Google has temporarily limited access from this IP address.',
          suggestions: [
            'Wait 15-60 minutes and try again',
            'Use Demo Mode for testing',
            'Try using an incognito/private browser window',
            'Clear cookies for accounts.google.com'
          ],
          severity: 'warning' as const
        };
      case 'oauth_failed':
        return {
          title: 'Authentication Failed',
          message: 'Google OAuth authentication encountered an error.',
          suggestions: [
            'Check your internet connection',
            'Try again in a few minutes',
            'Use Demo Mode as an alternative'
          ],
          severity: 'error' as const
        };
      case 'no_user':
        return {
          title: 'User Not Found',
          message: 'Unable to retrieve user information from Google.',
          suggestions: [
            'Ensure you granted the necessary permissions',
            'Try signing in again',
            'Contact support if the issue persists'
          ],
          severity: 'error' as const
        };
      default:
        return {
          title: 'Authentication Error',
          message: 'An unexpected error occurred during authentication.',
          suggestions: [
            'Try signing in again',
            'Use Demo Mode for testing',
            'Contact support if the issue persists'
          ],
          severity: 'error' as const
        };
    }
  };

  const errorInfo = getErrorMessage(error);

  useEffect(() => {
    // Auto-redirect after 30 seconds for rate limit errors
    if (error === 'rate_limit') {
      const timer = setTimeout(() => {
        navigate('/login');
      }, 30000);
      return () => clearTimeout(timer);
    }
  }, [error, navigate]);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2
      }}
    >
      <Container maxWidth="sm">
        <Card elevation={10} sx={{ borderRadius: 3 }}>
          <CardContent sx={{ p: 4, textAlign: 'center' }}>
            <Warning 
              sx={{ 
                fontSize: 60, 
                color: errorInfo.severity === 'warning' ? 'warning.main' : 'error.main',
                mb: 2 
              }} 
            />
            
            <Typography variant="h4" gutterBottom color="textPrimary">
              {errorInfo.title}
            </Typography>
            
            <Alert severity={errorInfo.severity} sx={{ mb: 3, textAlign: 'left' }}>
              <Typography variant="body1" gutterBottom>
                {errorInfo.message}
              </Typography>
              
              <Typography variant="body2" sx={{ mt: 2, fontWeight: 'bold' }}>
                Solutions:
              </Typography>
              <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
                {errorInfo.suggestions.map((suggestion, index) => (
                  <li key={index}>
                    <Typography variant="body2">{suggestion}</Typography>
                  </li>
                ))}
              </ul>
            </Alert>

            {error === 'rate_limit' && (
              <Alert severity="info" sx={{ mb: 3 }}>
                <Typography variant="body2">
                  <strong>Tip:</strong> To increase rate limits, set up your OAuth consent screen 
                  and request quota increases in Google Cloud Console.
                </Typography>
              </Alert>
            )}

            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                startIcon={<Home />}
                onClick={() => navigate('/login')}
                sx={{ minWidth: 120 }}
              >
                Back to Login
              </Button>
              
              <Button
                variant="outlined"
                startIcon={<Refresh />}
                onClick={() => window.location.reload()}
                sx={{ minWidth: 120 }}
              >
                Try Again
              </Button>
            </Box>

            {error === 'rate_limit' && (
              <Typography 
                variant="caption" 
                display="block" 
                sx={{ mt: 2, opacity: 0.7 }}
              >
                Redirecting to login page in 30 seconds...
              </Typography>
            )}
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};

export default AuthErrorPage;
