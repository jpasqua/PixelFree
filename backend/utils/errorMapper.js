import {
  AppError,
  ValidationError,
  NotFoundError,
  RateLimitError,
  UpstreamError
} from '../modules/errors.js';

/**
 * Express middleware to map thrown errors to HTTP responses.
 *
 * Usage: Place after all route handlers: app.use(errorMapper)
 */
export function errorMapper(err, req, res, next) {
  if (err instanceof AppError) {
    const payload = {
      error: err.message,
      code: err.code,
      status: err.status
    };

    if (err.meta) {
      payload.details = err.meta;
    }

    return res.status(err.status).json(payload);
  }

  // Fallback for unexpected errors
  console.error('Unexpected error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    code: 'internal_error',
    status: 500
  });
}

/**
 * Helper to wrap async route handlers for better error catching.
 *
 * Example: router.get('/route', asyncHandler(async (req, res) => { ... }))
 */
export const asyncHandler = fn => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};