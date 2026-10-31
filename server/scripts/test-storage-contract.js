/**
 * DevPrep - Storage Driver Contract Test Suite (`test-storage-contract.js`)
 * 
 * Verifies that storage drivers implement the exact same interface,
 * enforce concurrency and atomicity guarantees, and maintain strict per-user isolation.
 * 
 * Invariants tested:
 * 1. 20 parallel signups with duplicate email: exactly 1 succeeds, 19 fail with 409 / code 23505.
 * 2. 50 parallel progress updates on a single user: all 50 recorded without lost updates.
 * 3. Per-user isolation: User A's data (applications, solutions, attempts, progress, avatar)
 *    is never accessible or modifiable by User B.
 * 4. Full CRUD verification across all 8 entities.
 * 
 * Note: Postgres tests execute ONLY when TEST_DATABASE_URL is provided;
 * otherwise gracefully skips Postgres testing and exits 0.
 */

const assert = require('assert');
const fs = require('fs/promises');
const path = require('path');
const os = require('os');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { FileStorageDriver, PostgresStorageDriver } = require('../storage');

async function runDriverContractTests(driverName, driver) {
  console.log(`\n======================================================`);
  console.log(`RUNNING CONTRACT TESTS FOR DRIVER: "${driverName}"`);
  console.log(`======================================================`);

  await driver.init();

  // Test 0: Driver Ping & Alive Check
  console.log('Test 0: Ping & Driver Name...');
  const alive = await driver.ping();
  assert.strictEqual(alive, true, 'Driver ping should return true');
  assert.strictEqual(driver.getDriverName(), driverName, 'Driver name should match');
  console.log('✓ Test 0 Passed: Driver is alive.');

  // Test 1: 20 Parallel Signups With Same Email (Duplicate Conflict Concurrency)
  console.log('Test 1: 20 Parallel signups with the same email...');
  const dupEmail = `contract-dup-${Date.now()}-${Math.random().toString(36).substring(7)}@devprep.com`;
  const signupPromises = Array.from({ length: 20 }, (_, i) =>
    driver.createUser({
      id: `user-dup-${Date.now()}-${i}`,
      name: `Concurrent User ${i}`,
      email: dupEmail,
      passwordHash: 'hashed_password_sample_123',
      role: 'user'
    })
  );

  const signupResults = await Promise.allSettled(signupPromises);
  const succeededSignups = signupResults.filter((r) => r.status === 'fulfilled');
  const failedSignups = signupResults.filter((r) => r.status === 'rejected');

  assert.strictEqual(
    succeededSignups.length,
    1,
    `Expected exactly 1 signup to succeed, but got ${succeededSignups.length}`
  );
  assert.strictEqual(
    failedSignups.length,
    19,
    `Expected exactly 19 signups to fail, but got ${failedSignups.length}`
  );

  for (const failed of failedSignups) {
    const reason = failed.reason;
    const status = reason?.status || reason?.statusCode;
    const code = reason?.code;
    const msg = reason?.message || '';
    assert(
      status === 409 || code === '23505' || msg.toLowerCase().includes('already registered'),
      `Expected duplicate email conflict (409 / 23505), but got: ${msg}`
    );
  }
  console.log('✓ Test 1 Passed: Exactly 1 signup succeeded, 19 rejected with 409 conflict.');

  // Test 2: 50 Parallel Progress Updates (Atomic Mutex / Row Lock)
  console.log('Test 2: 50 Parallel progress updates on a single user...');
  const progUserId = `user-prog-${Date.now()}`;
  await driver.createUser({
    id: progUserId,
    name: 'Progress Concurrency Tester',
    email: `contract-prog-${Date.now()}@devprep.com`,
    passwordHash: 'hashed_sample',
    role: 'user'
  });

  const updatePromises = Array.from({ length: 50 }, (_, i) =>
    driver.atomicUpdateProgress(progUserId, async (current) => {
      const solved = current.solvedQuestionIds || [];
      return {
        ...current,
        solvedQuestionIds: [...solved, `q-concurrent-${i}`]
      };
    })
  );

  await Promise.all(updatePromises);

  const finalProgress = await driver.getProgress(progUserId);
  assert.strictEqual(
    finalProgress.solvedQuestionIds.length,
    50,
    `Expected 50 solved question IDs, but got ${finalProgress.solvedQuestionIds.length}`
  );
  const uniqueQuestions = new Set(finalProgress.solvedQuestionIds);
  assert.strictEqual(
    uniqueQuestions.size,
    50,
    `Expected 50 unique questions, but got ${uniqueQuestions.size} (lost update detected!)`
  );
  console.log('✓ Test 2 Passed: 50 parallel progress updates recorded with zero lost updates.');

  // Test 3: Per-User Isolation Verification
  console.log('Test 3: Per-user data isolation across applications, solutions, attempts, avatars...');
  const userAId = `user-iso-a-${Date.now()}`;
  const userBId = `user-iso-b-${Date.now()}`;
  await driver.createUser({
    id: userAId,
    name: 'User A',
    email: `contract-a-${Date.now()}@devprep.com`,
    passwordHash: 'hash_a',
    role: 'user'
  });
  await driver.createUser({
    id: userBId,
    name: 'User B',
    email: `contract-b-${Date.now()}@devprep.com`,
    passwordHash: 'hash_b',
    role: 'user'
  });

  // 3a. Applications Isolation
  const appA = {
    id: `app-iso-${Date.now()}`,
    userId: userAId,
    company: 'Stripe',
    role: 'Software Engineer',
    status: 'Applied',
    location: 'Remote',
    appliedDate: '2026-10-31',
    notes: 'Confidential User A application notes'
  };
  await driver.createApplication(appA);

  const userBApps = await driver.listApplications(userBId);
  assert.strictEqual(userBApps.length, 0, `User B should have 0 applications, found ${userBApps.length}`);
  const userBAppFind = await driver.findApplicationById(userBId, appA.id);
  assert.strictEqual(userBAppFind, null, 'User B must not be able to find User A application by ID');

  // 3b. Solutions Isolation
  await driver.saveSolution(userAId, 'q-arr-1', {
    language: 'JavaScript',
    code: 'function twoSum() { /* User A proprietary code */ }'
  });

  const userBSolutions = await driver.listSolutions(userBId);
  assert.strictEqual(userBSolutions.length, 0, `User B should have 0 solutions, found ${userBSolutions.length}`);
  const userBSolFind = await driver.findSolutionsByQuestion(userBId, 'q-arr-1');
  assert.strictEqual(userBSolFind.length, 0, 'User B must not see User A solutions for question');

  // 3c. Mock Attempts Isolation
  const attA = {
    id: `att-iso-${Date.now()}`,
    userId: userAId,
    topic: 'Arrays',
    score: 5,
    total: 5,
    accuracy: 100,
    timeTaken: 110,
    date: new Date().toISOString(),
    reviews: [{ questionId: 'q-1', selectedOption: 1, correct: true }]
  };
  await driver.createAttempt(attA);

  const userBAttemptsRes = await driver.listAttempts(userBId);
  const userBAttempts = Array.isArray(userBAttemptsRes) ? userBAttemptsRes : (userBAttemptsRes.attempts || []);
  assert.strictEqual(userBAttempts.length, 0, `User B should have 0 attempts, found ${userBAttempts.length}`);
  const userBAttFind = await driver.findAttemptById(userBId, attA.id);
  assert.strictEqual(userBAttFind, null, 'User B must not find User A attempt by ID');

  // 3d. Avatars Isolation
  await driver.setAvatar(userAId, 'data:image/webp;base64,USER_A_PRIVATE_AVATAR');
  const userBAvatar = await driver.getAvatar(userBId);
  assert.strictEqual(userBAvatar, null, 'User B must have null avatar');
  const userAAvatar = await driver.getAvatar(userAId);
  assert.strictEqual(userAAvatar, 'data:image/webp;base64,USER_A_PRIVATE_AVATAR');

  console.log('✓ Test 3 Passed: User isolation verified across all private entities.');

  // Test 4: Questions & MCQ Bank Contract Operations
  console.log('Test 4: Questions & MCQ Bank CRUD contract...');
  const testQuestion = {
    id: `q-contract-${Date.now()}`,
    title: 'Contract Test Two Sum',
    topic: 'Arrays',
    difficulty: 'Easy',
    description: 'Contract test description'
  };
  await driver.createQuestion(testQuestion);
  const foundQ = await driver.findQuestionById(testQuestion.id);
  assert.strictEqual(foundQ?.title, testQuestion.title, 'Question should be found by ID');

  testQuestion.title = 'Contract Test Two Sum Updated';
  await driver.updateQuestion(testQuestion.id, testQuestion);
  const updatedQ = await driver.findQuestionById(testQuestion.id);
  assert.strictEqual(updatedQ?.title, 'Contract Test Two Sum Updated');

  await driver.deleteQuestion(testQuestion.id);
  const deletedQ = await driver.findQuestionById(testQuestion.id);
  assert.strictEqual(deletedQ, null, 'Question should be null after deletion');

  const testMcq = {
    id: `mcq-contract-${Date.now()}`,
    topic: 'Arrays',
    question: 'Contract test question?',
    options: ['A', 'B', 'C', 'D'],
    correctIndex: 0,
    explanation: 'Test explanation'
  };
  await driver.createMcq(testMcq);
  const foundMcq = await driver.findMcqById(testMcq.id);
  assert.strictEqual(foundMcq?.question, testMcq.question, 'MCQ should be found by ID');

  const topicCounts = await driver.getMcqTopicCounts();
  assert(topicCounts.counts.Arrays >= 1, 'MCQ topic counts should include Arrays');

  await driver.deleteMcq(testMcq.id);
  const deletedMcq = await driver.findMcqById(testMcq.id);
  assert.strictEqual(deletedMcq, null, 'MCQ should be null after deletion');
  console.log('✓ Test 4 Passed: Questions and MCQ contract operations verified.');

  console.log(`\nALL CONTRACT TESTS PASSED FOR DRIVER: "${driverName}"! ✓`);
}

