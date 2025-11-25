import 'reflect-metadata';
import express, { Application } from 'express';
import { container } from 'tsyringe';
import { config } from './config';
import routes from './routes';
import { DirectoryDatabaseConnector } from './connector/sql';
import { logger } from './utils/logger';

class App {
  public app: Application;
  private port: number;

  constructor() {
    this.app = express();
    this.port = config.port;
    logger.info('Initializing LMS Service', { port: this.port, env: config.nodeEnv });
    this.initializeDatabase();
    this.initializeMiddlewares();
    this.initializeRoutes();
  }

  private initializeMiddlewares(): void {
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
  }

  private initializeRoutes(): void {
    this.app.use('/api', routes);
  }

  private initializeDatabase(): void {
    // Force creation of the shared DB client as soon as the app boots
    container.resolve(DirectoryDatabaseConnector);
  }

  public listen(): void {
    this.app.listen(this.port, () => {
      logger.info('LMS Service listening', { port: this.port });
      console.log(`🚀 LMS Service running on port ${this.port}`);
      console.log(`📊 Environment: ${config.nodeEnv}`);
    });
  }
}

const app = new App();
app.listen();

export default App;

