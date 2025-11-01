@echo off
echo 🔧 Setting up JUNIOR Sandbox Database...
echo.
echo This will create the trading_app_sandbox database and set up the schema.
echo.
echo Press any key to continue or Ctrl+C to cancel...
pause > nul

node scripts/setup-sandbox-db.js

echo.
echo Setup complete! You can now run start-sandbox.bat to start the application.
pause