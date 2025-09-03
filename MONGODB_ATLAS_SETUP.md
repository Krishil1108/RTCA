# MongoDB Atlas Migration Guide

## Step 1: Create MongoDB Atlas Account

1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Sign up for a free account
3. Create a new project called "RTCA"

## Step 2: Create a Cluster

1. Click "Build a Database"
2. Choose "M0 Sandbox" (Free tier)
3. Select your preferred cloud provider and region
4. Name your cluster (e.g., "rtca-cluster")
5. Click "Create Cluster"

## Step 3: Set Up Database Access

1. Go to "Database Access" in the left sidebar
2. Click "Add New Database User"
3. Choose "Password" authentication
4. Create a username and strong password
5. Set privileges to "Read and write to any database"
6. Click "Add User"

## Step 4: Set Up Network Access

1. Go to "Network Access" in the left sidebar
2. Click "Add IP Address"
3. For development: Click "Allow Access from Anywhere" (0.0.0.0/0)
4. For production: Add your server's specific IP address
5. Click "Confirm"

## Step 5: Get Connection String

1. Go to "Database" in the left sidebar
2. Click "Connect" on your cluster
3. Choose "Connect your application"
4. Select "Node.js" as driver and latest version
5. Copy the connection string

## Step 6: Update Environment Variables

Replace the MONGODB_URI in your `.env` file with your Atlas connection string:

```
MONGODB_URI=mongodb+srv://<username>:<password>@rtca-cluster.xxxxx.mongodb.net/rtca-chat?retryWrites=true&w=majority
```

**Important**: 
- Replace `<username>` with your database username
- Replace `<password>` with your database password
- Replace `rtca-cluster.xxxxx` with your actual cluster name
- Keep `rtca-chat` as the database name

## Step 7: Security Best Practices

1. **Environment Variables**: Never commit your `.env` file to git
2. **Strong Passwords**: Use a strong password for your database user
3. **IP Whitelisting**: In production, only whitelist specific IP addresses
4. **Separate Environments**: Use different clusters for development and production

## Step 8: Test the Connection

1. Stop your current server if running
2. Update your `.env` file with the Atlas connection string
3. Restart your server with `npm start`
4. Check the console for "Connected to MongoDB" message

## Step 9: Data Migration (if needed)

If you have existing data in your local MongoDB:

1. **Export from local MongoDB**:
   ```bash
   mongodump --db rtca-chat --out ./backup
   ```

2. **Import to Atlas**:
   ```bash
   mongorestore --uri "mongodb+srv://<username>:<password>@rtca-cluster.xxxxx.mongodb.net/rtca-chat" ./backup/rtca-chat
   ```

## Troubleshooting

- **Connection Issues**: Check your IP whitelist and credentials
- **Authentication Failed**: Verify username and password
- **Network Timeout**: Ensure your firewall allows outbound connections on port 27017
- **SSL Issues**: MongoDB Atlas requires SSL connections (already handled in the connection string)

## Production Considerations

1. **Monitoring**: Enable Atlas monitoring and alerts
2. **Backups**: Configure automated backups
3. **Performance**: Monitor slow queries and create indexes as needed
4. **Scaling**: Plan for cluster scaling as your app grows
