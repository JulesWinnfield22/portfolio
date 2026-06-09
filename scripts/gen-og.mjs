// Run: node scripts/gen-og.mjs
import sharp from 'sharp';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const svg = `<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <!-- Background -->
  <rect width="1200" height="630" fill="#0c0c0a"/>

  <!-- Subtle border lines -->
  <line x1="60" y1="48" x2="1140" y2="48"  stroke="#1e1e1c" stroke-width="1"/>
  <line x1="60" y1="582" x2="1140" y2="582" stroke="#1e1e1c" stroke-width="1"/>

  <!-- AT logo — top right, scaled from 24×24 viewBox by 4× -->
  <g fill="none" stroke="#ff5a1f" stroke-width="6"
     stroke-linecap="round" stroke-linejoin="round"
     transform="translate(1046, 64) scale(4)">
    <path d="M3.5 21 L12 3 L20.5 21"/>
    <path d="M3.5 13 L20.5 13"/>
    <path d="M12 13 L12 17"/>
  </g>

  <!-- Name -->
  <text x="60" y="310"
        font-family="DejaVu Sans, Liberation Sans, Arial, sans-serif"
        font-weight="700"
        font-size="108"
        letter-spacing="-3"
        fill="#f0ece4">Abel Teame</text>

  <!-- Role + domain -->
  <text x="64" y="388"
        font-family="DejaVu Sans Mono, Liberation Mono, Courier New, monospace"
        font-size="26"
        letter-spacing="4"
        fill="#555555">SOFTWARE DEVELOPER · ABELTEAME.DEV</text>

  <!-- Stack line -->
  <text x="64" y="452"
        font-family="DejaVu Sans Mono, Liberation Mono, Courier New, monospace"
        font-size="19"
        letter-spacing="2"
        fill="#333333">Vue · React · TypeScript · Node.js · Elixir · Kotlin</text>

  <!-- Accent bar -->
  <rect x="60" y="498" width="72" height="3" rx="1.5" fill="#ff5a1f"/>

  <!-- Location / status -->
  <text x="60" y="548"
        font-family="DejaVu Sans Mono, Liberation Mono, Courier New, monospace"
        font-size="19"
        letter-spacing="2"
        fill="#333333">Addis Ababa · Available for work</text>
</svg>`;

const outPath = path.join(__dirname, '..', 'public', 'og.png');

await sharp(Buffer.from(svg)).png().toFile(outPath);
console.log('✅  public/og.png created (1200×630)');
