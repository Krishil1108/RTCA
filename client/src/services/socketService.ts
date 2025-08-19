import { io, Socket } from 'socket.io-client';
import { SOCKET_URL, SOCKET_EVENTS, LOCAL_STORAGE_KEYS } from '../config/constants';
import { Message } from './chatService';

export interface SocketMessage {
  message: Message;
}

export interface TypingData {
  userId: string;
  userName: string;
  isTyping: boolean;
}

export interface UserStatusData {
  userId: string;
  user: {
    id: string;
    name: string;
    email?: string;
    avatar?: string;
    isOnline?: boolean;
    lastSeen?: Date;
  };
}

class SocketService {
  private socket: Socket | null = null;
  private isConnected = false;

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      const token = localStorage.getItem(LOCAL_STORAGE_KEYS.AUTH_TOKEN);
      
      if (!token) {
        reject(new Error('No authentication token found'));
        return;
      }

      this.socket = io(SOCKET_URL, {
        auth: { token },
        transports: ['websocket', 'polling'],
      });

      this.socket.on(SOCKET_EVENTS.CONNECT, () => {
        console.log('Connected to server');
        this.isConnected = true;
        resolve();
      });

      this.socket.on(SOCKET_EVENTS.CONNECT_ERROR, (error) => {
        console.error('Socket connection error:', error);
        this.isConnected = false;
        reject(error);
      });

      this.socket.on(SOCKET_EVENTS.DISCONNECT, (reason) => {
        console.log('Disconnected from server:', reason);
        this.isConnected = false;
      });

      this.socket.on(SOCKET_EVENTS.ERROR, (error) => {
        console.error('Socket error:', error);
      });
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  isSocketConnected(): boolean {
    return this.isConnected && this.socket?.connected === true;
  }

  // Room management
  joinRoom(roomId: string): void {
    if (this.socket) {
      this.socket.emit(SOCKET_EVENTS.JOIN_ROOM, { roomId });
    }
  }

  leaveRoom(roomId: string): void {
    if (this.socket) {
      this.socket.emit(SOCKET_EVENTS.LEAVE_ROOM, { roomId });
    }
  }

  // Message handling
  sendMessage(roomId: string, content: string, messageType = 'text', replyTo?: string): void {
    if (this.socket) {
      this.socket.emit(SOCKET_EVENTS.SEND_MESSAGE, {
        roomId,
        content,
        messageType,
        replyTo,
      });
    }
  }

  onNewMessage(callback: (data: SocketMessage) => void): void {
    if (this.socket) {
      this.socket.on(SOCKET_EVENTS.NEW_MESSAGE, callback);
    }
  }

  onRoomMessages(callback: (data: { roomId: string; messages: Message[] }) => void): void {
    if (this.socket) {
      this.socket.on(SOCKET_EVENTS.ROOM_MESSAGES, callback);
    }
  }

  // Typing indicators
  setTyping(roomId: string, isTyping: boolean): void {
    if (this.socket) {
      this.socket.emit(SOCKET_EVENTS.TYPING, { roomId, isTyping });
    }
  }

  onUserTyping(callback: (data: TypingData) => void): void {
    if (this.socket) {
      this.socket.on(SOCKET_EVENTS.USER_TYPING, callback);
    }
  }

  // Reactions
  addReaction(messageId: string, emoji: string): void {
    if (this.socket) {
      this.socket.emit(SOCKET_EVENTS.ADD_REACTION, { messageId, emoji });
    }
  }

  removeReaction(messageId: string): void {
    if (this.socket) {
      this.socket.emit(SOCKET_EVENTS.REMOVE_REACTION, { messageId });
    }
  }

  onReactionUpdated(callback: (data: { messageId: string; reactions: any[] }) => void): void {
    if (this.socket) {
      this.socket.on(SOCKET_EVENTS.REACTION_UPDATED, callback);
    }
  }

  // User status
  onUserOnline(callback: (data: UserStatusData) => void): void {
    if (this.socket) {
      this.socket.on(SOCKET_EVENTS.USER_ONLINE, callback);
    }
  }

  onUserOffline(callback: (data: UserStatusData) => void): void {
    if (this.socket) {
      this.socket.on(SOCKET_EVENTS.USER_OFFLINE, callback);
    }
  }

  // Event cleanup
  off(event: string, callback?: (...args: any[]) => void): void {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  removeAllListeners(): void {
    if (this.socket) {
      this.socket.removeAllListeners();
    }
  }
}

export default new SocketService();
