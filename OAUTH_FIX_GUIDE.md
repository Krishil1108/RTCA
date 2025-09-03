# Google OAuth Configuration Fix Guide

## 🚨 Current Error: redirect_uri_mismatch

The error occurs because Google OAuth redirect URIs are not configured for your production URLs.

## ✅ Fix Steps:

### 1. Update Google Cloud Console

Go to [Google Cloud Console](https://console.cloud.google.com/):

1. **APIs & Services** → **Credentials**
2. **Edit your OAuth 2.0 Client ID**
3. **Add these Authorized redirect URIs**:

```
# Production URLs (ADD THESE)
https://arizta.onrender.com/api/auth/google/callback

# Keep existing localhost URLs for development
http://localhost:5000/api/auth/google/callback
```

### 2. Environment Variables for Render

Update your Render backend environment variables:

```
NODE_ENV=production
CLIENT_URL=https://your-frontend-url.onrender.com
GOOGLE_CLIENT_ID=643573413997-avp1s4kqq3r43k0ancal09s3fs3t2cr5.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
```

### 3. Frontend URLs to Update

When your frontend is deployed, update:

```
# In Render Backend Environment
CLIENT_URL=https://your-actual-frontend-url.onrender.com

# In Google Cloud Console, also add:
https://your-actual-frontend-url.onrender.com/api/auth/google/callback
```

## 🔍 Testing the Fix:

1. Deploy with updated OAuth URIs
2. Test login flow
3. Check browser network tab for redirect URLs
4. Verify CLIENT_URL environment variable matches your frontend

## ⚠️ Important Notes:

- Google OAuth must have EXACT URL matches
- Both HTTP and HTTPS protocols matter
- Subdomains must match exactly
- Ports must match (production uses standard ports)

## 🛠️ Debug Commands:

Test your OAuth config:
```
curl https://arizta.onrender.com/api/auth/config
```

This will show your current configuration.