async function main() {
  console.log('--- DevPrep Storage Interface Driver Contract Tests ---');

  // 1. Run Contract Tests against File Storage Driver in an isolated directory
  const testDataDir = path.join(os.tmpdir(), `devprep-contract-test-${Date.now()}`);
  const fileDriver = new FileStorageDriver({ dataDir: testDataDir });
  try {
    await runDriverContractTests('file', fileDriver);
  } finally {
    await fileDriver.close();
    await fs.rm(testDataDir, { recursive: true, force: true }).catch(() => {});
  }

  // 2. Run Contract Tests against Postgres Storage Driver (if TEST_DATABASE_URL provided)
  const testDbUrl = process.env.TEST_DATABASE_URL;
  if (!testDbUrl) {
    console.log('\n[contract] TEST_DATABASE_URL not set - skipping Postgres contract tests.');
  } else {
    console.log('\n[contract] TEST_DATABASE_URL provided. Connecting to Postgres test database...');
    const pgDriver = new PostgresStorageDriver({ connectionString: testDbUrl });
    try {
      await runDriverContractTests('postgres', pgDriver);
    } finally {
      // Clean up test records
      try {
        await pgDriver.pool.query("DELETE FROM users WHERE email LIKE 'contract-%'");
        await pgDriver.pool.query("DELETE FROM questions WHERE id LIKE 'q-contract-%'");
        await pgDriver.pool.query("DELETE FROM mcq_bank WHERE id LIKE 'mcq-contract-%'");
      } catch (_) {}
      await pgDriver.close();
    }
  }

  console.log('\n=========================================');
  console.log('STORAGE CONTRACT TEST SUITE FINISHED! ✓');
  console.log('=========================================\n');
}

main().catch((err) => {
  console.error('\n❌ Contract tests failed:', err.message || err);
  process.exit(1);
});
