/**
 * Kafka Consumer Tracking Repository
 * Data access layer for consumer management tables
 * Follows Repository Pattern and Single Responsibility Principle
 */

import { injectable, inject } from 'tsyringe';
import { Pool, RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { DirectoryDatabaseConnector } from '../connector/sql';
import {
  ConsumerGroup,
  CreateConsumerGroupRequest,
  ConsumerStatus,
  MessageProcessing,
  CreateMessageProcessingRequest,
  UpdateMessageProcessingRequest,
  ConsumerError,
  CreateConsumerErrorRequest,
  AcknowledgeErrorRequest,
  ConsumerMetrics,
  CreateConsumerMetricsRequest,
  ConsumerOffset,
  CreateConsumerOffsetRequest,
  RebalanceEvent,
  CreateRebalanceEventRequest,
  ConsumerGroupOverview,
  ProcessingStats,
  CurrentLag,
  MessageProcessingFilter,
  ConsumerErrorFilter,
  ConsumerMetricsFilter,
} from '../models/kafka-tracking.models';
import { logger } from '../utils/logger';

@injectable()
export class KafkaTrackingRepository {
  private pool: Pool;

  constructor(
    @inject(DirectoryDatabaseConnector) private dbConnector: DirectoryDatabaseConnector
  ) {
    this.pool = dbConnector.getPool();
  }

  // =====================================================
  // Consumer Group Operations
  // =====================================================

  async createConsumerGroup(data: CreateConsumerGroupRequest): Promise<ConsumerGroup> {
    const query = `
      INSERT INTO kafka_consumer_groups (group_id, group_name, description, topics, handler_class)
      VALUES (?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE 
        group_name = VALUES(group_name), 
        description = VALUES(description), 
        topics = VALUES(topics), 
        handler_class = VALUES(handler_class), 
        updated_at = CURRENT_TIMESTAMP
    `;

    const values = [
      data.groupId,
      data.groupName,
      data.description,
      JSON.stringify(data.topics),
      data.handlerClass,
    ];

    await this.pool.query(query, values);
    
    // Fetch the inserted/updated record
    return this.getConsumerGroupByGroupId(data.groupId) as Promise<ConsumerGroup>;
  }

  async getConsumerGroupById(id: number): Promise<ConsumerGroup | null> {
    const query = 'SELECT * FROM kafka_consumer_groups WHERE id = ?';
    const [rows] = await this.pool.query<RowDataPacket[]>(query, [id]);
    return rows[0] ? this.mapConsumerGroup(rows[0]) : null;
  }

  async getConsumerGroupByGroupId(groupId: string): Promise<ConsumerGroup | null> {
    const query = 'SELECT * FROM kafka_consumer_groups WHERE group_id = ?';
    const [rows] = await this.pool.query<RowDataPacket[]>(query, [groupId]);
    return rows[0] ? this.mapConsumerGroup(rows[0]) : null;
  }

  async getAllConsumerGroups(): Promise<ConsumerGroup[]> {
    const query = 'SELECT * FROM kafka_consumer_groups ORDER BY group_name';
    const [rows] = await this.pool.query<RowDataPacket[]>(query);
    return rows.map(row => this.mapConsumerGroup(row));
  }

  async updateConsumerGroupStatus(groupId: string, status: string, lastActiveAt?: Date): Promise<void> {
    const query = `
      UPDATE kafka_consumer_groups 
      SET status = ?, last_active_at = COALESCE(?, last_active_at), updated_at = CURRENT_TIMESTAMP
      WHERE group_id = ?
    `;
    await this.pool.query(query, [status, lastActiveAt, groupId]);
  }

  // =====================================================
  // Consumer Status Operations
  // =====================================================

  async upsertConsumerStatus(data: Partial<ConsumerStatus>): Promise<ConsumerStatus> {
    const query = `
      INSERT INTO kafka_consumer_status 
        (consumer_group_id, instance_id, hostname, status, is_connected, 
         partition_assignments, current_offsets, lag_total, last_heartbeat_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON DUPLICATE KEY UPDATE 
        status = VALUES(status), 
        is_connected = VALUES(is_connected), 
        partition_assignments = VALUES(partition_assignments),
        current_offsets = VALUES(current_offsets), 
        lag_total = VALUES(lag_total), 
        last_heartbeat_at = CURRENT_TIMESTAMP
    `;

    const values = [
      data.consumerGroupId,
      data.instanceId,
      data.hostname,
      data.status,
      data.isConnected,
      JSON.stringify(data.partitionAssignments),
      JSON.stringify(data.currentOffsets),
      data.lagTotal || 0,
    ];

    await this.pool.query(query, values);
    
    // Fetch the inserted/updated record
    const selectQuery = 'SELECT * FROM kafka_consumer_status WHERE consumer_group_id = ? AND instance_id = ?';
    const [rows] = await this.pool.query<RowDataPacket[]>(selectQuery, [data.consumerGroupId, data.instanceId]);
    return this.mapConsumerStatus(rows[0]);
  }

  async getConsumerStatusByGroupId(consumerGroupId: number): Promise<ConsumerStatus[]> {
    const query = 'SELECT * FROM kafka_consumer_status WHERE consumer_group_id = ? ORDER BY instance_id';
    const [rows] = await this.pool.query<RowDataPacket[]>(query, [consumerGroupId]);
    return rows.map(row => this.mapConsumerStatus(row));
  }

  async updateConsumerHeartbeat(consumerGroupId: number, instanceId: string): Promise<void> {
    const query = `
      UPDATE kafka_consumer_status 
      SET last_heartbeat_at = CURRENT_TIMESTAMP
      WHERE consumer_group_id = ? AND instance_id = ?
    `;
    await this.pool.query(query, [consumerGroupId, instanceId]);
  }

  // =====================================================
  // Message Processing Operations
  // =====================================================

  async createMessageProcessing(data: CreateMessageProcessingRequest): Promise<MessageProcessing> {
    const query = `
      INSERT INTO kafka_message_processing 
        (consumer_group_id, message_id, correlation_id, topic, \`partition_number\`, \`offset_value\`, 
         event_type, event_payload, processed_by, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'PROCESSING')
    `;

    const values = [
      data.consumerGroupId,
      data.messageId,
      data.correlationId,
      data.topic,
      data.partition,
      data.offset,
      data.eventType,
      JSON.stringify(data.eventPayload),
      data.processedBy,
    ];

    const [result] = await this.pool.query<ResultSetHeader>(query, values);
    
    // Fetch the inserted record
    const selectQuery = 'SELECT * FROM kafka_message_processing WHERE id = ?';
    const [rows] = await this.pool.query<RowDataPacket[]>(selectQuery, [result.insertId]);
    return this.mapMessageProcessing(rows[0]);
  }

  async updateMessageProcessing(id: number, data: UpdateMessageProcessingRequest): Promise<void> {
    const query = `
      UPDATE kafka_message_processing 
      SET status = ?, 
          processing_completed_at = COALESCE(?, processing_completed_at),
          error_message = COALESCE(?, error_message),
          error_stack = COALESCE(?, error_stack),
          retry_count = COALESCE(?, retry_count)
      WHERE id = ?
    `;

    await this.pool.query(query, [
      data.status,
      data.processingCompletedAt,
      data.errorMessage,
      data.errorStack,
      data.retryCount,
      id,
    ]);
  }

  async getMessageProcessing(filter: MessageProcessingFilter): Promise<MessageProcessing[]> {
    let query = 'SELECT * FROM kafka_message_processing WHERE 1=1';
    const values: any[] = [];

    if (filter.consumerGroupId) {
      query += ` AND consumer_group_id = ?`;
      values.push(filter.consumerGroupId);
    }

    if (filter.topic) {
      query += ` AND topic = ?`;
      values.push(filter.topic);
    }

    if (filter.eventType) {
      query += ` AND event_type = ?`;
      values.push(filter.eventType);
    }

    if (filter.status) {
      query += ` AND status = ?`;
      values.push(filter.status);
    }

    if (filter.correlationId) {
      query += ` AND correlation_id = ?`;
      values.push(filter.correlationId);
    }

    if (filter.startDate) {
      query += ` AND processing_started_at >= ?`;
      values.push(filter.startDate);
    }

    if (filter.endDate) {
      query += ` AND processing_started_at <= ?`;
      values.push(filter.endDate);
    }

    query += ' ORDER BY processing_started_at DESC';

    if (filter.limit) {
      query += ` LIMIT ?`;
      values.push(filter.limit);
    }

    if (filter.offset) {
      query += ` OFFSET ?`;
      values.push(filter.offset);
    }

    const [rows] = await this.pool.query<RowDataPacket[]>(query, values);
    return rows.map(row => this.mapMessageProcessing(row));
  }

  // =====================================================
  // Consumer Error Operations
  // =====================================================

  async createConsumerError(data: CreateConsumerErrorRequest): Promise<ConsumerError> {
    const query = `
      INSERT INTO kafka_consumer_errors 
        (consumer_group_id, message_processing_id, error_type, error_message, error_stack,
         severity, topic, \`partition_number\`, \`offset_value\`, event_type, event_payload, retry_count, max_retries_exceeded)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      data.consumerGroupId,
      data.messageProcessingId,
      data.errorType,
      data.errorMessage,
      data.errorStack,
      data.severity,
      data.topic,
      data.partition,
      data.offset,
      data.eventType,
      JSON.stringify(data.eventPayload),
      data.retryCount || 0,
      data.maxRetriesExceeded || false,
    ];

    const [result] = await this.pool.query<ResultSetHeader>(query, values);
    
    // Fetch the inserted record
    const selectQuery = 'SELECT * FROM kafka_consumer_errors WHERE id = ?';
    const [rows] = await this.pool.query<RowDataPacket[]>(selectQuery, [result.insertId]);
    return this.mapConsumerError(rows[0]);
  }

  async acknowledgeError(errorId: number, data: AcknowledgeErrorRequest): Promise<void> {
    const query = `
      UPDATE kafka_consumer_errors 
      SET acknowledged = 1, 
          acknowledged_by = ?, 
          acknowledged_at = CURRENT_TIMESTAMP,
          resolution_notes = ?
      WHERE id = ?
    `;

    await this.pool.query(query, [data.acknowledgedBy, data.resolutionNotes, errorId]);
  }

  async getConsumerErrors(filter: ConsumerErrorFilter): Promise<ConsumerError[]> {
    let query = 'SELECT * FROM kafka_consumer_errors WHERE 1=1';
    const values: any[] = [];

    if (filter.consumerGroupId) {
      query += ` AND consumer_group_id = ?`;
      values.push(filter.consumerGroupId);
    }

    if (filter.severity) {
      query += ` AND severity = ?`;
      values.push(filter.severity);
    }

    if (filter.acknowledged !== undefined) {
      query += ` AND acknowledged = ?`;
      values.push(filter.acknowledged ? 1 : 0);
    }

    if (filter.topic) {
      query += ` AND topic = ?`;
      values.push(filter.topic);
    }

    if (filter.startDate) {
      query += ` AND occurred_at >= ?`;
      values.push(filter.startDate);
    }

    if (filter.endDate) {
      query += ` AND occurred_at <= ?`;
      values.push(filter.endDate);
    }

    query += ' ORDER BY severity DESC, occurred_at DESC';

    if (filter.limit) {
      query += ` LIMIT ?`;
      values.push(filter.limit);
    }

    if (filter.offset) {
      query += ` OFFSET ?`;
      values.push(filter.offset);
    }

    const [rows] = await this.pool.query<RowDataPacket[]>(query, values);
    return rows.map(row => this.mapConsumerError(row));
  }

  // =====================================================
  // Consumer Metrics Operations
  // =====================================================

  async createConsumerMetrics(data: CreateConsumerMetricsRequest): Promise<ConsumerMetrics> {
    const query = `
      INSERT INTO kafka_consumer_metrics 
        (consumer_group_id, time_window, messages_processed, messages_succeeded, 
         messages_failed, messages_retried, avg_processing_time_ms, min_processing_time_ms,
         max_processing_time_ms, p95_processing_time_ms, p99_processing_time_ms,
         messages_per_second, bytes_processed, total_lag, max_lag, avg_lag, error_rate, retry_rate)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      data.consumerGroupId,
      data.timeWindow,
      data.messagesProcessed,
      data.messagesSucceeded,
      data.messagesFailed,
      data.messagesRetried,
      data.avgProcessingTimeMs,
      data.minProcessingTimeMs,
      data.maxProcessingTimeMs,
      data.p95ProcessingTimeMs,
      data.p99ProcessingTimeMs,
      data.messagesPerSecond,
      data.bytesProcessed,
      data.totalLag,
      data.maxLag,
      data.avgLag,
      data.errorRate,
      data.retryRate,
    ];

    const [result] = await this.pool.query<ResultSetHeader>(query, values);
    
    // Fetch the inserted record
    const selectQuery = 'SELECT * FROM kafka_consumer_metrics WHERE id = ?';
    const [rows] = await this.pool.query<RowDataPacket[]>(selectQuery, [result.insertId]);
    return this.mapConsumerMetrics(rows[0]);
  }

  async getConsumerMetrics(filter: ConsumerMetricsFilter): Promise<ConsumerMetrics[]> {
    let query = 'SELECT * FROM kafka_consumer_metrics WHERE 1=1';
    const values: any[] = [];

    if (filter.consumerGroupId) {
      query += ` AND consumer_group_id = ?`;
      values.push(filter.consumerGroupId);
    }

    if (filter.timeWindow) {
      query += ` AND time_window = ?`;
      values.push(filter.timeWindow);
    }

    if (filter.startDate) {
      query += ` AND metric_timestamp >= ?`;
      values.push(filter.startDate);
    }

    if (filter.endDate) {
      query += ` AND metric_timestamp <= ?`;
      values.push(filter.endDate);
    }

    query += ' ORDER BY metric_timestamp DESC';

    const [rows] = await this.pool.query<RowDataPacket[]>(query, values);
    return rows.map(row => this.mapConsumerMetrics(row));
  }

  // =====================================================
  // Consumer Offset Operations
  // =====================================================

  async createConsumerOffset(data: CreateConsumerOffsetRequest): Promise<ConsumerOffset> {
    const query = `
      INSERT INTO kafka_consumer_offsets 
        (consumer_group_id, topic, \`partition_number\`, current_offset, committed_offset, end_offset, lag)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      data.consumerGroupId,
      data.topic,
      data.partition,
      data.currentOffset,
      data.committedOffset,
      data.endOffset,
      data.lag,
    ];

    const [result] = await this.pool.query<ResultSetHeader>(query, values);
    
    // Fetch the inserted record
    const selectQuery = 'SELECT * FROM kafka_consumer_offsets WHERE id = ?';
    const [rows] = await this.pool.query<RowDataPacket[]>(selectQuery, [result.insertId]);
    return this.mapConsumerOffset(rows[0]);
  }

  // =====================================================
  // Rebalance Event Operations
  // =====================================================

  async createRebalanceEvent(data: CreateRebalanceEventRequest): Promise<RebalanceEvent> {
    const query = `
      INSERT INTO kafka_consumer_rebalance_events 
        (consumer_group_id, event_type, partitions_revoked, partitions_assigned, 
         member_count, rebalance_reason, duration_ms)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      data.consumerGroupId,
      data.eventType,
      JSON.stringify(data.partitionsRevoked),
      JSON.stringify(data.partitionsAssigned),
      data.memberCount,
      data.rebalanceReason,
      data.durationMs,
    ];

    const [result] = await this.pool.query<ResultSetHeader>(query, values);
    
    // Fetch the inserted record
    const selectQuery = 'SELECT * FROM kafka_consumer_rebalance_events WHERE id = ?';
    const [rows] = await this.pool.query<RowDataPacket[]>(selectQuery, [result.insertId]);
    return this.mapRebalanceEvent(rows[0]);
  }

  // =====================================================
  // View Operations (Read-Only)
  // =====================================================

  async getConsumerGroupOverview(): Promise<ConsumerGroupOverview[]> {
    const query = 'SELECT * FROM v_consumer_group_overview ORDER BY group_name';
    const [rows] = await this.pool.query<RowDataPacket[]>(query);
    return rows.map(row => this.mapConsumerGroupOverview(row));
  }

  async getProcessingStats(): Promise<ProcessingStats[]> {
    const query = 'SELECT * FROM v_recent_processing_stats ORDER BY failed_count DESC';
    const [rows] = await this.pool.query<RowDataPacket[]>(query);
    return rows.map(row => this.mapProcessingStats(row));
  }

  async getCurrentLag(): Promise<CurrentLag[]> {
    const query = 'SELECT * FROM v_current_consumer_lag ORDER BY lag DESC';
    const [rows] = await this.pool.query<RowDataPacket[]>(query);
    return rows.map(row => this.mapCurrentLag(row));
  }

  // =====================================================
  // Mapper Functions
  // =====================================================

  private mapConsumerGroup(row: any): ConsumerGroup {
    return {
      id: row.id,
      groupId: row.group_id,
      groupName: row.group_name,
      description: row.description,
      topics: typeof row.topics === 'string' ? JSON.parse(row.topics) : row.topics,
      handlerClass: row.handler_class,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      lastActiveAt: row.last_active_at,
    };
  }

  private mapConsumerStatus(row: any): ConsumerStatus {
    return {
      id: row.id,
      consumerGroupId: row.consumer_group_id,
      instanceId: row.instance_id,
      hostname: row.hostname,
      status: row.status,
      isConnected: Boolean(row.is_connected),
      partitionAssignments: typeof row.partition_assignments === 'string' 
        ? JSON.parse(row.partition_assignments) 
        : row.partition_assignments,
      currentOffsets: typeof row.current_offsets === 'string' 
        ? JSON.parse(row.current_offsets) 
        : row.current_offsets,
      lagTotal: row.lag_total,
      startedAt: row.started_at,
      lastHeartbeatAt: row.last_heartbeat_at,
      stoppedAt: row.stopped_at,
    };
  }

  private mapMessageProcessing(row: any): MessageProcessing {
    return {
      id: row.id,
      consumerGroupId: row.consumer_group_id,
      messageId: row.message_id,
      correlationId: row.correlation_id,
      topic: row.topic,
      partition: row.partition,
      offset: row.offset,
      eventType: row.event_type,
      eventPayload: typeof row.event_payload === 'string' 
        ? JSON.parse(row.event_payload) 
        : row.event_payload,
      status: row.status,
      processingStartedAt: row.processing_started_at,
      processingCompletedAt: row.processing_completed_at,
      processingDurationMs: row.processing_duration_ms,
      retryCount: row.retry_count,
      errorMessage: row.error_message,
      errorStack: row.error_stack,
      processedBy: row.processed_by,
    };
  }

  private mapConsumerError(row: any): ConsumerError {
    return {
      id: row.id,
      consumerGroupId: row.consumer_group_id,
      messageProcessingId: row.message_processing_id,
      errorType: row.error_type,
      errorMessage: row.error_message,
      errorStack: row.error_stack,
      severity: row.severity,
      topic: row.topic,
      partition: row.partition,
      offset: row.offset,
      eventType: row.event_type,
      eventPayload: typeof row.event_payload === 'string' 
        ? JSON.parse(row.event_payload) 
        : row.event_payload,
      retryCount: row.retry_count,
      maxRetriesExceeded: Boolean(row.max_retries_exceeded),
      acknowledged: Boolean(row.acknowledged),
      acknowledgedBy: row.acknowledged_by,
      acknowledgedAt: row.acknowledged_at,
      resolutionNotes: row.resolution_notes,
      occurredAt: row.occurred_at,
    };
  }

  private mapConsumerMetrics(row: any): ConsumerMetrics {
    return {
      id: row.id,
      consumerGroupId: row.consumer_group_id,
      metricTimestamp: row.metric_timestamp,
      timeWindow: row.time_window,
      messagesProcessed: row.messages_processed,
      messagesSucceeded: row.messages_succeeded,
      messagesFailed: row.messages_failed,
      messagesRetried: row.messages_retried,
      avgProcessingTimeMs: row.avg_processing_time_ms,
      minProcessingTimeMs: row.min_processing_time_ms,
      maxProcessingTimeMs: row.max_processing_time_ms,
      p95ProcessingTimeMs: row.p95_processing_time_ms,
      p99ProcessingTimeMs: row.p99_processing_time_ms,
      messagesPerSecond: row.messages_per_second,
      bytesProcessed: row.bytes_processed,
      totalLag: row.total_lag,
      maxLag: row.max_lag,
      avgLag: row.avg_lag,
      errorRate: row.error_rate,
      retryRate: row.retry_rate,
    };
  }

  private mapConsumerOffset(row: any): ConsumerOffset {
    return {
      id: row.id,
      consumerGroupId: row.consumer_group_id,
      topic: row.topic,
      partition: row.partition,
      currentOffset: row.current_offset,
      committedOffset: row.committed_offset,
      endOffset: row.end_offset,
      lag: row.lag,
      recordedAt: row.recorded_at,
    };
  }

  private mapRebalanceEvent(row: any): RebalanceEvent {
    return {
      id: row.id,
      consumerGroupId: row.consumer_group_id,
      eventType: row.event_type,
      partitionsRevoked: typeof row.partitions_revoked === 'string' 
        ? JSON.parse(row.partitions_revoked) 
        : row.partitions_revoked,
      partitionsAssigned: typeof row.partitions_assigned === 'string' 
        ? JSON.parse(row.partitions_assigned) 
        : row.partitions_assigned,
      memberCount: row.member_count,
      rebalanceReason: row.rebalance_reason,
      durationMs: row.duration_ms,
      occurredAt: row.occurred_at,
    };
  }

  private mapConsumerGroupOverview(row: any): ConsumerGroupOverview {
    return {
      id: row.id,
      groupId: row.group_id,
      groupName: row.group_name,
      topics: typeof row.topics === 'string' ? JSON.parse(row.topics) : row.topics,
      status: row.status,
      lastActiveAt: row.last_active_at,
      activeInstances: parseInt(row.active_instances) || 0,
      totalLag: parseInt(row.total_lag) || 0,
      messagesLastHour: parseInt(row.messages_last_hour) || 0,
      unackedErrorsLastHour: parseInt(row.unacked_errors_last_hour) || 0,
    };
  }

  private mapProcessingStats(row: any): ProcessingStats {
    return {
      groupId: row.group_id,
      groupName: row.group_name,
      topic: row.topic,
      eventType: row.event_type,
      status: row.status,
      messageCount: parseInt(row.message_count) || 0,
      avgDurationMs: parseFloat(row.avg_duration_ms) || 0,
      maxDurationMs: parseInt(row.max_duration_ms) || 0,
      failedCount: parseInt(row.failed_count) || 0,
    };
  }

  private mapCurrentLag(row: any): CurrentLag {
    return {
      groupId: row.group_id,
      groupName: row.group_name,
      topic: row.topic,
      partition: row.partition,
      currentOffset: parseInt(row.current_offset) || 0,
      endOffset: row.end_offset ? parseInt(row.end_offset) : undefined,
      lag: row.lag ? parseInt(row.lag) : undefined,
      recordedAt: row.recorded_at,
    };
  }
}

