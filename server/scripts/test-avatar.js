/**
 * DevPrep - Profile Avatar Backend Automated Test Suite (`test-avatar.js`)
 * 
 * Tests:
 * 1. Authentication requirement (401 on missing token)
 * 2. Initial state: GET returns { avatar: null }
 * 3. Valid WebP upload (RIFF...WEBP magic bytes) -> 200
 * 4. Valid JPEG upload (FF D8 FF magic bytes) -> 200
 * 5. Valid PNG upload (89 50 4E 47 magic bytes) -> 200
 * 6. File signature mismatch (PDF disguised as JPEG) -> 400
 * 7. SVG rejection -> 400
 * 8. GIF rejection -> 400
 * 9. Decoded binary payload exceeding 100 KB -> 400
 * 10. Request body exceeding 200 KB route limit -> 413
 * 11. Multi-tenant isolation between demo user and admin
 * 12. Deletion: DELETE removes entry, subsequent GET returns null
 */

const assert = require('assert');
const path = require('path');
const fs = require('fs');

const BASE_URL = 'http://127.0.0.1:5000';

// Minimal valid file buffers for testing
// 1. Valid WebP (RIFF + size + WEBP + VP8 chunk)
const VALID_WEBP_BUFFER = Buffer.from([
  0x52, 0x49, 0x46, 0x46, // 'RIFF'
  0x1a, 0x00, 0x00, 0x00, // file length - 8
  0x57, 0x45, 0x42, 0x50, // 'WEBP'
  0x56, 0x50, 0x38, 0x20, // 'VP8 '
  0x0e, 0x00, 0x00, 0x00, // chunk size
  0x30, 0x01, 0x00, 0x9d, 0x01, 0x2a, 0x01, 0x00, 0x01, 0x00, 0x02, 0x3e, 0x00, 0x00
]);

// 2. Valid 1x1 JPEG
const VALID_JPEG_BUFFER = Buffer.from([
  0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x01, 0x00, 0x48,
  0x00, 0x48, 0x00, 0x00, 0xff, 0xdb, 0x00, 0x43, 0x00, 0x03, 0x02, 0x02, 0x02, 0x02, 0x02, 0x03,
  0x02, 0x02, 0x02, 0x03, 0x03, 0x03, 0x03, 0x04, 0x06, 0x04, 0x04, 0x04, 0x04, 0x04, 0x08, 0x06,
  0x06, 0x05, 0x06, 0x09, 0x08, 0x0a, 0x0a, 0x09, 0x08, 0x09, 0x09, 0x0a, 0x0c, 0x0f, 0x0c, 0x0a,
  0xff, 0xc0, 0x00, 0x0b, 0x08, 0x00, 0x01, 0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0xff, 0xc4, 0x00,
  0x1f, 0x00, 0x00, 0x01, 0x05, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0a, 0x0b, 0xff, 0xda,
  0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3f, 0x00, 0x37, 0xff, 0xd9
]);

// 3. Valid 1x1 PNG
const VALID_PNG_BUFFER = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
  0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4,
  0x89, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00,
  0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae,
  0x42, 0x60, 0x82
]);

