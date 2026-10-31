/**
 * DevPrep - Test Runner Web Worker (`testWorker.js`)
 * 
 * Safety & Isolation Architecture:
 * 1. Sandboxed Browser Execution: Runs purely in a background Web Worker thread.
 * 2. Disabled Network & Storage APIs: Strips fetch, XMLHttpRequest, WebSocket, importScripts, and indexedDB.
 * 3. Captured Console Output: Overrides console.log/warn/error to capture up to 50 lines.
 * 4. Deep Equality Comparison: Supports "exact" and "unorderedArray" modes.
 * 5. Gutter Line Number Alignment: Normalizes stack traces so error lines match 1-based editor gutter lines.
 * 6. Nested LeetCode Template Handler: Detects and resolves functions defined inside wrapper functions of the same name.
 */

// 1. Sandbox Isolation: Disable network, dynamic script loading, and persistent storage
const FORBIDDEN_APIS = ['fetch', 'XMLHttpRequest', 'WebSocket', 'importScripts', 'indexedDB'];
for (const api of FORBIDDEN_APIS) {
  try {
    Object.defineProperty(self, api, {
      value: undefined,
      writable: false,
      configurable: false
    });
  } catch (_) {
    try {
      delete self[api];
      self[api] = undefined;
    } catch (__) {}
  }
}

// 2. Console Capture (Max 50 lines)
const logs = [];
const MAX_LOG_LINES = 50;

function formatLogArg(arg) {
  if (arg === undefined) return 'undefined';
  if (arg === null) return 'null';
  if (typeof arg === 'object') {
    try {
      return JSON.stringify(arg);
    } catch (_) {
      return String(arg);
    }
  }
  return String(arg);
}

try {
  self.console.log = (...args) => {
    if (logs.length < MAX_LOG_LINES) {
      logs.push(args.map(formatLogArg).join(' '));
    }
  };
  self.console.info = self.console.log;
  self.console.warn = (...args) => {
    if (logs.length < MAX_LOG_LINES) {
      logs.push('[warn] ' + args.map(formatLogArg).join(' '));
    }
  };
  self.console.error = (...args) => {
    if (logs.length < MAX_LOG_LINES) {
      logs.push('[error] ' + args.map(formatLogArg).join(' '));
    }
  };
} catch (_) {}

// 3. Comparison Utilities
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

/**
 * Formats runtime/syntax errors so that any line numbers match the 1-based editor gutter.
 * (new Function() places userCode starting on line 3 in V8).
 */
function formatErrorWithGutterLine(err) {
  if (!err) return 'Unknown error';
  let message = err.message || String(err);
  if (err.stack) {
    const match = err.stack.match(/<anonymous>:(\d+):(\d+)/);
    if (match) {
      const rawLine = parseInt(match[1], 10);
      const userLine = rawLine - 2;
      if (userLine > 0 && !message.startsWith(`Line ${userLine}`)) {
        message = `Line ${userLine}: ${message}`;
      }
    }
  }
  return message;
}

// 4. Message Handler
self.onmessage = function (event) {
  const { type, userCode, functionName, testCases, compareMode } = event.data || {};
  if (type !== 'RUN_TESTS') return;

  // Reset captured logs for new execution run
  logs.length = 0;

  const cases = Array.isArray(testCases) ? testCases : [];

  if (!userCode || typeof userCode !== 'string' || !userCode.trim()) {
    self.postMessage({
      type: 'TEST_RESULTS',
      success: false,
      error: 'No JavaScript code provided to execute',
      logs: [],
      results: [],
      passCount: 0,
      totalCount: cases.length
    });
    return;
  }

  if (!functionName || typeof functionName !== 'string') {
    self.postMessage({
      type: 'TEST_RESULTS',
      success: false,
      error: 'Missing or invalid function name for test runner',
      logs: [],
      results: [],
      passCount: 0,
      totalCount: cases.length
    });
    return;
  }

  // Compile user code in isolated function scope
  let targetFn;
  try {
    // Place userCode on line 1 so line numbers in stack traces match gutter line numbers directly
    const wrappedCode = `${userCode}\n;if (typeof ${functionName} !== 'function') {\n  throw new Error('Expected function "${functionName}" is not defined or is not a function');\n}\nreturn ${functionName};`;
    const factory = new Function(wrappedCode);
    const extracted = factory();

    // Nested LeetCode function wrapper handler:
    // If userCode wraps a function inside another function of the same name:
    // e.g. function isAnagram(s, t) { var isAnagram = function(s, t) { ... } }
    targetFn = function (...args) {
      const res = extracted(...args);
      if (res === undefined) {
        try {
          const fnStr = extracted.toString();
          const hasInnerSameName = new RegExp(
            `(?:var|let|const|function)\\s+${functionName}\\s*(?:=\\s*(?:function|\\([^)]*\\)\\s*=>)|\\()`
          ).test(fnStr);
          if (hasInnerSameName) {
            const bodyContent = fnStr.slice(fnStr.indexOf('{') + 1, fnStr.lastIndexOf('}'));
            const innerCode = `
              let __innerFn = null;
              function __extract() {
                ${bodyContent}
                if (typeof ${functionName} === 'function') {
                  __innerFn = ${functionName};
                }
              }
              __extract();
              return __innerFn;
            `;
            const innerFn = new Function(innerCode)();
            if (typeof innerFn === 'function' && innerFn !== extracted) {
              return innerFn(...args);
            }
          }
        } catch (_) {}
      }
      return res;
    };
  } catch (err) {
    self.postMessage({
      type: 'TEST_RESULTS',
      success: false,
      error: formatErrorWithGutterLine(err),
      logs: [...logs],
      results: [],
      passCount: 0,
      totalCount: cases.length
    });
    return;
  }

  // Execute test cases
  const results = [];
  let passCount = 0;

  for (let i = 0; i < cases.length; i++) {
    const tc = cases[i];
    const isHidden = Boolean(tc.hidden);

    // Deep clone args to protect against in-place mutations
    let clonedArgs;
    try {
      clonedArgs = JSON.parse(JSON.stringify(tc.args || []));
    } catch (_) {
      clonedArgs = Array.isArray(tc.args) ? [...tc.args] : [];
    }

    let got = undefined;
    let executionError = null;
    let durationMs = 0;
    let passed = false;

    try {
      const start = performance.now();
      got = targetFn(...clonedArgs);
      durationMs = Math.max(0.1, Math.round((performance.now() - start) * 100) / 100);
      passed = deepEqual(got, tc.expected, compareMode || 'exact');
    } catch (err) {
      executionError = formatErrorWithGutterLine(err);
      passed = false;
    }

    if (passed) {
      passCount++;
    }

    results.push({
      index: i + 1,
      passed,
      hidden: isHidden,
      // Conceal input args and expected values for hidden test cases
      args: isHidden ? null : tc.args,
      expected: isHidden ? null : tc.expected,
      got: isHidden ? (passed ? null : 'Hidden test output withheld') : got,
      durationMs,
      error: executionError
    });
  }

  self.postMessage({
    type: 'TEST_RESULTS',
    success: passCount === cases.length,
    error: null,
    logs: [...logs],
    results,
    passCount,
    totalCount: cases.length
  });
};
