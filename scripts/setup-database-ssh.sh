#!/bin/bash

# =====================================================
# Database Setup Script via SSH
# =====================================================
# This script connects to the database server via SSH
# and creates all necessary Kafka tracking tables
# =====================================================

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SSH_KEY="certs/stashlogin.pem"
DB_SERVER="65.2.168.178"
DB_USER="ec2-user"
SQL_FILE="src/database/migrations/create_kafka_tables.sql"
REMOTE_SQL_FILE="/tmp/create_kafka_tables.sql"

# Database credentials from .env
source .env 2>/dev/null || {
    echo -e "${RED}Error: .env file not found${NC}"
    echo -e "${YELLOW}Please create .env file first. See .env.complete for reference.${NC}"
    exit 1
}

echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE}Database Setup via SSH${NC}"
echo -e "${BLUE}=========================================${NC}"
echo ""

# Check if SSH key exists
if [ ! -f "$SSH_KEY" ]; then
    echo -e "${RED}Error: SSH key not found at $SSH_KEY${NC}"
    echo -e "${YELLOW}Please ensure stashlogin.pem is in the certs/ directory${NC}"
    exit 1
fi

# Check if SQL file exists
if [ ! -f "$SQL_FILE" ]; then
    echo -e "${RED}Error: SQL migration file not found at $SQL_FILE${NC}"
    exit 1
fi

echo -e "${YELLOW}Step 1: Testing SSH connection...${NC}"
if ssh -i "$SSH_KEY" -o ConnectTimeout=10 -o StrictHostKeyChecking=no "$DB_USER@$DB_SERVER" "echo 'SSH connection successful'" 2>&1 | grep -q "successful"; then
    echo -e "${GREEN}✓ SSH connection successful${NC}"
else
    echo -e "${RED}✗ SSH connection failed${NC}"
    echo -e "${YELLOW}Please check:${NC}"
    echo -e "  1. SSH key is correct"
    echo -e "  2. Server is accessible (VPN required?)"
    echo -e "  3. Firewall allows SSH connections"
    exit 1
fi
echo ""

echo -e "${YELLOW}Step 2: Copying SQL migration file to server...${NC}"
scp -i "$SSH_KEY" -o StrictHostKeyChecking=no "$SQL_FILE" "$DB_USER@$DB_SERVER:$REMOTE_SQL_FILE" 2>&1
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ SQL file copied successfully${NC}"
else
    echo -e "${RED}✗ Failed to copy SQL file${NC}"
    exit 1
fi
echo ""

echo -e "${YELLOW}Step 3: Executing SQL migration on database...${NC}"
echo -e "${BLUE}Database: $DB_HOST${NC}"
echo -e "${BLUE}Schema: $DB_NAME${NC}"
echo -e "${BLUE}User: $DB_USER${NC}"
echo ""

# Create a temporary script to run on the server
cat > /tmp/run-migration.sh << EOF
#!/bin/bash
mysql -h ${DB_HOST} \\
  -P ${DB_PORT} \\
  -u ${DB_USER} \\
  -p${DB_PASSWORD} \\
  ${DB_NAME} < ${REMOTE_SQL_FILE} 2>&1

if [ \$? -eq 0 ]; then
    echo "✓ Migration executed successfully"
    echo ""
    echo "Verifying tables..."
    mysql -h ${DB_HOST} \\
      -P ${DB_PORT} \\
      -u ${DB_USER} \\
      -p${DB_PASSWORD} \\
      ${DB_NAME} \\
      -e "SHOW TABLES LIKE 'kafka_%';" 2>&1
else
    echo "✗ Migration failed"
    exit 1
fi
EOF

# Copy and execute the script on the server
scp -i "$SSH_KEY" -o StrictHostKeyChecking=no /tmp/run-migration.sh "$DB_USER@$DB_SERVER:/tmp/run-migration.sh" 2>&1
ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$DB_USER@$DB_SERVER" "bash /tmp/run-migration.sh" 2>&1

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}=========================================${NC}"
    echo -e "${GREEN}✓ Database setup completed successfully!${NC}"
    echo -e "${GREEN}=========================================${NC}"
    echo ""
    echo -e "${YELLOW}Next steps:${NC}"
    echo -e "  1. Verify .env configuration: ${BLUE}cat .env${NC}"
    echo -e "  2. Build the project: ${BLUE}npm run build${NC}"
    echo -e "  3. Connect to VPN (for Kafka access)"
    echo -e "  4. Start the application: ${BLUE}npm run dev${NC}"
    echo ""
else
    echo ""
    echo -e "${RED}=========================================${NC}"
    echo -e "${RED}✗ Database setup failed${NC}"
    echo -e "${RED}=========================================${NC}"
    echo ""
    echo -e "${YELLOW}Possible reasons:${NC}"
    echo -e "  1. Database user lacks CREATE TABLE permission"
    echo -e "  2. Database host is not accessible from server"
    echo -e "  3. Invalid database credentials"
    echo ""
    echo -e "${YELLOW}Try manually:${NC}"
    echo -e "  ${BLUE}ssh -i $SSH_KEY $DB_USER@$DB_SERVER${NC}"
    echo -e "  ${BLUE}mysql -h $DB_HOST -u $DB_USER -p $DB_NAME < $REMOTE_SQL_FILE${NC}"
    exit 1
fi

# Cleanup
rm -f /tmp/run-migration.sh


