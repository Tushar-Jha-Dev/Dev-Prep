/**
 * DevPrep - Authentication & Authorization Middleware (`auth.js`)
 * 
 * Concepts explained:
 * 1. Bearer Token Authentication: The client sends `Authorization: Bearer <jwt_token>`
 *    in the HTTP request header.
 * 2. Stateless Auth with JWT: The server does not keep session tables in memory;
 *    instead, the JWT contains a signed payload (`{ id, role }`). If the cryptographic
 *    signature matches our JWT_SECRET, the token is verified.
 * 3. req.user Context: Once verified, we attach `{ id, role }` to the `req` object,
 *    allowing subsequent controllers to know exactly who is making the request.
 * 4. Role-Based Access Control (RBAC): `requireAdmin` ensures only users with `role: "admin"`
 *    can proceed to admin-only write operations.
 */

const jwt = require('jsonwebtoken');

/**
 * Middleware: Requires a valid JWT token.
 * Extracts user ID and role, attaching them to req.user.
 */
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Authentication token required (Bearer <token>)'
    });
  }

  const token = authHeader.split(' ')[1];
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    console.error('[auth] Critical: JWT_SECRET is not set in environment variables');
    return res.status(500).json({ error: 'Internal server configuration error' });
  }

  try {
    const decoded = jwt.verify(token, secret);
    // Attach decoded user identity to request
    req.user = {
      id: decoded.id,
      role: decoded.role
    };
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token has expired. Please log in again' });
    }
    return res.status(401).json({ error: 'Invalid authentication token' });
  }
}

/**
 * Middleware: Requires the authenticated user to have the "admin" role.
 * Must be used after requireAuth in the middleware chain.
 */
function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden: Admin access required' });
  }

  next();
}

module.exports = {
  requireAuth,
  requireAdmin
};
