/**
 * Audit Middleware
 * Automatically publishes audit events for all API calls
 * Follows Single Responsibility Principle
 */

import { Request, Response, NextFunction } from 'express';
import { container } from 'tsyringe';
import { EventPublisher } from '../services/EventPublisher';
import { AuditLogEvent } from '../events/SystemEvents';
import { KafkaTopics } from '../../config/kafka.config';
import { logger } from '../../utils/logger';

/**
 * Middleware to automatically log all API calls as audit events
 */
export function auditMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Capture the original send function
  const originalSend = res.send;

  // Override the send function to capture response
  res.send = function (data: any): Response {
    // Restore original send
    res.send = originalSend;

    // Publish audit event asynchronously (don't wait for it)
    publishAuditEvent(req, res, data).catch(error => {
      logger.error('Failed to publish audit event', { error });
    });

    // Call original send
    return res.send(data);
  };

  next();
}

/**
 * Helper function to publish audit event
 */
async function publishAuditEvent(req: Request, res: Response, responseData: any): Promise<void> {
  try {
    const eventPublisher = container.resolve(EventPublisher);

    // Don't audit health checks or certain system endpoints
    if (req.path === '/api/health' || req.path.includes('/metrics')) {
      return;
    }

    const auditEvent = new AuditLogEvent(
      {
        userId: (req as any).user?.id || 'anonymous',
        action: `${req.method} ${req.path}`,
        resource: extractResourceFromPath(req.path),
        resourceId: extractResourceId(req),
        changes: {
          method: req.method,
          path: req.path,
          query: req.query,
          statusCode: res.statusCode,
        },
        ipAddress: req.ip || req.socket.remoteAddress,
        userAgent: req.headers['user-agent'],
        timestamp: new Date(),
        metadata: {
          requestId: req.headers['x-request-id'] as string,
          correlationId: req.headers['x-correlation-id'] as string,
        },
      },
      {
        correlationId: req.headers['x-correlation-id'] as string,
        triggeredBy: (req as any).user?.id || 'system',
      }
    );

    await eventPublisher.publish(KafkaTopics.AUDIT_LOG, auditEvent);
  } catch (error) {
    logger.error('Error publishing audit event', { error });
    // Don't throw - audit failures shouldn't break the request
  }
}

/**
 * Extract resource name from API path
 */
function extractResourceFromPath(path: string): string {
  const parts = path.split('/').filter(p => p);
  return parts.length >= 2 ? parts[2] : 'unknown';
}

/**
 * Extract resource ID from request
 */
function extractResourceId(req: Request): string {
  // Try to extract ID from params
  if (req.params.id) {
    return req.params.id;
  }

  // Try to extract from body
  if (req.body?.id) {
    return req.body.id;
  }

  // Default to path
  return req.path;
}

