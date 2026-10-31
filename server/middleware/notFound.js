/**
 * DevPrep - 404 Not Found Middleware
 * 
 * Concepts explained:
 * 1. Catch-all Route: Placed after all valid API routes. If an incoming request
 *    does not match any registered endpoint, execution lands here.
 * 2. Predictable 404 Response: Returns HTTP 404 with standard `{ "error": "message" }`.
 */

function notFound(req, res, next) {
  res.status(404).json({
    error: `Cannot ${req.method} ${req.originalUrl} - Endpoint Not Found`
  });
}

module.exports = notFound;
