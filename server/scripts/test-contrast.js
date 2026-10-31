/**
 * DevPrep - WCAG 2.1 Contrast Ratio Verification Script (`test-contrast.js`)
 * 
 * Tests all 4 Theme & Skin Combinations:
 * 1. Paper Light
 * 2. Paper Dark
 * 3. Studio Light
 * 4. Studio Dark
 * 
 * Verifies that all essential UI text and semantic status badges achieve
 * a minimum contrast ratio of 4.5:1 (WCAG AA standard).
 */

function hexToRgb(hex) {
  const cleanHex = hex.replace('#', '').trim();
  let r, g, b;
  if (cleanHex.length === 3) {
    r = parseInt(cleanHex[0] + cleanHex[0], 16);
    g = parseInt(cleanHex[1] + cleanHex[1], 16);
    b = parseInt(cleanHex[2] + cleanHex[2], 16);
  } else {
    r = parseInt(cleanHex.substring(0, 2), 16);
    g = parseInt(cleanHex.substring(2, 4), 16);
    b = parseInt(cleanHex.substring(4, 6), 16);
  }
  return [r, g, b];
}

function getRelativeLuminance(hex) {
  const [r, g, b] = hexToRgb(hex).map((val) => {
    const srgb = val / 255;
    return srgb <= 0.04045
      ? srgb / 12.92
      : Math.pow((srgb + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function getContrastRatio(hex1, hex2) {
  const lum1 = getRelativeLuminance(hex1);
  const lum2 = getRelativeLuminance(hex2);
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  return (lighter + 0.05) / (darker + 0.05);
}

const THEME_COMBINATIONS = [
  {
    name: 'Paper Light',
    skin: 'paper',
    mode: 'light',
    pairs: [
      { role: 'Text / Background', fg: '#26211B', bg: '#F4EFE6' },
      { role: 'Muted Text / Background', fg: '#766B5B', bg: '#F4EFE6' },
      { role: 'Accent / Background', fg: '#B5472B', bg: '#F4EFE6' },
      { role: 'Button Text / Accent', fg: '#FFF8F0', bg: '#B5472B' },
      { role: 'Success / Success Soft', fg: '#346841', bg: '#DDEBDD' },
      { role: 'Warning / Warning Soft', fg: '#925807', bg: '#F4E5C2' },
      { role: 'Danger / Danger Soft', fg: '#A8332E', bg: '#F2D9D5' },
      { role: 'Info / Info Soft', fg: '#2F6F73', bg: '#D7E8E6' }
    ]
  },
  {
    name: 'Paper Dark',
    skin: 'paper',
    mode: 'dark',
    pairs: [
      { role: 'Text / Background', fg: '#EDE6D9', bg: '#151310' },
      { role: 'Muted Text / Background', fg: '#A0947F', bg: '#151310' },
      { role: 'Accent / Background', fg: '#E07A55', bg: '#151310' },
      { role: 'Button Text / Accent', fg: '#1A0F0A', bg: '#E07A55' },
      { role: 'Success / Success Soft', fg: '#7FB58A', bg: '#1F2E22' },
      { role: 'Warning / Warning Soft', fg: '#E0B055', bg: '#33291A' },
      { role: 'Danger / Danger Soft', fg: '#E27A72', bg: '#3A2120' },
      { role: 'Info / Info Soft', fg: '#6FB3B5', bg: '#1B2E2F' }
    ]
  },
  {
    name: 'Studio Light',
    skin: 'studio',
    mode: 'light',
    pairs: [
      { role: 'Text / Background', fg: '#18181B', bg: '#F8F7F4' },
      { role: 'Muted Text / Background', fg: '#5C5E66', bg: '#F8F7F4' },
      { role: 'Accent / Background', fg: '#2B44B8', bg: '#F8F7F4' },
      { role: 'Button Text / Accent', fg: '#F8F7F4', bg: '#2B44B8' },
      { role: 'Success / Success Soft', fg: '#27703F', bg: '#E1F0E6' },
      { role: 'Warning / Warning Soft', fg: '#8A5A00', bg: '#F6EBCF' },
      { role: 'Danger / Danger Soft', fg: '#B42318', bg: '#F8DEDA' },
      { role: 'Info / Info Soft', fg: '#475569', bg: '#E3E8EF' }
    ]
  },
  {
    name: 'Studio Dark',
    skin: 'studio',
    mode: 'dark',
    pairs: [
      { role: 'Text / Background', fg: '#EDEDEF', bg: '#121316' },
      { role: 'Muted Text / Background', fg: '#9A9CA6', bg: '#121316' },
      { role: 'Accent / Background', fg: '#8FA6FF', bg: '#121316' },
      { role: 'Button Text / Accent', fg: '#0B1030', bg: '#8FA6FF' },
      { role: 'Success / Success Soft', fg: '#66C28A', bg: '#16281F' },
      { role: 'Warning / Warning Soft', fg: '#E0B04F', bg: '#2B2414' },
      { role: 'Danger / Danger Soft', fg: '#F2867E', bg: '#2E1A19' },
      { role: 'Info / Info Soft', fg: '#9AA7BD', bg: '#1E242E' }
    ]
  }
];

const MIN_RATIO = 4.5;
let allPassed = true;
let totalChecks = 0;
let passedChecks = 0;

console.log('========================================================================');
console.log('       DevPrep WCAG 2.1 AA Contrast Ratio Verification Suite');
console.log('       Target Threshold: >= 4.5:1 for all primary & semantic text');
console.log('========================================================================\n');

for (const combo of THEME_COMBINATIONS) {
  console.log(`--- Combination: ${combo.name} [data-skin="${combo.skin}"] [data-theme="${combo.mode}"] ---`);
  for (const pair of combo.pairs) {
    totalChecks++;
    const ratio = getContrastRatio(pair.fg, pair.bg);
    const passed = ratio >= MIN_RATIO;
    if (passed) {
      passedChecks++;
      console.log(`  [PASS] ${pair.role.padEnd(28)} | ${pair.fg} on ${pair.bg} | Ratio: ${ratio.toFixed(2)}:1`);
    } else {
      allPassed = false;
      console.error(`  [FAIL] ${pair.role.padEnd(28)} | ${pair.fg} on ${pair.bg} | Ratio: ${ratio.toFixed(2)}:1 (Min: ${MIN_RATIO}:1)`);
    }
  }
  console.log('');
}

console.log('========================================================================');
console.log(`Summary: ${passedChecks}/${totalChecks} contrast checks passed.`);
if (allPassed) {
  console.log('Status: ALL THEME COMBINATIONS MEET OR EXCEED WCAG AA 4.5:1 REQUIREMENTS! ✓');
  console.log('========================================================================\n');
  process.exit(0);
} else {
  console.error('Status: SOME CONTRAST CHECKS FAILED THE 4.5:1 THRESHOLD! ✗');
  console.log('========================================================================\n');
  process.exit(1);
}
