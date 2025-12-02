#!/bin/bash

# =====================================================
# Stop Kafka SSH Tunnel
# =====================================================

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

LOCAL_PORT="9092"

echo -e "${YELLOW}Stopping Kafka SSH tunnel...${NC}"

TUNNEL_PID=$(lsof -ti:$LOCAL_PORT 2>/dev/null || echo "")

if [ -z "$TUNNEL_PID" ]; then
    echo -e "${YELLOW}No tunnel running on port $LOCAL_PORT${NC}"
    exit 0
fi

kill $TUNNEL_PID
echo -e "${GREEN}✓ Tunnel stopped (PID: $TUNNEL_PID)${NC}"


