# Server Verification Guide

## Backend Server (Port 5000)

### Start the Backend:
```bash
cd server
npm run dev
```

### Expected Output:
- ✅ Database connection established successfully
- ✅ Database synchronized
- 🚀 Diamond Bidding System API running on port 5000
- 🔄 WebSocket enabled for real-time bidding

### Test Backend:
```bash
curl http://localhost:5000/health
```

Expected response:
```json
{
  "status": "OK",
  "message": "Diamond Bidding System API is running",
  "timestamp": "..."
}
```

## Frontend Server (Port 3001 or 5173)

### Start the Frontend:
```bash
cd client
npm run dev
```

### Expected Output:
- Vite dev server running
- Local URL: http://localhost:5173 (or similar)

## Testing Live Bidding Activity

### Steps to Test:

1. **Start Backend Server** (Terminal 1):
   ```bash
   cd server
   npm run dev
   ```

2. **Start Frontend Server** (Terminal 2):
   ```bash
   cd client
   npm run dev
   ```

3. **Login as Admin**:
   - Open http://localhost:5173 (or the port shown)
   - Login with admin credentials
   - Navigate to Admin Dashboard

4. **Login as User** (Different browser/incognito):
   - Open http://localhost:5173
   - Login with user credentials
   - Navigate to Bidding Interface

5. **Test Real-time Updates**:
   - As User: Place a bid or update an existing bid
   - As Admin: Watch the "Live Bidding Activity" section update in real-time
   - You should see:
     - User name and ID
     - Diamond name and ID
     - Bid amount
     - Timestamp (date and time)
     - Connection status indicator (should show "Live" with green dot)

### What to Check:

✅ **Backend:**
- Server starts without errors
- WebSocket server initializes
- Database connection works
- Health endpoint responds

✅ **Frontend:**
- Dev server starts
- No compilation errors
- Admin Dashboard loads
- WebSocket connection indicator shows status
- Live Bidding Activity section is visible

✅ **Real-time Updates:**
- When user places bid → Admin sees it immediately
- When user updates bid → Admin sees update immediately
- Timestamp updates correctly
- Connection status shows "Live" when connected

## Troubleshooting

### Backend Issues:
- **Database connection error**: Check PostgreSQL is running
- **Port 5000 already in use**: Change PORT in .env or kill process using port 5000
- **WebSocket not initializing**: Check socket.io is installed

### Frontend Issues:
- **WebSocket connection error**: Check backend is running and CORS is configured
- **No live updates**: Check browser console for WebSocket errors
- **Token issues**: Make sure you're logged in as admin

### Common Fixes:
1. Clear browser cache and localStorage
2. Restart both servers
3. Check browser console for errors
4. Verify environment variables if using .env files
