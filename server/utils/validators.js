/**
 * DevPrep - Input Validation Helpers (`validators.js`)
 * 
 * Concepts explained:
 * 1. Server-Side Validation: Never trust input from the client. Malicious or malformed
 *    data must be caught on the server before modifying state or database files.
 * 2. Enums / Whitelisting: Allowing only predefined values (like valid topics or statuses)
 *    ensures data integrity across the system.
 * 3. Consistent Error Messages: Returns clear, descriptive error strings so controllers
 *    can return HTTP 400 Bad Request with `{ "error": "message" }`.
 */

// Allowed topics across DevPrep
const ALLOWED_TOPICS = Object.freeze([
  'Arrays',
  'Strings',
  'Linked Lists',
  'Stack',
  'Queue',
  'Trees',
  'Graphs',
  'Dynamic Programming',
  'Binary Search'
]);

// Allowed difficulty levels
const ALLOWED_DIFFICULTIES = Object.freeze([
  'Easy',
  'Medium',
  'Hard'
]);

// Allowed job/internship application statuses
const ALLOWED_APPLICATION_STATUSES = Object.freeze([
  'Applied',
  'Interview',
  'Selected',
  'Rejected'
]);

// Allowed actions for POST /api/progress
const ALLOWED_PROGRESS_ACTIONS = Object.freeze([
  'markSolved',
  'unmarkSolved',
  'updateProfile'
]);

/**
 * Validates email format using a standard regex
 */
