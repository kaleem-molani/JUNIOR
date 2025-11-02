#!/bin/bash

echo "🔍 Server Setup Verification"
echo "============================="

# Check Node.js version
echo "Node.js version:"
node --version || echo "❌ Node.js not installed"

# Check npm version
echo "npm version:"
npm --version || echo "❌ npm not installed"

# Check if trading-app directory exists
echo "Application directory:"
if [ -d "/home/ubuntu/trading-app" ]; then
    echo "✅ /home/ubuntu/trading-app exists"
    cd /home/ubuntu/trading-app

    # Check if it's a git repository
    if [ -d ".git" ]; then
        echo "✅ Git repository initialized"
        echo "Current branch: $(git branch --show-current)"
        echo "Latest commit: $(git log -1 --oneline)"
    else
        echo "❌ Not a git repository"
    fi

    # Check package.json
    if [ -f "package.json" ]; then
        echo "✅ package.json exists"
    else
        echo "❌ package.json missing"
    fi

else
    echo "❌ /home/ubuntu/trading-app does not exist"
fi

# Check PM2
echo "PM2 status:"
pm2 list || echo "❌ PM2 not installed or not running"

echo "============================="
echo "Setup verification complete"