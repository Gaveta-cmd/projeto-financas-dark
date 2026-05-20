/**
 * Generates PWA PNG icons from an inline SVG source.
 * Run once: node scripts/generate-icons.mjs
 */
import sharp from 'sharp';
import { mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '..', 'public');

mkdirSync(publicDir, { recursive: true });

// ── Icon SVG (512×512 viewBox, black bg, red accent, wallet shape) ──────────
const ICON_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <!-- Background -->
  <rect width="512" height="512" rx="112" fill="#000000"/>

  <!-- Outer card -->
  <rect x="72" y="160" width="368" height="248" rx="28" fill="#18181b"/>
  <rect x="72" y="160" width="368" height="248" rx="28" fill="none" stroke="#ef233c" stroke-width="4" opacity="0.6"/>

  <!-- Card stripe top -->
  <rect x="72" y="204" width="368" height="2" fill="#27272a"/>

  <!-- Wallet flap -->
  <rect x="280" y="232" width="128" height="72" rx="14" fill="#27272a"/>
  <circle cx="356" cy="268" r="18" fill="#ef233c"/>
  <circle cx="356" cy="268" r="8" fill="#000000"/>

  <!-- Card chip lines -->
  <rect x="104" y="232" width="48" height="36" rx="8" fill="#ef233c" opacity="0.9"/>
  <rect x="112" y="244" width="32" height="2" rx="1" fill="#000" opacity="0.4"/>
  <rect x="112" y="250" width="32" height="2" rx="1" fill="#000" opacity="0.4"/>
  <rect x="112" y="256" width="20" height="2" rx="1" fill="#000" opacity="0.4"/>

  <!-- Bottom dots (card numbers) -->
  <circle cx="112" cy="352" r="6" fill="#ef233c" opacity="0.9"/>
  <circle cx="132" cy="352" r="6" fill="#ef233c" opacity="0.9"/>
  <circle cx="152" cy="352" r="6" fill="#ef233c" opacity="0.9"/>
  <circle cx="172" cy="352" r="6" fill="#27272a"/>
  <circle cx="212" cy="352" r="6" fill="#27272a"/>
  <circle cx="232" cy="352" r="6" fill="#27272a"/>
  <circle cx="252" cy="352" r="6" fill="#27272a"/>
  <circle cx="272" cy="352" r="6" fill="#27272a"/>

  <!-- Glow overlay -->
  <radialGradient id="glow" cx="50%" cy="30%" r="60%">
    <stop offset="0%" stop-color="#ef233c" stop-opacity="0.12"/>
    <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
  </radialGradient>
  <rect width="512" height="512" rx="112" fill="url(#glow)"/>
</svg>`.trim();

// ── Screenshot SVG (540×720) ─────────────────────────────────────────────────
const SCREENSHOT_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 540 720" width="540" height="720">
  <rect width="540" height="720" fill="#000000"/>

  <!-- Header -->
  <rect width="540" height="64" fill="#18181b"/>
  <rect x="20" y="20" width="80" height="24" rx="6" fill="#ef233c" opacity="0.9"/>
  <rect x="120" y="26" width="120" height="12" rx="4" fill="#27272a"/>
  <circle cx="506" cy="32" r="16" fill="#27272a"/>

  <!-- Balance card -->
  <rect x="20" y="80" width="500" height="140" rx="16" fill="#18181b" stroke="#ef233c" stroke-width="1" stroke-opacity="0.4"/>
  <rect x="40" y="104" width="80" height="10" rx="4" fill="#27272a"/>
  <rect x="40" y="124" width="200" height="28" rx="6" fill="#ef233c" opacity="0.9"/>
  <rect x="40" y="164" width="140" height="10" rx="4" fill="#27272a"/>
  <rect x="40" y="180" width="100" height="10" rx="4" fill="#27272a" opacity="0.6"/>

  <!-- Chart bars -->
  <rect x="20" y="240" width="500" height="140" rx="16" fill="#18181b"/>
  ${[60,90,50,110,75,130,95].map((h,i) =>
    `<rect x="${55 + i*62}" y="${340 - h}" width="40" height="${h}" rx="4" fill="${i === 5 ? '#ef233c' : '#27272a'}"/>`
  ).join('\n  ')}

  <!-- Transaction items -->
  ${[0,1,2,3].map(i => `
  <rect x="20" y="${404 + i*72}" width="500" height="60" rx="12" fill="#18181b"/>
  <circle cx="56" cy="${434 + i*72}" r="18" fill="${i === 0 ? '#ef233c' : '#27272a'}" opacity="${i === 0 ? '0.9' : '1'}"/>
  <rect x="86" y="${422 + i*72}" width="120" height="10" rx="4" fill="#e4e4e7"/>
  <rect x="86" y="${440 + i*72}" width="80" height="8" rx="4" fill="#27272a"/>
  <rect x="420" y="${428 + i*72}" width="80" height="12" rx="4" fill="${i % 2 === 0 ? '#ef233c' : '#22c55e'}" opacity="0.9"/>`
  ).join('')}

  <!-- Bottom nav -->
  <rect x="0" y="668" width="540" height="52" fill="#18181b"/>
  ${[0,1,2,3].map(i => `<circle cx="${74 + i*132}" cy="694" r="6" fill="${i === 0 ? '#ef233c' : '#27272a'}"/>`).join('')}
</svg>`.trim();

const sizes = [
  { name: 'icon-192x192.png',  w: 192, h: 192, svg: ICON_SVG },
  { name: 'icon-512x512.png',  w: 512, h: 512, svg: ICON_SVG },
  { name: 'screenshot-540x720.png', w: 540, h: 720, svg: SCREENSHOT_SVG },
];

for (const { name, w, h, svg } of sizes) {
  const outPath = join(publicDir, name);
  await sharp(Buffer.from(svg))
    .resize(w, h)
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toFile(outPath);
  console.log(`✓ ${name}  (${w}×${h})`);
}

console.log('\nIcons generated in public/');
