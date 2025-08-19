const express = require('express');
const passport = require('passport');
const { generateToken } = require('../middleware/auth');
const User = require('../models/User');
const router = express.Router();

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
    passport.authenticate('google', { session: false }, (err, user, info) => {
      if (err) {
        console.error('OAuth authentication error:', err);
        const clientURL = process.env.CLIENT_URL || 'http://localhost:3000';
        
        // Handle rate limiting specifically
        if (err.message && err.message.includes('rate')) {
          return res.redirect(`${clientURL}/auth/error?error=rate_limit`);
        }
        
        return res.redirect(`${clientURL}/auth/error?error=oauth_failed`);
      }
      
      if (!user) {
        console.log('No user returned from OAuth');
        const clientURL = process.env.CLIENT_URL || 'http://localhost:3000';
        return res.redirect(`${clientURL}/auth/error?error=no_user`);
      }
      
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
      isOnline: req.user.isOnline,
      settings: req.user.settings,
      lastSeen: req.user.lastSeen
    }
  });
});

module.exports = router;
