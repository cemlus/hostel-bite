import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import router from './routes/index.js';
import { errorHandler } from './middlewares/error.middleware.js';
import { configs } from './config/env.js';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));
if (configs.NODE_ENV !== 'test') app.use(morgan('dev'));

// basic rate limiter
app.use(rateLimit({ windowMs: 1000 * 60, max: 200 }));

// routes
app.use('/api', router);

// health check
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

// error handler
app.use(errorHandler);

export default app;
