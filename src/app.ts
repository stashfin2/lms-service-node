import 'reflect-metadata';
import express, { Application } from 'express';
import { container } from 'tsyringe';

console.log('[DEBUG] Starting app initialization...');

import { config } from './config';
console.log('[DEBUG] Config loaded successfully');

import routes from './routes';
import { DirectoryDatabaseConnector } from './connector/sql';
import { logger } from './utils/logger';
import { EventPublisher, ConsumerManager } from './kafka/services';
import {
  eventPublishingMiddleware,
  auditMiddleware,
  errorPublishingMiddleware,
} from './kafka/middleware';

class App {
  public app: Application;
  private port: number;
  private eventPublisher?: EventPublisher;
  private consumerManager?: ConsumerManager;

  constructor() {
    console.log('[DEBUG] App constructor called');
    this.app = express();
    this.port = config.port;
    console.log('[DEBUG] Express app created, port:', this.port);
    logger.info('Initializing LMS Service', { port: this.port, env: config.nodeEnv });
    console.log('[DEBUG] About to initialize database...');
    this.initializeDatabase();
    console.log('[DEBUG] Database initialized, initializing middlewares...');
    this.initializeMiddlewares();
    console.log('[DEBUG] Middlewares initialized, initializing routes...');
    this.initializeRoutes();
    console.log('[DEBUG] Routes initialized, initializing error handling...');
    this.initializeErrorHandling();
    console.log('[DEBUG] App constructor completed');
  }

  private initializeMiddlewares(): void {
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));

    // Add Kafka-related middleware
    this.app.use(eventPublishingMiddleware);
    this.app.use(auditMiddleware);
  }

  private initializeRoutes(): void {
    this.app.use('/api', routes);
  }

  private initializeErrorHandling(): void {
    // Global error handler - must be last
    this.app.use(errorPublishingMiddleware);
  }

  private initializeDatabase(): void {
    // Force creation of the shared DB client as soon as the app boots
    container.resolve(DirectoryDatabaseConnector);
  }

  /**
   * Initialize Kafka infrastructure
   */
  private async initializeKafka(): Promise<void> {
    try {
      console.log('[DEBUG] Starting Kafka initialization...');
      logger.info('Initializing Kafka infrastructure');

      // Initialize Event Publisher
      console.log('[DEBUG] Resolving EventPublisher...');
      this.eventPublisher = container.resolve(EventPublisher);
      console.log('[DEBUG] Initializing EventPublisher...');
      await this.eventPublisher.initialize();
      logger.info('Kafka EventPublisher initialized');
      console.log('[DEBUG] EventPublisher initialized');

      // Initialize Consumer Manager
      console.log('[DEBUG] Resolving ConsumerManager...');
      this.consumerManager = container.resolve(ConsumerManager);
      console.log('[DEBUG] Initializing ConsumerManager...');
      await this.consumerManager.initialize();
      console.log('[DEBUG] Starting all consumers...');
      await this.consumerManager.startAll();
      logger.info('Kafka ConsumerManager initialized and started');
      console.log('[DEBUG] All consumers started');

      logger.info('Kafka infrastructure initialized successfully');
      console.log('[DEBUG] Kafka initialization completed');
    } catch (error) {
      console.error('[ERROR] Kafka initialization failed:', error);
      logger.error('Failed to initialize Kafka infrastructure', { error });
      throw error;
    }
  }

  /**
   * Shutdown Kafka infrastructure gracefully
   */
  private async shutdownKafka(): Promise<void> {
    try {
      logger.info('Shutting down Kafka infrastructure');

      if (this.consumerManager) {
        await this.consumerManager.stopAll();
        logger.info('Kafka consumers stopped');
      }

      if (this.eventPublisher) {
        await this.eventPublisher.shutdown();
        logger.info('Kafka producers stopped');
      }

      logger.info('Kafka infrastructure shut down successfully');
    } catch (error) {
      logger.error('Error during Kafka shutdown', { error });
    }
  }

  /**
   * Start the application
   */
  public async start(): Promise<void> {
    try {
      console.log('[DEBUG] App.start() called');
      // Initialize Kafka before starting the server
      await this.initializeKafka();
      console.log('[DEBUG] Kafka initialized, starting HTTP server...');

      // Start HTTP server
      this.app.listen(this.port, () => {
        logger.info('LMS Service listening', { port: this.port });
        console.log(`🚀 LMS Service running on port ${this.port}`);
        console.log(`📊 Environment: ${config.nodeEnv}`);
        console.log(`📨 Kafka Integration: ENABLED`);
      });

      // Handle graceful shutdown
      this.setupGracefulShutdown();
      console.log('[DEBUG] App started successfully');
    } catch (error) {
      console.error('[ERROR] Failed to start application:', error);
      logger.error('Failed to start application', { error });
      process.exit(1);
    }
  }

  /**
   * Setup graceful shutdown handlers
   */
  private setupGracefulShutdown(): void {
    const shutdown = async (signal: string) => {
      logger.info(`Received ${signal}, starting graceful shutdown`);

      try {
        await this.shutdownKafka();
        logger.info('Graceful shutdown complete');
        process.exit(0);
      } catch (error) {
        logger.error('Error during graceful shutdown', { error });
        process.exit(1);
      }
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  }

  /**
   * Legacy listen method for backward compatibility
   */
  public listen(): void {
    this.start().catch(error => {
      logger.error('Error starting application', { error });
      process.exit(1);
    });
  }
}

console.log('[DEBUG] Creating App instance...');
const app = new App();
console.log('[DEBUG] App instance created, calling listen()...');
app.listen();
console.log('[DEBUG] listen() called');

export default App;

