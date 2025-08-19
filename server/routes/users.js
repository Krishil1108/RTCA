const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const router = express.Router();

// @route   GET /api/users/online
// @desc    Get online users
// @access  Private
router.get('/online', async (req, res) => {
  try {
    const onlineUsers = await User.find({ isOnline: true })
      .select('name email avatar lastSeen')
      .limit(50);

    res.json({ users: onlineUsers });
  } catch (error) {
    console.error('Get online users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Name must be between 1 and 50 characters'),
  body('avatar')
    .optional()
    .isURL()
    .withMessage('Avatar must be a valid URL')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, avatar } = req.body;
    const user = req.user;

    if (name) user.name = name;
    if (avatar) user.avatar = avatar;

    await user.save();

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        isOnline: user.isOnline,
        settings: user.settings
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/users/settings
// @desc    Update user settings
// @access  Private
router.put('/settings', [
  body('theme')
    .optional()
    .isIn(['light', 'dark', 'auto'])
    .withMessage('Theme must be light, dark, or auto'),
  body('notifications')
    .optional()
    .isBoolean()
    .withMessage('Notifications must be boolean'),
  body('soundEnabled')
    .optional()
    .isBoolean()
    .withMessage('Sound enabled must be boolean')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { theme, notifications, soundEnabled } = req.body;
    const user = req.user;

    if (theme !== undefined) user.settings.theme = theme;
    if (notifications !== undefined) user.settings.notifications = notifications;
    if (soundEnabled !== undefined) user.settings.soundEnabled = soundEnabled;

    await user.save();

    res.json({
      message: 'Settings updated successfully',
      settings: user.settings
    });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/users/search
// @desc    Search users
// @access  Private
router.get('/search', async (req, res) => {
  try {
    const { q: query } = req.query;

    if (!query) {
      return res.status(400).json({ message: 'Search query required' });
    }

    const users = await User.find({
      $and: [
        { _id: { $ne: req.user._id } }, // Exclude current user
        {
          $or: [
            { name: { $regex: query, $options: 'i' } },
            { email: { $regex: query, $options: 'i' } }
          ]
        }
      ]
    })
      .select('name email avatar isOnline lastSeen')
      .limit(20);

    res.json({ users });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/users/:userId
// @desc    Get user profile
// @access  Private
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId)
      .select('name email avatar isOnline lastSeen createdAt');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Get user profile error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid user ID' });
    }
    
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
