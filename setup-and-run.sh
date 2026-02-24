#!/bin/bash

set -e

echo "🚀 Starting Amber Setup..."
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if docker-compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ docker-compose is not installed. Please install it first."
    exit 1
fi

echo "📦 Step 1: Starting PostgreSQL database..."
docker-compose up -d postgres

echo "⏳ Waiting for database to be ready..."
sleep 5

# Try to connect and see if DB is ready
for i in {1..30}; do
    if docker-compose exec -T postgres pg_isready -U postgres > /dev/null 2>&1; then
        echo "✅ Database is ready!"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "❌ Database failed to start"
        exit 1
    fi
    echo "⏳ Waiting... ($i/30)"
    sleep 2
done

echo ""
echo "🔄 Step 2: Running database migrations..."
cd Apps/server
npx prisma migrate deploy

echo ""
echo "🏗️  Step 3: Building server..."
npm run build

echo ""
echo "✅ Setup complete! Starting server..."
echo ""
npm start
