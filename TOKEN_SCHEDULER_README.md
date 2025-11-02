# Token Refresh Scheduler

The application includes an automated token refresh scheduler that ensures trading account authentication tokens remain valid.

## Features

- **Automated Scheduling**: Runs twice daily at 6:00 AM and 6:00 PM IST
- **Smart Refresh**: Only refreshes tokens that are expired or will expire within 30 minutes
- **Server Integration**: Runs as part of the Next.js server process
- **Admin Monitoring**: View scheduler status and manually trigger refreshes via admin panel

## How It Works

1. **Server Startup**: The scheduler starts automatically when the Next.js server starts
2. **Scheduled Runs**: Executes at 6:00 AM and 6:00 PM IST daily
3. **Token Check**: Identifies accounts with tokens expiring soon
4. **Refresh Process**: Calls AngelOne API to refresh tokens for identified accounts
5. **Database Update**: Saves new tokens to the database
6. **Logging**: Comprehensive logging for monitoring and debugging

## Admin Panel

Admins can monitor and control the scheduler through the admin panel:

- **Status View**: See if scheduler is running and next execution times
- **Manual Refresh**: Trigger immediate token refresh for all accounts
- **Schedule Info**: View current schedule and timezone settings

## API Endpoints

- `GET /api/scheduler/status` - Get scheduler status
- `POST /api/scheduler/refresh` - Trigger manual token refresh (admin only)

## Configuration

The scheduler is configured in `lib/scheduled-token-refresh.ts`:

- **Schedule**: `"0 6,18 * * *"` (6:00 AM and 6:00 PM daily)
- **Timezone**: Asia/Kolkata (IST)
- **Buffer Time**: 30 minutes before expiry

## Files

- `lib/scheduled-token-refresh.ts` - Main scheduler service
- `instrumentation.ts` - Server startup integration
- `app/api/scheduler/` - API endpoints for monitoring and control
- `lib/brokers/token-manager.ts` - Token refresh logic