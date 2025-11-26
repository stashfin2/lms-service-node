/**
 * Consumer Tracking Service
 * Service layer for tracking and monitoring Kafka consumers
 * Follows Single Responsibility Principle and Service Layer Pattern
 */

import { singleton, inject } from 'tsyringe';
import { KafkaTrackingRepository } from '../../repositories/kafka-tracking.repo';
import {
  ConsumerGroup,
  CreateConsumerGroupRequest,
  MessageProcessing,
  CreateMessageProcessingRequest,
  UpdateMessageProcessingRequest,
  ConsumerError,
  CreateConsumerErrorRequest,
  AcknowledgeErrorRequest,
  ConsumerMetrics,
  CreateConsumerMetricsRequest,
  CreateConsumerOffsetRequest,
  CreateRebalanceEventRequest,
  ConsumerDashboard,
  ConsumerHealthReport,
  MessageProcessingFilter,
  ConsumerErrorFilter,
  ConsumerMetricsFilter,
  HealthIssue,
} from '../../models/kafka-tracking.models';
import { IEvent } from '../interfaces/IEvent';
import { logger } from '../../utils/logger';
import * as os from 'os';

@singleton()
export class ConsumerTrackingService {
  private instanceId: string;
  private hostname: string;

  constructor(
    @inject(KafkaTrackingRepository) private repository: KafkaTrackingRepository
  ) {
    this.instanceId = `${os.hostname()}-${process.pid}-${Date.now()}`;
    this.hostname = os.hostname();
  }

  // =====================================================
  // Consumer Group Operations
  // =====================================================

  async registerConsumerGroup(data: CreateConsumerGroupRequest): Promise<ConsumerGroup> {
    try {
      logger.info('Registering consumer group', { groupId: data.groupId });
      return await this.repository.createConsumerGroup(data);
    } catch (error: any) {
      logger.error('Error registering consumer group', { groupId: data.groupId, error });
      throw error;
    }
  }

  async getConsumerGroupByGroupId(groupId: string): Promise<ConsumerGroup | null> {
    return await this.repository.getConsumerGroupByGroupId(groupId);
  }

  async getAllConsumerGroups(): Promise<ConsumerGroup[]> {
    return await this.repository.getAllConsumerGroups();
  }

  async updateConsumerGroupStatus(groupId: string, status: string): Promise<void> {
    await this.repository.updateConsumerGroupStatus(groupId, status, new Date());
  }

  // =====================================================
  // Message Processing Tracking
  // =====================================================

  async startMessageProcessing(
    consumerGroupId: number,
    topic: string,
    partition: number,
    offset: number,
    event: IEvent
  ): Promise<MessageProcessing> {
    const data: CreateMessageProcessingRequest = {
      consumerGroupId,
      messageId: event.eventId,
      correlationId: event.correlationId,
      topic,
      partition,
      offset,
      eventType: event.eventType,
      eventPayload: event.payload,
      processedBy: this.instanceId,
    };

    try {
      return await this.repository.createMessageProcessing(data);
    } catch (error: any) {
      logger.error('Error starting message processing tracking', { data, error });
      throw error;
    }
  }

  async completeMessageProcessing(processingId: number): Promise<void> {
    const data: UpdateMessageProcessingRequest = {
      status: 'COMPLETED',
      processingCompletedAt: new Date(),
    };

    await this.repository.updateMessageProcessing(processingId, data);
  }

  async failMessageProcessing(
    processingId: number,
    error: Error,
    retryCount: number
  ): Promise<void> {
    const data: UpdateMessageProcessingRequest = {
      status: retryCount > 0 ? 'RETRYING' : 'FAILED',
      processingCompletedAt: new Date(),
      errorMessage: error.message,
      errorStack: error.stack,
      retryCount,
    };

    await this.repository.updateMessageProcessing(processingId, data);
  }

  async getMessageProcessing(filter: MessageProcessingFilter): Promise<MessageProcessing[]> {
    return await this.repository.getMessageProcessing(filter);
  }

  // =====================================================
  // Error Tracking
  // =====================================================

  async trackConsumerError(
    consumerGroupId: number,
    error: Error,
    context: {
      messageProcessingId?: number;
      topic?: string;
      partition?: number;
      offset?: number;
      eventType?: string;
      eventPayload?: any;
      retryCount?: number;
      maxRetriesExceeded?: boolean;
    }
  ): Promise<ConsumerError> {
    const severity = this.determineSeverity(error, context.retryCount || 0);

    const data: CreateConsumerErrorRequest = {
      consumerGroupId,
      messageProcessingId: context.messageProcessingId,
      errorType: error.name || 'Error',
      errorMessage: error.message,
      errorStack: error.stack,
      severity,
      topic: context.topic,
      partition: context.partition,
      offset: context.offset,
      eventType: context.eventType,
      eventPayload: context.eventPayload,
      retryCount: context.retryCount,
      maxRetriesExceeded: context.maxRetriesExceeded,
    };

    try {
      const consumerError = await this.repository.createConsumerError(data);
      
      // Log critical errors
      if (severity === 'CRITICAL' || severity === 'HIGH') {
        logger.error('Critical consumer error detected', {
          errorId: consumerError.id,
          consumerGroupId,
          severity,
          error: error.message,
        });
      }

      return consumerError;
    } catch (err: any) {
      logger.error('Error tracking consumer error', { data, error: err });
      throw err;
    }
  }

