const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const pinoHttp = require('pino-http');
const rateLimit = require('express-rate-limit');
const passport = require('passport');
require('dotenv').config();
const logger = require('./utils/logger');

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

logger.info({ mongoUri: isAtlas ? 'atlas-cluster' : mongoUri }, `Connecting to MongoDB ${isAtlas ? 'Atlas' : 'Local'}...`);

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
  logger.info({ db: mongoose.connection.name }, `Connected to MongoDB ${isAtlas ? 'Atlas' : 'Local'}`);
  // Initialize default data after MongoDB connection
  initializeDefaultData();
})
.catch(err => {
  logger.error({ err }, 'MongoDB connection error');
  if (isAtlas) {
  logger.warn('Atlas connection tips: Check connection string, credentials, IP whitelist, network connectivity');
  }
  process.exit(1);
});

// Content Security Policy directives
const clientOrigin = process.env.CLIENT_URL || 'http://localhost:3000';
const cspDirectives = {
  defaultSrc: ["'self'"],
  scriptSrc: ["'self'", "'unsafe-inline'"], // consider removing 'unsafe-inline' after migrating inline scripts
  styleSrc: ["'self'", "'unsafe-inline'"],
  imgSrc: ["'self'", 'data:', 'blob:'],
  connectSrc: ["'self'", clientOrigin, 'ws:', 'wss:'],
  fontSrc: ["'self'", 'data:'],
  mediaSrc: ["'self'", 'blob:', 'data:'],
  objectSrc: ["'none'"],
  frameAncestors: ["'self'"],
  upgradeInsecureRequests: []
};

app.use(helmet({
  contentSecurityPolicy: { directives: cspDirectives },
  crossOriginEmbedderPolicy: false,
}));
app.disable('x-powered-by');

// Trust proxy (needed for correct IP when behind Render/NGINX)
app.set('trust proxy', 1);

// HTTP logging
app.use(pinoHttp({ logger }));

// Enhanced Rate limiting with better configuration
const createRateLimiter = (windowMs, max, message) => rateLimit({
  windowMs,
  max,
  message: { error: message, retryAfter: Math.ceil(windowMs / 1000) },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  skip: (req) => {
    // Skip rate limiting entirely in development
    if (process.env.NODE_ENV === 'development') {
      return true;
    }
    // Skip for health checks
    if (req.path === '/api/health') {
      return true;
    }
    return false;
  },
  handler: (req, res) => {
  logger.warn({ ip: req.ip, path: req.path }, 'Rate limit exceeded');
    res.status(429).json({
      error: message,
      retryAfter: Math.ceil(windowMs / 1000),
      timestamp: new Date().toISOString()
    });
  }
});

// Different rate limits for different endpoints
const generalLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  process.env.NODE_ENV === 'production' ? 200 : 2000, // Higher limit
  'Too many requests from this IP, please try again later.'
);

const authLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  process.env.NODE_ENV === 'production' ? 50 : 500, // Auth endpoints
  'Too many authentication attempts, please try again later.'
);

const strictLimiter = createRateLimiter(
  1 * 60 * 1000, // 1 minute
  process.env.NODE_ENV === 'production' ? 10 : 100, // Very strict
  'Too many requests, please slow down.'
);

// Apply rate limiters
app.use('/api/', generalLimiter);
app.use('/api/auth/google', strictLimiter); // Strict limit for OAuth
app.use('/api/auth/', authLimiter);

// CORS configuration
const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:3000',
  'http://localhost:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3000'
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

app.options('*', cors());

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Passport middleware
app.use(passport.initialize());

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'RTCA Server is running!', status: 'OK' });
});

app.use('/api/auth', authRoutes);
app.use('/api/chat', authenticateToken, chatRoutes);
app.use('/api/users', authenticateToken, userRoutes);

// Single health endpoint (already defined above '/')
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', uptime: process.uptime(), timestamp: new Date().toISOString() });
});

// Handle socket connections
socketHandler(io);

// Global error handler
app.use((err, req, res, next) => {
  logger.error({ err }, 'Unhandled error');
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

// Graceful shutdown
const startServer = () => {
  server.listen(PORT, '0.0.0.0', () => {
  logger.info({ port: PORT, client: process.env.CLIENT_URL, env: process.env.NODE_ENV }, 'Server started');
  });
};

const shutdown = (signal) => {
  logger.info({ signal }, 'Received shutdown signal');
  server.close(() => {
  logger.info('HTTP server closed');
    mongoose.connection.close(false, () => {
  logger.info('MongoDB connection closed');
      process.exit(0);
    });
  });
  // Force exit after timeout
  setTimeout(() => process.exit(1), 10000).unref();
};

['SIGINT', 'SIGTERM'].forEach(sig => process.on(sig, () => shutdown(sig)));

startServer();
