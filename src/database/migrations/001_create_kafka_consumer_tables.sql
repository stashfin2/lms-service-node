-- =====================================================
-- Kafka Consumer Management Tables (MySQL Version)
-- Complete visibility and tracking for Kafka consumers
-- =====================================================

-- =====================================================
-- 1. Consumer Groups Table
-- Tracks all registered consumer groups
-- =====================================================
CREATE TABLE IF NOT EXISTS kafka_consumer_groups (
    id INT AUTO_INCREMENT PRIMARY KEY,
    group_id VARCHAR(255) NOT NULL UNIQUE,
    group_name VARCHAR(255) NOT NULL,
    description TEXT,
    topics JSON NOT NULL COMMENT 'Array of topic names',
    handler_class VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_active_at TIMESTAMP NULL,
    
    CHECK (status IN ('ACTIVE', 'PAUSED', 'STOPPED', 'ERROR'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_consumer_groups_group_id ON kafka_consumer_groups(group_id);
CREATE INDEX idx_consumer_groups_status ON kafka_consumer_groups(status);

-- =====================================================
-- 2. Consumer Status Table
-- Real-time status of each consumer instance
-- =====================================================
CREATE TABLE IF NOT EXISTS kafka_consumer_status (
    id INT AUTO_INCREMENT PRIMARY KEY,
    consumer_group_id INT NOT NULL,
    instance_id VARCHAR(255) NOT NULL,
    hostname VARCHAR(255),
    status VARCHAR(50) NOT NULL DEFAULT 'RUNNING',
    is_connected BOOLEAN NOT NULL DEFAULT TRUE,
    partition_assignments JSON,
    current_offsets JSON,
    lag_total BIGINT DEFAULT 0,
    started_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_heartbeat_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    stopped_at TIMESTAMP NULL,
    
    CHECK (status IN ('RUNNING', 'PAUSED', 'STOPPED', 'ERROR', 'REBALANCING')),
    FOREIGN KEY (consumer_group_id) REFERENCES kafka_consumer_groups(id) ON DELETE CASCADE,
    UNIQUE KEY unique_consumer_instance (consumer_group_id, instance_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_consumer_status_group_id ON kafka_consumer_status(consumer_group_id);
CREATE INDEX idx_consumer_status_instance_id ON kafka_consumer_status(instance_id);
CREATE INDEX idx_consumer_status_status ON kafka_consumer_status(status);
CREATE INDEX idx_consumer_status_heartbeat ON kafka_consumer_status(last_heartbeat_at);

-- =====================================================
-- 3. Message Processing Log Table
-- Tracks every message processed by consumers
-- =====================================================
CREATE TABLE IF NOT EXISTS kafka_message_processing (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    consumer_group_id INT NOT NULL,
    message_id VARCHAR(255),
    correlation_id VARCHAR(255),
    topic VARCHAR(255) NOT NULL,
    partition INT NOT NULL,
    `offset` BIGINT NOT NULL,
    event_type VARCHAR(255) NOT NULL,
    event_payload JSON,
    status VARCHAR(50) NOT NULL DEFAULT 'PROCESSING',
    processing_started_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    processing_completed_at TIMESTAMP NULL,
    processing_duration_ms INT,
    retry_count INT DEFAULT 0,
    error_message TEXT,
    error_stack TEXT,
    processed_by VARCHAR(255),
    
    CHECK (status IN ('PROCESSING', 'COMPLETED', 'FAILED', 'RETRYING', 'DEAD_LETTER')),
    FOREIGN KEY (consumer_group_id) REFERENCES kafka_consumer_groups(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_message_processing_group_id ON kafka_message_processing(consumer_group_id);
CREATE INDEX idx_message_processing_topic_partition ON kafka_message_processing(topic, partition);
CREATE INDEX idx_message_processing_status ON kafka_message_processing(status);
CREATE INDEX idx_message_processing_correlation_id ON kafka_message_processing(correlation_id);
CREATE INDEX idx_message_processing_event_type ON kafka_message_processing(event_type);
CREATE INDEX idx_message_processing_started_at ON kafka_message_processing(processing_started_at);
CREATE INDEX idx_message_processing_offset ON kafka_message_processing(topic, partition, `offset`);

-- =====================================================
-- 4. Consumer Errors Table
-- Dedicated table for tracking consumer errors
-- =====================================================
CREATE TABLE IF NOT EXISTS kafka_consumer_errors (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    consumer_group_id INT NOT NULL,
    message_processing_id BIGINT,
    error_type VARCHAR(255) NOT NULL,
    error_message TEXT NOT NULL,
    error_stack TEXT,
    severity VARCHAR(50) NOT NULL DEFAULT 'MEDIUM',
    topic VARCHAR(255),
    partition INT,
    `offset` BIGINT,
    event_type VARCHAR(255),
    event_payload JSON,
    retry_count INT DEFAULT 0,
    max_retries_exceeded BOOLEAN DEFAULT FALSE,
    acknowledged BOOLEAN DEFAULT FALSE,
    acknowledged_by VARCHAR(255),
    acknowledged_at TIMESTAMP NULL,
    resolution_notes TEXT,
    occurred_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    FOREIGN KEY (consumer_group_id) REFERENCES kafka_consumer_groups(id) ON DELETE CASCADE,
    FOREIGN KEY (message_processing_id) REFERENCES kafka_message_processing(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_consumer_errors_group_id ON kafka_consumer_errors(consumer_group_id);
CREATE INDEX idx_consumer_errors_severity ON kafka_consumer_errors(severity);
CREATE INDEX idx_consumer_errors_occurred_at ON kafka_consumer_errors(occurred_at);
CREATE INDEX idx_consumer_errors_acknowledged ON kafka_consumer_errors(acknowledged);
CREATE INDEX idx_consumer_errors_topic ON kafka_consumer_errors(topic);

-- =====================================================
-- 5. Consumer Metrics Table
-- Aggregated metrics for performance monitoring
-- =====================================================
CREATE TABLE IF NOT EXISTS kafka_consumer_metrics (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    consumer_group_id INT NOT NULL,
    metric_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    time_window VARCHAR(50) NOT NULL,
    
    -- Message counts
    messages_processed INT NOT NULL DEFAULT 0,
    messages_succeeded INT NOT NULL DEFAULT 0,
    messages_failed INT NOT NULL DEFAULT 0,
    messages_retried INT NOT NULL DEFAULT 0,
    
    -- Performance metrics
    avg_processing_time_ms DECIMAL(10, 2),
    min_processing_time_ms INT,
    max_processing_time_ms INT,
    p95_processing_time_ms DECIMAL(10, 2),
    p99_processing_time_ms DECIMAL(10, 2),
    
    -- Throughput metrics
    messages_per_second DECIMAL(10, 2),
    bytes_processed BIGINT,
    
    -- Lag metrics
    total_lag BIGINT,
    max_lag BIGINT,
    avg_lag DECIMAL(10, 2),
    
    -- Error metrics
    error_rate DECIMAL(5, 2),
    retry_rate DECIMAL(5, 2),
    
    CHECK (time_window IN ('1min', '5min', '15min', '1hour', '1day')),
    FOREIGN KEY (consumer_group_id) REFERENCES kafka_consumer_groups(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_consumer_metrics_group_id ON kafka_consumer_metrics(consumer_group_id);
CREATE INDEX idx_consumer_metrics_timestamp ON kafka_consumer_metrics(metric_timestamp);
CREATE INDEX idx_consumer_metrics_window ON kafka_consumer_metrics(time_window);
CREATE INDEX idx_consumer_metrics_composite ON kafka_consumer_metrics(consumer_group_id, time_window, metric_timestamp);

-- =====================================================
-- 6. Consumer Offset Tracking Table
-- Track consumer offset positions over time
-- =====================================================
CREATE TABLE IF NOT EXISTS kafka_consumer_offsets (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    consumer_group_id INT NOT NULL,
    topic VARCHAR(255) NOT NULL,
    partition INT NOT NULL,
    current_offset BIGINT NOT NULL,
    committed_offset BIGINT,
    end_offset BIGINT,
    lag BIGINT,
    recorded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE KEY unique_offset_snapshot (consumer_group_id, topic, partition, recorded_at),
    FOREIGN KEY (consumer_group_id) REFERENCES kafka_consumer_groups(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_consumer_offsets_group_id ON kafka_consumer_offsets(consumer_group_id);
CREATE INDEX idx_consumer_offsets_topic_partition ON kafka_consumer_offsets(topic, partition);
CREATE INDEX idx_consumer_offsets_recorded_at ON kafka_consumer_offsets(recorded_at);

-- =====================================================
-- 7. Consumer Rebalance Events Table
-- Track consumer group rebalancing events
-- =====================================================
CREATE TABLE IF NOT EXISTS kafka_consumer_rebalance_events (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    consumer_group_id INT NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    partitions_revoked JSON,
    partitions_assigned JSON,
    member_count INT,
    rebalance_reason TEXT,
    duration_ms INT,
    occurred_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CHECK (event_type IN ('REBALANCE_START', 'PARTITIONS_REVOKED', 'PARTITIONS_ASSIGNED', 'REBALANCE_COMPLETE')),
    FOREIGN KEY (consumer_group_id) REFERENCES kafka_consumer_groups(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_rebalance_events_group_id ON kafka_consumer_rebalance_events(consumer_group_id);
CREATE INDEX idx_rebalance_events_occurred_at ON kafka_consumer_rebalance_events(occurred_at);

-- =====================================================
-- Triggers for MySQL
-- =====================================================

-- Trigger to calculate processing duration
DELIMITER $$

CREATE TRIGGER calculate_message_processing_duration
BEFORE UPDATE ON kafka_message_processing
FOR EACH ROW
BEGIN
    IF NEW.processing_completed_at IS NOT NULL AND NEW.processing_started_at IS NOT NULL THEN
        SET NEW.processing_duration_ms = TIMESTAMPDIFF(MICROSECOND, NEW.processing_started_at, NEW.processing_completed_at) / 1000;
    END IF;
END$$

DELIMITER ;

-- =====================================================
-- Views for Easy Querying
-- =====================================================

-- View: Consumer Group Overview
CREATE OR REPLACE VIEW v_consumer_group_overview AS
SELECT 
    cg.id,
    cg.group_id,
    cg.group_name,
    cg.topics,
    cg.status,
    cg.last_active_at,
    COUNT(DISTINCT cs.id) as active_instances,
    COALESCE(SUM(cs.lag_total), 0) as total_lag,
    (SELECT COUNT(*) FROM kafka_message_processing mp 
     WHERE mp.consumer_group_id = cg.id 
     AND mp.processing_started_at >= DATE_SUB(NOW(), INTERVAL 1 HOUR)) as messages_last_hour,
    (SELECT COUNT(*) FROM kafka_consumer_errors ce 
     WHERE ce.consumer_group_id = cg.id 
     AND ce.occurred_at >= DATE_SUB(NOW(), INTERVAL 1 HOUR)
     AND ce.acknowledged = 0) as unacked_errors_last_hour
FROM kafka_consumer_groups cg
LEFT JOIN kafka_consumer_status cs ON cs.consumer_group_id = cg.id AND cs.status = 'RUNNING'
GROUP BY cg.id, cg.group_id, cg.group_name, cg.topics, cg.status, cg.last_active_at;

-- View: Recent Processing Stats
CREATE OR REPLACE VIEW v_recent_processing_stats AS
SELECT 
    cg.group_id,
    cg.group_name,
    mp.topic,
    mp.event_type,
    mp.status,
    COUNT(*) as message_count,
    AVG(mp.processing_duration_ms) as avg_duration_ms,
    MAX(mp.processing_duration_ms) as max_duration_ms,
    SUM(CASE WHEN mp.status = 'FAILED' THEN 1 ELSE 0 END) as failed_count
FROM kafka_message_processing mp
JOIN kafka_consumer_groups cg ON cg.id = mp.consumer_group_id
WHERE mp.processing_started_at >= DATE_SUB(NOW(), INTERVAL 1 HOUR)
GROUP BY cg.group_id, cg.group_name, mp.topic, mp.event_type, mp.status;

-- View: Current Consumer Lag
CREATE OR REPLACE VIEW v_current_consumer_lag AS
SELECT 
    cg.group_id,
    cg.group_name,
    co.topic,
    co.partition,
    co.current_offset,
    co.end_offset,
    co.lag,
    co.recorded_at
FROM kafka_consumer_offsets co
JOIN kafka_consumer_groups cg ON cg.id = co.consumer_group_id
INNER JOIN (
    SELECT consumer_group_id, topic, partition, MAX(recorded_at) as max_recorded_at
    FROM kafka_consumer_offsets
    GROUP BY consumer_group_id, topic, partition
) latest ON co.consumer_group_id = latest.consumer_group_id 
    AND co.topic = latest.topic 
    AND co.partition = latest.partition 
    AND co.recorded_at = latest.max_recorded_at;

-- =====================================================
-- Comments for Documentation (MySQL doesn't support COMMENT ON)
-- Using table comments in CREATE TABLE statements instead
-- =====================================================

-- =====================================================
-- Sample Queries for Reference
-- =====================================================

-- Get consumer group health
-- SELECT * FROM v_consumer_group_overview;

-- Get processing stats
-- SELECT * FROM v_recent_processing_stats ORDER BY failed_count DESC;

-- Get current lag
-- SELECT * FROM v_current_consumer_lag ORDER BY lag DESC;

-- Get unacknowledged errors
-- SELECT * FROM kafka_consumer_errors 
-- WHERE acknowledged = false 
-- ORDER BY severity DESC, occurred_at DESC;

-- Get slow messages
-- SELECT * FROM kafka_message_processing 
-- WHERE processing_duration_ms > 1000 
-- AND processing_started_at >= NOW() - INTERVAL '1 hour'
-- ORDER BY processing_duration_ms DESC;