  async acknowledgeError(errorId: number, acknowledgedBy: string, resolutionNotes?: string): Promise<void> {
    const data: AcknowledgeErrorRequest = {
      acknowledgedBy,
      resolutionNotes,
    };

    await this.repository.acknowledgeError(errorId, data);
    logger.info('Error acknowledged', { errorId, acknowledgedBy });
  }

  async getConsumerErrors(filter: ConsumerErrorFilter): Promise<ConsumerError[]> {
    return await this.repository.getConsumerErrors(filter);
  }

  async getUnacknowledgedErrors(consumerGroupId?: number): Promise<ConsumerError[]> {
    const filter: ConsumerErrorFilter = {
      acknowledged: false,
      limit: 100,
    };

    if (consumerGroupId) {
      filter.consumerGroupId = consumerGroupId;
    }

    return await this.repository.getConsumerErrors(filter);
  }

  // =====================================================
  // Metrics Tracking
  // =====================================================

  async recordConsumerMetrics(data: CreateConsumerMetricsRequest): Promise<ConsumerMetrics> {
    try {
      return await this.repository.createConsumerMetrics(data);
    } catch (error: any) {
      logger.error('Error recording consumer metrics', { data, error });
      throw error;
    }
  }

  async getConsumerMetrics(filter: ConsumerMetricsFilter): Promise<ConsumerMetrics[]> {
    return await this.repository.getConsumerMetrics(filter);
  }

  // =====================================================
  // Offset Tracking
  // =====================================================

  async trackConsumerOffset(data: CreateConsumerOffsetRequest): Promise<void> {
    try {
      await this.repository.createConsumerOffset(data);
    } catch (error: any) {
      // Don't throw - offset tracking failures shouldn't break processing
      logger.error('Error tracking consumer offset', { data, error });
    }
  }

  // =====================================================
  // Rebalance Tracking
  // =====================================================

  async trackRebalanceEvent(data: CreateRebalanceEventRequest): Promise<void> {
    try {
      await this.repository.createRebalanceEvent(data);
      logger.info('Rebalance event tracked', {
        consumerGroupId: data.consumerGroupId,
        eventType: data.eventType,
      });
    } catch (error: any) {
      logger.error('Error tracking rebalance event', { data, error });
    }
  }

  // =====================================================
  // Dashboard and Reporting
  // =====================================================

  async getDashboard(): Promise<ConsumerDashboard> {
    try {
      const overview = await this.repository.getConsumerGroupOverview();
      const recentErrors = await this.getConsumerErrors({
        acknowledged: false,
        limit: 10,
        startDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
      });

      const slowMessages = await this.getMessageProcessing({
        startDate: new Date(Date.now() - 60 * 60 * 1000), // Last hour
        limit: 10,
      });

      // Sort by duration
      slowMessages.sort((a, b) => 
        (b.processingDurationMs || 0) - (a.processingDurationMs || 0)
      );

      const lagByTopic = await this.repository.getCurrentLag();

      // Calculate overall metrics
      const totalConsumerGroups = overview.length;
      const activeConsumerGroups = overview.filter(g => g.status === 'ACTIVE').length;
      const totalActiveInstances = overview.reduce((sum, g) => sum + g.activeInstances, 0);
      const totalLag = overview.reduce((sum, g) => sum + g.totalLag, 0);
      const messagesProcessedLastHour = overview.reduce((sum, g) => sum + g.messagesLastHour, 0);

      // Calculate error rate
      const errorCount = recentErrors.length;
      const errorRate = messagesProcessedLastHour > 0 
        ? (errorCount / messagesProcessedLastHour) * 100 
        : 0;

      return {
        overview: {
          totalConsumerGroups,
          activeConsumerGroups,
          totalActiveInstances,
          totalLag,
          messagesProcessedLastHour,
          errorRateLastHour: Math.round(errorRate * 100) / 100,
        },
        consumerGroups: overview,
        recentErrors: recentErrors.slice(0, 10),
        topSlowMessages: slowMessages.slice(0, 10),
        lagByTopic: lagByTopic.slice(0, 20),
      };
    } catch (error: any) {
      logger.error('Error generating dashboard', { error });
      throw error;
    }
  }

