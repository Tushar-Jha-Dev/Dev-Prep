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
const { readJson, writeJson, FILES } = require('../utils/fileDb');
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

    // 4. Check for duplicate email in users.json
    const users = await readJson(FILES.USERS, []);
    const existingUser = users.find((u) => u.email.toLowerCase() === normalizedEmail);
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

    // 7. Save to users.json
    users.push(newUser);
    await writeJson(FILES.USERS, users);

    // 8. Provision empty user state in progress.json
    const progressMap = await readJson(FILES.PROGRESS, {});
    progressMap[newUser.id] = {
      solvedQuestionIds: [],
      streak: { current: 0, lastActiveDate: null },
      activity: [
        {
          type: 'account_created',
          text: 'Account created',
          date: new Date().toISOString()
        }
      ],
      profile: {
        skills: [],
        goals: [],
        theme: 'light'
      }
    };
    await writeJson(FILES.PROGRESS, progressMap);

    // 9. Generate JWT token
    const token = generateToken(newUser);

    // 10. Return sanitized response (never return passwordHash)
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
    const users = await readJson(FILES.USERS, []);
    const user = users.find((u) => u.email.toLowerCase() === normalizedEmail);

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
    const users = await readJson(FILES.USERS, []);
    const user = users.find((u) => u.id === req.user.id);

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
