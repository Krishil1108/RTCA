import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ChatProvider } from './contexts/ChatContext';
import { ThemeProvider } from './contexts/ThemeContext';
import LoginPage from './pages/LoginPage';
import ChatPage from './pages/ChatPage';
import AriztaMainPage from './pages/AriztaMainPage';
import AuthSuccessPage from './pages/AuthSuccessPage';
import AuthErrorPage from './pages/AuthErrorPage';
import LoadingSpinner from './components/LoadingSpinner';
import PWAInstallPrompt from './components/PWAInstallPrompt';
import './App.css';

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return <LoadingSpinner />;
  }
  
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

// Public Route Component (redirect if authenticated)
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return <LoadingSpinner />;
  }
  
  return !isAuthenticated ? <>{children}</> : <Navigate to="/" replace />;
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Routes>
            {/* Public Routes */}
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <LoginPage />
                </PublicRoute>
              }
            />
            <Route path="/auth/success" element={<AuthSuccessPage />} />
            <Route path="/auth/error" element={<AuthErrorPage />} />
            
            {/* Protected Routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <ChatProvider>
                    <AriztaMainPage />
                  </ChatProvider>
                </ProtectedRoute>
              }
            />
            <Route
              path="/chat"
              element={
                <ProtectedRoute>
                  <ChatProvider>
                    <AriztaMainPage />
                  </ChatProvider>
                </ProtectedRoute>
              }
            />
            <Route
              path="/old-chat"
              element={
                <ProtectedRoute>
                  <ChatProvider>
                    <ChatPage />
                  </ChatProvider>
                </ProtectedRoute>
              }
            />
            <Route
              path="/chat/:roomId"
              element={
                <ProtectedRoute>
                  <ChatProvider>
                    <AriztaMainPage />
                  </ChatProvider>
                </ProtectedRoute>
              }
            />
            
            {/* Catch all - redirect to chat */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          
          {/* PWA Install Prompt */}
          <PWAInstallPrompt />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
