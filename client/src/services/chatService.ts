import api from './api';

export interface Message {
  _id: string;
  sender: {
    _id: string;
    name: string;
    email: string;
    avatar: string;
  };
  content: string;
  room: string;
  messageType: 'text' | 'image' | 'video' | 'audio' | 'file' | 'system' | 'deleted';
  fileData?: {
    filename: string;
    originalName: string;
    mimetype: string;
    size: number;
    url: string;
    publicId?: string;
    thumbnail?: string;
    blurredThumbnail?: string;
  };
  createdAt: string;
  edited?: boolean;
  editedAt?: string;
  reactions: Array<{
    user: {
      _id: string;
      name: string;
    };
    emoji: string;
  }>;
  replyTo?: {
    _id: string;
    content: string;
    sender: {
      _id: string;
      name: string;
    };
  };
}

export interface Room {
  _id: string;
  name: string;
  description: string;
  type: 'direct' | 'group';
  members: Array<{
    user: {
      _id: string;
      name: string;
      email: string;
      avatar: string;
      isOnline: boolean;
      lastSeen?: string | Date;
    };
    role: 'admin' | 'moderator' | 'member';
    joinedAt: string;
  }>;
  createdBy: string;
  lastMessage?: {
    _id: string;
    content: string;
    createdAt: string;
    sender: {
      _id: string;
      name: string;
    };
  };
  memberCount?: number;
  createdAt: string;
  updatedAt: string;
}

class ChatService {
  async getRooms(): Promise<{ rooms: Room[] }> {
    const response = await api.get('/chat/rooms');
    return response.data;
  }

  async getMessages(roomId: string, page = 1, limit = 50): Promise<{ messages: Message[]; hasMore: boolean }> {
    const response = await api.get(`/chat/rooms/${roomId}/messages`, {
      params: { page, limit }
    });
    return response.data;
  }

  async createRoom(roomData: {
    name: string;
    description?: string;
    type?: 'direct' | 'group';
  }): Promise<{ message: string; room: Room }> {
    const response = await api.post('/chat/rooms', roomData);
    return response.data;
  }

  async createConversation(userEmail: string): Promise<{ room: Room }> {
    const response = await api.post('/chat/conversation', { userEmail });
    return response.data;
  }

  async joinRoom(roomId: string): Promise<{ message: string; room: Room }> {
    const response = await api.post(`/chat/rooms/${roomId}/join`);
    return response.data;
  }

  async leaveRoom(roomId: string): Promise<{ message: string }> {
    const response = await api.post(`/chat/rooms/${roomId}/leave`);
    return response.data;
  }

  async searchMessages(query: string, roomId?: string): Promise<{ messages: Message[] }> {
    const response = await api.get('/chat/search', {
      params: { q: query, room: roomId }
    });
    return response.data;
  }
}

const chatService = new ChatService();
export default chatService;
