/**
 * DevPrep - Final QA Pass: Auth, Security, Isolation & Injection Suite
 */

const assert = require('assert');

const BASE_URL = 'http://127.0.0.1:5000';

async function req(endpoint, options = {}) {
  const url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint}`;
  const res = await fetch(url, options);
  let body = null;
  const text = await res.text();
  try {
    body = JSON.parse(text);
  } catch (_) {
    body = text;
  }
  return { status: res.status, headers: res.headers, body };
}

async function run() {
  console.log('========================================================================');
  console.log('       DevPrep QA: Auth, Security & Multi-Tenant Isolation Suite        ');
  console.log('========================================================================\n');

  let passes = 0;
  let fails = 0;

  function pass(desc) {
    passes++;
    console.log(`✓ [PASS] ${desc}`);
  }

  function fail(desc, err) {
    fails++;
    console.error(`❌ [FAIL] ${desc}:`, err);
  }

  // 1. AUTH & SIGNUP VALIDATION
  console.log('--- 1. Signup Validation Matrix ---');

  // 1a. Missing fields
  {
    const r = await req('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@example.com', password: 'Password123' })
    });
    if (r.status === 400 && r.body.error && r.body.error.includes('name')) {
      pass('Missing name rejected with 400');
    } else fail('Missing name rejected with 400', r);
  }

  // 1b. Bad email
  {
    const r = await req('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test', email: 'not-an-email', password: 'Password123' })
    });
    if (r.status === 400 && r.body.error && r.body.error.toLowerCase().includes('email')) {
      pass('Invalid email syntax rejected with 400');
    } else fail('Invalid email syntax rejected with 400', r);
  }

  // 1c. Short password
  {
    const r = await req('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test', email: 'short@example.com', password: 'Pass1' })
    });
    if (r.status === 400 && r.body.error && r.body.error.includes('8 characters')) {
      pass('Short password (<8 chars) rejected with 400');
    } else fail('Short password (<8 chars) rejected with 400', r);
  }

  // 1d. Password without number
  {
    const r = await req('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test', email: 'nonum@example.com', password: 'PasswordOnly' })
    });
    if (r.status === 400 && r.body.error && r.body.error.includes('number')) {
      pass('Password without number rejected with 400');
    } else fail('Password without number rejected with 400', r);
  }

  // 1e. Password without letter
  {
    const r = await req('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test', email: 'noletter@example.com', password: '1234567890' })
    });
    if (r.status === 400 && r.body.error && r.body.error.includes('letter')) {
      pass('Password without letter rejected with 400');
    } else fail('Password without letter rejected with 400', r);
  }

  // 1f. Duplicate email case-insensitive check
  {
    const r = await req('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Demo Clone', email: 'DEMO@DEVPREP.COM', password: 'Password123' })
    });
    if (r.status === 409 && r.body.error && r.body.error.includes('already registered')) {
      pass('Duplicate email in uppercase rejected with 409');
    } else fail('Duplicate email in uppercase rejected with 409', r);
  }

  // 1g. Valid signup creates user and does NOT leak passwordHash
  const userAEmail = `qa-user-a-${Date.now()}@devprep.test`;
  const userBEmail = `qa-user-b-${Date.now()}@devprep.test`;
  let userAToken = null;
  let userAId = null;
  let userBToken = null;
  let userBId = null;

  {
    const r = await req('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'QA User Alpha', email: userAEmail, password: 'QaUser@123' })
    });
    if (r.status === 201 && r.body.token && r.body.user && !r.body.user.passwordHash) {
      userAToken = r.body.token;
      userAId = r.body.user.id;
      pass('Valid signup succeeded (201) and passwordHash is strictly excluded');
    } else fail('Valid signup succeeded (201) and passwordHash is strictly excluded', r);
  }

  {
    const r = await req('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'QA User Beta', email: userBEmail, password: 'QaUser@123' })
    });
    if (r.status === 201 && r.body.token && r.body.user) {
      userBToken = r.body.token;
      userBId = r.body.user.id;
      pass('Second QA test user registered successfully');
    } else fail('Second QA test user registered successfully', r);
  }

  // 2. LOGIN & GENERIC ERROR MESSAGES
  console.log('\n--- 2. Login & Generic Error Messages ---');
  {
    const r = await req('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'demo@devprep.com', password: 'Demo@1234' })
    });
    if (r.status === 200 && r.body.token && r.body.user && !r.body.user.passwordHash) {
      pass('Demo user login successful (200), passwordHash excluded');
    } else fail('Demo user login successful', r);
  }

  {
    const rWrong = await req('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'demo@devprep.com', password: 'WrongPassword999' })
    });
    const rUnknown = await req('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'does-not-exist@devprep.com', password: 'WrongPassword999' })
    });

    if (
      rWrong.status === 401 &&
      rUnknown.status === 401 &&
      rWrong.body.error === 'Invalid email or password' &&
      rUnknown.body.error === 'Invalid email or password'
    ) {
      pass('Wrong password and unknown email return identical generic 401 "Invalid email or password"');
    } else {
      fail('Wrong password and unknown email generic check', { wrong: rWrong.body, unknown: rUnknown.body });
    }
  }

  // 3. TOKEN INTEGRITY & EXPIRATION/TAMPERING
  console.log('\n--- 3. Token Integrity & Tampering Checks ---');
  {
    const r = await req('/api/auth/me', {
      headers: { Authorization: `Bearer ${userAToken}` }
    });
    if (r.status === 200 && r.body.user && r.body.user.id === userAId && !r.body.user.passwordHash) {
      pass('Valid token retrieves user profile via GET /api/auth/me');
    } else fail('Valid token retrieves user profile', r);
  }

  {
    const r = await req('/api/auth/me', {
      headers: { Authorization: `Bearer ${userAToken}tampered` }
    });
    if (r.status === 401) {
      pass('Tampered signature rejected with 401');
    } else fail('Tampered signature rejected with 401', r);
  }

  {
    const r = await req('/api/auth/me', {
      headers: { Authorization: 'Bearer not.a.real.jwt' }
    });
    if (r.status === 401) {
      pass('Malformed JWT token rejected with 401');
    } else fail('Malformed JWT token rejected with 401', r);
  }

  {
    const r = await req('/api/auth/me');
    if (r.status === 401) {
      pass('Missing Authorization header rejected with 401');
    } else fail('Missing Authorization header rejected with 401', r);
  }

  // 4. ADMIN ROUTE GATING (NORMAL USER BLOCKED WITH 403)
  console.log('\n--- 4. Admin Gating (403 for Normal Users) ---');
  {
    const r1 = await req('/api/questions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${userAToken}` },
      body: JSON.stringify({ title: 'Hacked Question', topic: 'Arrays', difficulty: 'Easy' })
    });
    const r2 = await req('/api/admin/mcq', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${userAToken}` },
      body: JSON.stringify({ question: 'Hacked MCQ?', topic: 'Arrays' })
    });
    if (r1.status === 403 && r2.status === 403) {
      pass('Student user blocked with 403 on POST /api/questions and POST /api/admin/mcq');
    } else fail('Student blocked on admin routes', { r1: r1.status, r2: r2.status });
  }

  // 5. TWO-USER MULTI-TENANT ISOLATION
  console.log('\n--- 5. Two-User Multi-Tenant Isolation ---');
  // 5a. Applications
  let userAAppId = null;
  {
    const createRes = await req('/api/applications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${userAToken}` },
      body: JSON.stringify({
        company: 'Stark Industries',
        role: 'Software Engineer',
        status: 'Applied',
        appliedDate: '2026-10-30',
        notes: 'Secret QA note from User A'
      })
    });
    const appData = createRes.body.application || createRes.body;
    if (createRes.status === 201 && appData && appData.id) {
      userAAppId = appData.id;
      pass('User A created private job application');
    } else fail('User A application creation', createRes);

    // User B tries to view applications
    const listResB = await req('/api/applications', {
      headers: { Authorization: `Bearer ${userBToken}` }
    });
    const bApps = listResB.body.applications || listResB.body;
    const leaked = Array.isArray(bApps) && bApps.some((a) => a.id === userAAppId);
    if (!leaked) {
      pass('User B GET /api/applications does NOT include User A’s application');
    } else fail('User B sees User A’s application', listResB);

    // User B tries to update User A's application
    const putResB = await req(`/api/applications/${userAAppId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${userBToken}` },
      body: JSON.stringify({ company: 'Hacked Corp', status: 'Offer' })
    });
    if (putResB.status === 404 || putResB.status === 403) {
      pass('User B PUT /api/applications/:id on User A’s ID is rejected (404/403)');
    } else fail('User B modified User A application', putResB);

    // User B tries to delete User A's application
    const delResB = await req(`/api/applications/${userAAppId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${userBToken}` }
    });
    if (delResB.status === 404 || delResB.status === 403) {
      pass('User B DELETE /api/applications/:id on User A’s ID is rejected (404/403)');
    } else fail('User B deleted User A application', delResB);
  }

  // 5b. Solutions Isolation
  {
    await req('/api/solutions/q-arr-1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${userAToken}` },
      body: JSON.stringify({ language: 'JavaScript', code: '// Secret Solution A' })
    });

    const getResB = await req('/api/solutions/q-arr-1?language=JavaScript', {
      headers: { Authorization: `Bearer ${userBToken}` }
    });
    if (!getResB.body.solution || !getResB.body.solution.code || !getResB.body.solution.code.includes('Secret Solution A')) {
      pass('User B cannot read User A’s code solution on q-arr-1');
    } else fail('User B read User A code solution', getResB);
  }

  // 5c. Avatar Isolation
  {
    const miniWebp = 'data:image/webp;base64,UklGRhoAAABXRUJQVlA4TA0AAAAvAAAAEAnQ8n8gPgA=';
    await req('/api/profile/avatar', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${userAToken}` },
      body: JSON.stringify({ image: miniWebp })
    });

    const getAvB = await req('/api/profile/avatar', {
      headers: { Authorization: `Bearer ${userBToken}` }
    });
    if (getAvB.body.avatar === null) {
      pass('User B GET /api/profile/avatar returns null, preserving User A’s photo privacy');
    } else fail('User B saw User A avatar', getAvB);

    const delAvB = await req('/api/profile/avatar', {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${userBToken}` }
    });
    const checkAvA = await req('/api/profile/avatar', {
      headers: { Authorization: `Bearer ${userAToken}` }
    });
    if (checkAvA.body.avatar !== null) {
      pass('User B DELETE /api/profile/avatar does not remove User A’s avatar');
    } else fail('User B deleted User A avatar', checkAvA);
  }

  // 6. XSS PAYLOADS PRESERVATION WITHOUT EXECUTION
  console.log('\n--- 6. XSS Injection & Plain-Text Storage ---');
  {
    const xssPayload = '<script>alert("XSS")</script><img src=x onerror=alert(1)>';
    const appXss = await req('/api/applications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${userAToken}` },
      body: JSON.stringify({
        company: xssPayload,
        role: 'Security Engineer',
        status: 'Applied',
        appliedDate: '2026-10-30',
        notes: xssPayload
      })
    });
    const xssData = appXss.body.application || appXss.body;
    if (appXss.status === 201 && xssData && xssData.company === xssPayload) {
      pass('XSS payload stored verbatim as plain string, no server corruption');
    } else fail('XSS payload handling', appXss);
  }

  // 7. PAYLOAD SIZE LIMITS & NO STACK TRACE LEAK
  console.log('\n--- 7. Body Size Limits & Stack Trace Privacy ---');
  {
    const hugeBody = JSON.stringify({ data: 'A'.repeat(150 * 1024) }); // 150 KB > 100 KB default
    const r = await req('/api/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${userAToken}` },
      body: hugeBody
    });
    if (r.status === 413) {
      pass('Body > 100 KB to standard route rejected with HTTP 413');
    } else fail('Body > 100 KB rejected with 413', r);
  }

  {
    // Test that 500 or error responses never leak stack traces
    const r = await req('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{"broken": json'
    });
    if (r.status === 400 && !JSON.stringify(r.body).includes('at ') && !JSON.stringify(r.body).includes('node_modules')) {
      pass('Malformed JSON returns 400 without leaking stack traces or internal paths');
    } else fail('Malformed JSON leaked stack trace', r);
  }

  console.log('\n========================================================================');
  console.log(`Results: ${passes} Passed, ${fails} Failed`);
  console.log('========================================================================');
  if (fails > 0) process.exit(1);
}

run().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