function isValidEmail(email) {
  if (typeof email !== 'string') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Validates password requirement: at least 8 characters, at least 1 letter, and at least 1 number
 */
function isValidPassword(password) {
  if (typeof password !== 'string') return false;
  if (password.length < 8) return false;
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  return hasLetter && hasNumber;
}

/**
 * Checks that all required keys are present and not empty in an object
 * @param {object} obj - The request body
 * @param {string[]} fields - List of required field names
 * @returns {string|null} Error message if invalid, or null if valid
 */
function validateRequiredFields(obj, fields) {
  if (!obj || typeof obj !== 'object') {
    return 'Request body must be a JSON object';
  }

  for (const field of fields) {
    const val = obj[field];
    if (val === undefined || val === null || (typeof val === 'string' && val.trim() === '')) {
      return `Field "${field}" is required`;
    }
  }

  return null;
}

/**
 * Validates that a value is in an allowed set of enum values
 */
function validateEnum(value, allowedList, fieldName) {
  if (!allowedList.includes(value)) {
    return `Invalid ${fieldName} "${value}". Allowed values: ${allowedList.join(', ')}`;
  }
  return null;
}

// Allowed programming languages for "My Solution" code notepad
const ALLOWED_LANGUAGES = Object.freeze([
  'JavaScript',
  'Python',
  'Java',
  'C++'
]);

const MAX_CODE_LENGTH = 20000; // Max 20,000 characters of code per language

// Allowed test runner comparison modes (Phase 10B)
const ALLOWED_COMPARE_MODES = Object.freeze([
  'exact',
  'unorderedArray'
]);

/**
 * Validates optional Phase 10B test runner fields on question objects
 * @param {object} obj - Question creation or update payload
 * @returns {string|null} Error string if invalid, or null if valid
 */
function validateTestRunnerFields(obj) {
  if (!obj || typeof obj !== 'object') return null;

  // 1. functionName validation (valid JavaScript identifier)
  if (obj.functionName !== undefined && obj.functionName !== null && obj.functionName !== '') {
    if (typeof obj.functionName !== 'string') {
      return 'Field "functionName" must be a string';
    }
    const trimmedFn = obj.functionName.trim();
    if (trimmedFn.length > 60) {
      return 'Field "functionName" cannot exceed 60 characters';
    }
    const identifierRegex = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/;
    if (!identifierRegex.test(trimmedFn)) {
      return `Field "functionName" must be a valid JavaScript identifier (got "${trimmedFn}")`;
    }
  }

  // 2. starterCode validation
  if (obj.starterCode !== undefined && obj.starterCode !== null) {
    if (typeof obj.starterCode !== 'string') {
      return 'Field "starterCode" must be a string';
    }
    if (obj.starterCode.length > 10000) {
      return 'Field "starterCode" cannot exceed 10,000 characters';
    }
  }

  // 3. compare mode validation
  if (obj.compare !== undefined && obj.compare !== null && obj.compare !== '') {
    if (!ALLOWED_COMPARE_MODES.includes(obj.compare)) {
      return `Invalid compare mode "${obj.compare}". Allowed modes: ${ALLOWED_COMPARE_MODES.join(', ')}`;
    }
  }

  // 4. testCases array validation
  if (obj.testCases !== undefined && obj.testCases !== null) {
    if (!Array.isArray(obj.testCases)) {
      return 'Field "testCases" must be an array';
    }
    if (obj.testCases.length > 20) {
      return 'Cannot have more than 20 test cases per question';
    }

    try {
      const jsonStr = JSON.stringify(obj.testCases);
      if (jsonStr.length > 50000) {
        return 'Test cases payload exceeds 50,000 character limit';
      }
    } catch (_) {
      return 'Test cases must be JSON-serializable';
    }

    for (let i = 0; i < obj.testCases.length; i++) {
      const tc = obj.testCases[i];
      if (!tc || typeof tc !== 'object') {
        return `Test case #${i + 1} must be an object`;
      }
      if (!Array.isArray(tc.args)) {
        return `Test case #${i + 1} must have an "args" array`;
      }
      if (tc.expected === undefined) {
        return `Test case #${i + 1} must specify an "expected" return value`;
      }
    }
  }

  return null;
}

/**
 * Validates profile photo avatar data URL payload.
 * Enforces:
 * 1. String starting strictly with data:image/webp;base64,, data:image/jpeg;base64,, or data:image/png;base64,
 * 2. Strict rejection of SVG, GIF, HTML, and other file types
 * 3. Base64 decoding sanity check
 * 4. Maximum decoded binary size of 100 KB
 * 5. Real magic bytes file signature verification:
 *    - JPEG: FF D8 FF
 *    - PNG:  89 50 4E 47
 *    - WebP: RIFF (bytes 0-3) and WEBP (bytes 8-11)
 *
 * @param {*} image - The avatar image field from req.body
 * @returns {string|null} Error message string if invalid, or null if valid
 */
function validateAvatarPayload(image) {
  if (!image || typeof image !== 'string') {
    return 'Field "image" must be a non-empty base64 data URL string';
  }

  const allowedPrefixes = [
    'data:image/webp;base64,',
    'data:image/jpeg;base64,',
    'data:image/png;base64,'
  ];

  const matchedPrefix = allowedPrefixes.find((p) => image.startsWith(p));
  if (!matchedPrefix) {
    if (image.startsWith('data:image/svg') || image.includes('<svg')) {
      return 'SVG images are not supported for profile photos. Please choose a JPG, PNG, or WebP image.';
    }
    if (image.startsWith('data:image/gif')) {
      return 'GIF images are not supported for profile photos. Please choose a JPG, PNG, or WebP image.';
    }
    return 'Invalid image format. Avatar must be a WebP, JPEG, or PNG data URL (e.g. data:image/webp;base64,...)';
  }

  const base64Data = image.slice(matchedPrefix.length);
  if (!base64Data || base64Data.trim() === '') {
    return 'Image data payload cannot be empty';
  }

  // Verify valid base64 character set
  if (!/^[A-Za-z0-9+/=]+$/.test(base64Data)) {
    return 'Malformed image payload: invalid base64 encoding';
  }

  let buffer;
  try {
    buffer = Buffer.from(base64Data, 'base64');
  } catch (_) {
    return 'Failed to decode base64 image data';
  }

  if (buffer.length === 0) {
    return 'Decoded image payload is empty';
  }

  // Maximum binary size 100 KB
  const MAX_AVATAR_BYTES = 100 * 1024;
  if (buffer.length > MAX_AVATAR_BYTES) {
    return `Decoded image size (${Math.round(buffer.length / 1024)} KB) exceeds the maximum allowed limit of 100 KB`;
  }

  // Magic bytes file signature verification
  if (matchedPrefix === 'data:image/jpeg;base64,') {
    if (buffer.length < 3 || buffer[0] !== 0xFF || buffer[1] !== 0xD8 || buffer[2] !== 0xFF) {
      return 'File signature mismatch. The provided file is not a valid JPEG image.';
    }
  } else if (matchedPrefix === 'data:image/png;base64,') {
    if (
      buffer.length < 8 ||
      buffer[0] !== 0x89 ||
      buffer[1] !== 0x50 ||
      buffer[2] !== 0x4E ||
      buffer[3] !== 0x47
    ) {
      return 'File signature mismatch. The provided file is not a valid PNG image.';
    }
  } else if (matchedPrefix === 'data:image/webp;base64,') {
    const isRiff = buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46;
    const isWebp = buffer.length >= 12 && buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50;
    if (buffer.length < 12 || !isRiff || !isWebp) {
      return 'File signature mismatch. The provided file is not a valid WebP image.';
    }
  }

  return null;
}

module.exports = {
  ALLOWED_TOPICS,
  ALLOWED_DIFFICULTIES,
  ALLOWED_APPLICATION_STATUSES,
  ALLOWED_PROGRESS_ACTIONS,
  ALLOWED_LANGUAGES,
  ALLOWED_COMPARE_MODES,
  MAX_CODE_LENGTH,
  isValidEmail,
  isValidPassword,
  validateRequiredFields,
  validateEnum,
  validateTestRunnerFields,
  validateAvatarPayload
};
