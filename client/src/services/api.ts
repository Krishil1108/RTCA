import axios, { AxiosError, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';
import { API_BASE_URL, LOCAL_STORAGE_KEYS } from '../config/constants';

// Extend the config interface to include custom properties
interface CustomAxiosConfig extends InternalAxiosRequestConfig {
  metadata?: { startTime: number };
  _retry?: boolean;
}

// Request queue to prevent spam
interface QueuedRequest {
  config: AxiosRequestConfig;
  resolve: (value: any) => void;
  reject: (reason: any) => void;
}

class RequestQueue {
  private queue: QueuedRequest[] = [];
  private processing = false;
  private lastRequestTime = 0;
  private minInterval = 100; // Minimum time between requests (ms)

  async add<T>(config: AxiosRequestConfig): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push({ config, resolve, reject });
      this.process();
    });
  }

  private async process() {
    if (this.processing || this.queue.length === 0) return;
    
    this.processing = true;
    
    while (this.queue.length > 0) {
      const request = this.queue.shift()!;
      
      // Throttle requests
      const now = Date.now();
      const timeSinceLastRequest = now - this.lastRequestTime;
      if (timeSinceLastRequest < this.minInterval) {
        await this.delay(this.minInterval - timeSinceLastRequest);
      }
      
      try {
        const response = await axios(request.config);
        request.resolve(response);
      } catch (error) {
        request.reject(error);
      }
      
      this.lastRequestTime = Date.now();
    }
    
    this.processing = false;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

const requestQueue = new RequestQueue();

// Enhanced retry logic with exponential backoff
const retryRequest = async (
  config: AxiosRequestConfig,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<any> => {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await requestQueue.add(config);
    } catch (error: any) {
      const isRateLimit = error.response?.status === 429;
      const isNetworkError = !error.response;
      const shouldRetry = (isRateLimit || isNetworkError) && attempt < maxRetries;
      
      if (!shouldRetry) {
        throw error;
      }
      
      // Calculate delay with exponential backoff
      let delay = baseDelay * Math.pow(2, attempt);
      
      // If rate limited, use the retry-after header if available
      if (isRateLimit && error.response?.data?.retryAfter) {
        delay = Math.max(delay, error.response.data.retryAfter * 1000);
      }
      
      // Add jitter to prevent thundering herd
      delay += Math.random() * 1000;
      
      console.log(`Request failed (attempt ${attempt + 1}/${maxRetries + 1}). Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // Increased timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token and implement retry logic
api.interceptors.request.use(
  (config: CustomAxiosConfig) => {
    const token = localStorage.getItem(LOCAL_STORAGE_KEYS.AUTH_TOKEN);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add request metadata for retry logic
    config.metadata = { startTime: Date.now() };
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors and rate limiting
api.interceptors.response.use(
  (response) => {
    // Log successful request time for monitoring
    const config = response.config as CustomAxiosConfig;
    const duration = Date.now() - (config.metadata?.startTime || 0);
    if (duration > 5000) {
      console.warn(`Slow request detected: ${response.config.url} took ${duration}ms`);
    }
    return response;
  },
  async (error: AxiosError) => {
    const { response, config } = error;
    
    // Handle authentication errors
    if (response?.status === 401) {
      localStorage.removeItem(LOCAL_STORAGE_KEYS.AUTH_TOKEN);
      localStorage.removeItem(LOCAL_STORAGE_KEYS.USER_DATA);
      window.location.href = '/login';
      return Promise.reject(error);
    }
    
    // Handle rate limiting with automatic retry
    if (response?.status === 429 && config) {
      console.warn('Rate limit exceeded, implementing retry logic...');
      
      const customConfig = config as CustomAxiosConfig;
      // Don't retry if this is already a retry
      if (!customConfig._retry) {
        customConfig._retry = true;
        return retryRequest(config, 2, 2000); // 2 retries with 2s base delay
      }
    }
    
    // Handle network errors with retry
    if (!response && config) {
      const customConfig = config as CustomAxiosConfig;
      if (!customConfig._retry) {
        customConfig._retry = true;
        return retryRequest(config, 1, 1000); // 1 retry for network errors
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;
