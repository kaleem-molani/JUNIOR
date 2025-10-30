@echo off
echo 🚀 Starting JUNIOR Trading App in SANDBOX MODE...
echo.
echo Environment: SANDBOX
echo Database: trading_app_sandbox
echo Port: 4001
echo Mock Broker: ENABLED
echo.
echo Press Ctrl+C to stop the server
echo.

set SANDBOX_MODE=true
set MOCK_BROKER_API=true
set ENABLE_PERFORMANCE_LOGGING=true
set LOG_LEVEL=debug

npm run dev