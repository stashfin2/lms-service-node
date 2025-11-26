# LMS Service Node - Complete System Guide

## 📋 Table of Contents

1. [System Overview](#system-overview)
2. [Architecture](#architecture)
3. [Kafka Integration](#kafka-integration)
4. [Database Schema](#database-schema)
5. [API Endpoints](#api-endpoints)
6. [Monitoring & Visibility](#monitoring--visibility)
7. [Setup & Configuration](#setup--configuration)
8. [Usage Examples](#usage-examples)

---

## 1. System Overview

### What is This System?

**LMS Service Node** is an enterprise-grade Loan Management System (LMS) built with:
- **Node.js + TypeScript** - Type-safe, modern backend
- **Express.js** - RESTful API framework
- **Apache Kafka** - Event-driven architecture for microservices
- **MySQL 8** - Relational database with full consumer tracking
- **Dependency Injection** - Using `tsyringe` for IoC
- **SOLID Principles** - Clean, maintainable, extensible code

### Key Features

✅ **Complete Kafka Integration**
- 17 topics across 5 domains
- 7 consumer groups with automatic tracking
- Event-driven architecture
- Exactly-once semantics

✅ **Full Consumer Visibility**
- Every message tracked in database
- Real-time health monitoring
- Performance metrics
- Error tracking with acknowledgment workflow

✅ **Production-Ready**
- Comprehensive logging
- Graceful shutdown
- Retry mechanisms
- Health checks

---

## 2. Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     External Services                        │
│  (Other Microservices, Frontend, Mobile Apps)               │
└────────────────────────┬────────────────────────────────────┘
                         │ REST API
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    LMS Service Node                          │
│  ┌────────────────────────────────────────────────────┐    │
│  │              Express API Layer                      │    │
│  │  - Controllers (REST endpoints)                     │    │
│  │  - Middleware (Auth, Logging, Kafka)               │    │
│  └────────────────────┬───────────────────────────────┘    │
│                       │                                      │
│  ┌────────────────────▼───────────────────────────────┐    │
│  │              Service Layer                          │    │
│  │  - Business Logic                                   │    │
│  │  - Event Publishing                                 │    │
│  │  - Consumer Tracking                                │    │
│  └────────────────────┬───────────────────────────────┘    │
│                       │                                      │
│  ┌────────────────────▼───────────────────────────────┐    │
│  │           Repository Layer                          │    │
│  │  - Database Queries                                 │    │
│  │  - Data Access Logic                                │    │
│  └────────────────────┬───────────────────────────────┘    │
└────────────────────────┼────────────────────────────────────┘
                         │
         ┌───────────────┴───────────────┐
         │                               │
         ▼                               ▼
┌─────────────────┐            ┌──────────────────┐
│   MySQL 8       │            │   Apache Kafka   │
│  - Core Data    │            │  - Events        │
│  - Tracking     │            │  - 17 Topics     │
│  - Metrics      │            │  - 7 Consumers   │
└─────────────────┘            └──────────────────┘
```

### Kafka Architecture

```
                      ┌──────────────────────┐
                      │   Event Publisher    │
                      │     (Facade)         │
                      └──────────┬───────────┘
                                 │
                    ┌────────────┴────────────┐
                    │                         │
                    ▼                         ▼
          ┌─────────────────┐      ┌─────────────────┐
          │  17 Producers   │      │  7 Consumers    │
          │ (One per topic) │      │ (One per group) │
          └────────┬────────┘      └────────┬────────┘
                   │                        │
                   ▼                        ▼
    ┌──────────────────────────────────────────────────┐
    │              Apache Kafka Cluster                 │
    │                                                   │
    │  ┌─────────────────────────────────────────┐    │
    │  │        17 Topics (3 partitions each)     │    │
    │  ├─────────────────────────────────────────┤    │
    │  │  Loan Domain (7 topics)                  │    │
    │  │  - application.created/updated/approved  │    │
    │  │  - disbursement.initiated/completed      │    │
    │  ├─────────────────────────────────────────┤    │
    │  │  Customer Domain (3 topics)              │    │
    │  │  Payment Domain (2 topics)               │    │
    │  │  Fineract Domain (3 topics)              │    │
    │  │  System Domain (2 topics)                │    │
    │  └─────────────────────────────────────────┘    │
    └──────────────────────────────────────────────────┘
                   │                        │
                   │    ┌──────────────────┘
                   │    │
                   ▼    ▼
    ┌──────────────────────────────────────┐
    │  Consumer Tracking Service            │
    │  - Tracks every message               │
    │  - Records processing time            │
    │  - Logs errors                        │
    │  - Calculates metrics                 │
    └──────────────────────────────────────┘
                   │
                   ▼
    ┌──────────────────────────────────────┐
    │         MySQL Database                │
    │  - 7 tracking tables                  │
    │  - 3 views for insights               │
    └──────────────────────────────────────┘
```

### Code Architecture (SOLID Principles)

```
src/
├── app.ts                    # Application entry point
├── config/                   # Configuration
│   ├── environment.ts        # Environment variables
│   ├── kafka.config.ts       # Kafka topics & consumer groups
│   └── fineract.config.ts    # Fineract integration
│
├── kafka/                    # Kafka module (enterprise-grade)
│   ├── core/                 # Base implementations
│   │   ├── BaseProducer.ts   # Template for producers
│   │   └── BaseConsumer.ts   # Template for consumers
│   │
│   ├── interfaces/           # Contracts (Dependency Inversion)
│   │   ├── IEvent.ts         # Event interface
│   │   ├── IProducer.ts      # Producer interface
│   │   ├── IConsumer.ts      # Consumer interface
│   │   └── IEventPublisher.ts
│   │
│   ├── models/               # Domain models
│   │   └── BaseEvent.ts      # Base event class
│   │
│   ├── events/               # Domain-specific events
│   │   ├── LoanEvents.ts     # 7 loan event classes
│   │   ├── CustomerEvents.ts # 3 customer event classes
│   │   ├── PaymentEvents.ts  # 2 payment event classes
│   │   ├── FineractEvents.ts # 3 Fineract event classes
│   │   └── SystemEvents.ts   # 2 system event classes
│   │
│   ├── factories/            # Factory Pattern
│   │   ├── KafkaClientFactory.ts  # Singleton
│   │   ├── ProducerFactory.ts     # Creates producers
│   │   └── ConsumerFactory.ts     # Creates consumers
│   │
│   ├── handlers/             # Message handlers (Strategy Pattern)
│   │   ├── LoanMessageHandler.ts
│   │   ├── DisbursementMessageHandler.ts
│   │   ├── CustomerMessageHandler.ts
│   │   ├── PaymentMessageHandler.ts
│   │   ├── FineractSyncMessageHandler.ts
│   │   ├── AuditMessageHandler.ts
│   │   └── ErrorMessageHandler.ts
│   │
│   ├── services/             # High-level services (Facade Pattern)
│   │   ├── EventPublisher.ts      # Publish to any topic
│   │   ├── ConsumerManager.ts     # Manage all consumers
│   │   └── ConsumerTrackingService.ts # Track everything
│   │
│   └── middleware/           # Express middleware
│       ├── EventPublishingMiddleware.ts
│       ├── AuditMiddleware.ts
│       └── ErrorPublishingMiddleware.ts
│
├── controllers/              # API Controllers
│   ├── lms.controller.v1.ts
│   ├── fineract.controller.v1.ts
│   └── kafka-monitoring.controller.ts
│
├── services/                 # Business logic
│   ├── lms.service.v1.ts
│   └── fineract.service.v1.ts
│
├── repositories/             # Data access
│   ├── lms.repo.v1.ts
│   ├── fineract.repo.v1.ts
│   └── kafka-tracking.repo.ts
│
├── models/                   # Data models
│   ├── lms.models.ts
│   ├── fineract.models.ts
│   └── kafka-tracking.models.ts
│
├── connector/                # Database connection
│   └── sql.ts                # MySQL connection pool
│
├── database/                 # Database migrations
│   └── migrations/
│       └── 001_create_kafka_consumer_tables.sql
│
└── routes/                   # API routes
    └── index.ts              # Route definitions
```

---

## 3. Kafka Integration

### Topics (17 Total)

#### **Loan Domain (7 topics)**

| Topic | Purpose | Partition Key |
|-------|---------|---------------|
| `lms.loan.application.created` | New loan application | customerId |
| `lms.loan.application.updated` | Application updated | customerId |
| `lms.loan.application.approved` | Application approved | customerId |
| `lms.loan.application.rejected` | Application rejected | customerId |
| `lms.loan.disbursement.initiated` | Disbursement started | customerId |
| `lms.loan.disbursement.completed` | Money transferred | customerId |
| `lms.loan.disbursement.failed` | Disbursement failed | customerId |

#### **Customer Domain (3 topics)**

| Topic | Purpose | Partition Key |
|-------|---------|---------------|
| `lms.customer.created` | New customer registered | customerId |
| `lms.customer.updated` | Customer profile updated | customerId |
| `lms.customer.kyc.completed` | KYC verification done | customerId |

#### **Payment Domain (2 topics)**

| Topic | Purpose | Partition Key |
|-------|---------|---------------|
| `lms.payment.received` | Payment successfully received | customerId |
| `lms.payment.failed` | Payment processing failed | customerId |

#### **Fineract Integration (3 topics)**

| Topic | Purpose | Partition Key |
|-------|---------|---------------|
| `lms.fineract.client.sync` | Sync client data with Fineract | clientId |
| `lms.fineract.loan.sync` | Sync loan data with Fineract | loanId |
| `lms.fineract.transaction.sync` | Sync transaction with Fineract | loanId |

#### **System Domain (2 topics)**

| Topic | Purpose | Partition Key |
|-------|---------|---------------|
| `lms.system.audit.log` | Audit trail for all operations | resourceId |
| `lms.system.error.log` | System errors and exceptions | requestId |

### Consumer Groups (7 Total)

| Consumer Group | Topics | Handler | Purpose |
|----------------|--------|---------|---------|
| `lms-loan-processor-group` | 4 loan topics | LoanMessageHandler | Process loan applications |
| `lms-disbursement-processor-group` | 3 disbursement topics | DisbursementMessageHandler | Handle disbursements |
| `lms-customer-processor-group` | 3 customer topics | CustomerMessageHandler | Manage customers |
| `lms-payment-processor-group` | 2 payment topics | PaymentMessageHandler | Process payments |
| `lms-fineract-sync-group` | 3 Fineract topics | FineractSyncMessageHandler | Sync with Fineract |
| `lms-audit-processor-group` | 1 audit topic | AuditMessageHandler | Process audit logs |
| `lms-error-processor-group` | 1 error topic | ErrorMessageHandler | Handle error logs |

### How Events Flow

```
1. API Request Received
   ↓
2. Controller validates & processes
   ↓
3. Service layer business logic
   ↓
4. Event created (e.g., LoanApplicationCreatedEvent)
   ↓
5. EventPublisher.publish(topic, event)
   ↓
6. Producer sends to Kafka
   ↓
7. Kafka stores in topic partition
   ↓
8. Consumer receives message
   ↓
9. BaseConsumer tracks start (DB insert)
   ↓
10. MessageHandler processes event
    ↓
11. Business logic executes
    ↓
12. BaseConsumer tracks completion (DB update)
    ↓
13. Success/Error logged to database
```

---

## 4. Database Schema

### Tables (7 Total)

#### **1. kafka_consumer_groups**
**Purpose:** Track all registered Kafka consumer groups

| Column | Type | Description |
|--------|------|-------------|
| `id` | INT AUTO_INCREMENT | Primary key |
| `group_id` | VARCHAR(255) | Kafka consumer group ID (unique) |
| `group_name` | VARCHAR(255) | Human-readable name |
| `description` | TEXT | Description of consumer group |
| `topics` | JSON | Array of subscribed topic names |
| `handler_class` | VARCHAR(255) | Name of message handler class |
| `status` | VARCHAR(50) | ACTIVE, PAUSED, STOPPED, ERROR |
| `created_at` | TIMESTAMP | When group was registered |
| `updated_at` | TIMESTAMP | Last update time |
| `last_active_at` | TIMESTAMP | Last activity timestamp |

**Use Case:** Track which consumer groups exist and what topics they process

---

#### **2. kafka_consumer_status**
**Purpose:** Real-time status of each consumer instance

| Column | Type | Description |
|--------|------|-------------|
| `id` | INT AUTO_INCREMENT | Primary key |
| `consumer_group_id` | INT | Foreign key to consumer_groups |
| `instance_id` | VARCHAR(255) | Unique instance identifier |
| `hostname` | VARCHAR(255) | Server hostname |
| `status` | VARCHAR(50) | RUNNING, PAUSED, STOPPED, ERROR, REBALANCING |
| `is_connected` | BOOLEAN | Connection status |
| `partition_assignments` | JSON | Assigned partitions |
| `current_offsets` | JSON | Current offset positions |
| `lag_total` | BIGINT | Total consumer lag |
| `started_at` | TIMESTAMP | Instance start time |
| `last_heartbeat_at` | TIMESTAMP | Last heartbeat |
| `stopped_at` | TIMESTAMP | Stop time (if stopped) |

**Use Case:** Monitor active consumer instances, their health, and lag

---

#### **3. kafka_message_processing**
**Purpose:** Complete audit trail of ALL messages processed

| Column | Type | Description |
|--------|------|-------------|
| `id` | BIGINT AUTO_INCREMENT | Primary key |
| `consumer_group_id` | INT | Which consumer group |
| `message_id` | VARCHAR(255) | Event ID from message |
| `correlation_id` | VARCHAR(255) | For distributed tracing |
| `topic` | VARCHAR(255) | Kafka topic name |
| `partition` | INT | Partition number |
| `offset` | BIGINT | Message offset |
| `event_type` | VARCHAR(255) | Type of event |
| `event_payload` | JSON | Full event data |
| `status` | VARCHAR(50) | PROCESSING, COMPLETED, FAILED, RETRYING, DEAD_LETTER |
| `processing_started_at` | TIMESTAMP | When processing started |
| `processing_completed_at` | TIMESTAMP | When processing finished |
| `processing_duration_ms` | INT | How long it took (auto-calculated) |
| `retry_count` | INT | Number of retry attempts |
| `error_message` | TEXT | Error message if failed |
| `error_stack` | TEXT | Full stack trace if failed |
| `processed_by` | VARCHAR(255) | Instance that processed it |

**Use Case:** 
- Complete audit trail
- Find slow messages
- Track by correlation ID
- Debugging failed messages

---

#### **4. kafka_consumer_errors**
**Purpose:** Dedicated error tracking with severity and acknowledgment

| Column | Type | Description |
|--------|------|-------------|
| `id` | BIGINT AUTO_INCREMENT | Primary key |
| `consumer_group_id` | INT | Which consumer group |
| `message_processing_id` | BIGINT | Link to message (if applicable) |
| `error_type` | VARCHAR(255) | Error class name |
| `error_message` | TEXT | Error message |
| `error_stack` | TEXT | Full stack trace |
| `severity` | VARCHAR(50) | LOW, MEDIUM, HIGH, CRITICAL |
| `topic` | VARCHAR(255) | Topic where error occurred |
| `partition` | INT | Partition number |
| `offset` | BIGINT | Message offset |
| `event_type` | VARCHAR(255) | Event type that failed |
| `event_payload` | JSON | Event data (for retry) |
| `retry_count` | INT | Retry attempts |
| `max_retries_exceeded` | BOOLEAN | Hit retry limit? |
| `acknowledged` | BOOLEAN | Has someone reviewed it? |
| `acknowledged_by` | VARCHAR(255) | Who acknowledged |
| `acknowledged_at` | TIMESTAMP | When acknowledged |
| `resolution_notes` | TEXT | How it was resolved |
| `occurred_at` | TIMESTAMP | When error occurred |

**Use Case:**
- Track all errors with context
- Alert on CRITICAL errors
- Acknowledgment workflow
- Error pattern analysis

---

#### **5. kafka_consumer_metrics**
**Purpose:** Aggregated performance metrics over time windows

| Column | Type | Description |
|--------|------|-------------|
| `id` | BIGINT AUTO_INCREMENT | Primary key |
| `consumer_group_id` | INT | Which consumer group |
| `metric_timestamp` | TIMESTAMP | When metric was recorded |
| `time_window` | VARCHAR(50) | 1min, 5min, 15min, 1hour, 1day |
| `messages_processed` | INT | Total messages |
| `messages_succeeded` | INT | Successful messages |
| `messages_failed` | INT | Failed messages |
| `messages_retried` | INT | Retried messages |
| `avg_processing_time_ms` | DECIMAL(10,2) | Average time |
| `min_processing_time_ms` | INT | Fastest message |
| `max_processing_time_ms` | INT | Slowest message |
| `p95_processing_time_ms` | DECIMAL(10,2) | 95th percentile |
| `p99_processing_time_ms` | DECIMAL(10,2) | 99th percentile |
| `messages_per_second` | DECIMAL(10,2) | Throughput |
| `bytes_processed` | BIGINT | Total bytes |
| `total_lag` | BIGINT | Consumer lag |
| `max_lag` | BIGINT | Worst lag |
| `avg_lag` | DECIMAL(10,2) | Average lag |
| `error_rate` | DECIMAL(5,2) | Error percentage |
| `retry_rate` | DECIMAL(5,2) | Retry percentage |

**Use Case:**
- Performance monitoring
- Trend analysis
- Capacity planning
- SLA tracking

---

#### **6. kafka_consumer_offsets**
**Purpose:** Historical offset tracking for lag analysis

| Column | Type | Description |
|--------|------|-------------|
| `id` | BIGINT AUTO_INCREMENT | Primary key |
| `consumer_group_id` | INT | Which consumer group |
| `topic` | VARCHAR(255) | Topic name |
| `partition` | INT | Partition number |
| `current_offset` | BIGINT | Consumer's current offset |
| `committed_offset` | BIGINT | Last committed offset |
| `end_offset` | BIGINT | Latest offset in partition |
| `lag` | BIGINT | How far behind (end - current) |
| `recorded_at` | TIMESTAMP | When snapshot was taken |

**Use Case:**
- Track lag over time
- Identify growing lag
- Partition-level visibility

---

#### **7. kafka_consumer_rebalance_events**
**Purpose:** Track consumer group rebalancing events

| Column | Type | Description |
|--------|------|-------------|
| `id` | BIGINT AUTO_INCREMENT | Primary key |
| `consumer_group_id` | INT | Which consumer group |
| `event_type` | VARCHAR(50) | REBALANCE_START, PARTITIONS_REVOKED, PARTITIONS_ASSIGNED, REBALANCE_COMPLETE |
| `partitions_revoked` | JSON | Partitions taken away |
| `partitions_assigned` | JSON | Partitions received |
| `member_count` | INT | Number of consumers in group |
| `rebalance_reason` | TEXT | Why rebalance happened |
| `duration_ms` | INT | How long it took |
| `occurred_at` | TIMESTAMP | When it happened |

**Use Case:**
- Monitor rebalancing frequency
- Debug consumer stability issues
- Track partition distribution

---

### Views (3 Total)

#### **1. v_consumer_group_overview**
**Purpose:** Quick dashboard overview

```sql
SELECT 
  cg.id,
  cg.group_id,
  cg.group_name,
  cg.topics,
  cg.status,
  cg.last_active_at,
  COUNT(DISTINCT cs.id) as active_instances,
  COALESCE(SUM(cs.lag_total), 0) as total_lag,
  COUNT(messages last hour) as messages_last_hour,
  COUNT(unacked errors last hour) as unacked_errors_last_hour
FROM kafka_consumer_groups cg
LEFT JOIN kafka_consumer_status cs ON ...
GROUP BY cg.id;
```

---

#### **2. v_recent_processing_stats**
**Purpose:** Recent processing statistics

```sql
SELECT 
  group_id,
  group_name,
  topic,
  event_type,
  status,
  COUNT(*) as message_count,
  AVG(processing_duration_ms) as avg_duration_ms,
  MAX(processing_duration_ms) as max_duration_ms,
  SUM(CASE WHEN status = 'FAILED' THEN 1 ELSE 0 END) as failed_count
FROM kafka_message_processing
WHERE processing_started_at >= DATE_SUB(NOW(), INTERVAL 1 HOUR)
GROUP BY group_id, topic, event_type, status;
```

---

#### **3. v_current_consumer_lag**
**Purpose:** Current lag by topic/partition

```sql
SELECT 
  group_id,
  group_name,
  topic,
  partition,
  current_offset,
  end_offset,
  lag,
  recorded_at
FROM kafka_consumer_offsets
WHERE recorded_at = (latest snapshot for each partition);
```

---

## 5. API Endpoints

### Health & Dashboard (3 endpoints)

```bash
# Application health
GET /api/health

# Kafka infrastructure health
GET /api/health/kafka

# Complete dashboard with metrics
GET /api/v1/kafka/dashboard
```

---

### Consumer Group Management (5 endpoints)

```bash
# List all consumer groups
GET /api/v1/kafka/consumer-groups

# Get specific consumer group
GET /api/v1/kafka/consumer-groups/:groupId

# Get consumer group health report
GET /api/v1/kafka/consumer-groups/:groupId/health

# Pause consumer group
POST /api/v1/kafka/consumer-groups/:groupId/pause

# Resume consumer group
POST /api/v1/kafka/consumer-groups/:groupId/resume
```

---

### Message History (1 endpoint)

```bash
# Query message processing history
GET /api/v1/kafka/messages?topic=xxx&status=xxx&limit=50

# Query parameters:
# - topic: Filter by topic name
# - eventType: Filter by event type
# - status: PROCESSING, COMPLETED, FAILED, RETRYING, DEAD_LETTER
# - correlationId: Track across services
# - startDate: ISO date
# - endDate: ISO date
# - limit: Number of results (default: 50)
# - offset: Pagination offset (default: 0)
```

---

### Error Management (3 endpoints)

```bash
# Query errors with filters
GET /api/v1/kafka/errors?severity=HIGH&acknowledged=false

# Get unacknowledged errors
GET /api/v1/kafka/errors/unacknowledged

# Acknowledge an error
PUT /api/v1/kafka/errors/:errorId/acknowledge
Body: {
  "acknowledgedBy": "admin@example.com",
  "resolutionNotes": "Fixed by restarting consumer"
}
```

---

### Metrics (1 endpoint)

```bash
# Query performance metrics
GET /api/v1/kafka/metrics?consumerGroupId=1&timeWindow=1hour

# Query parameters:
# - consumerGroupId: Filter by group
# - timeWindow: 1min, 5min, 15min, 1hour, 1day
# - startDate: ISO date
# - endDate: ISO date
```

---

### Business Endpoints (5 endpoints)

```bash
# Create customer (publishes CustomerCreated event)
POST /api/v1/lms/customers

# Create loan application (publishes LoanApplicationCreated event)
POST /api/v1/lms/loan-applications

# Approve loan (publishes LoanApplicationApproved event)
PUT /api/v1/lms/loan-applications/:applicationId/approve

# Initiate disbursement (publishes LoanDisbursementInitiated event)
POST /api/v1/lms/disbursements

# Record payment (publishes PaymentReceived event)
POST /api/v1/lms/payments
```

---

## 6. Monitoring & Visibility

### What Gets Tracked Automatically

✅ **Every Message:**
- When it arrived
- How long it took to process
- Success or failure
- Full event payload
- Correlation ID
- Retry attempts

✅ **Consumer Health:**
- Active instances
- Connection status
- Partition assignments
- Current offsets
- Consumer lag

✅ **Performance Metrics:**
- Messages per second
- Processing times (avg, p95, p99)
- Error rates
- Retry rates

✅ **Errors:**
- Error type and message
- Stack traces
- Severity levels
- Acknowledgment status

### How to Monitor

#### **1. Real-Time Dashboard**

```bash
curl http://localhost:3000/api/v1/kafka/dashboard
```

**Shows:**
- Total consumer groups
- Active instances
- Messages processed (last hour)
- Error rates
- Recent errors
- Slow messages
- Consumer lag by topic

---

#### **2. Consumer Health Report**

```bash
curl http://localhost:3000/api/v1/kafka/consumer-groups/lms-loan-processor-group/health
```

**Returns:**
- Health score (0-100)
- Status: HEALTHY, WARNING, CRITICAL
- Issues detected
- Performance metrics
- Recommendations

**Health Score Calculation:**
- Start: 100 points
- Deduct points for:
  - High lag (>10k = -30, >1k = -15)
  - High error rate (>10% = -25, >5% = -10)
  - Slow processing (>5s = -20, >2s = -10)
  - Connection issues (-40)

---

#### **3. Find Slow Messages**

```sql
SELECT 
  topic,
  event_type,
  processing_duration_ms,
  correlation_id,
  processing_started_at
FROM kafka_message_processing
WHERE processing_duration_ms > 1000
AND processing_started_at >= DATE_SUB(NOW(), INTERVAL 1 HOUR)
ORDER BY processing_duration_ms DESC
LIMIT 20;
```

---

#### **4. Track by Correlation ID**

```sql
SELECT 
  topic,
  event_type,
  status,
  processing_duration_ms,
  error_message,
  processing_started_at
FROM kafka_message_processing
WHERE correlation_id = 'your-correlation-id'
ORDER BY processing_started_at;
```

---

#### **5. Unacknowledged Errors**

```bash
curl http://localhost:3000/api/v1/kafka/errors/unacknowledged
```

Or:

```sql
SELECT 
  severity,
  error_type,
  error_message,
  topic,
  event_type,
  occurred_at
FROM kafka_consumer_errors
WHERE acknowledged = 0
ORDER BY severity DESC, occurred_at DESC;
```

---

#### **6. Consumer Lag**

```sql
SELECT * FROM v_current_consumer_lag
WHERE lag > 0
ORDER BY lag DESC;
```

---

### Alert Conditions

**CRITICAL (Immediate Action)**
- Health score < 50
- Consumer lag > 10,000 messages
- Error rate > 10%
- Consumer status != ACTIVE
- No heartbeat in 5 minutes

**HIGH (Action Required)**
- Health score < 80
- Consumer lag > 1,000 messages
- Error rate > 5%
- Avg processing time > 5 seconds
- Multiple unacknowledged errors

**MEDIUM (Monitor)**
- Processing time > 2 seconds
- Error rate > 2%
- Increasing lag trend
- Frequent rebalancing

---

## 7. Setup & Configuration

### Prerequisites

- Node.js v16+
- MySQL 8
- Apache Kafka
- Docker (for local Kafka)

---

### Installation

```bash
# Clone repository
git clone <repository-url>
cd lms-service-node

# Install dependencies
npm install
```

---

### Configure Environment

Create `.env` file:

```env
# Application
NODE_ENV=development
PORT=3000
LOG_LEVEL=info

# Database (MySQL 8)
DB_HOST=localhost
DB_PORT=3306
DB_NAME=lms_service
DB_USER=root
DB_PASSWORD=your_password

# Kafka
KAFKA_BROKERS=localhost:9092
KAFKA_CLIENT_ID=lms-service
KAFKA_GROUP_ID=lms-service-consumer-group

# Optional: Kafka Security
KAFKA_SSL_ENABLED=false
# KAFKA_SASL_MECHANISM=plain
# KAFKA_SASL_USERNAME=
# KAFKA_SASL_PASSWORD=
```

---

### Start Kafka (Local Development)

```bash
# Using Docker Compose
docker-compose -f docker-compose.kafka.yml up -d

# Services started:
# - Zookeeper: localhost:2181
# - Kafka: localhost:9092
# - Kafka UI: http://localhost:8080
```

---

### Setup Database

```bash
# Connect to MySQL
mysql -u root -p

# Create database
CREATE DATABASE IF NOT EXISTS lms_service 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE lms_service;

# Run migration
source src/database/migrations/001_create_kafka_consumer_tables.sql;

# Verify tables
SHOW TABLES LIKE 'kafka_%';
-- Should show 7 tables
```

---

### Build & Run

```bash
# Build
npm run build

# Development mode (hot reload)
npm run dev

# Production
npm start
```

---

### Verify Installation

```bash
# Check application health
curl http://localhost:3000/api/health

# Check Kafka health
curl http://localhost:3000/api/health/kafka

# View dashboard
curl http://localhost:3000/api/v1/kafka/dashboard
```

---

## 8. Usage Examples

### Example 1: Create a Customer

```bash
curl -X POST http://localhost:3000/api/v1/lms/customers \
  -H "Content-Type: application/json" \
  -H "x-correlation-id: test-123" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "phone": "+1234567890",
    "address": {
      "street": "123 Main St",
      "city": "New York",
      "state": "NY",
      "pincode": "10001",
      "country": "USA"
    }
  }'
```

**What Happens:**
1. ✅ Customer created in system
2. ✅ `CustomerCreated` event published to Kafka
3. ✅ Event tracked in `kafka_message_processing` table
4. ✅ `CustomerMessageHandler` processes the event
5. ✅ Completion tracked with duration
6. ✅ Audit event automatically logged

---

### Example 2: Monitor Consumer Health

```bash
curl http://localhost:3000/api/v1/kafka/consumer-groups/lms-loan-processor-group/health
```

**Response:**
```json
{
  "success": true,
  "data": {
    "groupId": "lms-loan-processor-group",
    "groupName": "Lms Loan Processor Group",
    "healthScore": 95,
    "status": "HEALTHY",
    "issues": [],
    "metrics": {
      "avgProcessingTime": 45.5,
      "errorRate": 0.5,
      "lag": 0,
      "throughput": 25.5
    },
    "recommendations": []
  }
}
```

---

### Example 3: Query Messages by Correlation ID

```bash
curl "http://localhost:3000/api/v1/kafka/messages?correlationId=test-123&limit=10"
```

**Use Case:** Track a request across multiple services/events

---

### Example 4: Acknowledge an Error

```bash
curl -X PUT http://localhost:3000/api/v1/kafka/errors/123/acknowledge \
  -H "Content-Type: application/json" \
  -d '{
    "acknowledgedBy": "admin@example.com",
    "resolutionNotes": "Fixed by restarting the consumer. Root cause was database connection timeout."
  }'
```

---

### Example 5: Get Performance Metrics

```bash
curl "http://localhost:3000/api/v1/kafka/metrics?timeWindow=1hour&consumerGroupId=1"
```

**Response includes:**
- Messages processed
- Success/failure rates
- Processing times (avg, p95, p99)
- Throughput
- Error rates

---

## Summary

### What You Have

✅ **Complete Kafka Integration**
- 17 topics across 5 domains
- 7 consumer groups
- Automatic tracking of everything

✅ **Full Visibility**
- 7 database tables
- 3 views for insights
- 12 REST API endpoints

✅ **Enterprise-Grade**
- SOLID principles
- Design patterns
- Production-ready
- Comprehensive monitoring

✅ **MySQL 8 Ready**
- Fully optimized schema
- JSON columns for flexibility
- Proper indexes and foreign keys

---

### Quick Reference

**Start Everything:**
```bash
# 1. Start Kafka
docker-compose -f docker-compose.kafka.yml up -d

# 2. Setup database
mysql -u root -p < src/database/migrations/001_create_kafka_consumer_tables.sql

# 3. Configure .env
# (Add your MySQL credentials)

# 4. Start application
npm run dev
```

**Monitor:**
- Dashboard: `http://localhost:3000/api/v1/kafka/dashboard`
- Kafka UI: `http://localhost:8080`
- Health: `http://localhost:3000/api/health/kafka`

**Database:**
- Tables: 7 tracking tables
- Views: 3 for quick insights
- Automatic tracking: Every message logged

---

## 📞 Support

For questions:
1. Check `/api/health/kafka`
2. Review unacknowledged errors
3. Check consumer health reports
4. Review application logs

**Everything is monitored and tracked!** 🎉

