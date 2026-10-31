/**
 * DevPrep - Centralized Error Handling Middleware
 * 
 * Concepts explained:
 * 1. Express Error Middleware: Identified by four arguments `(err, req, res, next)`.
 *    Whenever a controller calls `next(err)` or throws an error inside an async handler,
 *    Express skips normal routes and directs execution here.
 * 2. Predictable Error Format: Every error response across all endpoints follows the
 *    exact same schema `{ "error": "message" }` as required by Rules.md and Architecture.md.
 * 3. Status Code Preservation: Uses `err.status` or `err.statusCode` if set, defaulting to 500.
 */

function errorHandler(err, req, res, next) {
  // Determine appropriate HTTP status code (defaults to 500 Internal Server Error)
  const statusCode = err.status || err.statusCode || 500;
  
  // Specific handler for body parser payload too large (HTTP 413)
  if (err.type === 'entity.too.large' || statusCode === 413) {
    return res.status(413).json({
      error: 'Payload Too Large: The uploaded image exceeds the 200 KB request size limit.'
    });
  }

  // Log unexpected server errors in development console
  if (statusCode >= 500) {
    console.error(`[Error] ${req.method} ${req.originalUrl}:`, err);
  }

  // Consistent JSON response format
  res.status(statusCode).json({
    error: err.message || 'Internal Server Error'
  });
}

module.exports = errorHandler;
