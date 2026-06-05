/**
 * Global error handling middleware.
 * Catches all unhandled route errors, logs them to the console, and formats a clean JSON response.
 */
const errorHandler = (err, req, res, next) => {
  console.error(`[Error Handler] Unhandled error:`, err);

  const statusCode = err.status || res.statusCode === 200 ? 500 : res.statusCode;
  
  res.status(statusCode).json({
    error: err.message || 'Internal Server Error',
    // Include stack trace only in non-production environments
    ...(process.env.NODE_ENV !== 'production' ? { stack: err.stack } : {})
  });
};

/**
 * Middleware for handling 404 (Not Found) routes.
 */
const notFoundHandler = (req, res, next) => {
  res.status(404);
  const error = new Error(`Not Found - ${req.originalUrl}`);
  next(error);
};

module.exports = {
  errorHandler,
  notFoundHandler
};
