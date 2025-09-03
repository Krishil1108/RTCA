const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const passport = require('passport');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth');
const chatRoutes = require('./routes/chat');
const userRoutes = require('./routes/users');

// Import middleware
const { authenticateToken } = require('./middleware/auth');

// Import socket handlers
const socketHandler = require('./utils/socketHandler');
const { initializeDefaultData } = require('./utils/initializeData');

// Import passport configuration
require('./config/passport');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Connect to MongoDB (Atlas or Local)
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/rtca-chat';
const isAtlas = mongoUri.includes('mongodb+srv://');

console.log(`Connecting to MongoDB ${isAtlas ? 'Atlas' : 'Local'}...`);

mongoose.connect(mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  // Atlas-specific optimizations
  ...(isAtlas && {
    serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
    socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
    maxPoolSize: 10, // Maintain up to 10 socket connections
    retryWrites: true, // Retry a write operation if it fails
    w: 'majority' // Write operations wait for majority confirmation
  })
})
.then(() => {
  console.log(`✅ Connected to MongoDB ${isAtlas ? 'Atlas' : 'Local'}`);
  console.log(`Database: ${mongoose.connection.name}`);
  // Initialize default data after MongoDB connection
  initializeDefaultData();
})
.catch(err => {
  console.error('❌ MongoDB connection error:', err.message);
  if (isAtlas) {
    console.error('💡 Atlas connection tips:');
    console.error('   - Check your connection string format');
    console.error('   - Verify username and password');
    console.error('   - Ensure IP is whitelisted');
    console.error('   - Check network connectivity');
  }
  process.exit(1);
});

// Security middleware
app.use(helmet());

// Rate limiting (more lenient in development)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'development' ? 1000 : 100, // Much higher limit in development
  message: 'Too many requests from this IP, please try again later.',
  skip: (req) => {
    // Skip rate limiting entirely in development
    if (process.env.NODE_ENV === 'development') {
      return true;
    }
    return false;
  }
});
app.use('/api/', limiter);

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests from localhost during development
    const allowedOrigins = [
      process.env.CLIENT_URL || "http://localhost:3000",
      "http://localhost:3000",
      "http://localhost:3001", // In case client runs on different port
      "http://127.0.0.1:3000"
    ];
    
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200 // For legacy browser support
};

app.use(cors(corsOptions));

// Handle preflight requests explicitly
app.options('*', cors(corsOptions));

// Additional CORS headers for problematic requests
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.header('Access-Control-Allow-Credentials', true);
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Passport middleware
app.use(passport.initialize());

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'RTCA Server is running!', status: 'OK' });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/chat', authenticateToken, chatRoutes);
app.use('/api/users', authenticateToken, userRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Handle socket connections
socketHandler(io);

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Something went wrong!', 
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal Server Error' 
  });
});

// Handle 404
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 Client URL: ${process.env.CLIENT_URL || 'http://localhost:3000'}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
});
// restart
