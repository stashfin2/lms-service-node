/**
 * Event Publishing Middleware
 * Middleware to intercept API responses and publish events to Kafka
 * Follows Decorator Pattern and Open/Closed Principle
 */

import { Request, Response, NextFunction } from 'express';
import { container } from 'tsyringe';
import { EventPublisher } from '../services/EventPublisher';
import { logger } from '../../utils/logger';

/**
 * Middleware to enable Kafka event publishing for specific routes
 * Attaches a kafkaPublisher function to the response object
 */
export function eventPublishingMiddleware(req: Request, res: Response, next: NextFunction): void {
  try {
    const eventPublisher = container.resolve(EventPublisher);

    // Attach the event publisher to the response object for use in controllers
    (res as any).kafkaPublisher = eventPublisher;

    // Add correlation ID to request if not present
    if (!req.headers['x-correlation-id']) {
      req.headers['x-correlation-id'] = `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    next();
  } catch (error) {
    logger.error('Error in event publishing middleware', { error });
    next(error);
  }
}

/**
 * Express Request extension to include correlation ID
 */
declare global {
  namespace Express {
    interface Request {
      correlationId?: string;
    }
    interface Response {
      kafkaPublisher?: EventPublisher;
    }
  }
}

