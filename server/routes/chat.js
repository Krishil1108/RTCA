const express = require('express');
const { body, validationResult } = require('express-validator');
const Message = require('../models/Message');
const Room = require('../models/Room');
const User = require('../models/User');
const router = express.Router();

// @route   GET /api/chat/rooms
// @desc    Get user's chat rooms
// @access  Private
router.get('/rooms', async (req, res) => {
  try {
    const rooms = await Room.getUserRooms(req.user._id);
    res.json({ rooms });
  } catch (error) {
    console.error('Get rooms error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/chat/conversation
// @desc    Create or get direct conversation with another user
// @access  Private
router.post('/conversation', [
  body('userEmail').isEmail().withMessage('Valid email is required'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { userEmail } = req.body;
    const currentUserId = req.user._id;

    // Find the other user
    const otherUser = await User.findOne({ email: userEmail });
    if (!otherUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (otherUser._id.toString() === currentUserId.toString()) {
      return res.status(400).json({ message: 'Cannot create conversation with yourself' });
    }

    // Check if direct conversation already exists
    let room = await Room.findOne({
      type: 'direct',
      'members.user': { $all: [currentUserId, otherUser._id] },
      $expr: { $eq: [{ $size: '$members' }, 2] }
    }).populate('members.user', 'name email avatar');

    if (!room) {
      // Create new direct conversation
      room = new Room({
        name: `${req.user.name} & ${otherUser.name}`,
        type: 'direct',
        members: [
          { user: currentUserId, role: 'member' },
          { user: otherUser._id, role: 'member' }
        ],
        createdBy: currentUserId
      });
      await room.save();
      await room.populate('members.user', 'name email avatar');
    }

    res.json({ room });
  } catch (error) {
    console.error('Create conversation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/chat/rooms/:roomId/messages
// @desc    Get messages for a specific room
// @access  Private
router.get('/rooms/:roomId/messages', async (req, res) => {
  try {
    const { roomId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    // Check if user is member of the room
    const room = await Room.findById(roomId);
    if (!room || !room.isMember(req.user._id)) {
      return res.status(403).json({ message: 'Access denied to this room' });
    }

    const messages = await Message.find({ room: roomId })
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('sender', 'name email avatar')
      .populate('replyTo', 'content sender')
      .populate('reactions.user', 'name')
      .exec();

    res.json({ 
      messages: messages.reverse(), // Reverse to get chronological order
      hasMore: messages.length === limit 
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/chat/rooms
// @desc    Create a new room
// @access  Private
router.post('/rooms', [
  body('name')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Room name must be between 1 and 50 characters'),
  body('description')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Description must be less than 200 characters'),
  body('type')
    .optional()
    .isIn(['public', 'private'])
    .withMessage('Type must be public or private')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, description, type = 'public' } = req.body;

    // Check if room with same name exists
    const existingRoom = await Room.findOne({ name });
    if (existingRoom) {
      return res.status(400).json({ message: 'Room with this name already exists' });
    }

    const room = new Room({
      name,
      description,
      type,
      createdBy: req.user._id,
      members: [{
        user: req.user._id,
        role: 'admin'
      }]
    });

    await room.save();
    await room.populate('members.user', 'name email avatar isOnline');

    res.status(201).json({ 
      message: 'Room created successfully',
      room 
    });
  } catch (error) {
    console.error('Create room error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/chat/rooms/:roomId/join
// @desc    Join a room
// @access  Private
router.post('/rooms/:roomId/join', async (req, res) => {
  try {
    const { roomId } = req.params;
    
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    if (room.isMember(req.user._id)) {
      return res.status(400).json({ message: 'Already a member of this room' });
    }

    await room.addMember(req.user._id);
    await room.populate('members.user', 'name email avatar isOnline');

    res.json({ 
      message: 'Joined room successfully',
      room 
    });
  } catch (error) {
    console.error('Join room error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/chat/rooms/:roomId/leave
// @desc    Leave a room
// @access  Private
router.post('/rooms/:roomId/leave', async (req, res) => {
  try {
    const { roomId } = req.params;
    
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    if (!room.isMember(req.user._id)) {
      return res.status(400).json({ message: 'Not a member of this room' });
    }

    await room.removeMember(req.user._id);

    res.json({ message: 'Left room successfully' });
  } catch (error) {
    console.error('Leave room error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/chat/messages/:messageId
// @desc    Edit a message
// @access  Private
router.put('/messages/:messageId', [
  body('content')
    .trim()
    .isLength({ min: 1, max: 2000 })
    .withMessage('Message content must be between 1 and 2000 characters'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { messageId } = req.params;
    const { content } = req.body;

    // Find the message
    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Check if user is the sender
    if (message.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only edit your own messages' });
    }

    // Check if message is too old to edit (24 hours)
    const messageAge = Date.now() - new Date(message.createdAt).getTime();
    const maxEditTime = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    if (messageAge > maxEditTime) {
      return res.status(400).json({ message: 'Message is too old to edit' });
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

    res.json({ 
      message: 'Message updated successfully',
      data: message 
    });
  } catch (error) {
    console.error('Edit message error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/chat/messages/:messageId
// @desc    Delete a message
// @access  Private
router.delete('/messages/:messageId', async (req, res) => {
  try {
    const { messageId } = req.params;

    // Find the message
    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Check if user is the sender
    if (message.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only delete your own messages' });
    }

    // Check if message is too old to delete (24 hours)
    const messageAge = Date.now() - new Date(message.createdAt).getTime();
    const maxDeleteTime = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    if (messageAge > maxDeleteTime) {
      return res.status(400).json({ message: 'Message is too old to delete' });
    }

    // Soft delete - mark as deleted instead of removing
    message.content = 'This message was deleted';
    message.messageType = 'deleted';
    message.edited = true;
    message.editedAt = new Date();
    await message.save();

    res.json({ 
      message: 'Message deleted successfully',
      data: message 
    });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/chat/search
// @desc    Search messages
// @access  Private
router.get('/search', async (req, res) => {
  try {
    const { q: query, room } = req.query;

    if (!query) {
      return res.status(400).json({ message: 'Search query required' });
    }

    // Get user's rooms for search scope
    const userRooms = await Room.find({ 'members.user': req.user._id }).select('_id');
    const roomIds = userRooms.map(r => r._id);

    const searchFilter = {
      room: room ? room : { $in: roomIds },
      content: { $regex: query, $options: 'i' }
    };

    const messages = await Message.find(searchFilter)
      .sort({ createdAt: -1 })
      .limit(20)
      .populate('sender', 'name email avatar')
      .populate('room', 'name')
      .exec();

    res.json({ messages });
  } catch (error) {
    console.error('Search messages error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
