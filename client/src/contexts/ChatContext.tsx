import React, { createContext, useContext, useReducer, useEffect, useCallback, ReactNode } from 'react';
import { Room, Message } from '../services/chatService';
import { TypingData, UserStatusData } from '../services/socketService';
import socketService from '../services/socketService';
import chatService from '../services/chatService';

interface ChatState {
  rooms: Room[];
  messages: { [roomId: string]: Message[] };
  currentRoom: string | null;
  onlineUsers: Set<string>;
  typingUsers: { [roomId: string]: TypingData[] };
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
}

type ChatAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_ROOMS'; payload: Room[] }
  | { type: 'ADD_ROOM'; payload: Room }
  | { type: 'UPDATE_ROOM'; payload: Room }
  | { type: 'SET_CURRENT_ROOM'; payload: string | null }
  | { type: 'SET_MESSAGES'; payload: { roomId: string; messages: Message[] } }
  | { type: 'ADD_MESSAGE'; payload: { roomId: string; message: Message } }
  | { type: 'UPDATE_MESSAGE'; payload: { roomId: string; message: Message } }
  | { type: 'SET_CONNECTED'; payload: boolean }
  | { type: 'SET_USER_ONLINE'; payload: string }
  | { type: 'SET_USER_OFFLINE'; payload: string }
  | { type: 'SET_TYPING'; payload: { roomId: string; typingData: TypingData[] } }
  | { type: 'CLEAR_MESSAGES'; payload: string };

const initialState: ChatState = {
  rooms: [],
  messages: {},
  currentRoom: null,
  onlineUsers: new Set(),
  typingUsers: {},
  isConnected: false,
  isLoading: false,
  error: null,
};

const chatReducer = (state: ChatState, action: ChatAction): ChatState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    case 'SET_ROOMS':
      return { ...state, rooms: action.payload };
    case 'ADD_ROOM':
      return { ...state, rooms: [action.payload, ...state.rooms] };
    case 'UPDATE_ROOM':
      return {
        ...state,
        rooms: state.rooms.map(room =>
          room._id === action.payload._id ? action.payload : room
        ),
      };
    case 'SET_CURRENT_ROOM':
      return { ...state, currentRoom: action.payload };
    case 'SET_MESSAGES':
      return {
        ...state,
        messages: {
          ...state.messages,
          [action.payload.roomId]: action.payload.messages,
        },
      };
    case 'ADD_MESSAGE':
      const { roomId, message } = action.payload;
      const existingMessages = state.messages[roomId] || [];
      return {
        ...state,
        messages: {
          ...state.messages,
          [roomId]: [...existingMessages, message],
        },
      };
    case 'UPDATE_MESSAGE':
      const updateRoomId = action.payload.roomId;
      const updatedMessage = action.payload.message;
      return {
        ...state,
        messages: {
          ...state.messages,
          [updateRoomId]: (state.messages[updateRoomId] || []).map(msg =>
            msg._id === updatedMessage._id ? updatedMessage : msg
          ),
        },
      };
    case 'SET_CONNECTED':
      return { ...state, isConnected: action.payload };
    case 'SET_USER_ONLINE':
      const updatedOnlineUsers = new Set(state.onlineUsers);
      updatedOnlineUsers.add(action.payload);
      return {
        ...state,
        onlineUsers: updatedOnlineUsers,
      };
    case 'SET_USER_OFFLINE':
      const newOnlineUsers = new Set(state.onlineUsers);
      newOnlineUsers.delete(action.payload);
      return { ...state, onlineUsers: newOnlineUsers };
    case 'SET_TYPING':
      return {
        ...state,
        typingUsers: {
          ...state.typingUsers,
          [action.payload.roomId]: action.payload.typingData,
        },
      };
    case 'CLEAR_MESSAGES':
      const newMessages = { ...state.messages };
      delete newMessages[action.payload];
      return { ...state, messages: newMessages };
    default:
      return state;
  }
};

interface ChatContextType extends ChatState {
  initializeSocket: () => Promise<void>;
  disconnectSocket: () => void;
  loadRooms: () => Promise<void>;
  loadMessages: (roomId: string) => Promise<void>;
  sendMessage: (content: string, messageType?: string, replyTo?: string) => void;
  editMessage: (messageId: string, content: string) => void;
  deleteMessage: (messageId: string) => void;
  joinRoom: (roomId: string) => void;
  leaveRoom: (roomId: string) => void;
  setCurrentRoom: (roomId: string | null) => void;
  createRoom: (roomData: { name: string; description?: string; type?: 'direct' | 'group' }) => Promise<void>;
  setTyping: (isTyping: boolean) => void;
  addReaction: (messageId: string, emoji: string) => void;
  removeReaction: (messageId: string) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

interface ChatProviderProps {
  children: ReactNode;
}

export const ChatProvider: React.FC<ChatProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(chatReducer, initialState);

