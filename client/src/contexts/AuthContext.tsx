import React, { createContext, useContext, useReducer, useEffect, useRef, ReactNode, useState } from 'react';
import { User } from '../services/authService';
import { LOCAL_STORAGE_KEYS } from '../config/constants';
import authService from '../services/authService';
import { useRateLimitHandler, checkPersistedRateLimit } from '../hooks/useRateLimitHandler';
import RateLimitHandler from '../components/RateLimitHandler';
import { AxiosError } from 'axios';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: User }
  | { type: 'AUTH_FAILURE'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'UPDATE_USER'; payload: Partial<User> }
  | { type: 'CLEAR_ERROR' };

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'AUTH_START':
      return {
        ...state,
        isLoading: true,
        error: null,
      };
    case 'AUTH_SUCCESS':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };
    case 'AUTH_FAILURE':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      };
    case 'UPDATE_USER':
      return {
        ...state,
        user: state.user ? { ...state.user, ...action.payload } : null,
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };
    default:
      return state;
  }
};

interface AuthContextType extends AuthState {
  login: (token: string) => Promise<void>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
  updateProfile: (profileData: Partial<Pick<User, 'name' | 'about' | 'avatar'>>) => Promise<void>;
  clearError: () => void;
  isRateLimited: boolean;
  rateLimitInfo: { retryAfter: number; message: string } | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const hasCheckedAuth = useRef(false);
  const isInitializing = useRef(false);
  
  // Rate limiting state
  const { rateLimitState, handleRateLimit, clearRateLimit, retryAfterRateLimit } = useRateLimitHandler();
  const [showRateLimitDialog, setShowRateLimitDialog] = useState(false);

  // Check for persisted rate limit on mount
  useEffect(() => {
    const persistedRateLimit = checkPersistedRateLimit();
    if (persistedRateLimit) {
      setShowRateLimitDialog(true);
    }
  }, []);

  // Show rate limit dialog when rate limit state changes
  useEffect(() => {
    setShowRateLimitDialog(rateLimitState.isRateLimited);
  }, [rateLimitState.isRateLimited]);

  // Check for existing token on mount
  useEffect(() => {
    const checkAuth = async () => {
      if (hasCheckedAuth.current || isInitializing.current) {
        return;
      }
      
      isInitializing.current = true;
      hasCheckedAuth.current = true;
      
      console.log('AuthContext: Checking authentication...');
      dispatch({ type: 'AUTH_START' });
      
      const token = localStorage.getItem(LOCAL_STORAGE_KEYS.AUTH_TOKEN);
      console.log('AuthContext: Token found?', !!token);
      
      if (!token) {
        console.log('AuthContext: No token, setting auth failure');
        dispatch({ type: 'AUTH_FAILURE', payload: 'No token found' });
        isInitializing.current = false;
        return;
      }

      try {
        console.log('AuthContext: Verifying token...');
        const response = await authService.verifyToken(token);
        console.log('AuthContext: Token verified successfully', response.user);
        localStorage.setItem(LOCAL_STORAGE_KEYS.USER_DATA, JSON.stringify(response.user));
        dispatch({ type: 'AUTH_SUCCESS', payload: response.user });
      } catch (error: any) {
        console.error('AuthContext: Token verification failed:', error);
        
        // Handle rate limiting
        if (handleRateLimit(error as AxiosError)) {
          console.log('Rate limit detected during token verification');
          return; // Exit early, rate limit handler will show dialog
        }
        
        localStorage.removeItem(LOCAL_STORAGE_KEYS.AUTH_TOKEN);
        localStorage.removeItem(LOCAL_STORAGE_KEYS.USER_DATA);
        dispatch({ type: 'AUTH_FAILURE', payload: error.response?.data?.message || 'Authentication failed' });
      } finally {
        isInitializing.current = false;
      }
    };

    checkAuth();
  }, []);

  const login = async (token: string) => {
    console.log('AuthContext: Login called with token:', !!token);
    dispatch({ type: 'AUTH_START' });
    
    try {
      localStorage.setItem(LOCAL_STORAGE_KEYS.AUTH_TOKEN, token);
      console.log('AuthContext: Token saved to localStorage');
      
      const response = await authService.verifyToken(token);
      console.log('AuthContext: Token verified in login:', response.user);
      
      localStorage.setItem(LOCAL_STORAGE_KEYS.USER_DATA, JSON.stringify(response.user));
      dispatch({ type: 'AUTH_SUCCESS', payload: response.user });
      console.log('AuthContext: Login success dispatched');
    } catch (error: any) {
      console.error('AuthContext: Login failed:', error);
      
      // Handle rate limiting
      if (handleRateLimit(error as AxiosError)) {
        console.log('Rate limit detected during login');
        return; // Exit early, rate limit handler will show dialog
      }
      
      localStorage.removeItem(LOCAL_STORAGE_KEYS.AUTH_TOKEN);
      localStorage.removeItem(LOCAL_STORAGE_KEYS.USER_DATA);
      dispatch({ type: 'AUTH_FAILURE', payload: error.response?.data?.message || 'Login failed' });
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem(LOCAL_STORAGE_KEYS.AUTH_TOKEN);
    localStorage.removeItem(LOCAL_STORAGE_KEYS.USER_DATA);
    authService.logout().catch(console.error);
    dispatch({ type: 'LOGOUT' });
  };

  const updateUser = (userData: Partial<User>) => {
    dispatch({ type: 'UPDATE_USER', payload: userData });
    
    // Update localStorage
    const currentUserData = localStorage.getItem(LOCAL_STORAGE_KEYS.USER_DATA);
    if (currentUserData) {
      const user = JSON.parse(currentUserData);
      const updatedUser = { ...user, ...userData };
      localStorage.setItem(LOCAL_STORAGE_KEYS.USER_DATA, JSON.stringify(updatedUser));
    }
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const updateProfile = async (profileData: Partial<Pick<User, 'name' | 'about' | 'avatar'>>) => {
    try {
      const response = await authService.updateProfile(profileData);
      dispatch({ type: 'UPDATE_USER', payload: response.user });
      
      // Update local storage
      localStorage.setItem(LOCAL_STORAGE_KEYS.USER_DATA, JSON.stringify(response.user));
    } catch (error: any) {
      console.error('Failed to update profile:', error);
      throw new Error(error.response?.data?.message || 'Failed to update profile');
    }
  };

  const value: AuthContextType = {
    ...state,
    login,
    logout,
    updateUser,
    updateProfile,
    clearError,
    isRateLimited: rateLimitState.isRateLimited,
    rateLimitInfo: rateLimitState.isRateLimited ? {
      retryAfter: rateLimitState.retryAfter,
      message: rateLimitState.message
    } : null,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
      <RateLimitHandler
        open={showRateLimitDialog}
        onClose={() => setShowRateLimitDialog(false)}
        retryAfter={rateLimitState.retryAfter}
        message={rateLimitState.message}
        onRetry={retryAfterRateLimit}
      />
    </AuthContext.Provider>
  );
};
