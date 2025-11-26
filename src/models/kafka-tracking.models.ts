/**
 * Kafka Consumer Tracking Models
 * Models for consumer management and visibility
 */

// =====================================================
// Consumer Group Models
// =====================================================

export interface ConsumerGroup {
  id: number;
  groupId: string;
  groupName: string;
  description?: string;
  topics: string[];
  handlerClass: string;
  status: ConsumerGroupStatus;
  createdAt: Date;
  updatedAt: Date;
  lastActiveAt?: Date;
}

export type ConsumerGroupStatus = 'ACTIVE' | 'PAUSED' | 'STOPPED' | 'ERROR';

export interface CreateConsumerGroupRequest {
  groupId: string;
  groupName: string;
  description?: string;
  topics: string[];
  handlerClass: string;
}

// =====================================================
// Consumer Status Models
// =====================================================

export interface ConsumerStatus {
  id: number;
  consumerGroupId: number;
  instanceId: string;
  hostname?: string;
  status: ConsumerInstanceStatus;
  isConnected: boolean;
  partitionAssignments?: PartitionAssignment[];
  currentOffsets?: Record<string, Record<number, number>>;
  lagTotal: number;
  startedAt: Date;
  lastHeartbeatAt: Date;
  stoppedAt?: Date;
}

export type ConsumerInstanceStatus = 'RUNNING' | 'PAUSED' | 'STOPPED' | 'ERROR' | 'REBALANCING';

export interface PartitionAssignment {
  topic: string;
  partition: number;
}

// =====================================================
// Message Processing Models
// =====================================================

export interface MessageProcessing {
  id: number;
  consumerGroupId: number;
  messageId?: string;
  correlationId?: string;
  topic: string;
  partition: number;
  offset: number;
  eventType: string;
  eventPayload?: any;
  status: ProcessingStatus;
  processingStartedAt: Date;
  processingCompletedAt?: Date;
  processingDurationMs?: number;
  retryCount: number;
  errorMessage?: string;
  errorStack?: string;
  processedBy?: string;
}

export type ProcessingStatus = 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'RETRYING' | 'DEAD_LETTER';

export interface CreateMessageProcessingRequest {
  consumerGroupId: number;
  messageId?: string;
  correlationId?: string;
  topic: string;
  partition: number;
  offset: number;
  eventType: string;
  eventPayload?: any;
  processedBy?: string;
}

export interface UpdateMessageProcessingRequest {
  status: ProcessingStatus;
  processingCompletedAt?: Date;
  errorMessage?: string;
  errorStack?: string;
  retryCount?: number;
}

// =====================================================
// Consumer Error Models
// =====================================================

export interface ConsumerError {
  id: number;
  consumerGroupId: number;
  messageProcessingId?: number;
  errorType: string;
  errorMessage: string;
  errorStack?: string;
  severity: ErrorSeverity;
  topic?: string;
  partition?: number;
  offset?: number;
  eventType?: string;
  eventPayload?: any;
  retryCount: number;
  maxRetriesExceeded: boolean;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  resolutionNotes?: string;
  occurredAt: Date;
}

export type ErrorSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface CreateConsumerErrorRequest {
  consumerGroupId: number;
  messageProcessingId?: number;
  errorType: string;
  errorMessage: string;
  errorStack?: string;
  severity: ErrorSeverity;
  topic?: string;
  partition?: number;
  offset?: number;
  eventType?: string;
  eventPayload?: any;
  retryCount?: number;
  maxRetriesExceeded?: boolean;
}

export interface AcknowledgeErrorRequest {
  acknowledgedBy: string;
  resolutionNotes?: string;
}

// =====================================================
// Consumer Metrics Models
// =====================================================

export interface ConsumerMetrics {
  id: number;
  consumerGroupId: number;
  metricTimestamp: Date;
  timeWindow: MetricTimeWindow;
  messagesProcessed: number;
  messagesSucceeded: number;
  messagesFailed: number;
  messagesRetried: number;
  avgProcessingTimeMs?: number;
  minProcessingTimeMs?: number;
  maxProcessingTimeMs?: number;
  p95ProcessingTimeMs?: number;
  p99ProcessingTimeMs?: number;
  messagesPerSecond?: number;
  bytesProcessed?: number;
  totalLag?: number;
  maxLag?: number;
  avgLag?: number;
  errorRate?: number;
  retryRate?: number;
}

export type MetricTimeWindow = '1min' | '5min' | '15min' | '1hour' | '1day';

