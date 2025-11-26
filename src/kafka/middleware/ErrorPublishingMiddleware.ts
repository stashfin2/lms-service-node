/**
 * Error Publishing Middleware
 * Captures errors and publishes them to Kafka error topic
 * Follows Single Responsibility Principle
 */

import { Request, Response, NextFunction } from 'express';
import { container } from 'tsyringe';
import { EventPublisher } from '../services/EventPublisher';
import { ErrorLogEvent } from '../events/SystemEvents';
import { KafkaTopics } from '../../config/kafka.config';
import { logger } from '../../utils/logger';

/**
 * Error handling middleware that publishes errors to Kafka
 */
export function errorPublishingMiddleware(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Publish error event asynchronously
  publishErrorEvent(err, req).catch(error => {
    logger.error('Failed to publish error event', { error });
  });

  // Determine error severity
  const severity = determineErrorSeverity(err);

  // Log error
  logger.error('Request error', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    severity,
  });

  // Send error response
  const statusCode = err.statusCode || err.status || 500;
  res.status(statusCode).json({
    error: {
      message: err.message || 'Internal Server Error',
      statusCode,
      timestamp: new Date().toISOString(),
      path: req.path,
      requestId: req.headers['x-request-id'],
    },
  });
}

/**
 * Helper function to publish error event
 */
async function publishErrorEvent(err: any, req: Request): Promise<void> {
  try {
    const eventPublisher = container.resolve(EventPublisher);

    const errorEvent = new ErrorLogEvent(
      {
        errorType: err.name || 'Error',
        errorMessage: err.message || 'Unknown error',
        stackTrace: err.stack,
        context: {
          service: 'lms-service-node',
          endpoint: req.path,
          method: req.method,
          userId: (req as any).user?.id,
          requestId: req.headers['x-request-id'] as string,
        },
        severity: determineErrorSeverity(err),
        timestamp: new Date(),
        metadata: {
          correlationId: req.headers['x-correlation-id'] as string,
          statusCode: err.statusCode || err.status || 500,
          query: req.query,
          params: req.params,
        },
      },
      {
        correlationId: req.headers['x-correlation-id'] as string,
        triggeredBy: (req as any).user?.id || 'system',
      }
    );

    await eventPublisher.publish(KafkaTopics.ERROR_LOG, errorEvent);
  } catch (error) {
    logger.error('Error publishing error event', { error });
    // Don't throw - error publishing failures shouldn't break error handling
  }
}

/**
 * Determine error severity based on error type and status code
 */
function determineErrorSeverity(err: any): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
  const statusCode = err.statusCode || err.status || 500;

  if (statusCode >= 500) {
    return 'CRITICAL';
  } else if (statusCode >= 400 && statusCode < 500) {
    return 'MEDIUM';
  } else if (err.name === 'ValidationError') {
    return 'LOW';
  }

  return 'HIGH';
}

