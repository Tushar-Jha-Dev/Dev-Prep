/**
 * DevPrep - Phase 10B Automated Test Suite (`test-phase10b.js`)
 * 
 * Verifies:
 * 1. Server Safety Verification: Confirms ZERO eval, new Function, vm, child_process in server/
 * 2. Validator Unit Tests: functionName, compare mode, testCases schema, size limits
 * 3. Deep Equality & Compare Unit Tests: exact and unorderedArray modes
 * 4. Controller Integration Tests: Question creation, validation, updating, and deletion with testRunner fields
 * 5. RBAC Middleware Security: requireAdmin rejects non-admin with 403 Forbidden
 * 6. Questions Data Integrity: Verified >= 12 seeded questions have testRunner metadata
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const {
  validateTestRunnerFields,
  ALLOWED_COMPARE_MODES
} = require('../utils/validators');

const authController = require('../controllers/authController');
const questionController = require('../controllers/questionController');
const { requireAdmin } = require('../middleware/auth');
const { readJson, FILES } = require('../utils/fileDb');

function createMockRes() {
  return {
    statusCode: 200,
    headers: {},
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.body = data;
      return this;
    },
    cookie(name, val, opts) {
      this.headers['set-cookie'] = `${name}=${val}`;
      return this;
    }
  };
}

// Deep equality logic matching client testWorker.js
function deepEqual(actual, expected, compareMode = 'exact') {
  if (Number.isNaN(actual) && Number.isNaN(expected)) return true;
  if (actual === expected) return true;

  if (Array.isArray(actual) && Array.isArray(expected)) {
    if (actual.length !== expected.length) return false;
    if (compareMode === 'unorderedArray') {
      const pool = [...expected];
      for (const item of actual) {
        const idx = pool.findIndex((e) => deepEqual(item, e, 'exact'));
        if (idx === -1) return false;
        pool.splice(idx, 1);
      }
      return pool.length === 0;
    }
    for (let i = 0; i < actual.length; i++) {
      if (!deepEqual(actual[i], expected[i], compareMode)) return false;
    }
    return true;
  }

  if (actual !== null && typeof actual === 'object' && expected !== null && typeof expected === 'object') {
    if (Array.isArray(actual) !== Array.isArray(expected)) return false;
    const actualKeys = Object.keys(actual);
    const expectedKeys = Object.keys(expected);
    if (actualKeys.length !== expectedKeys.length) return false;
    for (const key of actualKeys) {
      if (!Object.prototype.hasOwnProperty.call(expected, key)) return false;
      if (!deepEqual(actual[key], expected[key], compareMode)) return false;
    }
    return true;
  }

  return false;
}

async function runTests() {
  console.log('====================================================');
  console.log('  DevPrep Phase 10B Test Suite: JavaScript Test Runner');
  console.log('====================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function test(name, fn) {
    totalTests++;
    try {
      fn();
      console.log(`  ✓ ${name}`);
      passedTests++;
    } catch (err) {
      console.error(`  ✗ ${name}`);
      console.error(`    Error: ${err.message}`);
      throw err;
    }
  }

  async function asyncTest(name, fn) {
    totalTests++;
    try {
      await fn();
      console.log(`  ✓ ${name}`);
      passedTests++;
    } catch (err) {
      console.error(`  ✗ ${name}`);
      console.error(`    Error: ${err.message}`);
      throw err;
    }
  }

  // --- 1. SERVER SAFETY CODE AUDIT ---
  console.log('--- 1. Server Safety Verification ---');
  test('Server directory contains zero eval, new Function, vm, or child_process', () => {
    const serverDir = path.join(__dirname, '..');
    const forbidden = [
      /\beval\s*\(/,
      /\bnew\s+Function\s*\(/,
      /\brequire\s*\(\s*['"]vm['"]\s*\)/,
      /\brequire\s*\(\s*['"]child_process['"]\s*\)/
    ];
    
    function scanDir(dir) {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          if (entry.name !== 'node_modules' && entry.name !== 'scripts') {
            scanDir(fullPath);
          }
        } else if (entry.name.endsWith('.js')) {
          const content = fs.readFileSync(fullPath, 'utf8');
          for (const pattern of forbidden) {
            if (pattern.test(content)) {
              throw new Error(`Forbidden code execution pattern ${pattern} found in ${fullPath}`);
            }
          }
        }
      }
    }

    scanDir(serverDir);
  });

  // --- 2. VALIDATOR UNIT TESTS ---
  console.log('\n--- 2. Phase 10B Validator Unit Tests ---');
  test('Validates valid functionName (JS identifier)', () => {
    assert.strictEqual(validateTestRunnerFields({ functionName: 'twoSum' }), null);
    assert.strictEqual(validateTestRunnerFields({ functionName: '_privateHelper' }), null);
    assert.strictEqual(validateTestRunnerFields({ functionName: '$val123' }), null);
  });

  test('Rejects invalid functionName', () => {
    assert.ok(validateTestRunnerFields({ functionName: 'two-sum' }).includes('valid JavaScript identifier'));
    assert.ok(validateTestRunnerFields({ functionName: '123bad' }).includes('valid JavaScript identifier'));
    assert.ok(validateTestRunnerFields({ functionName: 'function with spaces' }).includes('valid JavaScript identifier'));
  });

  test('Validates allowed compare modes', () => {
    assert.strictEqual(validateTestRunnerFields({ compare: 'exact' }), null);
    assert.strictEqual(validateTestRunnerFields({ compare: 'unorderedArray' }), null);
    assert.ok(validateTestRunnerFields({ compare: 'fuzzy' }).includes('Invalid compare mode'));
  });

  test('Enforces max test case count (max 20)', () => {
    const testCases = Array(21).fill({ args: [1], expected: 2 });
    const err = validateTestRunnerFields({ testCases });
    assert.ok(err.includes('Cannot have more than 20 test cases'));
  });

  test('Validates testCase schema structure (args must be array, expected required)', () => {
    const badArgs = validateTestRunnerFields({ testCases: [{ args: 'not-array', expected: 1 }] });
    assert.ok(badArgs.includes('must have an "args" array'));

    const missingExpected = validateTestRunnerFields({ testCases: [{ args: [1] }] });
    assert.ok(missingExpected.includes('must specify an "expected" return value'));
  });

  // --- 3. COMPARISON & DEEP EQUALITY UNIT TESTS ---
  console.log('\n--- 3. Comparison & Deep Equality Unit Tests ---');
  test('Exact compare: primitives & nested arrays', () => {
    assert.strictEqual(deepEqual(5, 5, 'exact'), true);
    assert.strictEqual(deepEqual('test', 'test', 'exact'), true);
    assert.strictEqual(deepEqual(NaN, NaN, 'exact'), true);
    assert.strictEqual(deepEqual([1, 2, 3], [1, 2, 3], 'exact'), true);
    assert.strictEqual(deepEqual([1, 2, 3], [3, 2, 1], 'exact'), false);
    assert.strictEqual(deepEqual({ a: 1, b: [2] }, { a: 1, b: [2] }, 'exact'), true);
  });

  test('UnorderedArray compare: accepts permutations, preserves multiset frequency', () => {
    assert.strictEqual(deepEqual([0, 1], [1, 0], 'unorderedArray'), true);
    assert.strictEqual(deepEqual([1, 2, 3, 4], [4, 2, 1, 3], 'unorderedArray'), true);
    assert.strictEqual(deepEqual([1, 2, 2], [1, 1, 2], 'unorderedArray'), false);
  });

  // --- 4. BACKEND CONTROLLER INTEGRATION ---
  console.log('\n--- 4. Backend Controller Integration ---');
  let createdQuestionId = null;

  await asyncTest('Admin Login: returns authenticated admin user', async () => {
    const req = { body: { email: 'admin@devprep.com', password: 'Admin@1234' } };
    const res = createMockRes();
    let nextCalled = false;
    await authController.login(req, res, () => { nextCalled = true; });
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.user.role, 'admin');
    assert.ok(res.body.token);
  });

  await asyncTest('Demo User Login: returns regular user', async () => {
    const req = { body: { email: 'demo@devprep.com', password: 'Demo@1234' } };
    const res = createMockRes();
    await authController.login(req, res, () => {});
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.user.role, 'user');
  });

  await asyncTest('Security: requireAdmin rejects non-admin user with 403', () => {
    const req = { user: { id: 'user-demo', role: 'user' } };
    const res = createMockRes();
    let nextCalled = false;
    requireAdmin(req, res, () => { nextCalled = true; });
    assert.strictEqual(res.statusCode, 403);
    assert.strictEqual(nextCalled, false);
  });

  await asyncTest('Security: requireAdmin permits admin user', () => {
    const req = { user: { id: 'user-admin', role: 'admin' } };
    const res = createMockRes();
    let nextCalled = false;
    requireAdmin(req, res, () => { nextCalled = true; });
    assert.strictEqual(nextCalled, true);
  });

  await asyncTest('Question Controller: Rejects create with invalid functionName', async () => {
    const req = {
      body: {
        title: 'Invalid FN Question',
        topic: 'Arrays',
        difficulty: 'Easy',
        description: 'Test invalid identifier',
        functionName: 'invalid-name-with-hyphens'
      }
    };
    const res = createMockRes();
    await questionController.createQuestion(req, res, () => {});
    assert.strictEqual(res.statusCode, 400);
    assert.ok(res.body.error.includes('valid JavaScript identifier'));
  });

  await asyncTest('Question Controller: Creates question with test runner fields', async () => {
    const req = {
      body: {
        title: 'Automated Test Runner Demo',
        topic: 'Arrays',
        difficulty: 'Easy',
        description: 'Given an array of integers, return the sum of its elements.',
        examples: [{ input: 'nums = [1, 2, 3]', output: '6' }],
        constraints: ['1 <= nums.length <= 1000'],
        solutionApproach: 'Sum elements using reduce.',
        functionName: 'arraySum',
        starterCode: 'function arraySum(nums) {\n  return 0;\n}',
        compare: 'exact',
        testCases: [
          { args: [[1, 2, 3]], expected: 6, hidden: false },
          { args: [[10, -5, 5]], expected: 10, hidden: true }
        ]
      }
    };
    const res = createMockRes();
    await questionController.createQuestion(req, res, () => {});
    assert.strictEqual(res.statusCode, 201);
    assert.strictEqual(res.body.title, req.body.title);
    assert.strictEqual(res.body.functionName, 'arraySum');
    assert.strictEqual(res.body.compare, 'exact');
    assert.strictEqual(res.body.testCases.length, 2);
    createdQuestionId = res.body.id;
  });

  await asyncTest('Question Controller: Retrieves question by ID with test runner fields', async () => {
    const req = { params: { id: createdQuestionId } };
    const res = createMockRes();
    await questionController.getQuestionById(req, res, () => {});
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.functionName, 'arraySum');
    assert.strictEqual(res.body.starterCode, 'function arraySum(nums) {\n  return 0;\n}');
    assert.strictEqual(res.body.testCases.length, 2);
  });

  await asyncTest('Question Controller: Updates question test runner fields', async () => {
    const req = {
      params: { id: createdQuestionId },
      body: {
        compare: 'unorderedArray',
        testCases: [
          { args: [[1, 2]], expected: 3, hidden: false }
        ]
      }
    };
    const res = createMockRes();
    await questionController.updateQuestion(req, res, () => {});
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.compare, 'unorderedArray');
    assert.strictEqual(res.body.testCases.length, 1);
  });

  await asyncTest('Question Controller: Deletes question cleanly', async () => {
    const req = { params: { id: createdQuestionId } };
    const res = createMockRes();
    await questionController.deleteQuestion(req, res, () => {});
    assert.strictEqual(res.statusCode, 200);

    const checkRes = createMockRes();
    await questionController.getQuestionById(req, checkRes, () => {});
    assert.strictEqual(checkRes.statusCode, 404);
  });

  // --- 5. DATA INTEGRITY VERIFICATION ---
  console.log('\n--- 5. Seeded Questions Verification ---');
  await asyncTest('Verifies seeded question bank has >= 12 questions with testRunner metadata', async () => {
    const questions = await readJson(FILES.QUESTIONS, []);
    const questionsWithTests = questions.filter((q) => Array.isArray(q.testCases) && q.testCases.length > 0);
    console.log(`    Found ${questionsWithTests.length} questions configured with test runner cases.`);
    assert.ok(questionsWithTests.length >= 12, `Expected at least 12 questions with test cases, found ${questionsWithTests.length}`);

    // Verify Two Sum
    const twoSum = questions.find((q) => q.id === 'q-arr-1');
    assert.ok(twoSum);
    assert.strictEqual(twoSum.functionName, 'twoSum');
    assert.strictEqual(twoSum.compare, 'unorderedArray');
    assert.ok(twoSum.starterCode.includes('function twoSum'));
    assert.ok(twoSum.testCases.some((t) => t.hidden === true));
    assert.ok(twoSum.testCases.some((t) => t.hidden === false));

    // Verify questions without test cases exist (e.g. linked lists)
    const reverseList = questions.find((q) => q.id === 'q-ll-1');
    assert.ok(reverseList);
    assert.strictEqual(reverseList.testCases, undefined);
  });

  console.log('\n====================================================');
  console.log(`  All ${passedTests}/${totalTests} tests passed successfully! ✓`);
  console.log('====================================================\n');
}

runTests().catch((err) => {
  console.error('\nTest suite execution failed:', err);
  process.exit(1);
});