export interface CreateConsumerMetricsRequest {
  consumerGroupId: number;
  timeWindow: MetricTimeWindow;
  messagesProcessed: number;
  messagesSucceeded: number;
  messagesFailed: number;
  messagesRetried: number;
  avgProcessingTimeMs?: number;
  minProcessingTimeMs?: number;
  maxProcessingTimeMs?: number;
  p95ProcessingTimeMs?: number;
  p99ProcessingTimeMs?: number;
  messagesPerSecond?: number;
  bytesProcessed?: number;
  totalLag?: number;
  maxLag?: number;
  avgLag?: number;
  errorRate?: number;
  retryRate?: number;
}

// =====================================================
// Consumer Offset Models
// =====================================================

export interface ConsumerOffset {
  id: number;
  consumerGroupId: number;
  topic: string;
  partition: number;
  currentOffset: number;
  committedOffset?: number;
  endOffset?: number;
  lag?: number;
  recordedAt: Date;
}

export interface CreateConsumerOffsetRequest {
  consumerGroupId: number;
  topic: string;
  partition: number;
  currentOffset: number;
  committedOffset?: number;
  endOffset?: number;
  lag?: number;
}

// =====================================================
// Rebalance Event Models
// =====================================================

export interface RebalanceEvent {
  id: number;
  consumerGroupId: number;
  eventType: RebalanceEventType;
  partitionsRevoked?: PartitionAssignment[];
  partitionsAssigned?: PartitionAssignment[];
  memberCount?: number;
  rebalanceReason?: string;
  durationMs?: number;
  occurredAt: Date;
}

export type RebalanceEventType = 
  | 'REBALANCE_START' 
  | 'PARTITIONS_REVOKED' 
  | 'PARTITIONS_ASSIGNED' 
  | 'REBALANCE_COMPLETE';

export interface CreateRebalanceEventRequest {
  consumerGroupId: number;
  eventType: RebalanceEventType;
  partitionsRevoked?: PartitionAssignment[];
  partitionsAssigned?: PartitionAssignment[];
  memberCount?: number;
  rebalanceReason?: string;
  durationMs?: number;
}

// =====================================================
// View Models (Read-Only)
// =====================================================

export interface ConsumerGroupOverview {
  id: number;
  groupId: string;
  groupName: string;
  topics: string[];
  status: ConsumerGroupStatus;
  lastActiveAt?: Date;
  activeInstances: number;
  totalLag: number;
  messagesLastHour: number;
  unackedErrorsLastHour: number;
}

export interface ProcessingStats {
  groupId: string;
  groupName: string;
  topic: string;
  eventType: string;
  status: ProcessingStatus;
  messageCount: number;
  avgDurationMs: number;
  maxDurationMs: number;
  failedCount: number;
}

export interface CurrentLag {
  groupId: string;
  groupName: string;
  topic: string;
  partition: number;
  currentOffset: number;
  endOffset?: number;
  lag?: number;
  recordedAt: Date;
}

// =====================================================
// Query Filter Models
// =====================================================

export interface ConsumerGroupFilter {
  status?: ConsumerGroupStatus;
  groupId?: string;
  topic?: string;
}

export interface MessageProcessingFilter {
  consumerGroupId?: number;
  topic?: string;
  eventType?: string;
  status?: ProcessingStatus;
  correlationId?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

export interface ConsumerErrorFilter {
  consumerGroupId?: number;
  severity?: ErrorSeverity;
  acknowledged?: boolean;
  topic?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

export interface ConsumerMetricsFilter {
  consumerGroupId?: number;
  timeWindow?: MetricTimeWindow;
  startDate?: Date;
  endDate?: Date;
}

// =====================================================
// Dashboard Models
// =====================================================

export interface ConsumerDashboard {
  overview: {
    totalConsumerGroups: number;
    activeConsumerGroups: number;
    totalActiveInstances: number;
    totalLag: number;
    messagesProcessedLastHour: number;
    errorRateLastHour: number;
  };
  consumerGroups: ConsumerGroupOverview[];
  recentErrors: ConsumerError[];
  topSlowMessages: MessageProcessing[];
  lagByTopic: CurrentLag[];
}

export interface ConsumerHealthReport {
  groupId: string;
  groupName: string;
  healthScore: number; // 0-100
  status: 'HEALTHY' | 'WARNING' | 'CRITICAL';
  issues: HealthIssue[];
  metrics: {
    avgProcessingTime: number;
    errorRate: number;
    lag: number;
    throughput: number;
  };
  recommendations: string[];
}

export interface HealthIssue {
  severity: ErrorSeverity;
  category: 'LAG' | 'ERROR_RATE' | 'PERFORMANCE' | 'CONNECTIVITY';
  description: string;
  detectedAt: Date;
}

