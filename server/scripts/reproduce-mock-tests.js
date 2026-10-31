const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function waitForUrl(url, timeoutMs = 20000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok || res.status === 200 || res.status === 304 || res.status === 404) return true;
    } catch (_) {}
    await sleep(400);
  }
  throw new Error(`Timeout waiting for ${url}`);
}

class CDPClient {
  constructor(wsUrl) {
    this.ws = new WebSocket(wsUrl);
    this.id = 1;
    this.callbacks = new Map();
    this.exceptions = [];
    this.consoleLogs = [];
    this.networkRequests = [];

    this.ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id && this.callbacks.has(msg.id)) {
        const { resolve, reject } = this.callbacks.get(msg.id);
        this.callbacks.delete(msg.id);
        if (msg.error) reject(new Error(msg.error.message));
        else resolve(msg.result);
      } else if (msg.method) {
        if (msg.method === 'Runtime.exceptionThrown') {
          this.exceptions.push(msg.params);
        } else if (msg.method === 'Console.messageAdded') {
          this.consoleLogs.push(msg.params.message);
        } else if (msg.method === 'Runtime.consoleAPICalled') {
          this.consoleLogs.push(msg.params);
        } else if (msg.method === 'Network.responseReceived') {
          this.networkRequests.push({
            url: msg.params.response.url,
            status: msg.params.response.status,
            statusText: msg.params.response.statusText
          });
        }
      }
    };
  }

  async ready() {
    if (this.ws.readyState === WebSocket.OPEN) return;
    await new Promise((resolve, reject) => {
      this.ws.onopen = resolve;
      this.ws.onerror = reject;
    });
  }

  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = this.id++;
      this.callbacks.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  close() {
    this.ws.close();
  }
}

