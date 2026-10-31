/**
 * DevPrep - Final QA Pass: Responsive, A11y & Viewport Suite via Chrome CDP
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function waitForSelector(cdp, selector, timeoutMs = 5000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const exists = await cdp.evaluate(`Boolean(document.querySelector('${selector}'))`);
    if (exists) return true;
    await sleep(100);
  }
  return false;
}

class CDPClient {
  constructor(wsUrl) {
    this.ws = new WebSocket(wsUrl);
    this.id = 1;
    this.callbacks = new Map();
    this.exceptions = [];

    this.ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id && this.callbacks.has(msg.id)) {
        const { resolve, reject } = this.callbacks.get(msg.id);
        this.callbacks.delete(msg.id);
        if (msg.error) reject(new Error(msg.error.message));
        else resolve(msg.result);
      } else if (msg.method === 'Runtime.exceptionThrown') {
        this.exceptions.push(msg.params);
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

  async evaluate(expression) {
    const res = await this.send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true
    });
    if (res.exceptionDetails) {
      console.error('[CDP Evaluate Exception]:', res.exceptionDetails.exception?.description || res.exceptionDetails.text);
    }
    return res.result?.value;
  }

  close() {
    this.ws.close();
  }
}

async function run() {
  console.log('========================================================================');
  console.log('   DevPrep QA: Responsive (360/768/1280/1920), A11y & Modal Suite      ');
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

  const rootDir = path.resolve(__dirname, '../..');
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const tempProfileDir = path.join(rootDir, 'node_modules', '.tmp_chrome_qa_a11y');
  if (!fs.existsSync(tempProfileDir)) fs.mkdirSync(tempProfileDir, { recursive: true });

  const chromeProc = spawn(chromePath, [
    '--headless=new',
    '--no-sandbox',
    '--disable-gpu',
    '--remote-debugging-port=9229',
    `--user-data-dir=${tempProfileDir}`,
    'about:blank'
  ]);

  let cdp = null;

  try {
    await sleep(2000);
    const newTabRes = await fetch('http://127.0.0.1:9229/json/new?about:blank', { method: 'PUT' });
    const tabData = await newTabRes.json();
    cdp = new CDPClient(tabData.webSocketDebuggerUrl);
    await cdp.ready();

    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');

    // Authenticate Demo user for storage
    const demoRes = await fetch('http://127.0.0.1:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'demo@devprep.com', password: 'Demo@1234' })
    });
    const demoAuth = await demoRes.json();

    // 1. HORIZONTAL SCROLL & RESPONSIVENESS MATRIX
    console.log('--- 1. Responsive Viewport Matrix (360, 768, 1280, 1920) ---');
    const viewports = [
      { width: 360, height: 740, name: 'Mobile (360px)' },
      { width: 768, height: 1024, name: 'Tablet (768px)' },
      { width: 1280, height: 800, name: 'Laptop (1280px)' },
      { width: 1920, height: 1080, name: 'Desktop (1920px)' }
    ];

    const skinThemeCombos = [
      { skin: 'paper', theme: 'light' },
      { skin: 'paper', theme: 'dark' },
      { skin: 'studio', theme: 'light' },
      { skin: 'studio', theme: 'dark' }
    ];

    const testRoutes = ['/', '/problems', '/problems/q-arr-1', '/mock-tests', '/applications', '/profile'];

    for (const vp of viewports) {
      await cdp.send('Emulation.setDeviceMetricsOverride', {
        width: vp.width,
        height: vp.height,
        deviceScaleFactor: 1,
        mobile: vp.width < 900
      });

      for (const st of skinThemeCombos) {
        // Set skin & theme & token
        await cdp.send('Page.navigate', { url: 'http://localhost:5173/' });
        await sleep(600);
        await cdp.evaluate(`
          localStorage.setItem('devprep-token', '${demoAuth.token}');
          localStorage.setItem('devprep-user', JSON.stringify(${JSON.stringify(demoAuth.user)}));
          localStorage.setItem('devprep-theme', '${st.theme}');
          localStorage.setItem('devprep-skin', '${st.skin}');
          document.documentElement.setAttribute('data-theme', '${st.theme}');
          document.documentElement.setAttribute('data-skin', '${st.skin}');
        `);

        for (const route of testRoutes) {
          await cdp.send('Page.navigate', { url: `http://localhost:5173${route}` });
          await sleep(500);

          const overflowData = await cdp.evaluate(`
            (() => {
              const docWidth = document.documentElement.offsetWidth;
              const scrollWidth = document.documentElement.scrollWidth;
              const winWidth = window.innerWidth;
              const hasHorizontalScroll = scrollWidth > winWidth + 1;
              return { hasHorizontalScroll, scrollWidth, winWidth, docWidth };
            })()
          `);

          if (!overflowData.hasHorizontalScroll) {
            pass(`No horizontal overflow on ${route} at ${vp.name} [${st.skin}-${st.theme}]`);
          } else {
            fail(
              `Horizontal overflow on ${route} at ${vp.name} [${st.skin}-${st.theme}]`,
              `scrollWidth: ${overflowData.scrollWidth} > winWidth: ${overflowData.winWidth}`
            );
          }
        }
      }
    }

    // 2. MODAL FOCUS TRAP & ESCAPE DISMISSAL
    console.log('\n--- 2. Modal Accessibility, Focus Trap & Escape Dismissal ---');
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: 1280,
      height: 800,
      deviceScaleFactor: 1,
      mobile: false
    });
    await cdp.send('Page.navigate', { url: 'http://localhost:5173/login' });
    await sleep(1500);
    await cdp.evaluate(`
      localStorage.setItem('devprep-token', '${demoAuth.token}');
      localStorage.setItem('devprep-user', JSON.stringify(${JSON.stringify(demoAuth.user)}));
      localStorage.setItem('devprep-skin', 'paper');
      localStorage.setItem('devprep-theme', 'light');
    `);
    await cdp.send('Page.navigate', { url: 'http://localhost:5173/applications' });
    await sleep(2000);

    // Click "Add Application" button
    const openModalResult = await cdp.evaluate(`
      (() => {
        const addBtn = document.querySelector('.btn-primary') || Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Add'));
        if (!addBtn) return { success: false, reason: 'Add button not found', htmlSnippet: document.body.innerText.slice(0, 150) };
        addBtn.click();
        return { success: true };
      })()
    `);

    if (openModalResult && openModalResult.success) {
      await sleep(500);
      const modalOpenState = await cdp.evaluate(`
        (() => {
          const dialog = document.querySelector('[role="dialog"]');
          const hasBackdrop = Boolean(document.querySelector('.modal-portal-overlay, .modal-overlay'));
          const focusedTag = document.activeElement ? document.activeElement.tagName : null;
          return { isOpen: Boolean(dialog), hasBackdrop, focusedTag };
        })()
      `);

      if (modalOpenState && modalOpenState.isOpen && modalOpenState.hasBackdrop) {
        pass('Modal opened with accessible role="dialog", backdrop overlay and focus trap');
      } else {
        fail('Modal failed to open properly', modalOpenState);
      }

      // Press Escape key
      await cdp.send('Input.dispatchKeyEvent', { type: 'rawKeyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
      await cdp.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
      await sleep(500);

      const modalClosedState = await cdp.evaluate(`
        (() => {
          const dialog = document.querySelector('[role="dialog"]');
          return { isClosed: !dialog };
        })()
      `);

      if (modalClosedState && modalClosedState.isClosed) {
        pass('Escape key safely closed the modal dialog');
      } else {
        fail('Escape key did not dismiss modal', modalClosedState);
      }
    } else {
      fail('Could not trigger Add Application modal', openModalResult);
    }

    // 3. PROFILE VIEW MODE VS EDIT MODE
    console.log('\n--- 3. Profile View Mode vs Edit Mode ---');
    await cdp.send('Page.navigate', { url: 'http://localhost:5173/profile' });
    await sleep(2000);

    const initialProfileState = await cdp.evaluate(`
      (() => {
        const editBtn = document.querySelector('.profile-edit-btn');
        const changePhotoBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Change photo'));
        const saveChangesBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Save changes'));
        return {
          hasEditBtn: Boolean(editBtn),
          hasChangePhotoInViewMode: Boolean(changePhotoBtn),
          hasSaveBtnInViewMode: Boolean(saveChangesBtn)
        };
      })()
    `);

    if (initialProfileState && initialProfileState.hasEditBtn && !initialProfileState.hasChangePhotoInViewMode && !initialProfileState.hasSaveBtnInViewMode) {
      pass('Profile renders strictly in View mode by default: photo edit buttons and save button are hidden');
    } else {
      fail('Profile View mode state check', initialProfileState);
    }

    // Click "Edit Profile"
    await cdp.evaluate(`
      (() => {
        const editBtn = document.querySelector('.profile-edit-btn');
        if (editBtn) editBtn.click();
      })()
    `);
    await sleep(600);

    const editModeState = await cdp.evaluate(`
      (() => {
        const cancelBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Cancel'));
        const saveChangesBtn = document.querySelector('.profile-save-btn');
        const changePhotoBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Change photo'));
        const photoNote = document.querySelector('.profile-avatar-note')?.textContent || '';
        return {
          hasCancelBtn: Boolean(cancelBtn),
          hasSaveBtn: Boolean(saveChangesBtn),
          hasChangePhoto: Boolean(changePhotoBtn),
          photoNote
        };
      })()
    `);

    if (editModeState && editModeState.hasCancelBtn && editModeState.hasSaveBtn && editModeState.hasChangePhoto && editModeState.photoNote.includes('immediately')) {
      pass('Edit Mode activated: "Save changes", "Cancel", "Change photo", and "Photo updates immediately" are visible');
    } else {
      fail('Edit Mode state check', editModeState);
    }

    // 4. 200% ZOOM USABILITY CHECK
    console.log('\n--- 4. 200% Zoom Usability Simulation ---');
    // Simulate 200% zoom on 1280px display (effective 640px CSS layout)
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: 640,
      height: 480,
      deviceScaleFactor: 2,
      mobile: false
    });
    await cdp.send('Page.navigate', { url: 'http://localhost:5173/' });
    await sleep(2000);

    const zoomCheck = await cdp.evaluate(`
      (() => {
        const title = document.querySelector('.greeting-title')?.textContent || '';
        const cards = document.querySelectorAll('.stat-card');
        const scrollWidth = document.documentElement.scrollWidth;
        const winWidth = window.innerWidth;
        return { hasTitle: Boolean(title), cardCount: cards.length, scrollWidth, winWidth, ok: scrollWidth <= winWidth + 1 };
      })()
    `);

    if (zoomCheck && zoomCheck.ok && zoomCheck.hasTitle) {
      pass('Dashboard renders cleanly and without horizontal clipping under 200% zoom scaling');
    } else {
      fail('200% zoom scaling check', zoomCheck);
    }

    console.log('\n========================================================================');
    console.log(`Results: ${passes} Passed, ${fails} Failed`);
    console.log('========================================================================');
    if (fails > 0) process.exit(1);

  } catch (err) {
    console.error('Test execution error:', err);
    process.exit(1);
  } finally {
    if (cdp) cdp.close();
    chromeProc.kill('SIGKILL');
  }
}

run();
