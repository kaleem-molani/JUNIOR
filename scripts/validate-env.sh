#!/bin/bash

# Environment validation script
set -e

echo "🔍 Validating deployment environment..."

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Function to check environment variable
check_env_var() {
    local var_name=$1
    local var_value=${!var_name}

    if [ -z "$var_value" ]; then
        echo -e "${RED}❌ $var_name is not set${NC}"
        return 1
    else
        echo -e "${GREEN}✅ $var_name is set${NC}"
        return 0
    fi
}

# Load environment variables
echo "📂 Loading environment variables..."
if [ -f ".env.production" ]; then
    export $(cat .env.production | xargs)
    echo "✅ Loaded .env.production"
elif [ -f ".env" ]; then
    export $(cat .env | xargs)
    echo "✅ Loaded .env"
else
    echo -e "${RED}❌ No environment file found${NC}"
    exit 1
fi

echo ""
echo "🔧 Checking required environment variables..."

# Check critical variables
check_env_var "DATABASE_URL"
check_env_var "NEXTAUTH_SECRET"
check_env_var "NEXTAUTH_URL"
check_env_var "NODE_ENV"

echo ""
echo "🗄️ Testing database connection..."

# Test database connection
if command -v psql &> /dev/null; then
    if psql "$DATABASE_URL" -c "SELECT 1;" &> /dev/null; then
        echo -e "${GREEN}✅ Database connection successful${NC}"
    else
        echo -e "${RED}❌ Database connection failed${NC}"
        echo "   Please check your DATABASE_URL"
        exit 1
    fi
else
    echo -e "${YELLOW}⚠️ psql not found, skipping database test${NC}"
fi

echo ""
echo "📦 Testing Prisma..."

# Test Prisma
if npx prisma validate &> /dev/null; then
    echo -e "${GREEN}✅ Prisma schema is valid${NC}"
else
    echo -e "${RED}❌ Prisma schema validation failed${NC}"
    exit 1
fi

if npx prisma generate &> /dev/null; then
    echo -e "${GREEN}✅ Prisma client generated successfully${NC}"
else
    echo -e "${RED}❌ Prisma client generation failed${NC}"
    exit 1
fi

echo ""
echo "🏗️ Testing build..."

# Test build
if npm run build &> /dev/null; then
    echo -e "${GREEN}✅ Application builds successfully${NC}"
else
    echo -e "${RED}❌ Build failed${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}🎉 Environment validation completed successfully!${NC}"
echo "🚀 Ready for deployment"