async function run() {
  const rootDir = path.resolve(__dirname, '../..');

  let serverProc = null;
  try {
    const check = await fetch('http://127.0.0.1:5000/api/health');
    if (check.ok) console.log('Existing backend server detected on :5000');
  } catch (_) {
    console.log('Starting Express server on port 5000...');
    serverProc = spawn('node', [path.join(rootDir, 'server/server.js')], {
      cwd: rootDir,
      env: { ...process.env, PORT: '5000' }
    });
  }

  let clientProc = null;
  try {
    const check = await fetch('http://127.0.0.1:5173');
    if (check.ok) console.log('Existing Vite server detected on :5173');
  } catch (_) {
    console.log('Starting Vite server on port 5173...');
    const viteBin = path.join(rootDir, 'client/node_modules/vite/bin/vite.js');
    clientProc = spawn('node', [viteBin, '--host', '127.0.0.1', '--port', '5173'], {
      cwd: path.join(rootDir, 'client')
    });
  }

  let chromeProc = null;
  let cdp = null;

  try {
    await waitForUrl('http://127.0.0.1:5000/api/health');
    console.log('Backend server is ready on http://127.0.0.1:5000');
    await waitForUrl('http://127.0.0.1:5173');
    console.log('Vite server is ready on http://127.0.0.1:5173');

    const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
    const tempProfileDir = path.join(rootDir, 'node_modules', '.tmp_chrome_profile');
    if (!fs.existsSync(tempProfileDir)) fs.mkdirSync(tempProfileDir, { recursive: true });

    chromeProc = spawn(chromePath, [
      '--headless=new',
      '--no-sandbox',
      '--disable-gpu',
      '--remote-debugging-port=9225',
      `--user-data-dir=${tempProfileDir}`,
      'about:blank'
    ]);

    await sleep(2000);
    const newTabRes = await fetch('http://127.0.0.1:9225/json/new?about:blank', { method: 'PUT' });
    const tabData = await newTabRes.json();
    const wsUrl = tabData.webSocketDebuggerUrl;

    cdp = new CDPClient(wsUrl);
    await cdp.ready();

    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');
    await cdp.send('Network.enable');
    await cdp.send('Console.enable');

    console.log('\nLogging in as Demo User via API...');
    const authRes = await fetch('http://127.0.0.1:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'demo@devprep.com', password: 'Demo@1234' })
    });
    const authData = await authRes.json();
    console.log('Demo Auth Result:', authData.token ? `SUCCESS (User: ${authData.user.name}, ${authData.user.email})` : 'FAILED');

    const adminAuthRes = await fetch('http://127.0.0.1:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@devprep.com', password: 'Admin@1234' })
    });
    const adminAuthData = await adminAuthRes.json();
    console.log('Admin Auth Result:', adminAuthData.token ? `SUCCESS (User: ${adminAuthData.user.name}, ${adminAuthData.user.email})` : 'FAILED');

    // Establish origin
    await cdp.send('Page.navigate', { url: 'http://127.0.0.1:5173/login' });
    await sleep(1500);

    async function setCredentials(userObj, token) {
      await cdp.send('Runtime.evaluate', {
        expression: `
          localStorage.setItem('devprep-token', '${token}');
          localStorage.setItem('devprep-user', JSON.stringify(${JSON.stringify(userObj)}));
        `
      });
    }

    async function testScenario(label, setupFn, actionFn) {
      console.log(`\n========================================================================`);
      console.log(`SCENARIO: ${label}`);
      console.log(`========================================================================`);
      cdp.exceptions = [];
      cdp.consoleLogs = [];
      cdp.networkRequests = [];

      if (setupFn) await setupFn();
      await actionFn();
      await sleep(2500);

      const evalRes = await cdp.send('Runtime.evaluate', {
        expression: `({
          url: window.location.href,
          title: document.title,
          rootHtml: document.getElementById('root') ? document.getElementById('root').innerHTML : 'NO ROOT',
          skin: document.documentElement.getAttribute('data-skin'),
          theme: document.documentElement.getAttribute('data-theme')
        })`,
        returnByValue: true
      });

      const res = evalRes.result.value;
      const isBlank = !res.rootHtml || res.rootHtml.trim() === '';
      console.log('Current URL:       ', res.url);
      console.log('Document Title:    ', res.title);
      console.log('Active Skin / Theme:', `${res.skin} / ${res.theme}`);
      console.log('Root HTML Length:  ', res.rootHtml ? res.rootHtml.length : 0);
      console.log('Is Page Blank?     ', isBlank ? '>>> YES, COMPLETELY BLANK <<<' : 'NO (Has DOM content)');

      if (cdp.exceptions.length > 0) {
        console.log(`\n>>> UNCAUGHT RUNTIME EXCEPTIONS (${cdp.exceptions.length}):`);
        cdp.exceptions.forEach((ex, idx) => {
          console.log(`\n[Exception #${idx + 1}]`);
          if (ex.exceptionDetails) {
            console.log('Message: ', ex.exceptionDetails.text);
            if (ex.exceptionDetails.exception) {
              console.log('Details: ', ex.exceptionDetails.exception.description);
            }
            if (ex.exceptionDetails.stackTrace) {
              console.log('Stack Trace:');
              ex.exceptionDetails.stackTrace.callFrames.forEach(f => {
                console.log(`    at ${f.functionName || '<anonymous>'} (${f.url}:${f.lineNumber}:${f.columnNumber})`);
              });
            }
          }
        });
      }

      const errors = cdp.consoleLogs.filter(l => l.level === 'error' || l.type === 'error');
      if (errors.length > 0) {
        console.log(`\n>>> CONSOLE ERRORS (${errors.length}):`);
        errors.forEach(l => {
          console.log(`  -`, l.text || (l.args ? l.args.map(a => a.value || a.description).join(' ') : ''));
        });
      }

      const failedReqs = cdp.networkRequests.filter(r => r.status >= 400);
      if (failedReqs.length > 0) {
        console.log(`\n>>> FAILED NETWORK REQUESTS (${failedReqs.length}):`);
        failedReqs.forEach(r => console.log(`  - [${r.status} ${r.statusText}] ${r.url}`));
      } else {
        console.log(`Network Requests: All ${cdp.networkRequests.length} succeeded (0 failures)`);
      }
    }

    // 1. Demo User - Direct Navigation (Hard Reload) - Paper Light
    await testScenario(
      'Demo User | Direct Navigation / Hard Reload | Paper Light',
      async () => {
        await setCredentials(authData.user, authData.token);
        await cdp.send('Runtime.evaluate', {
          expression: `
            localStorage.setItem('devprep-skin', 'paper');
            localStorage.setItem('devprep-theme', 'light');
            document.documentElement.setAttribute('data-skin', 'paper');
            document.documentElement.setAttribute('data-theme', 'light');
          `
        });
      },
      async () => {
        await cdp.send('Page.navigate', { url: 'http://127.0.0.1:5173/mock-tests' });
      }
    );

    // 2. Demo User - Sidebar Navigation from Dashboard - Paper Light
    await testScenario(
      'Demo User | Sidebar Navigation from Dashboard | Paper Light',
      async () => {
        await setCredentials(authData.user, authData.token);
        await cdp.send('Page.navigate', { url: 'http://127.0.0.1:5173/' });
        await sleep(1500);
      },
      async () => {
        await cdp.send('Runtime.evaluate', {
          expression: `
            const link = Array.from(document.querySelectorAll('a')).find(el => el.getAttribute('href') === '/mock-tests' || el.textContent.includes('Mock Tests'));
            if (link) link.click();
            else window.location.href = '/mock-tests';
          `
        });
      }
    );

    // 3. Demo User - Studio Light
    await testScenario(
      'Demo User | Direct Navigation | Studio Light',
      async () => {
        await setCredentials(authData.user, authData.token);
        await cdp.send('Runtime.evaluate', {
          expression: `
            localStorage.setItem('devprep-skin', 'studio');
            localStorage.setItem('devprep-theme', 'light');
            document.documentElement.setAttribute('data-skin', 'studio');
            document.documentElement.setAttribute('data-theme', 'light');
          `
        });
      },
      async () => {
        await cdp.send('Page.navigate', { url: 'http://127.0.0.1:5173/mock-tests' });
      }
    );

    // 4. Demo User - Studio Dark
    await testScenario(
      'Demo User | Direct Navigation | Studio Dark',
      async () => {
        await setCredentials(authData.user, authData.token);
        await cdp.send('Runtime.evaluate', {
          expression: `
            localStorage.setItem('devprep-skin', 'studio');
            localStorage.setItem('devprep-theme', 'dark');
            document.documentElement.setAttribute('data-skin', 'studio');
            document.documentElement.setAttribute('data-theme', 'dark');
          `
        });
      },
      async () => {
        await cdp.send('Page.navigate', { url: 'http://127.0.0.1:5173/mock-tests' });
      }
    );

    // 5. Admin User - Direct Navigation - Paper Light
    await testScenario(
      'Admin User | Direct Navigation | Paper Light',
      async () => {
        await setCredentials(adminAuthData.user, adminAuthData.token);
        await cdp.send('Runtime.evaluate', {
          expression: `
            localStorage.setItem('devprep-skin', 'paper');
            localStorage.setItem('devprep-theme', 'light');
            document.documentElement.setAttribute('data-skin', 'paper');
            document.documentElement.setAttribute('data-theme', 'light');
          `
        });
      },
      async () => {
        await cdp.send('Page.navigate', { url: 'http://127.0.0.1:5173/mock-tests' });
      }
    );

    console.log(`\n========================================================================`);
    console.log('SERVER TERMINAL OUTPUT LOGS:');
    console.log(`========================================================================`);
    console.log(serverOutput.trim() || '(No server error messages outputted)');

  } finally {
    if (cdp) cdp.close();
    if (chromeProc) chromeProc.kill();
    if (serverProc) serverProc.kill();
    if (clientProc) clientProc.kill();
  }
}

run().catch(console.error);
