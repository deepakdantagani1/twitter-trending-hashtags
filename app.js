import express from 'express';
import { initializeRedis } from './redisClient.js';
import tweetRoutes from './routes/tweet.js';
import hashtagsRoutes from './routes/hashtags.js';
import logger from './utils/logger.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandlers.js';

const createApp = async () => {
  try {
    const app = express();

    // Middleware Setup
    const setupMiddleware = () => {

      // JSON Parsing Middleware
      app.use(express.json({ limit: '10kb' })); // Limit JSON payload size to 10kb
    };

    // Route Setup
    const setupRoutes = () => {
      app.use('/api/v1/tweets', tweetRoutes); // More RESTful and future-proof endpoint naming
      app.use('/api/v1/hashtags', hashtagsRoutes);
    };

    // Error Handling Setup
    const setupErrorHandling = () => {
      app.use(notFoundHandler); // Handle 404 errors
      app.use(errorHandler); // Centralized error handler
    };

    // Initialize middleware, routes, and error handling
    setupMiddleware();
    setupRoutes();
    setupErrorHandling();

    return app;
  } catch (err) {
    logger.error(`Failed to initialize app: ${err.message}`);
    throw err; // Let the caller handle app creation failure
  }
};

const startServer = async () => {
  try {
    await initializeRedis(); // Ensure Redis is properly initialized

    const app = await createApp();

    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      logger.info(`🚀 Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    logger.error(`Failed to start server: ${err.message}`);
    process.exit(1); // Exit process on unrecoverable error
  }
};

startServer();
