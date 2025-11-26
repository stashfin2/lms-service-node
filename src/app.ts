import 'reflect-metadata';
import express, { Application } from 'express';
import { container } from 'tsyringe';
import { config } from './config';
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
    this.app = express();
    this.port = config.port;
    logger.info('Initializing LMS Service', { port: this.port, env: config.nodeEnv });
    this.initializeDatabase();
    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeErrorHandling();
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
      logger.info('Initializing Kafka infrastructure');

      // Initialize Event Publisher
      this.eventPublisher = container.resolve(EventPublisher);
      await this.eventPublisher.initialize();
      logger.info('Kafka EventPublisher initialized');

      // Initialize Consumer Manager
      this.consumerManager = container.resolve(ConsumerManager);
      await this.consumerManager.initialize();
      await this.consumerManager.startAll();
      logger.info('Kafka ConsumerManager initialized and started');

      logger.info('Kafka infrastructure initialized successfully');
    } catch (error) {
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
      // Initialize Kafka before starting the server
      await this.initializeKafka();

      // Start HTTP server
      this.app.listen(this.port, () => {
        logger.info('LMS Service listening', { port: this.port });
        console.log(`🚀 LMS Service running on port ${this.port}`);
        console.log(`📊 Environment: ${config.nodeEnv}`);
        console.log(`📨 Kafka Integration: ENABLED`);
      });

      // Handle graceful shutdown
      this.setupGracefulShutdown();
    } catch (error) {
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

const app = new App();
app.listen();

export default App;

