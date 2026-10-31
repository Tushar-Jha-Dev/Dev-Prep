/**
 * DevPrep - Topic Progress Percentage Calculation Automated Check
 * 
 * Verifies the mathematical rule:
 * percent = Math.round((solved / total) * 100), and 0 when total is 0.
 * 
 * Test cases:
 * - 0 of 4 -> 0%
 * - 1 of 4 -> 25%
 * - 2 of 4 -> 50%
 * - 4 of 4 -> 100%
 * - 0 of 0 -> 0% (zero total, avoids divide-by-zero/NaN)
 */

const assert = require('assert');

function calculatePercent(solved, total) {
  if (!total || total <= 0) return 0;
  if (!solved || solved <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((solved / total) * 100)));
}

console.log('--- DevPrep Percentage Calculation Verification Suite ---\n');

const testCases = [
  { solved: 0, total: 4, expected: 0, description: '0 of 4 solved (unstarted topic)' },
  { solved: 1, total: 4, expected: 25, description: '1 of 4 solved (quarter progress)' },
  { solved: 2, total: 4, expected: 50, description: '2 of 4 solved (half progress)' },
  { solved: 4, total: 4, expected: 100, description: '4 of 4 solved (fully completed topic)' },
  { solved: 0, total: 0, expected: 0, description: '0 of 0 solved (empty topic, divide-by-zero guard)' },
  // Additional boundary checks
  { solved: 1, total: 3, expected: 33, description: '1 of 3 solved (rounded repeating decimal 33.33% -> 33%)' },
  { solved: 2, total: 3, expected: 67, description: '2 of 3 solved (rounded repeating decimal 66.66% -> 67%)' },
  { solved: 3, total: 4, expected: 75, description: '3 of 4 solved (three-quarters progress)' }
];

let passed = 0;

testCases.forEach((tc, idx) => {
  const result = calculatePercent(tc.solved, tc.total);
  const ok = result === tc.expected;
  if (ok) {
    passed++;
    console.log(`[PASS] Test ${idx + 1}: ${tc.description}`);
    console.log(`       Input: (${tc.solved} / ${tc.total}) => Result: ${result}% | Expected: ${tc.expected}%\n`);
  } else {
    console.error(`[FAIL] Test ${idx + 1}: ${tc.description}`);
    console.error(`       Input: (${tc.solved} / ${tc.total}) => Got: ${result}% | Expected: ${tc.expected}%\n`);
    process.exitCode = 1;
  }
});

console.log('========================================================');
console.log(`TEST SUMMARY: ${passed}/${testCases.length} percentage checks passed successfully.`);
console.log('========================================================');
