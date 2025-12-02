#!/bin/bash

# Fix Kafka hostname resolution issue
# This script adds the Kafka broker's internal hostname to /etc/hosts

HOSTNAME="ip-172-31-35-138.ap-south-1.compute.internal"
HOSTS_FILE="/etc/hosts"

echo "🔧 Fixing Kafka Hostname Resolution"
echo "===================================="
echo ""
echo "Issue: Kafka broker advertises itself as: $HOSTNAME"
echo "This hostname doesn't resolve on your local machine"
echo ""
echo "Solution: Map $HOSTNAME to localhost in /etc/hosts"
echo ""

# Check if already exists
if grep -q "$HOSTNAME" "$HOSTS_FILE" 2>/dev/null; then
    echo "✅ Hostname already mapped in /etc/hosts"
    grep "$HOSTNAME" "$HOSTS_FILE"
    exit 0
fi

# Add the mapping
echo "Adding mapping: 127.0.0.1 -> $HOSTNAME"
echo ""
echo "You'll be prompted for your password to edit /etc/hosts:"
echo ""

sudo sh -c "echo '127.0.0.1\t$HOSTNAME' >> $HOSTS_FILE"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Successfully added hostname mapping!"
    echo ""
    echo "Verification:"
    grep "$HOSTNAME" "$HOSTS_FILE"
    echo ""
    echo "Now restart your service: npm run dev"
else
    echo ""
    echo "❌ Failed to add hostname mapping"
    echo "Please run manually:"
    echo "  sudo sh -c \"echo '127.0.0.1\t$HOSTNAME' >> /etc/hosts\""
fi

