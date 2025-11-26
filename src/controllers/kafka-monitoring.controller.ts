/**
 * Kafka Monitoring Controller
 * API endpoints for Kafka consumer monitoring and visibility
 * Follows REST API best practices and SOLID principles
 */

import { injectable, inject } from 'tsyringe';
import { Request, Response } from 'express';
import { ConsumerTrackingService } from '../kafka/services/ConsumerTrackingService';
import { ConsumerManager, EventPublisher } from '../kafka/services';
import {
  MessageProcessingFilter,
  ConsumerErrorFilter,
  ConsumerMetricsFilter,
} from '../models/kafka-tracking.models';
import { logger } from '../utils/logger';

@injectable()
export class KafkaMonitoringController {
  constructor(
    @inject(ConsumerTrackingService) private trackingService: ConsumerTrackingService,
    @inject(ConsumerManager) private consumerManager: ConsumerManager,
    @inject(EventPublisher) private eventPublisher: EventPublisher
  ) {}

  /**
   * GET /api/v1/kafka/dashboard
   * Get complete dashboard overview
   */
  public getDashboard = async (req: Request, res: Response): Promise<void> => {
    try {
      const dashboard = await this.trackingService.getDashboard();

      res.status(200).json({
        success: true,
        data: dashboard,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      logger.error('Error fetching Kafka dashboard', { error });
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  };

  /**
   * GET /api/v1/kafka/consumer-groups
   * Get all consumer groups
   */
  public getConsumerGroups = async (req: Request, res: Response): Promise<void> => {
    try {
      const consumerGroups = await this.trackingService.getAllConsumerGroups();

      res.status(200).json({
        success: true,
        data: consumerGroups,
        count: consumerGroups.length,
      });
    } catch (error: any) {
      logger.error('Error fetching consumer groups', { error });
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  };

  /**
   * GET /api/v1/kafka/consumer-groups/:groupId
   * Get specific consumer group details
   */
  public getConsumerGroup = async (req: Request, res: Response): Promise<void> => {
    try {
      const { groupId } = req.params;
      const consumerGroup = await this.trackingService.getConsumerGroupByGroupId(groupId);

      if (!consumerGroup) {
        res.status(404).json({
          success: false,
          error: 'Consumer group not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: consumerGroup,
      });
    } catch (error: any) {
      logger.error('Error fetching consumer group', { error });
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  };

  /**
   * GET /api/v1/kafka/consumer-groups/:groupId/health
   * Get health report for a consumer group
   */
  public getConsumerHealth = async (req: Request, res: Response): Promise<void> => {
    try {
      const { groupId } = req.params;
      const healthReport = await this.trackingService.getConsumerHealthReport(groupId);

      res.status(200).json({
        success: true,
        data: healthReport,
      });
    } catch (error: any) {
      logger.error('Error fetching consumer health', { error });
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  };

  /**
   * GET /api/v1/kafka/messages
   * Get message processing history with filters
   */
  public getMessages = async (req: Request, res: Response): Promise<void> => {
    try {
      const filter: MessageProcessingFilter = {
        topic: req.query.topic as string,
        eventType: req.query.eventType as string,
        status: req.query.status as any,
        correlationId: req.query.correlationId as string,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 50,
        offset: req.query.offset ? parseInt(req.query.offset as string) : 0,
      };

      if (req.query.startDate) {
        filter.startDate = new Date(req.query.startDate as string);
      }

      if (req.query.endDate) {
        filter.endDate = new Date(req.query.endDate as string);
      }

      const messages = await this.trackingService.getMessageProcessing(filter);

      res.status(200).json({
        success: true,
        data: messages,
        count: messages.length,
        filter,
      });
    } catch (error: any) {
      logger.error('Error fetching messages', { error });
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  };

  /**
   * GET /api/v1/kafka/errors
   * Get consumer errors with filters
   */
  public getErrors = async (req: Request, res: Response): Promise<void> => {
    try {
      const filter: ConsumerErrorFilter = {
        severity: req.query.severity as any,
        acknowledged: req.query.acknowledged === 'true' ? true : req.query.acknowledged === 'false' ? false : undefined,
        topic: req.query.topic as string,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 50,
        offset: req.query.offset ? parseInt(req.query.offset as string) : 0,
      };

      if (req.query.startDate) {
        filter.startDate = new Date(req.query.startDate as string);
      }

      if (req.query.endDate) {
        filter.endDate = new Date(req.query.endDate as string);
      }

      const errors = await this.trackingService.getConsumerErrors(filter);

      res.status(200).json({
        success: true,
        data: errors,
        count: errors.length,
        filter,
      });
    } catch (error: any) {
      logger.error('Error fetching errors', { error });
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  };

  /**
   * GET /api/v1/kafka/errors/unacknowledged
   * Get all unacknowledged errors
   */
  public getUnacknowledgedErrors = async (req: Request, res: Response): Promise<void> => {
    try {
      const errors = await this.trackingService.getUnacknowledgedErrors();

      res.status(200).json({
        success: true,
        data: errors,
        count: errors.length,
      });
    } catch (error: any) {
      logger.error('Error fetching unacknowledged errors', { error });
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  };

  /**
   * PUT /api/v1/kafka/errors/:errorId/acknowledge
   * Acknowledge an error
   */
  public acknowledgeError = async (req: Request, res: Response): Promise<void> => {
    try {
      const { errorId } = req.params;
      const { acknowledgedBy, resolutionNotes } = req.body;

      if (!acknowledgedBy) {
        res.status(400).json({
          success: false,
          error: 'acknowledgedBy is required',
        });
        return;
      }

      await this.trackingService.acknowledgeError(
        parseInt(errorId),
        acknowledgedBy,
        resolutionNotes
      );

      res.status(200).json({
        success: true,
        message: 'Error acknowledged successfully',
      });
    } catch (error: any) {
      logger.error('Error acknowledging error', { error });
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  };

  /**
   * GET /api/v1/kafka/metrics
   * Get consumer metrics
   */
  public getMetrics = async (req: Request, res: Response): Promise<void> => {
    try {
      const filter: ConsumerMetricsFilter = {
        timeWindow: req.query.timeWindow as any,
      };

      if (req.query.consumerGroupId) {
        filter.consumerGroupId = parseInt(req.query.consumerGroupId as string);
      }

      if (req.query.startDate) {
        filter.startDate = new Date(req.query.startDate as string);
      }

      if (req.query.endDate) {
        filter.endDate = new Date(req.query.endDate as string);
      }

      const metrics = await this.trackingService.getConsumerMetrics(filter);

      res.status(200).json({
        success: true,
        data: metrics,
        count: metrics.length,
        filter,
      });
    } catch (error: any) {
      logger.error('Error fetching metrics', { error });
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  };

  /**
   * GET /api/v1/kafka/status
   * Get real-time Kafka infrastructure status
   */
  public getKafkaStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const publisherHealth = this.eventPublisher.getHealthStatus();
      const consumerHealth = this.consumerManager.getHealthStatus();

      const status = {
        overall: publisherHealth.initialized && consumerHealth.initialized ? 'healthy' : 'unhealthy',
        producers: publisherHealth,
        consumers: consumerHealth,
        timestamp: new Date().toISOString(),
      };

      res.status(200).json({
        success: true,
        data: status,
      });
    } catch (error: any) {
      logger.error('Error fetching Kafka status', { error });
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  };

  /**
   * POST /api/v1/kafka/consumer-groups/:groupId/pause
   * Pause a consumer group
   */
  public pauseConsumerGroup = async (req: Request, res: Response): Promise<void> => {
    try {
      const { groupId } = req.params;

      await this.consumerManager.pauseAll();
      await this.trackingService.updateConsumerGroupStatus(groupId, 'PAUSED');

      res.status(200).json({
        success: true,
        message: `Consumer group ${groupId} paused successfully`,
      });
    } catch (error: any) {
      logger.error('Error pausing consumer group', { error });
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  };

  /**
   * POST /api/v1/kafka/consumer-groups/:groupId/resume
   * Resume a consumer group
   */
  public resumeConsumerGroup = async (req: Request, res: Response): Promise<void> => {
    try {
      const { groupId } = req.params;

      await this.consumerManager.resumeAll();
      await this.trackingService.updateConsumerGroupStatus(groupId, 'ACTIVE');

      res.status(200).json({
        success: true,
        message: `Consumer group ${groupId} resumed successfully`,
      });
    } catch (error: any) {
      logger.error('Error resuming consumer group', { error });
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  };
}

