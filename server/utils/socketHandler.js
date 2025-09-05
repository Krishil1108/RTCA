const Message = require('../models/Message');
const User = require('../models/User');
const Room = require('../models/Room');
const { authenticateSocket } = require('../middleware/auth');

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
        const { roomId, content, messageType = 'text', replyTo, fileData } = data;

        // Validate input
        if (!roomId || (!content && !fileData) || (content && content.trim().length === 0 && !fileData)) {
          socket.emit('error', { message: 'Invalid message data' });
          return;
        }

        // Verify user is member of the room
        const room = await Room.findById(roomId);
        if (!room || !room.isMember(socket.userId)) {
          socket.emit('error', { message: 'Access denied to this room' });
          return;
        }

        // Create and save message
        const messageData = {
          sender: socket.userId,
          content: content ? content.trim() : (fileData ? fileData.originalName : ''),
          room: roomId,
          messageType,
          replyTo: replyTo || undefined
        };

        // Add file data if present
        if (fileData) {
          messageData.fileData = fileData;
        }

        const message = new Message(messageData);

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
            fileData: message.fileData,
            createdAt: message.createdAt,
            replyTo: message.replyTo,
            reactions: message.reactions,
            deliveredTo: message.deliveredTo,
            readBy: message.readBy,
            readReceiptStatus: message.readReceiptStatus
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

        if (!messageId || !content || content.trim().length === 0) {
          socket.emit('error', { message: 'Invalid edit data' });
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
        message.content = content.trim();
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

    // Handle marking message as delivered
    socket.on('mark_delivered', async (data) => {
      try {
        const { messageId } = data;

        const message = await Message.findById(messageId);
        if (!message) {
          socket.emit('error', { message: 'Message not found' });
          return;
        }

        // Don't mark own messages as delivered
        if (message.sender.toString() === socket.userId.toString()) {
          return;
        }

        await message.markAsDelivered(socket.userId);
        
        // Notify the sender about delivery
        socket.to(message.room.toString()).emit('message_delivered', {
          messageId,
          userId: socket.userId,
          deliveredAt: new Date()
        });

        console.log(`Message ${messageId} marked as delivered by ${socket.user.name}`);
      } catch (error) {
        console.error('Mark delivered error:', error);
      }
    });

    // Handle marking message as read
    socket.on('mark_read', async (data) => {
      try {
        const { messageId } = data;

        const message = await Message.findById(messageId);
        if (!message) {
          socket.emit('error', { message: 'Message not found' });
          return;
        }

        // Don't mark own messages as read
        if (message.sender.toString() === socket.userId.toString()) {
          return;
        }

        // Mark as delivered first, then read
        await message.markAsDelivered(socket.userId);
        await message.markAsRead(socket.userId);
        
        // Get the room to calculate new unread count
        const Room = require('../models/Room');
        const room = await Room.findById(message.room);
        if (room) {
          const unreadCount = await room.getUnreadCount(socket.userId);
          
          // Emit unread count update to the user who read the message
          socket.emit('unread_count_updated', {
            roomId: message.room,
            unreadCount
          });
        }
        
        // Notify the sender about read status
        socket.to(message.room.toString()).emit('message_read', {
          messageId,
          userId: socket.userId,
          readAt: new Date()
        });

        console.log(`Message ${messageId} marked as read by ${socket.user.name}`);
      } catch (error) {
        console.error('Mark read error:', error);
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
