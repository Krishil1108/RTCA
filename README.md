# Arizta - Modern Real-Time Chat Application

[![GitHub Repository](https://img.shields.io/badge/GitHub-Arizta-blue?style=flat-square&logo=github)](https://github.com/Krishil1108/RTCA)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green?style=flat-square&logo=node.js)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18-blue?style=flat-square&logo=react)](https://reactjs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Database-green?style=flat-square&logo=mongodb)](https://mongodb.com/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-Real--time-orange?style=flat-square&logo=socket.io)](https://socket.io/)

**Arizta** is a cutting-edge real-time chat application built with Node.js, Express, Socket.IO, React, and MongoDB. Experience seamless communication with Gmail authentication, glassmorphism UI design, and advanced messaging features.

## Features

- 🔐 Gmail OAuth Authentication
- 💬 Real-time messaging with Socket.IO
- 🎨 Glassmorphism UI with modern design
- 👥 User presence indicators
- 📱 Mobile-friendly responsive design
- 🌙 Dark/Light theme support with smooth transitions
- 💾 Message persistence with MongoDB
- ✨ Advanced message interactions (reply, edit, delete)
- 🚀 Performance optimized with Material-UI

## Tech Stack

### Frontend
- React 18
- Material-UI (MUI)
- Socket.IO Client
- Axios

### Backend
- Node.js
- Express.js
- Socket.IO
- MongoDB with Mongoose
- Google OAuth 2.0
- JWT Authentication

## Quick Start

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or Atlas)
- Google OAuth credentials

### Installation

1. Clone and install dependencies:
```bash
npm run install-all
```

2. Set up environment variables:
   - Copy `.env.example` to `.env` in the server directory
   - Fill in your Google OAuth and MongoDB credentials

3. Start the development servers:
```bash
npm run dev
```

The client will run on `http://localhost:3000` and the server on `http://localhost:5000`.

## Configuration

### Google OAuth Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Gmail API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - `http://localhost:5000/auth/google/callback`

### Database Setup

#### Option 1: MongoDB Atlas (Recommended for Production)
1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a new cluster
3. Set up database user and network access
4. Get your connection string
5. Update `MONGODB_URI` in `.env`:
   ```
   MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/rtca-chat?retryWrites=true&w=majority
   ```

#### Option 2: Local MongoDB
- Install MongoDB and run on default port (27017)
- Use: `MONGODB_URI=mongodb://localhost:27017/rtca-chat`

#### Test Your Connection
```bash
cd server
npm run test-connection
```

For detailed Atlas setup, see [MONGODB_ATLAS_SETUP.md](MONGODB_ATLAS_SETUP.md)

## Project Structure

```
rtca-chat-app/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── context/        # Context providers
│   │   ├── hooks/          # Custom hooks
│   │   ├── services/       # API services
│   │   └── utils/          # Utility functions
│   └── public/
├── server/                 # Node.js backend
│   ├── controllers/        # Route controllers
│   ├── middleware/         # Custom middleware
│   ├── models/             # MongoDB models
│   ├── routes/             # API routes
│   ├── config/             # Configuration files
│   └── utils/              # Utility functions
└── docs/                   # Documentation
```

## Usage

1. Open the application in your browser
2. Click "Sign in with Gmail"
3. Authorize the application
4. Start chatting in real-time!

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - see LICENSE file for details.
