#!/bin/bash

# Quick setup script for PEM file

echo "🔐 Kafka PEM File Setup"
echo "========================"
echo ""

# Check if certs directory exists
if [ ! -d "certs" ]; then
    echo "Creating certs directory..."
    mkdir -p certs
fi

# Check if PEM file already exists
if [ -f "certs/stashlogin.pem" ]; then
    echo "⚠️  PEM file already exists at certs/stashlogin.pem"
    read -p "Overwrite? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Keeping existing file."
        exit 0
    fi
fi

# Prompt for PEM file location
echo "Please provide the path to your Kafka PEM file:"
read -p "PEM file path: " PEM_PATH

if [ ! -f "$PEM_PATH" ]; then
    echo "❌ Error: File not found at $PEM_PATH"
    exit 1
fi

# Copy PEM file
echo "Copying PEM file to certs/stashlogin.pem..."
cp "$PEM_PATH" certs/stashlogin.pem

# Set permissions
echo "Setting permissions (chmod 400)..."
chmod 400 certs/stashlogin.pem

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Update scripts/kafka-tunnel.sh with correct Kafka broker IP (if needed)"
echo "2. Run: npm run kafka:tunnel"
echo "3. Update .env: KAFKA_BOOTSTRAP_SERVERS=localhost:9092"
echo "4. Restart service: npm run dev"
