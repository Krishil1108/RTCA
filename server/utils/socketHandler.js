const Message = require('../models/Message');
const User = require('../models/User');
const Room = require('../models/Room');
const { authenticateSocket } = require('../middleware/auth');
const { MAX_MESSAGE_LENGTH, MESSAGE_RATE_LIMIT, REACTION_RATE_LIMIT, ALLOWED_MESSAGE_TYPES } = require('../config/constants');

// Simple in-memory token buckets (acceptable for single-instance deployments; replace with Redis for scaling)
const messageBuckets = new Map(); // key: userId, value: { count, reset }
const reactionBuckets = new Map();

function checkBucket(map, key, limitCfg) {
  const now = Date.now();
  let bucket = map.get(key);
  if (!bucket || bucket.reset < now) {
    bucket = { count: 0, reset: now + limitCfg.windowMs };
    map.set(key, bucket);
  }
  if (bucket.count >= limitCfg.max) {
    return { allowed: false, retryAfter: Math.ceil((bucket.reset - now) / 1000) };
  }
  bucket.count += 1;
  return { allowed: true, retryAfter: 0 };
}

const socketHandler = (io) => {
  // Authentication middleware for socket connections
  io.use(authenticateSocket);

  io.on('connection', async (socket) => {
    console.log(`User ${socket.user.name} connected with socket ID: ${socket.id}`);

    // Update user's online status and socket ID
    try {
      await socket.user.setOnlineStatus(true, socket.id);
      
      // Join user to their rooms
      const userRooms = await Room.getUserRooms(socket.userId);
      userRooms.forEach(room => {
        socket.join(room._id.toString());
      });

      // Notify others about user coming online
      socket.broadcast.emit('user_online', {
        userId: socket.userId,
        user: {
          id: socket.user._id,
          name: socket.user.name,
          email: socket.user.email,
          avatar: socket.user.avatar,
          isOnline: true
        }
      });

    } catch (error) {
      console.error('Connection setup error:', error);
    }

    // Handle joining a room
    socket.on('join_room', async (data) => {
      try {
        const { roomId } = data;
        
        // Verify user is member of the room
        const room = await Room.findById(roomId);
        if (!room || !room.isMember(socket.userId)) {
          socket.emit('error', { message: 'Access denied to this room' });
          return;
        }

        socket.join(roomId);
        socket.currentRoom = roomId;

        // Send recent messages to the user
        const messages = await Message.getRecentMessages(roomId, 50);
        socket.emit('room_messages', { roomId, messages });

        console.log(`User ${socket.user.name} joined room ${room.name}`);
      } catch (error) {
        console.error('Join room error:', error);
        socket.emit('error', { message: 'Failed to join room' });
      }
    });

    // Handle leaving a room
    socket.on('leave_room', (data) => {
      const { roomId } = data;
      socket.leave(roomId);
      
      if (socket.currentRoom === roomId) {
        socket.currentRoom = null;
      }
      
      console.log(`User ${socket.user.name} left room ${roomId}`);
    });

    // Handle sending a message
  socket.on('send_message', async (data) => {
      try {
    const { roomId, content, messageType = 'text', replyTo } = data || {};

    // Basic shape validation
    if (!roomId || typeof content !== 'string') {
      socket.emit('error', { message: 'Invalid message payload' });
      return;
    }
    const trimmed = content.trim();
    if (!trimmed) {
      socket.emit('error', { message: 'Message cannot be empty' });
      return;
    }
    if (trimmed.length > MAX_MESSAGE_LENGTH) {
      socket.emit('error', { message: `Message exceeds max length (${MAX_MESSAGE_LENGTH})` });
      return;
    }
    if (!ALLOWED_MESSAGE_TYPES.includes(messageType)) {
      socket.emit('error', { message: 'Unsupported message type' });
      return;
    }

    // Per-user rate bucket (not IP-based)
    const bucketRes = checkBucket(messageBuckets, socket.userId, MESSAGE_RATE_LIMIT);
    if (!bucketRes.allowed) {
      socket.emit('error', { message: 'Message rate limit exceeded', retryAfter: bucketRes.retryAfter });
      return;
    }

        // Verify user is member of the room
        const room = await Room.findById(roomId);
        if (!room || !room.isMember(socket.userId)) {
          socket.emit('error', { message: 'Access denied to this room' });
          return;
        }

        // Create and save message
        const message = new Message({
          sender: socket.userId,
          content: trimmed,
          room: roomId,
          messageType,
          replyTo: replyTo || undefined
        });

        await message.save();
        await message.populate('sender', 'name email avatar');
        
        if (replyTo) {
          await message.populate('replyTo', 'content sender');
        }

        // Update room's last message
        room.lastMessage = message._id;
        await room.save();

        // Emit message to all room members
        io.to(roomId).emit('new_message', {
          message: {
            _id: message._id,
            sender: message.sender,
            content: message.content,
            room: message.room,
            messageType: message.messageType,
            createdAt: message.createdAt,
            replyTo: message.replyTo,
            reactions: message.reactions
          }
        });

        console.log(`Message sent in room ${roomId} by ${socket.user.name}`);
      } catch (error) {
        console.error('Send message error:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Handle typing indicator
    socket.on('typing', (data) => {
      const { roomId, isTyping } = data;
      
      socket.to(roomId).emit('user_typing', {
        userId: socket.userId,
        userName: socket.user.name,
        isTyping
      });
    });

    // Handle message reactions
    socket.on('add_reaction', async (data) => {
      try {
        const { messageId, emoji } = data;

        if (!messageId || typeof emoji !== 'string' || emoji.length > 16) {
          socket.emit('error', { message: 'Invalid reaction data' });
          return;
        }

        const bucketRes = checkBucket(reactionBuckets, socket.userId, REACTION_RATE_LIMIT);
        if (!bucketRes.allowed) {
          socket.emit('error', { message: 'Reaction rate limit exceeded', retryAfter: bucketRes.retryAfter });
          return;
        }

        const message = await Message.findById(messageId);
        if (!message) {
          socket.emit('error', { message: 'Message not found' });
          return;
        }

        await message.addReaction(socket.userId, emoji);
        
        // Emit reaction update to room members
        io.to(message.room.toString()).emit('reaction_updated', {
          messageId,
          reactions: message.reactions
        });
      } catch (error) {
        console.error('Add reaction error:', error);
        socket.emit('error', { message: 'Failed to add reaction' });
      }
    });

    // Handle removing reactions
    socket.on('remove_reaction', async (data) => {
      try {
        const { messageId } = data;

        if (!messageId) {
          socket.emit('error', { message: 'Invalid reaction removal data' });
          return;
        }

        const message = await Message.findById(messageId);
        if (!message) {
          socket.emit('error', { message: 'Message not found' });
          return;
        }

        await message.removeReaction(socket.userId);
        
        // Emit reaction update to room members
        io.to(message.room.toString()).emit('reaction_updated', {
          messageId,
          reactions: message.reactions
        });
      } catch (error) {
        console.error('Remove reaction error:', error);
        socket.emit('error', { message: 'Failed to remove reaction' });
      }
    });

    // Handle editing a message
    socket.on('edit_message', async (data) => {
      try {
        const { messageId, content } = data;

        if (!messageId || typeof content !== 'string') {
          socket.emit('error', { message: 'Invalid edit payload' });
          return;
        }
        const trimmed = content.trim();
        if (!trimmed) {
          socket.emit('error', { message: 'Message cannot be empty' });
          return;
        }
        if (trimmed.length > MAX_MESSAGE_LENGTH) {
          socket.emit('error', { message: `Edited message exceeds max length (${MAX_MESSAGE_LENGTH})` });
          return;
        }

        const message = await Message.findById(messageId);
        if (!message) {
          socket.emit('error', { message: 'Message not found' });
          return;
        }

        // Check if user is the sender
        if (message.sender.toString() !== socket.userId.toString()) {
          socket.emit('error', { message: 'You can only edit your own messages' });
          return;
        }

        // Check if message is too old to edit (24 hours)
        const messageAge = Date.now() - new Date(message.createdAt).getTime();
        const maxEditTime = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
        if (messageAge > maxEditTime) {
          socket.emit('error', { message: 'Message is too old to edit' });
          return;
        }

        // Update message
  message.content = trimmed;
        message.edited = true;
        message.editedAt = new Date();
        await message.save();

        await message.populate('sender', 'name email avatar');
        if (message.replyTo) {
          await message.populate('replyTo', 'content sender');
        }

        // Emit updated message to room members
        io.to(message.room.toString()).emit('message_updated', {
          message: {
            _id: message._id,
            sender: message.sender,
            content: message.content,
            room: message.room,
            messageType: message.messageType,
            createdAt: message.createdAt,
            edited: message.edited,
            editedAt: message.editedAt,
            replyTo: message.replyTo,
            reactions: message.reactions
          }
        });

        console.log(`Message ${messageId} edited by ${socket.user.name}`);
      } catch (error) {
        console.error('Edit message error:', error);
        socket.emit('error', { message: 'Failed to edit message' });
      }
    });

    // Handle deleting a message
  socket.on('delete_message', async (data) => {
      try {
        const { messageId } = data;

        if (!messageId) {
          socket.emit('error', { message: 'Invalid delete data' });
          return;
        }

        const message = await Message.findById(messageId);
        if (!message) {
          socket.emit('error', { message: 'Message not found' });
          return;
        }

        // Check if user is the sender
        if (message.sender.toString() !== socket.userId.toString()) {
          socket.emit('error', { message: 'You can only delete your own messages' });
          return;
        }

        // Check if message is too old to delete (24 hours)
        const messageAge = Date.now() - new Date(message.createdAt).getTime();
        const maxDeleteTime = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
        if (messageAge > maxDeleteTime) {
          socket.emit('error', { message: 'Message is too old to delete' });
          return;
        }

        // Soft delete - mark as deleted instead of removing
        message.content = 'This message was deleted';
        message.messageType = 'deleted';
        message.edited = true;
        message.editedAt = new Date();
        await message.save();

        await message.populate('sender', 'name email avatar');

        // Emit updated message to room members
        io.to(message.room.toString()).emit('message_updated', {
          message: {
            _id: message._id,
            sender: message.sender,
            content: message.content,
            room: message.room,
            messageType: message.messageType,
            createdAt: message.createdAt,
            edited: message.edited,
            editedAt: message.editedAt,
            replyTo: message.replyTo,
            reactions: message.reactions
          }
        });

        console.log(`Message ${messageId} deleted by ${socket.user.name}`);
      } catch (error) {
        console.error('Delete message error:', error);
        socket.emit('error', { message: 'Failed to delete message' });
      }
    });

    // Handle user disconnect
    socket.on('disconnect', async () => {
      try {
        console.log(`User ${socket.user.name} disconnected`);
        
        // Update user's online status
        await socket.user.setOnlineStatus(false);

        // Notify others about user going offline
        socket.broadcast.emit('user_offline', {
          userId: socket.userId,
          user: {
            id: socket.user._id,
            name: socket.user.name,
            lastSeen: new Date()
          }
        });

      } catch (error) {
        console.error('Disconnect error:', error);
      }
    });

    // Handle errors
    socket.on('error', (error) => {
      console.error('Socket error:', error);
      socket.emit('error', { message: 'Socket connection error' });
    });
  });
};

module.exports = socketHandler;
