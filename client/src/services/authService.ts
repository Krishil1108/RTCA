import api from './api';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  isOnline: boolean;
  lastSeen?: Date;
  settings?: {
    theme: 'light' | 'dark' | 'auto';
    notifications: boolean;
    soundEnabled: boolean;
  };
}

export interface AuthResponse {
  message: string;
  user: User;
  token?: string;
}

class AuthService {
  async verifyToken(token: string): Promise<AuthResponse> {
    const response = await api.post('/auth/verify', { token });
    return response.data;
  }

  async getCurrentUser(): Promise<{ user: User }> {
    const response = await api.get('/auth/me');
    return response.data;
  }

  async logout(): Promise<void> {
    await api.post('/auth/logout');
  }

  async demoLogin(): Promise<AuthResponse & { token: string }> {
    const response = await api.post('/auth/demo');
    return response.data;
  }

  getGoogleAuthUrl(): string {
    return `${api.defaults.baseURL}/auth/google`;
  }
}

export default new AuthService();
