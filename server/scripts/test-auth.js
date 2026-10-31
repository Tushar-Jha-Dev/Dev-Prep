/**
 * DevPrep - Auth Verification Test Script
 * 
 * Tests the complete authentication cycle:
 * 1. Login with demo user credentials
 * 2. Login with wrong password (401 check)
 * 3. GET /api/auth/me with Bearer token (200 check)
 * 4. GET /api/auth/me without token (401 check)
 * 5. POST /api/auth/signup new user (201 check)
 * 6. POST /api/auth/signup duplicate email (409 check)
 * 7. POST /api/auth/signup weak password (400 check)
 * 
 * Note: If the backend server is not running on port 5000, this script automatically
 * starts a temporary server instance so tests always succeed out-of-the-box.
 */

const BASE_URL = 'http://127.0.0.1:5000/api/auth';

async function testAuth() {
  console.log('--- Starting Auth API Tests ---');

  let localServer = null;

  // 1. Check if backend is already running on port 5000
  try {
    await fetch('http://127.0.0.1:5000/api/health', { signal: AbortSignal.timeout(600) });
    console.log('Connected to existing server on http://localhost:5000.');
  } catch (_) {
    // Start temporary in-process server
    console.log('Server not active on port 5000. Launching in-process server for tests...');
    const app = require('../server');
    localServer = await new Promise((resolve) => {
      const serverInstance = app.listen(5000, () => resolve(serverInstance));
    });
  }

  try {
    // Test 1: Successful Login
    console.log('Test 1: Login with seeded demo credentials...');
    const loginRes = await fetch(`${BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'demo@devprep.com', password: 'Demo@1234' })
    });
    const loginData = await loginRes.json();
    if (loginRes.status !== 200 || !loginData.token || !loginData.user) {
      throw new Error(`Test 1 Failed: Status ${loginRes.status}, data: ${JSON.stringify(loginData)}`);
    }
    if (loginData.user.passwordHash) {
      throw new Error('Test 1 Failed: passwordHash was leaked in response!');
    }
    const demoToken = loginData.token;
    console.log(`✓ Test 1 Passed: Login returned 200 with JWT token for "${loginData.user.name}".`);

    // Test 2: Failed Login with Wrong Password
    console.log('\nTest 2: Login with wrong password...');
    const wrongLoginRes = await fetch(`${BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'demo@devprep.com', password: 'WrongPassword99' })
    });
    const wrongLoginData = await wrongLoginRes.json();
    if (wrongLoginRes.status !== 401 || wrongLoginData.error !== 'Invalid email or password') {
      throw new Error(`Test 2 Failed: Status ${wrongLoginRes.status}, data: ${JSON.stringify(wrongLoginData)}`);
    }
    console.log('✓ Test 2 Passed: Rejected with 401 "Invalid email or password".');

    // Test 3: GET /api/auth/me with Valid Token
    console.log('\nTest 3: GET /api/auth/me with Bearer token...');
    const meRes = await fetch(`${BASE_URL}/me`, {
      headers: { Authorization: `Bearer ${demoToken}` }
    });
    const meData = await meRes.json();
    if (meRes.status !== 200 || meData.user.email !== 'demo@devprep.com') {
      throw new Error(`Test 3 Failed: Status ${meRes.status}, data: ${JSON.stringify(meData)}`);
    }
    console.log(`✓ Test 3 Passed: Authenticated profile retrieved for user ID ${meData.user.id}.`);

    // Test 4: GET /api/auth/me without Token
    console.log('\nTest 4: GET /api/auth/me without token...');
    const unauthRes = await fetch(`${BASE_URL}/me`);
    const unauthData = await unauthRes.json();
    if (unauthRes.status !== 401) {
      throw new Error(`Test 4 Failed: Expected 401, got ${unauthRes.status}`);
    }
    console.log(`✓ Test 4 Passed: Unauthenticated request rejected with 401 (${unauthData.error}).`);

    // Test 5: Signup New User
    console.log('\nTest 5: POST /api/auth/signup with new user...');
    const randomSuffix = Math.floor(Math.random() * 100000);
    const newEmail = `student${randomSuffix}@test.com`;
    const signupRes = await fetch(`${BASE_URL}/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'New Student',
        email: newEmail,
        password: 'Password123'
      })
    });
    const signupData = await signupRes.json();
    if (signupRes.status !== 201 || !signupData.token || signupData.user.role !== 'user') {
      throw new Error(`Test 5 Failed: Status ${signupRes.status}, data: ${JSON.stringify(signupData)}`);
    }
    console.log(`✓ Test 5 Passed: Successfully registered new user with role "${signupData.user.role}".`);

    // Test 6: Duplicate Email Signup (409 Conflict)
    console.log('\nTest 6: POST /api/auth/signup with duplicate email...');
    const dupRes = await fetch(`${BASE_URL}/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Duplicate Student',
        email: newEmail,
        password: 'Password123'
      })
    });
    const dupData = await dupRes.json();
    if (dupRes.status !== 409 || dupData.error !== 'Email already registered') {
      throw new Error(`Test 6 Failed: Status ${dupRes.status}, data: ${JSON.stringify(dupData)}`);
    }
    console.log('✓ Test 6 Passed: Duplicate email rejected with 409 "Email already registered".');

    // Test 7: Weak Password Validation
    console.log('\nTest 7: POST /api/auth/signup with weak password...');
    const weakRes = await fetch(`${BASE_URL}/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Weak Pass',
        email: `weak${randomSuffix}@test.com`,
        password: 'weak'
      })
    });
    const weakData = await weakRes.json();
    if (weakRes.status !== 400) {
      throw new Error(`Test 7 Failed: Expected 400, got ${weakRes.status}`);
    }
    console.log(`✓ Test 7 Passed: Weak password rejected with 400 (${weakData.error}).`);

    console.log('\n=========================================');
    console.log('ALL AUTH API TESTS PASSED SUCCESSFULLY! ✓');
    console.log('=========================================');
  } finally {
    if (localServer) {
      localServer.close();
    }
  }
}

testAuth().catch((err) => {
  if (err.cause?.code === 'ECONNREFUSED' || (err.message && err.message.includes('fetch failed'))) {
    console.error('\n❌ Connection Error: Could not connect to Express server at http://127.0.0.1:5000.');
    console.error('👉 Make sure the server is running with `cd server && npm run dev` in another terminal.\n');
  } else {
    console.error('\n❌ Auth tests failed:', err.message);
  }
  process.exit(1);
});
