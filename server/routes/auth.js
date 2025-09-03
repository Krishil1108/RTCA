const express = require('express');
const passport = require('passport');
const { generateToken } = require('../middleware/auth');
const User = require('../models/User');
const router = express.Router();

// @route   GET /api/auth/config
// @desc    Check auth configuration (for debugging)
// @access  Public
router.get('/config', (req, res) => {
  res.json({
    google_client_id_configured: !!process.env.GOOGLE_CLIENT_ID,
    google_client_secret_configured: !!process.env.GOOGLE_CLIENT_SECRET,
    jwt_secret_configured: !!process.env.JWT_SECRET,
    client_url: process.env.CLIENT_URL || 'http://localhost:3000',
    callback_url: '/api/auth/google/callback'
  });
});

// @route   GET /api/auth/google
// @desc    Initiate Google OAuth
// @access  Public
router.get('/google', 
  passport.authenticate('google', { 
    scope: ['profile', 'email'] 
  })
);

// @route   GET /api/auth/google/callback
// @desc    Google OAuth callback
// @access  Public
router.get('/google/callback',
  (req, res, next) => {
    console.log('OAuth callback received');
    
    // Add rate limiting check
    const clientIP = req.ip || req.connection.remoteAddress;
    console.log(`OAuth callback from IP: ${clientIP}`);
    
    passport.authenticate('google', { session: false }, (err, user, info) => {
      console.log('OAuth authenticate result - err:', !!err, 'user:', !!user, 'info:', info);
      
      if (err) {
        console.error('OAuth authentication error:', err);
        const clientURL = process.env.CLIENT_URL || 'http://localhost:3000';
        
        // Handle rate limiting specifically
        if (err.message && (err.message.includes('rate') || err.message.includes('429'))) {
          console.log('Rate limit error detected');
          return res.redirect(`${clientURL}/auth/error?error=rate_limit&message=Too many requests. Please try again in a few minutes.`);
        }
        
        // Handle quota exceeded errors
        if (err.message && err.message.includes('quota')) {
          console.log('Quota exceeded error detected');
          return res.redirect(`${clientURL}/auth/error?error=quota_exceeded&message=Service temporarily unavailable. Please try again later.`);
        }
        
        console.log('General OAuth error');
        return res.redirect(`${clientURL}/auth/error?error=oauth_failed&message=Authentication failed. Please try again.`);
      }
      
      if (!user) {
        console.log('No user returned from OAuth, info:', info);
        const clientURL = process.env.CLIENT_URL || 'http://localhost:3000';
        return res.redirect(`${clientURL}/auth/error?error=no_user`);
      }
      
      console.log('OAuth authentication successful for user:', user.name);
      req.user = user;
      next();
    })(req, res, next);
  },
  async (req, res) => {
    try {
      console.log('OAuth callback - User:', req.user ? req.user.name : 'No user');
      
      const token = generateToken(req.user._id);
      console.log('OAuth callback - Token generated:', !!token);
      
      // Redirect to client with token
      const clientURL = process.env.CLIENT_URL || 'http://localhost:3000';
      const redirectURL = `${clientURL}/auth/success?token=${token}`;
      console.log('OAuth callback - Redirecting to:', redirectURL);
      
      res.redirect(redirectURL);
    } catch (error) {
      console.error('OAuth callback error:', error);
      const clientURL = process.env.CLIENT_URL || 'http://localhost:3000';
      res.redirect(`${clientURL}/auth/error?error=oauth_failed`);
    }
  }
);

// @route   POST /api/auth/verify
// @desc    Verify JWT token and get user info
// @access  Private
router.post('/verify', async (req, res) => {
  try {
    console.log('Token verification request received');
    const { token } = req.body;
    
    if (!token) {
      console.log('No token provided');
      return res.status(400).json({ message: 'Token required' });
    }

    console.log('Verifying token...');
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Token decoded:', decoded.userId);
    
    const user = await User.findById(decoded.userId).select('-googleId');
    console.log('User found:', user ? user.name : 'No user');

    if (!user) {
      console.log('User not found for token');
      return res.status(401).json({ message: 'Invalid token' });
    }

    console.log('Token verification successful');
    res.json({
      message: 'Token valid',
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
    console.error('Token verification error:', error);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/auth/demo
// @desc    Demo login (development only)
// @access  Public
router.post('/demo', async (req, res) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({ message: 'Demo mode not available in production' });
    }

    // Create or find demo user
    let demoUser = await User.findOne({ email: 'demo@rtca.local' });
    
    if (!demoUser) {
      demoUser = new User({
        email: 'demo@rtca.local',
        name: 'Demo User',
        avatar: 'https://ui-avatars.com/api/?name=Demo+User&background=0D47A1&color=fff'
      });
      await demoUser.save();

      // Add user to General room
      const Room = require('../models/Room');
      const generalRoom = await Room.findOne({ name: 'General' });
      if (generalRoom && !generalRoom.isMember(demoUser._id)) {
        await generalRoom.addMember(demoUser._id);
      }
    }

    const token = generateToken(demoUser._id);

    res.json({
      message: 'Demo login successful',
      token,
      user: {
        id: demoUser._id,
        name: demoUser.name,
        email: demoUser.email,
        avatar: demoUser.avatar,
        isOnline: demoUser.isOnline,
        settings: demoUser.settings
      }
    });
  } catch (error) {
    console.error('Demo login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/auth/logout
// @desc    Logout user (client-side token removal)
// @access  Private
router.post('/logout', (req, res) => {
  // In a JWT-based system, logout is handled client-side
  // by removing the token from storage
  res.json({ message: 'Logged out successfully' });
});

// @route   GET /api/auth/me
// @desc    Get current user info
// @access  Private
router.get('/me', passport.authenticate('jwt', { session: false }), (req, res) => {
  res.json({
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      avatar: req.user.avatar,
      about: req.user.about,
      isOnline: req.user.isOnline,
      settings: req.user.settings,
      lastSeen: req.user.lastSeen
    }
  });
});

// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', passport.authenticate('jwt', { session: false }), async (req, res) => {
  try {
    const { name, about, avatar } = req.body;
    const userId = req.user._id;

    // Validate input
    if (name && name.trim().length === 0) {
      return res.status(400).json({ message: 'Name cannot be empty' });
    }

    if (name && name.length > 25) {
      return res.status(400).json({ message: 'Name cannot exceed 25 characters' });
    }

    if (about && about.length > 139) {
      return res.status(400).json({ message: 'About cannot exceed 139 characters' });
    }

    // Build update object
    const updateData = {};
    if (name !== undefined) updateData.name = name.trim();
    if (about !== undefined) updateData.about = about.trim();
    if (avatar !== undefined) updateData.avatar = avatar;

    // Update user in database
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        avatar: updatedUser.avatar,
        about: updatedUser.about,
        isOnline: updatedUser.isOnline,
        settings: updatedUser.settings,
        lastSeen: updatedUser.lastSeen
      }
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ message: 'Server error while updating profile' });
  }
});

module.exports = router;
