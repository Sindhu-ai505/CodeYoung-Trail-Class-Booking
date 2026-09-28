import { createApp } from './app.js';
import { initDb } from './db.js';
import { seedRealisticDemoSchedule } from './data/seedDemo.js';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 5000;

async function bootstrap() {
  try {
    console.log('[Server] Initializing SQLite database...');
    await initDb();
    seedRealisticDemoSchedule();
    console.log('[Server] Database initialized and baseline demo schedule verified.');

    const app = createApp();
    app.listen(PORT, () => {
      console.log(`[Server] Codeyoung Trial Booking API is listening on http://localhost:${PORT}`);
      console.log(`[Server] Health check: http://localhost:${PORT}/health`);
    });
  } catch (err) {
    console.error('[Server] Fatal error during startup:', err);
    process.exit(1);
  }
}

bootstrap();
