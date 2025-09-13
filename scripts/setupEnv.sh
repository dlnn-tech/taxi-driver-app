#!/bin/bash

echo "=== ENVIRONMENT SETUP ==="
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "Creating .env file from .env.example..."
    cp .env.example .env
    echo "✓ .env file created"
else
    echo "✓ .env file exists"
fi

# Backup current .env
cp .env .env.backup
echo "✓ Backup created: .env.backup"

# Update NODE_ENV to development
if grep -q "NODE_ENV=" .env; then
    sed -i 's/NODE_ENV=.*/NODE_ENV=development/' .env
    echo "✓ Updated NODE_ENV to development"
else
    echo "NODE_ENV=development" >> .env
    echo "✓ Added NODE_ENV=development"
fi

# Show current environment
echo ""
echo "Current environment settings:"
grep -E "NODE_ENV|DB_|JWT_SECRET" .env | sed 's/PASSWORD=.*/PASSWORD=***hidden***/'

echo ""
echo "=== SETUP COMPLETE ==="
echo ""
echo "Next steps:"
echo "1. Run migration: node scripts/migrate.js"
echo "2. Restart app: pm2 restart taxi-driver-app"