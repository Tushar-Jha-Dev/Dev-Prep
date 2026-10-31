/**
 * DevPrep - Authentication Controller (`authController.js`)
 * 
 * Concepts explained:
 * 1. Password Hashing with Salt: bcrypt adds a random salt before hashing so two
 *    identical passwords produce different hashes, protecting against rainbow table attacks.
 * 2. Generic Error Messages: We return "Invalid email or password" whether the email is
 *    unregistered or the password was incorrect, preventing malicious email enumeration.
 * 3. Never Return Passwords: Password hashes are strictly stripped from all responses.
 * 4. User Scoping Bootstrap: When a user registers, an isolated profile record is
 *    immediately provisioned for them in `progress.json`.
 */

const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getStorage } = require('../storage');
const { isValidEmail, isValidPassword, validateRequiredFields } = require('../utils/validators');

/**
 * Helper to generate a 7-day signed JWT
 */
function generateToken(user) {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not configured in server environment');
  }
  return jwt.sign(
    { id: user.id, role: user.role },
    secret,
    { expiresIn: '7d' }
  );
}

/**
 * POST /api/auth/signup
 * Register a new student account
 */
async function signup(req, res, next) {
  try {
    const { name, email, password } = req.body;

    // 1. Validate required fields
    const missingError = validateRequiredFields(req.body, ['name', 'email', 'password']);
    if (missingError) {
      return res.status(400).json({ error: missingError });
    }

    // 2. Validate email format
    const normalizedEmail = email.trim().toLowerCase();
    if (!isValidEmail(normalizedEmail)) {
      return res.status(400).json({ error: 'Please enter a valid email address' });
    }

    // 3. Validate password strength
    if (!isValidPassword(password)) {
      return res.status(400).json({
        error: 'Password must be at least 8 characters long and contain at least one letter and one number'
      });
    }

    // 4. Check for duplicate email
    const storage = getStorage();
    const existingUser = await storage.findUserByEmail(normalizedEmail);
    if (existingUser) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    // 5. Hash password with bcrypt (10 salt rounds)
    const passwordHash = await bcrypt.hash(password, 10);

    // 6. Create user entity
    const newUser = {
      id: crypto.randomUUID(),
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      role: 'user', // Default role for public signups
      createdAt: new Date().toISOString()
    };

    // 7. Save to storage (creates user and provisions initial progress atomically)
    try {
      await storage.createUser(newUser);
    } catch (createErr) {
      if (createErr.status === 409 || createErr.code === '23505') {
        return res.status(409).json({ error: 'Email already registered' });
      }
      throw createErr;
    }

    // 8. Generate JWT token
    const token = generateToken(newUser);

    // 9. Return sanitized response (never return passwordHash)
    res.status(201).json({
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        createdAt: newUser.createdAt
      }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/login
 * Authenticate existing user and return JWT
 */
async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    const missingError = validateRequiredFields(req.body, ['email', 'password']);
    if (missingError) {
      return res.status(400).json({ error: missingError });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const storage = getStorage();
    const user = await storage.findUserByEmail(normalizedEmail);

    // Use identical error message for missing user or bad password to prevent enumeration
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate JWT token
    const token = generateToken(user);

    res.status(200).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt
      }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/auth/me
 * Returns current authenticated user profile
 */
async function getMe(req, res, next) {
  try {
    const storage = getStorage();
    const user = await storage.findUserById(req.user.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt
      }
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  signup,
  login,
  getMe
};