async function runTests() {
  console.log('========================================================================');
  console.log('       DevPrep Profile Avatar API Test Suite');
  console.log('========================================================================\n');

  // Authenticate demo user and admin user
  const demoLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'demo@devprep.com', password: 'Demo@1234' })
  });
  const demoData = await demoLoginRes.json();
  const demoToken = demoData.token;
  assert(demoToken, 'Demo login failed');

  const adminLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@devprep.com', password: 'Admin@1234' })
  });
  const adminData = await adminLoginRes.json();
  const adminToken = adminData.token;
  assert(adminToken, 'Admin login failed');

  console.log('✓ Authentication successful for Demo User and Admin User.');

  // Test 1: Authentication requirement
  const unauthRes = await fetch(`${BASE_URL}/api/profile/avatar`);
  assert.strictEqual(unauthRes.status, 401, 'Expected 401 Unauthorized without token');
  console.log('✓ [PASS] GET /api/profile/avatar requires authentication (401).');

  // Clean initial state
  await fetch(`${BASE_URL}/api/profile/avatar`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${demoToken}` }
  });
  await fetch(`${BASE_URL}/api/profile/avatar`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${adminToken}` }
  });

  // Test 2: Initial GET returns avatar: null
  const initRes = await fetch(`${BASE_URL}/api/profile/avatar`, {
    headers: { Authorization: `Bearer ${demoToken}` }
  });
  const initData = await initRes.json();
  assert.strictEqual(initRes.status, 200);
  assert.strictEqual(initData.avatar, null);
  console.log('✓ [PASS] Initial GET returns { avatar: null } (200).');

  // Test 3: Upload valid WebP
  const webpDataUrl = `data:image/webp;base64,${VALID_WEBP_BUFFER.toString('base64')}`;
  const webpRes = await fetch(`${BASE_URL}/api/profile/avatar`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${demoToken}`
    },
    body: JSON.stringify({ image: webpDataUrl })
  });
  const webpJson = await webpRes.json();
  assert.strictEqual(webpRes.status, 200, `WebP upload failed: ${webpJson.error}`);
  assert.strictEqual(webpJson.avatar, webpDataUrl);
  console.log('✓ [PASS] Valid WebP uploaded successfully (200).');

  // Test 4: Upload valid JPEG
  const jpegDataUrl = `data:image/jpeg;base64,${VALID_JPEG_BUFFER.toString('base64')}`;
  const jpegRes = await fetch(`${BASE_URL}/api/profile/avatar`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${demoToken}`
    },
    body: JSON.stringify({ image: jpegDataUrl })
  });
  const jpegJson = await jpegRes.json();
  assert.strictEqual(jpegRes.status, 200, `JPEG upload failed: ${jpegJson.error}`);
  assert.strictEqual(jpegJson.avatar, jpegDataUrl);
  console.log('✓ [PASS] Valid JPEG uploaded successfully (200).');

  // Test 5: Upload valid PNG
  const pngDataUrl = `data:image/png;base64,${VALID_PNG_BUFFER.toString('base64')}`;
  const pngRes = await fetch(`${BASE_URL}/api/profile/avatar`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${demoToken}`
    },
    body: JSON.stringify({ image: pngDataUrl })
  });
  const pngJson = await pngRes.json();
  assert.strictEqual(pngRes.status, 200, `PNG upload failed: ${pngJson.error}`);
  assert.strictEqual(pngJson.avatar, pngDataUrl);
  console.log('✓ [PASS] Valid PNG uploaded successfully (200).');

  // Test 6: File signature mismatch (PDF disguised as JPEG)
  const fakeJpegDataUrl = `data:image/jpeg;base64,${Buffer.from('%PDF-1.4 Fake PDF Content Header').toString('base64')}`;
  const fakeJpegRes = await fetch(`${BASE_URL}/api/profile/avatar`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${demoToken}`
    },
    body: JSON.stringify({ image: fakeJpegDataUrl })
  });
  const fakeJpegJson = await fakeJpegRes.json();
  assert.strictEqual(fakeJpegRes.status, 400, 'Expected 400 for fake JPEG');
  assert(fakeJpegJson.error.includes('signature mismatch'), 'Expected file signature mismatch error message');
  console.log('✓ [PASS] Renamed non-image (PDF disguised as JPEG) rejected with 400.');

  // Test 7: SVG rejection
  const svgDataUrl = `data:image/svg+xml;base64,${Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"></svg>').toString('base64')}`;
  const svgRes = await fetch(`${BASE_URL}/api/profile/avatar`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${demoToken}`
    },
    body: JSON.stringify({ image: svgDataUrl })
  });
  const svgJson = await svgRes.json();
  assert.strictEqual(svgRes.status, 400, 'Expected 400 for SVG');
  assert(svgJson.error.includes('SVG images are not supported'), 'Expected SVG unsupported error message');
  console.log('✓ [PASS] SVG format rejected with friendly 400.');

  // Test 8: GIF rejection
  const gifDataUrl = `data:image/gif;base64,${Buffer.from('GIF89a Fake Gif Header').toString('base64')}`;
  const gifRes = await fetch(`${BASE_URL}/api/profile/avatar`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${demoToken}`
    },
    body: JSON.stringify({ image: gifDataUrl })
  });
  const gifJson = await gifRes.json();
  assert.strictEqual(gifRes.status, 400, 'Expected 400 for GIF');
  assert(gifJson.error.includes('GIF images are not supported'), 'Expected GIF unsupported error message');
  console.log('✓ [PASS] GIF format rejected with friendly 400.');

  // Test 9: Decoded binary payload exceeding 100 KB
  // Buffer of 105 KB starting with valid JPEG magic bytes
  const largeBinary = Buffer.alloc(105 * 1024, 0);
  largeBinary[0] = 0xff;
  largeBinary[1] = 0xd8;
  largeBinary[2] = 0xff;
  const largeDataUrl = `data:image/jpeg;base64,${largeBinary.toString('base64')}`;
  const largeRes = await fetch(`${BASE_URL}/api/profile/avatar`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${demoToken}`
    },
    body: JSON.stringify({ image: largeDataUrl })
  });
  const largeJson = await largeRes.json();
  assert.strictEqual(largeRes.status, 400, 'Expected 400 for >100 KB binary payload');
  assert(largeJson.error.includes('100 KB'), 'Expected 100 KB error message');
  console.log('✓ [PASS] Binary payload > 100 KB rejected with 400.');

  // Test 10: Request body exceeding 200 KB route limit
  // String payload of 220 KB
  const oversizedString = 'x'.repeat(220 * 1024);
  const oversizedRes = await fetch(`${BASE_URL}/api/profile/avatar`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${demoToken}`
    },
    body: JSON.stringify({ image: oversizedString })
  });
  assert.strictEqual(oversizedRes.status, 413, `Expected 413 Payload Too Large, got ${oversizedRes.status}`);
  const oversizedJson = await oversizedRes.json();
  assert(oversizedJson.error.includes('Too Large') || oversizedJson.error.includes('200 KB'), 'Expected clear 413 error message');
  console.log('✓ [PASS] Request body exceeding 200 KB returns HTTP 413.');

  // Test 11: Multi-tenant user isolation
  // Demo user sets PNG avatar
  await fetch(`${BASE_URL}/api/profile/avatar`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${demoToken}`
    },
    body: JSON.stringify({ image: pngDataUrl })
  });

  // Admin user GET returns null
  const adminGetRes = await fetch(`${BASE_URL}/api/profile/avatar`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  const adminGetData = await adminGetRes.json();
  assert.strictEqual(adminGetData.avatar, null, 'Admin should not see Demo user avatar');

  // Admin sets their own WebP avatar
  await fetch(`${BASE_URL}/api/profile/avatar`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`
    },
    body: JSON.stringify({ image: webpDataUrl })
  });

  // Verify Demo user still has their PNG avatar
  const demoGetRes = await fetch(`${BASE_URL}/api/profile/avatar`, {
    headers: { Authorization: `Bearer ${demoToken}` }
  });
  const demoGetData = await demoGetRes.json();
  assert.strictEqual(demoGetData.avatar, pngDataUrl, 'Demo user avatar should be unchanged');

  // Admin deletes their avatar; Demo user remains untouched
  await fetch(`${BASE_URL}/api/profile/avatar`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${adminToken}` }
  });

  const demoStillHasRes = await fetch(`${BASE_URL}/api/profile/avatar`, {
    headers: { Authorization: `Bearer ${demoToken}` }
  });
  const demoStillHasData = await demoStillHasRes.json();
  assert.strictEqual(demoStillHasData.avatar, pngDataUrl, 'Demo avatar must survive admin deletion');
  console.log('✓ [PASS] Multi-tenant data isolation verified: users cannot read, overwrite, or delete each other’s avatars.');

  // Test 12: Delete Demo user avatar
  const delRes = await fetch(`${BASE_URL}/api/profile/avatar`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${demoToken}` }
  });
  const delJson = await delRes.json();
  assert.strictEqual(delRes.status, 200);
  assert.strictEqual(delJson.avatar, null);

  const finalGet = await fetch(`${BASE_URL}/api/profile/avatar`, {
    headers: { Authorization: `Bearer ${demoToken}` }
  });
  const finalData = await finalGet.json();
  assert.strictEqual(finalData.avatar, null);
  console.log('✓ [PASS] DELETE removes avatar and reverts to null (200).');

  console.log('\n========================================================================');
  console.log('Summary: ALL 12 BACKEND AVATAR TESTS PASSED SUCCESSFULLY! ✓');
  console.log('========================================================================\n');
}

runTests().catch((err) => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
