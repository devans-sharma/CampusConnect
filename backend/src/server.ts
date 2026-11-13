import app from './app.js';
import { config } from './config/env.js';
import { prisma } from './config/prisma.js';

const startServer = async () => {
  try {
    // Verify database connection
    await prisma.$connect();
    console.log('[Backend] Connected successfully to relational database.');

    app.listen(config.port, () => {
      console.log(`[Backend] CampusConnect API running on http://localhost:${config.port}`);
      console.log(`[Backend] Environment: ${config.nodeEnv}`);
    });
  } catch (error) {
    console.error('[Backend] Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