  async getConsumerHealthReport(groupId: string): Promise<ConsumerHealthReport> {
    try {
      const consumerGroup = await this.repository.getConsumerGroupByGroupId(groupId);
      if (!consumerGroup) {
        throw new Error(`Consumer group not found: ${groupId}`);
      }

      // Get recent metrics
      const metrics = await this.getConsumerMetrics({
        consumerGroupId: consumerGroup.id,
        timeWindow: '1hour',
        startDate: new Date(Date.now() - 60 * 60 * 1000),
      });

      const latestMetrics = metrics[0];

      // Get recent errors
      const errors = await this.getConsumerErrors({
        consumerGroupId: consumerGroup.id,
        acknowledged: false,
        startDate: new Date(Date.now() - 60 * 60 * 1000),
      });

      // Get current lag
      const lag = await this.repository.getCurrentLag();
      const groupLag = lag.filter(l => l.groupId === groupId);
      const totalLag = groupLag.reduce((sum, l) => sum + (l.lag || 0), 0);

      // Analyze health
      const issues: HealthIssue[] = [];
      let healthScore = 100;

      // Check lag
      if (totalLag > 10000) {
        healthScore -= 30;
        issues.push({
          severity: 'CRITICAL',
          category: 'LAG',
          description: `High consumer lag detected: ${totalLag} messages behind`,
          detectedAt: new Date(),
        });
      } else if (totalLag > 1000) {
        healthScore -= 15;
        issues.push({
          severity: 'HIGH',
          category: 'LAG',
          description: `Moderate consumer lag: ${totalLag} messages behind`,
          detectedAt: new Date(),
        });
      }

      // Check error rate
      const errorRate = latestMetrics?.errorRate || 0;
      if (errorRate > 10) {
        healthScore -= 25;
        issues.push({
          severity: 'CRITICAL',
          category: 'ERROR_RATE',
          description: `High error rate: ${errorRate.toFixed(2)}%`,
          detectedAt: new Date(),
        });
      } else if (errorRate > 5) {
        healthScore -= 10;
        issues.push({
          severity: 'HIGH',
          category: 'ERROR_RATE',
          description: `Elevated error rate: ${errorRate.toFixed(2)}%`,
          detectedAt: new Date(),
        });
      }

      // Check processing time
      const avgProcessingTime = latestMetrics?.avgProcessingTimeMs || 0;
      if (avgProcessingTime > 5000) {
        healthScore -= 20;
        issues.push({
          severity: 'HIGH',
          category: 'PERFORMANCE',
          description: `Slow message processing: ${avgProcessingTime}ms average`,
          detectedAt: new Date(),
        });
      } else if (avgProcessingTime > 2000) {
        healthScore -= 10;
        issues.push({
          severity: 'MEDIUM',
          category: 'PERFORMANCE',
          description: `Elevated processing time: ${avgProcessingTime}ms average`,
          detectedAt: new Date(),
        });
      }

      // Check connectivity
      if (consumerGroup.status !== 'ACTIVE') {
        healthScore -= 40;
        issues.push({
          severity: 'CRITICAL',
          category: 'CONNECTIVITY',
          description: `Consumer group status: ${consumerGroup.status}`,
          detectedAt: new Date(),
        });
      }

      // Determine overall status
      let status: 'HEALTHY' | 'WARNING' | 'CRITICAL';
      if (healthScore >= 80) {
        status = 'HEALTHY';
      } else if (healthScore >= 50) {
        status = 'WARNING';
      } else {
        status = 'CRITICAL';
      }

      // Generate recommendations
      const recommendations: string[] = [];
      if (totalLag > 1000) {
        recommendations.push('Consider increasing consumer instances to reduce lag');
        recommendations.push('Review message processing performance for optimization opportunities');
      }
      if (errorRate > 5) {
        recommendations.push('Review and fix failing message handlers');
        recommendations.push('Check error logs for common failure patterns');
      }
      if (avgProcessingTime > 2000) {
        recommendations.push('Optimize message processing logic');
        recommendations.push('Consider implementing caching for frequently accessed data');
      }
      if (consumerGroup.status !== 'ACTIVE') {
        recommendations.push('Restart consumer group to restore service');
        recommendations.push('Check for underlying infrastructure issues');
      }

      return {
        groupId: consumerGroup.groupId,
        groupName: consumerGroup.groupName,
        healthScore,
        status,
        issues,
        metrics: {
          avgProcessingTime: latestMetrics?.avgProcessingTimeMs || 0,
          errorRate: latestMetrics?.errorRate || 0,
          lag: totalLag,
          throughput: latestMetrics?.messagesPerSecond || 0,
        },
        recommendations,
      };
    } catch (error: any) {
      logger.error('Error generating health report', { groupId, error });
      throw error;
    }
  }

  // =====================================================
  // Utility Methods
  // =====================================================

  private determineSeverity(error: Error, retryCount: number): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    // Critical: Errors that prevent consumer from functioning
    if (error.message.includes('FATAL') || error.message.includes('Cannot connect')) {
      return 'CRITICAL';
    }

    // High: Errors after multiple retries or data corruption
    if (retryCount > 3 || error.message.includes('data corruption')) {
      return 'HIGH';
    }

    // Medium: Regular processing errors
    if (retryCount > 0) {
      return 'MEDIUM';
    }

    // Low: First-time errors, likely transient
    return 'LOW';
  }

  getInstanceId(): string {
    return this.instanceId;
  }

  getHostname(): string {
    return this.hostname;
  }
}

