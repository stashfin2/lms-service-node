#!/bin/bash

# =====================================================
# Kafka SSH Tunnel Script
# =====================================================
# This script creates an SSH tunnel to access Kafka
# running on a private EC2 instance
# =====================================================

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
SSH_KEY="certs/stashlogin.pem"
REMOTE_HOST="65.2.168.178"  # Kafka EC2 instance IP
REMOTE_KAFKA_HOST="localhost"  # Kafka host from EC2 perspective
REMOTE_KAFKA_PORT="9092"
LOCAL_PORT="9092"

# Try different possible usernames
USERNAMES=("ec2-user" "ubuntu" "admin" "centos")

echo -e "${YELLOW}=========================================${NC}"
echo -e "${YELLOW}Kafka SSH Tunnel Setup${NC}"
echo -e "${YELLOW}=========================================${NC}"

# Check if SSH key exists
if [ ! -f "$SSH_KEY" ]; then
    echo -e "${RED}Error: SSH key not found at $SSH_KEY${NC}"
    echo -e "${YELLOW}Please ensure stashlogin.pem is in the certs/ directory${NC}"
    exit 1
fi

# Check if tunnel is already running
TUNNEL_PID=$(lsof -ti:$LOCAL_PORT 2>/dev/null || echo "")
if [ -n "$TUNNEL_PID" ]; then
    echo -e "${YELLOW}Tunnel already running on port $LOCAL_PORT (PID: $TUNNEL_PID)${NC}"
    read -p "Kill existing tunnel and restart? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        kill $TUNNEL_PID
        sleep 2
    else
        exit 0
    fi
fi

# Function to try SSH with a username
try_ssh_user() {
    local username=$1
    echo -e "${YELLOW}Trying to connect with username: $username${NC}"
    
    ssh -i "$SSH_KEY" \
        -o StrictHostKeyChecking=no \
        -o ConnectTimeout=10 \
        -o ServerAliveInterval=60 \
        -o ServerAliveCountMax=3 \
        -L ${LOCAL_PORT}:${REMOTE_KAFKA_HOST}:${REMOTE_KAFKA_PORT} \
        -N -f \
        ${username}@${REMOTE_HOST} 2>&1
    
    return $?
}

# Try each username
SUCCESS=false
for username in "${USERNAMES[@]}"; do
    if try_ssh_user "$username"; then
        SUCCESS=true
        echo -e "${GREEN}✓ SSH tunnel established successfully with user: $username${NC}"
        echo -e "${GREEN}✓ Kafka accessible at: localhost:$LOCAL_PORT${NC}"
        break
    fi
done

if [ "$SUCCESS" = false ]; then
    echo -e "${RED}=========================================${NC}"
    echo -e "${RED}Failed to establish SSH tunnel${NC}"
    echo -e "${RED}=========================================${NC}"
    echo -e "${YELLOW}Possible reasons:${NC}"
    echo -e "  1. EC2 instance is in a private VPC (need VPN)"
    echo -e "  2. Security group doesn't allow SSH from your IP"
    echo -e "  3. Wrong SSH key or username"
    echo -e "  4. Instance is stopped or terminated"
    echo -e ""
    echo -e "${YELLOW}Next steps:${NC}"
    echo -e "  1. Connect to your company VPN first"
    echo -e "  2. Ask DevOps for bastion host details"
    echo -e "  3. Use direct Kafka access if on internal network"
    exit 1
fi

echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN}Tunnel is running in background${NC}"
echo -e "${GREEN}=========================================${NC}"
echo -e "To stop the tunnel, run: ${YELLOW}npm run kafka:tunnel:stop${NC}"


