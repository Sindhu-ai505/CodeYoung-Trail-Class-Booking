import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import subjectsRouter from './routes/subjects.js';
import mentorsRouter from './routes/mentors.js';
import availabilityRouter from './routes/availability.js';
import bookingsRouter from './routes/bookings.js';
import devRouter from './routes/dev.js';
import authRouter from './routes/auth.js';
import parentRouter from './routes/parent.js';
import mentorRouter from './routes/mentor.js';
import classroomRouter from './routes/classroom.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function createApp() {
  const app = express();

  app.use(cors({
    origin: true,
    credentials: true
  }));
  app.use(express.json());

  // Health check
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'codeyoung-booking-api', timestamp: new Date().toISOString() });
  });

  // Mount API routes
  app.use('/api/auth', authRouter);
  app.use('/api/parent', parentRouter);
  app.use('/api/mentor', mentorRouter);
  app.use('/api/classroom', classroomRouter);
  app.use('/api/subjects', subjectsRouter);
  app.use('/api/mentors', mentorsRouter);
  app.use('/api/availability', availabilityRouter);
  app.use('/api/bookings', bookingsRouter);
  app.use('/api/dev', devRouter);

  // Serve frontend static assets in production if built
  const frontendDistPath = path.join(__dirname, '../../frontend/dist');
  if (fs.existsSync(frontendDistPath)) {
    app.use(express.static(frontendDistPath));
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api') || req.path === '/health') {
        return next();
      }
      res.sendFile(path.join(frontendDistPath, 'index.html'));
    });
  }

  // 404 Handler for API routes
  app.use('/api/*', (req, res) => {
    res.status(404).json({
      success: false,
      code: 'NOT_FOUND',
      message: `Endpoint ${req.method} ${req.url} does not exist.`
    });
  });

  // Global Error Handler
  app.use((err, req, res, next) => {
    console.error('Unhandled server error:', err);
    res.status(500).json({
      success: false,
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected internal server error occurred. Please try again later.'
    });
  });

  return app;
}
