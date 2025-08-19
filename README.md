# Real-Time Chat Application (RTCA)

A modern real-time chat application with Gmail OAuth authentication, built with React, Node.js, Express, and Socket.IO.

## Features

- 🔐 Gmail OAuth Authentication
- 💬 Real-time messaging with Socket.IO
- 🎨 Dynamic responsive UI
- 👥 User presence indicators
- 📱 Mobile-friendly design
- 🌙 Dark/Light theme support
- 💾 Message persistence with MongoDB

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

### MongoDB Setup
- Local: Install MongoDB and run on default port (27017)
- Cloud: Create MongoDB Atlas cluster and get connection string

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
