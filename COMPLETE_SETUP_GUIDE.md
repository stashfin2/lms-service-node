.# 🚀 Complete Setup Guide - LMS Service Node

This guide will help you set up and run the LMS Service on your local machine from scratch.

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Installation](#installation)
3. [Environment Configuration](#environment-configuration)
4. [Kafka Setup](#kafka-setup)
5. [Running the Service](#running-the-service)
6. [Testing](#testing)
7. [Troubleshooting](#troubleshooting)

---

## 📦 Prerequisites

Before you begin, ensure you have:

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **npm** (comes with Node.js)
- **Git** - [Download](https://git-scm.com/)
- **SSH Access** - PEM file for Kafka EC2 instance (`stashlogin.pem`)
- **Terminal Access** - macOS Terminal, Linux bash, or Windows WSL/Git Bash

### Verify Prerequisites

```bash
node --version    # Should be v18 or higher
npm --version     # Should be 9.x or higher
git --version     # Any recent version
```

---

## 🔧 Installation

### Step 1: Clone the Repository

```bash
git clone <repository-url>
cd lms-service-node
```

### Step 2: Install Dependencies

```bash
npm install
```

This will install all required packages including:
- Express.js (web framework)
- KafkaJS (Kafka client)
- MySQL2 (database driver)
- TypeScript and development tools

### Step 3: Verify Installation

```bash
npm run build
```

If successful, you should see a `dist/` directory created with compiled JavaScript files.

---

## ⚙️ Environment Configuration

### Step 1: Create `.env` File

Create a `.env` file in the project root directory:

```bash
touch .env
```

### Step 2: Copy Complete Configuration

Copy the following **complete configuration** into your `.env` file:

```bash
# =====================================================
# LMS Service Node - Complete Environment Configuration
# =====================================================
# Copy this entire content to your .env file
# =====================================================

# =====================================================
# Application Configuration
# =====================================================
NODE_ENV=staging
PORT=3000
LOG_LEVEL=info

# =====================================================
# Database Configuration (MySQL 8 - Staging)
# =====================================================
DB_HOST=devdb-ujwy3me96v.stashfin.com
DB_PORT=3306
DB_NAME=lms_wrapper
DB_USER=lms_wrapper_rw
DB_PASSWORD=lms_wrapper_User789

# =====================================================
# Kafka Configuration
# =====================================================
# IMPORTANT: Use localhost:9092 when using SSH tunnel (see Kafka Setup section)
KAFKA_BOOTSTRAP_SERVERS=localhost:9092
KAFKA_CLIENT_ID=lms-service
KAFKA_GROUP_ID=lms-service-consumer-group

# =====================================================
# Kafka Connection & Retry Settings
# =====================================================
KAFKA_CONNECTION_TIMEOUT=10000
KAFKA_REQUEST_TIMEOUT=30000
KAFKA_RETRIES=5
KAFKA_INITIAL_RETRY_TIME=300
KAFKA_MAX_RETRY_TIME=30000

# =====================================================
# Kafka Security Configuration
# =====================================================
KAFKA_SSL_ENABLED=false

# =====================================================
# Optional: Suppress KafkaJS Warnings
# =====================================================
# Uncomment to silence partitioner warning:
# KAFKAJS_NO_PARTITIONER_WARNING=1
```

### Step 3: Verify Configuration

```bash
# Check that .env file exists and has content
cat .env | grep -E "^[A-Z]" | head -5
```

You should see your environment variables listed.

---

## 🔐 Kafka Setup

Kafka is running on a private EC2 instance. To connect from your local machine, you need to set up an SSH tunnel.

### Step 1: Place PEM File

1. **Locate your PEM file** (`stashlogin.pem` or similar)
2. **Create certs directory** (if it doesn't exist):
   ```bash
   mkdir -p certs
   ```
3. **Copy PEM file to certs directory**:
   ```bash
   cp /path/to/your/stashlogin.pem certs/stashlogin.pem
   ```
   Or if it's in Downloads:
   ```bash
   cp ~/Downloads/stashlogin*.pem certs/stashlogin.pem
   ```
4. **Set proper permissions** (REQUIRED for SSH):
   ```bash
   chmod 400 certs/stashlogin.pem
   ```
5. **Verify**:
   ```bash
   ls -la certs/stashlogin.pem
   ```
   Should show: `-r--------` (read-only for owner)

### Step 2: Start SSH Tunnel

The tunnel script is already configured. Simply run:

```bash
npm run kafka:tunnel
```

**What this does:**
- Creates SSH tunnel: `localhost:9092` → `65.2.168.178:9092`
- Runs in background
- Allows your app to connect to Kafka via `localhost:9092`

**Expected output:**
```
=========================================
Kafka SSH Tunnel Setup
=========================================
Trying to connect with username: ec2-user
✓ SSH tunnel established successfully with user: ec2-user
✓ Kafka accessible at: localhost:9092
=========================================
Tunnel is running in background
=========================================
```

**If tunnel fails:**
- Ensure you're connected to company VPN (if required)
- Verify PEM file permissions: `chmod 400 certs/stashlogin.pem`
- Check if EC2 instance is accessible from your network

### Step 3: Fix Hostname Resolution

Kafka returns its internal EC2 hostname which doesn't resolve on your Mac. You need to map it to localhost.

**Add hostname to `/etc/hosts`:**

**Option A: Run the script** (easiest)
```bash
./fix-kafka-hostname.sh
```
(You'll be prompted for your password)

**Option B: Manual command**
```bash
sudo sh -c "echo '127.0.0.1\tip-172-31-35-138.ap-south-1.compute.internal' >> /etc/hosts"
```

**Option C: Manual edit**
```bash
sudo nano /etc/hosts
# Add this line at the end:
127.0.0.1	ip-172-31-35-138.ap-south-1.compute.internal
# Save: Ctrl+X, then Y, then Enter
```

**Verify it was added:**
```bash
grep "ip-172-31-35-138" /etc/hosts
```

Should show:
```
127.0.0.1	ip-172-31-35-138.ap-south-1.compute.internal
```

**Why this is needed:**
- Kafka advertises itself as `ip-172-31-35-138.ap-south-1.compute.internal:9092`
- Your Mac can't resolve this hostname
- Mapping it to `127.0.0.1` makes it resolve to `localhost`
- Connections go through your SSH tunnel ✅

### Step 4: Verify Kafka Connection

**Check if tunnel is running:**
```bash
lsof -i:9092
```

Should show an `ssh` process listening on port 9092.

**Test connection:**
```bash
nc -zv localhost 9092
```

Should show: `Connection to localhost port 9092 [tcp/XmlIpcRegSvc] succeeded!`

---

## 🚀 Running the Service

### Start the Service

```bash
npm run dev
```

**Expected output:**
```
[INFO] ts-node-dev ver. 2.0.0
[INFO] Directory database connector initialized (MySQL)
[INFO] Initializing LMS Service { port: 3000, env: 'staging' }
[INFO] Initializing Kafka infrastructure
[INFO] Creating Kafka client { brokers: [ 'localhost:9092' ], clientId: 'lms-service' }
[INFO] Creating new producer { topic: 'lms.loan.application.created' }
... (more producers)
[INFO] Connecting all producers { count: 17 }
🚀 LMS Service running on port 3000
📊 Environment: staging
📨 Kafka Integration: ENABLED
```

**✅ Success indicators:**
- No connection timeout errors
- No `ENOTFOUND` errors
- Service listening on port 3000
- All 17 Kafka producers connected

**❌ If you see errors:**
- See [Troubleshooting](#troubleshooting) section below

### Stop the Service

Press `Ctrl+C` in the terminal where the service is running.

### Stop Kafka Tunnel (When Done)

```bash
npm run kafka:tunnel:stop
```

---

## 🧪 Testing

### Health Check

```bash
curl http://localhost:3000/api/health
```

**Expected response:**
```json
{
  "status": "ok",
  "service": "lms-service",
  "timestamp": "2025-12-02T18:30:00.000Z"
}
```

### Kafka Health Check

```bash
curl http://localhost:3000/api/health/kafka
```

**Expected response:**
```json
{
  "status": "healthy",
  "kafka": {
    "producers": { "initialized": true },
    "consumers": { "initialized": true }
  },
  "timestamp": "2025-12-02T18:30:00.000Z"
}
```

### Test Create Client API

**Using curl:**
```bash
curl -X POST http://localhost:3000/api/v1/lms/customers \
  -H "Content-Type: application/json" \
  -H "x-correlation-id: test-123" \
  -d '{
    "customerId": "CUST-001",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "phone": "+919876543210",
    "dateOfBirth": "1990-01-15",
    "address": {
      "street": "123 Main Street",
      "city": "Mumbai",
      "state": "Maharashtra",
      "pincode": "400001",
      "country": "India"
    }
  }'
```

**Using the test script:**
```bash
./test-create-client.sh
```

**Expected response:**
```json
{
  "success": true,
  "data": {
    "customerId": "CUST-001",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "status": "ACTIVE",
    "message": "Customer created successfully"
  }
}
```

---

## 🔧 Troubleshooting

### Issue: "SSH key not found"

**Solution:**
```bash
# Ensure PEM file exists
ls -la certs/stashlogin.pem

# If missing, copy it:
cp ~/Downloads/stashlogin*.pem certs/stashlogin.pem
chmod 400 certs/stashlogin.pem
```

### Issue: "Permission denied (publickey)"

**Solution:**
```bash
chmod 400 certs/stashlogin.pem
```

### Issue: "Connection timeout" when starting tunnel

**Possible causes:**
1. **Need VPN** - Connect to company VPN first
2. **Security Group** - EC2 security group may not allow SSH from your IP
3. **Wrong IP** - Verify Kafka broker IP address

**Solution:**
- Connect to VPN (if required)
- Contact DevOps for security group access
- Verify IP in `scripts/kafka-tunnel.sh`

### Issue: "getaddrinfo ENOTFOUND ip-172-31-35-138.ap-south-1.compute.internal"

**Solution:**
```bash
# Add hostname to /etc/hosts
sudo sh -c "echo '127.0.0.1\tip-172-31-35-138.ap-south-1.compute.internal' >> /etc/hosts"

# Verify
grep "ip-172-31-35-138" /etc/hosts

# Restart service
npm run dev
```

### Issue: "Port 9092 already in use"

**Solution:**
```bash
# Stop existing tunnel
npm run kafka:tunnel:stop

# Or manually kill process
lsof -ti:9092 | xargs kill

# Restart tunnel
npm run kafka:tunnel
```

### Issue: "Port 3000 already in use"

**Solution:**
```bash
# Find process using port 3000
lsof -ti:3000

# Kill it
kill $(lsof -ti:3000)

# Or change PORT in .env file
```

### Issue: Database connection fails

**Check:**
- Database credentials in `.env` are correct
- Database server is accessible from your network
- VPN is connected (if required)

### Issue: Kafka producers not connecting

**Checklist:**
1. ✅ SSH tunnel is running: `lsof -i:9092`
2. ✅ Hostname mapped in `/etc/hosts`
3. ✅ `.env` has `KAFKA_BOOTSTRAP_SERVERS=localhost:9092`
4. ✅ Service restarted after changes

---

## 📝 Quick Reference

### Essential Commands

| Command | Purpose |
|---------|---------|
| `npm install` | Install dependencies |
| `npm run dev` | Start development server |
| `npm run build` | Build TypeScript to JavaScript |
| `npm run kafka:tunnel` | Start SSH tunnel to Kafka |
| `npm run kafka:tunnel:stop` | Stop SSH tunnel |
| `./test-create-client.sh` | Test create client API |

### Important Files

| File | Purpose |
|------|---------|
| `.env` | Environment configuration |
| `certs/stashlogin.pem` | SSH key for Kafka tunnel |
| `/etc/hosts` | Hostname mappings |
| `scripts/kafka-tunnel.sh` | SSH tunnel script |

### Important URLs

| URL | Purpose |
|-----|---------|
| `http://localhost:3000/api/health` | Health check |
| `http://localhost:3000/api/health/kafka` | Kafka health check |
| `http://localhost:3000/api/v1/lms/customers` | Create customer endpoint |

---

## ✅ Setup Checklist

Use this checklist to ensure everything is configured:

- [ ] Node.js v18+ installed
- [ ] Repository cloned
- [ ] Dependencies installed (`npm install`)
- [ ] `.env` file created with all values
- [ ] PEM file copied to `certs/stashlogin.pem`
- [ ] PEM file permissions set (`chmod 400`)
- [ ] SSH tunnel started (`npm run kafka:tunnel`)
- [ ] Hostname added to `/etc/hosts`
- [ ] Service starts without errors (`npm run dev`)
- [ ] Health check passes (`curl http://localhost:3000/api/health`)
- [ ] Create client API works

---

## 🎯 Summary

**Complete setup process:**

1. **Install dependencies**: `npm install`
2. **Create `.env` file**: Copy configuration above
3. **Setup PEM file**: Copy to `certs/` and set permissions
4. **Start SSH tunnel**: `npm run kafka:tunnel`
5. **Fix hostname**: Add to `/etc/hosts`
6. **Start service**: `npm run dev`
7. **Test**: Use health check and test scripts

**That's it!** Your service should now be running and connected to Kafka.

---

## 📞 Need Help?

If you encounter issues not covered here:

1. Check the logs in your terminal
2. Verify all steps in the checklist
3. Review the troubleshooting section
4. Check that tunnel is running: `lsof -i:9092`
5. Verify hostname mapping: `grep "ip-172-31-35-138" /etc/hosts`

---

**Last Updated:** December 2025  
**Version:** 1.0.0

