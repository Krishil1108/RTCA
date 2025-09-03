# Render Deployment Guide for Arizta Backend

## 🚀 Quick Setup Steps:

### 1. Render Dashboard Settings:
```
Service Name: arizta-backend
Repository: https://github.com/Krishil1108/RTCA
Branch: main
Root Directory: server
Runtime: Node
Build Command: npm install
Start Command: node server.js
```

### 2. Environment Variables:
Add these in Render dashboard under "Environment":

```
NODE_ENV=production
PORT=10000
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxxx.mongodb.net/rtca-chat?retryWrites=true&w=majority
JWT_SECRET=<generate-strong-random-secret>
GOOGLE_CLIENT_ID=<your-google-oauth-client-id>
GOOGLE_CLIENT_SECRET=<your-google-oauth-client-secret>
CLIENT_URL=https://your-frontend-domain
SESSION_SECRET=<generate-strong-random-session-secret>
```

### 3. Alternative: Deploy from Root
If the above doesn't work, use root deployment:
```
Root Directory: ./
Build Command: npm run render-build
Start Command: npm run render-start
```

## 🔧 Troubleshooting:

### "Service Root Directory is missing":
- Set **Root Directory** to `server` in Render settings
- OR use root deployment with npm scripts

### Build Failures:
1. Check build logs for specific errors
2. Ensure all dependencies are in package.json
3. Verify Node.js version compatibility

### Connection Issues:
1. Update CLIENT_URL to your deployed frontend URL (e.g., Netlify/Render/Custom Domain)
2. Add the Render backend URL to the frontend API configuration
3. Check MongoDB Atlas IP whitelist (add 0.0.0.0/0 for Render or specific egress ranges)

## 📋 Post-Deployment:
1. Update frontend API base URL to point to Render backend
2. Test authentication flow
3. Verify Socket.IO connections
4. Check MongoDB Atlas connectivity
