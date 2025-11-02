@echo off
echo Starting scheduled token refresh service...
echo This service will run token refresh jobs twice daily at 6:00 AM and 6:00 PM IST
echo Press Ctrl+C to stop the service
echo.
npm run scheduled-token-refresh
echo Scheduled token refresh service stopped.
pause