  // Set up socket event listeners
  const setupSocketListeners = useCallback(() => {
    // New message
    socketService.onNewMessage((data) => {
      dispatch({
        type: 'ADD_MESSAGE',
        payload: { roomId: data.message.room, message: data.message },
      });
    });

    // Message updated (edit/delete)
    socketService.onMessageUpdated((data) => {
      dispatch({
        type: 'UPDATE_MESSAGE',
        payload: { roomId: data.message.room, message: data.message },
      });
    });

    // Room messages
    socketService.onRoomMessages((data) => {
      dispatch({
        type: 'SET_MESSAGES',
        payload: { roomId: data.roomId, messages: data.messages },
      });
    });

    // User typing
    socketService.onUserTyping((data) => {
      const currentTyping = state.typingUsers[state.currentRoom || ''] || [];
      let updatedTyping;

      if (data.isTyping) {
        // Add or update typing user
        updatedTyping = [
          ...currentTyping.filter(t => t.userId !== data.userId),
          data,
        ];
      } else {
        // Remove typing user
        updatedTyping = currentTyping.filter(t => t.userId !== data.userId);
      }

      if (state.currentRoom) {
        dispatch({
          type: 'SET_TYPING',
          payload: { roomId: state.currentRoom, typingData: updatedTyping },
        });
      }
    });

    // User status changes
    socketService.onUserOnline((data) => {
      dispatch({ type: 'SET_USER_ONLINE', payload: data.userId });
    });

    socketService.onUserOffline((data) => {
      dispatch({ type: 'SET_USER_OFFLINE', payload: data.userId });
    });

    // Reaction updates
    socketService.onReactionUpdated((data) => {
      // Find and update message with new reactions
      const { messageId, reactions } = data;
      for (const roomId in state.messages) {
        const message = state.messages[roomId].find(m => m._id === messageId);
        if (message) {
          const updatedMessage = { ...message, reactions };
          dispatch({
            type: 'UPDATE_MESSAGE',
            payload: { roomId, message: updatedMessage },
          });
          break;
        }
      }
    });
  }, [state.typingUsers, state.currentRoom, state.messages]);

  // Initialize socket connection
  const initializeSocket = useCallback(async () => {
    try {
      await socketService.connect();
      dispatch({ type: 'SET_CONNECTED', payload: true });
      setupSocketListeners();
    } catch (error: any) {
      console.error('Socket connection failed:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to connect to server' });
      dispatch({ type: 'SET_CONNECTED', payload: false });
    }
  }, [setupSocketListeners]);

  // Disconnect socket
  const disconnectSocket = () => {
    socketService.disconnect();
    dispatch({ type: 'SET_CONNECTED', payload: false });
  };

  // Load user's rooms
  const loadRooms = useCallback(async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await chatService.getRooms();
      dispatch({ type: 'SET_ROOMS', payload: response.rooms });
      dispatch({ type: 'SET_ERROR', payload: null });
    } catch (error: any) {
      console.error('Failed to load rooms:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load rooms' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  // Load messages for a room
  const loadMessages = async (roomId: string) => {
    try {
      const response = await chatService.getMessages(roomId);
      dispatch({
        type: 'SET_MESSAGES',
        payload: { roomId, messages: response.messages },
      });
    } catch (error: any) {
      console.error('Failed to load messages:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load messages' });
    }
  };

  // Send message
  const sendMessage = (content: string, messageType = 'text', replyTo?: string) => {
    if (state.currentRoom && content.trim()) {
      socketService.sendMessage(state.currentRoom, content.trim(), messageType, replyTo);
    }
  };

  // Join room
  const joinRoom = (roomId: string) => {
    socketService.joinRoom(roomId);
    setCurrentRoom(roomId);
    loadMessages(roomId);
  };

  // Leave room
  const leaveRoom = useCallback((roomId: string) => {
    socketService.leaveRoom(roomId);
    if (state.currentRoom === roomId) {
      setCurrentRoom(null);
    }
    dispatch({ type: 'CLEAR_MESSAGES', payload: roomId });
  }, [state.currentRoom]);

  // Set current room
  const setCurrentRoom = (roomId: string | null) => {
    dispatch({ type: 'SET_CURRENT_ROOM', payload: roomId });
  };

  // Create new room
  const createRoom = async (roomData: {
    name: string;
    description?: string;
    type?: 'direct' | 'group';
  }) => {
    try {
      const response = await chatService.createRoom(roomData);
      dispatch({ type: 'ADD_ROOM', payload: response.room });
      // Auto-join the newly created room
      joinRoom(response.room._id);
    } catch (error: any) {
      console.error('Failed to create room:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to create room' });
      throw error;
    }
  };

  // Set typing status
  const setTyping = (isTyping: boolean) => {
    if (state.currentRoom) {
      socketService.setTyping(state.currentRoom, isTyping);
    }
  };

  // Add reaction to message
  const addReaction = (messageId: string, emoji: string) => {
    socketService.addReaction(messageId, emoji);
  };

  // Remove reaction from message
  const removeReaction = (messageId: string) => {
    socketService.removeReaction(messageId);
  };

  // Edit message
  const editMessage = useCallback((messageId: string, content: string) => {
    socketService.editMessage(messageId, content);
  }, []);

  // Delete message
  const deleteMessage = useCallback((messageId: string) => {
    socketService.deleteMessage(messageId);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      socketService.removeAllListeners();
      disconnectSocket();
    };
  }, []);

  const value: ChatContextType = {
    ...state,
    initializeSocket,
    disconnectSocket,
    loadRooms,
    loadMessages,
    sendMessage,
    editMessage,
    deleteMessage,
    joinRoom,
    leaveRoom,
    setCurrentRoom,
    createRoom,
    setTyping,
    addReaction,
    removeReaction,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};
