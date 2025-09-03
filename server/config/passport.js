const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const User = require('../models/User');

// Google OAuth Strategy
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.NODE_ENV === 'production' 
    ? "/api/auth/google/callback"  // Render will use the full domain automatically
    : "/api/auth/google/callback"  // Local development
}, async (accessToken, refreshToken, profile, done) => {
  try {
    console.log('Google OAuth Strategy - Processing user:', profile.displayName, profile.emails[0]?.value);
    
    // Check if user already exists with this Google ID
    let user = await User.findOne({ googleId: profile.id });
    let isNewUser = false;
    
    if (user) {
      console.log('Google OAuth Strategy - Existing user found:', user.name);
      return done(null, user);
    }
    
    // Check if user exists with same email
    user = await User.findOne({ email: profile.emails[0].value });
    
    if (user) {
      console.log('Google OAuth Strategy - Linking Google account to existing user:', user.name);
      // Link Google account to existing user
      user.googleId = profile.id;
      user.avatar = profile.photos[0]?.value || user.avatar;
      await user.save();
      return done(null, user);
    }
    
    console.log('Google OAuth Strategy - Creating new user');
    // Create new user
    user = new User({
      googleId: profile.id,
      email: profile.emails[0].value,
      name: profile.displayName,
      avatar: profile.photos[0]?.value || ''
    });
    
    await user.save();
    isNewUser = true;
    
    console.log('New user created:', user.name, user.email);
    
    return done(null, user);
    
  } catch (error) {
    console.error('Google Strategy Error:', error);
    return done(error, null);
  }
}));

// JWT Strategy
passport.use(new JwtStrategy({
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET
}, async (payload, done) => {
  try {
    const user = await User.findById(payload.userId).select('-googleId');
    
    if (user) {
      return done(null, user);
    }
    
    return done(null, false);
  } catch (error) {
    console.error('JWT Strategy Error:', error);
    return done(error, false);
  }
}));

// Serialize user for the session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from the session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});
