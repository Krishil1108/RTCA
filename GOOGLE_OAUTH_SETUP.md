# Google OAuth Setup Guide

To enable Gmail authentication, you need to set up Google OAuth credentials:

## Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API (or Google People API for newer projects)

## Step 2: Create OAuth 2.0 Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth 2.0 Client IDs"
3. Choose "Web application"
4. Add these Authorized redirect URIs:
   - `http://localhost:5000/api/auth/google/callback`
   - `http://localhost:3000/auth/callback` (optional, for direct frontend handling)

### **Increase Rate Limits:**
5. Go to "APIs & Services" > "Library"
6. Enable these APIs if not already enabled:
   - **Google+ API** (or Google People API)
   - **Google Identity and Access Management (IAM) API**
7. Go to "APIs & Services" > "Quotas"
8. Find "Requests per day" and "Requests per 100 seconds per user"
9. Click "Edit Quotas" and request higher limits
10. For development, you can also:
    - Add test users in "OAuth consent screen" > "Test users"
    - This bypasses some rate limits for testing

## Step 3: Configure Environment Variables ✅ COMPLETED

✅ **OAuth credentials have been configured!**

Your credentials from `client_secret_643573413997-avp1s4kqq3r43k0ancal09s3fs3t2cr5.apps.googleusercontent.com.json`:
- **Client ID**: `643573413997-avp1s4kqq3r43k0ancal09s3fs3t2cr5.apps.googleusercontent.com`
- **Client Secret**: `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`

The `.env` file has been updated with your actual credentials.

## Rate Limit Solutions

### **If you're getting "Too many requests" errors:**

#### **Immediate Solutions:**
1. **Wait 15-60 minutes** - Google's rate limits reset automatically
2. **Use Demo Mode** - Click "Try Demo Mode" to test without OAuth
3. **Clear browser cookies** for accounts.google.com
4. **Try incognito/private browsing** mode

#### **Quick Development Workarounds:**
1. **Use different Google accounts** - Each account has separate rate limits
2. **Use different IP addresses** - Try mobile hotspot if available
3. **Clear all Google cookies and try incognito mode**
4. **Add test users in OAuth consent screen** - These have higher limits

#### **Permanent Solutions:**
1. **Set up OAuth Consent Screen properly:**
   - Go to "APIs & Services" > "OAuth consent screen"
   - Choose "External" user type
   - Fill in required fields (App name, User support email, Developer contact)
   - Add your email as a test user

2. **Request quota increases:**
   - Go to "APIs & Services" > "Quotas"
   - Find relevant quotas and request increases
   - Default limits: 100 requests/day for unverified apps

3. **Verify your app:**
   - Complete OAuth consent screen verification
   - This significantly increases rate limits

For development/testing without setting up OAuth, you can use demo mode:

1. Access the application at: http://localhost:3000
2. Click "Demo Mode" to login with a test account
3. This bypasses OAuth and creates a demo user

## Production Setup

For production deployment, make sure to:
- Use HTTPS URLs in redirect URIs
- Set proper CORS origins
- Use secure JWT secrets
- Enable proper MongoDB authentication
