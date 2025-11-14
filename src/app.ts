import 'reflect-metadata';
import express, { Application } from 'express';
import { config } from './config';
import routes from './routes';

class App {
  public app: Application;
  private port: number;

  constructor() {
    this.app = express();
    this.port = config.port;
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

  public listen(): void {
    this.app.listen(this.port, () => {
      console.log(`🚀 LMS Service running on port ${this.port}`);
      console.log(`📊 Environment: ${config.nodeEnv}`);
    });
  }
}

const app = new App();
app.listen();

export default App;

