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
MONGODB_URI=mongodb+srv://shahkrishil1108:Krishil%401108@cluster0.wmqwufd.mongodb.net/rtca-chat?retryWrites=true&w=majority
JWT_SECRET=production-jwt-secret-key-change-this
GOOGLE_CLIENT_ID=643573413997-avp1s4kqq3r43k0ancal09s3fs3t2cr5.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
CLIENT_URL=https://your-vercel-app.vercel.app
SESSION_SECRET=production-session-secret-key
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
1. Update CLIENT_URL to your Vercel frontend URL
2. Add Render backend URL to frontend API configuration
3. Check MongoDB Atlas IP whitelist (add 0.0.0.0/0 for Render)

## 📋 Post-Deployment:
1. Update frontend API base URL to point to Render backend
2. Test authentication flow
3. Verify Socket.IO connections
4. Check MongoDB Atlas connectivity
