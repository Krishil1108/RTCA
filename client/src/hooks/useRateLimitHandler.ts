import { useState, useCallback } from 'react';
import axios, { AxiosError } from 'axios';

interface RateLimitState {
  isRateLimited: boolean;
  retryAfter: number;
  message: string;
}

interface UseRateLimitHandler {
  rateLimitState: RateLimitState;
  handleRateLimit: (error: AxiosError) => boolean;
  clearRateLimit: () => void;
  retryAfterRateLimit: () => void;
}

export const useRateLimitHandler = (): UseRateLimitHandler => {
  const [rateLimitState, setRateLimitState] = useState<RateLimitState>({
    isRateLimited: false,
    retryAfter: 0,
    message: ''
  });

  const handleRateLimit = useCallback((error: AxiosError): boolean => {
    if (error.response?.status === 429) {
      const data = error.response.data as any;
      const retryAfter = data?.retryAfter || 60; // Default to 60 seconds
      const message = data?.error || 'Too many requests. Please try again later.';
      
      setRateLimitState({
        isRateLimited: true,
        retryAfter,
        message
      });

      // Store rate limit info in localStorage for persistence across page reloads
      localStorage.setItem('rateLimitInfo', JSON.stringify({
        timestamp: Date.now(),
        retryAfter,
        message
      }));

      return true; // Indicates rate limit was handled
    }
    return false; // Not a rate limit error
  }, []);

  const clearRateLimit = useCallback(() => {
    setRateLimitState({
      isRateLimited: false,
      retryAfter: 0,
      message: ''
    });
    localStorage.removeItem('rateLimitInfo');
  }, []);

  const retryAfterRateLimit = useCallback(() => {
    // Clear the rate limit state and allow user to try again
    clearRateLimit();
    
    // Optional: Add a small delay to prevent immediate retry
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  }, [clearRateLimit]);

  return {
    rateLimitState,
    handleRateLimit,
    clearRateLimit,
    retryAfterRateLimit
  };
};

// Global rate limit check on app initialization
export const checkPersistedRateLimit = (): RateLimitState | null => {
  try {
    const saved = localStorage.getItem('rateLimitInfo');
    if (!saved) return null;

    const { timestamp, retryAfter, message } = JSON.parse(saved);
    const elapsed = (Date.now() - timestamp) / 1000; // seconds
    const remainingTime = Math.max(0, retryAfter - elapsed);

    if (remainingTime > 0) {
      return {
        isRateLimited: true,
        retryAfter: Math.ceil(remainingTime),
        message
      };
    } else {
      // Rate limit has expired, clear it
      localStorage.removeItem('rateLimitInfo');
      return null;
    }
  } catch (error) {
    console.error('Error checking persisted rate limit:', error);
    localStorage.removeItem('rateLimitInfo');
    return null;
  }
};
