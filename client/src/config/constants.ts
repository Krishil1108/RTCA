// API Configuration
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://arizta.onrender.com/api';
export const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'https://arizta.onrender.com';

// Authentication
export const GOOGLE_OAUTH_URL = `${API_BASE_URL}/auth/google`;

// Local Storage Keys
export const LOCAL_STORAGE_KEYS = {
  AUTH_TOKEN: 'rtca_auth_token',
  USER_DATA: 'rtca_user_data',
  THEME_PREFERENCE: 'rtca_theme',
  SOUND_ENABLED: 'rtca_sound_enabled',
} as const;

// Socket Events
export const SOCKET_EVENTS = {
  // Connection
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  CONNECT_ERROR: 'connect_error',
  
  // Authentication
  AUTHENTICATE: 'authenticate',
  
  // Rooms
  JOIN_ROOM: 'join_room',
  LEAVE_ROOM: 'leave_room',
  ROOM_MESSAGES: 'room_messages',
  
  // Messages
  SEND_MESSAGE: 'send_message',
  NEW_MESSAGE: 'new_message',
  MESSAGE_EDITED: 'message_edited',
  MESSAGE_DELETED: 'message_deleted',
  
  // Reactions
  ADD_REACTION: 'add_reaction',
  REMOVE_REACTION: 'remove_reaction',
  REACTION_UPDATED: 'reaction_updated',
  
  // Typing
  TYPING: 'typing',
  USER_TYPING: 'user_typing',
  
  // User Status
  USER_ONLINE: 'user_online',
  USER_OFFLINE: 'user_offline',
  
  // Errors
  ERROR: 'error',
} as const;

// Message Types
export const MESSAGE_TYPES = {
  TEXT: 'text',
  IMAGE: 'image',
  FILE: 'file',
  SYSTEM: 'system',
} as const;

// Themes
export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
  AUTO: 'auto',
} as const;

// UI Constants
export const UI_CONSTANTS = {
  SIDEBAR_WIDTH: 280,
  HEADER_HEIGHT: 64,
  MESSAGE_INPUT_HEIGHT: 120,
  MAX_MESSAGE_LENGTH: 1000,
  TYPING_TIMEOUT: 3000,
  NOTIFICATION_DURATION: 5000,
} as const;
