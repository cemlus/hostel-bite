import { ApiError } from '../utils/ApiError.js';

export const errorHandler = (err, req, res, next) => {
  console.error(err);
  if (err instanceof ApiError) {
    return res.status(err.status).json({ error: err.message });
  }

  // mongoose validation error
  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: err.message });
  }

  // mongoose cast error (e.g. invalid ObjectId format)
  if (err.name === 'CastError') {
    return res.status(400).json({ error: `Invalid format for field ${err.path}` });
  }

  return res.status(500).json({ error: 'Internal server error' });
};
