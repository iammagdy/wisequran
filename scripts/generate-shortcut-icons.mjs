import { Resvg } from "@resvg/resvg-js";
import { writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, "../public/icons");

const BG = "#3d7a5a";
const FG = "white";
const SIZE = 96;
// Icon paths are defined in a 24x24 viewBox.
// We render them inside a 64x64 area centred in the 96x96 canvas (16px padding each side).

function makeIcon(title, paths) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">
  <!-- background -->
  <rect width="${SIZE}" height="${SIZE}" rx="20" fill="${BG}"/>
  <!-- icon (24×24 paths scaled to fit 64×64, offset by 16px) -->
  <g transform="translate(16,16) scale(${64 / 24})">
    <g fill="none" stroke="${FG}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
      ${paths}
    </g>
  </g>
</svg>`;
}

const icons = [
  {
    filename: "shortcut-quran.png",
    title: "Quran",
    paths: `
      <path d="M2 6C2 5.45 2.45 5 3 5h8v14H3a1 1 0 0 1-1-1V6z"/>
      <path d="M22 6c0-.55-.45-1-1-1h-8v14h8a1 1 0 0 0 1-1V6z"/>
      <path d="M11 5v14"/>
      <path d="M7 9h2M7 12h2M15 9h2M15 12h2"/>
    `,
  },
  {
    filename: "shortcut-prayer.png",
    title: "Prayer",
    paths: `
      <path d="M12 2v2"/>
      <path d="M12 4c-2.5 0-4 1.8-4 4v1H7a1 1 0 0 0-1 1v8h12v-8a1 1 0 0 0-1-1h-1V8c0-2.2-1.5-4-4-4z"/>
      <path d="M8 8c0-2.2 1.8-4 4-4s4 1.8 4 4"/>
      <path d="M3 18h18"/>
      <path d="M3 21h18"/>
      <path d="M4 18v-3"/>
      <path d="M20 18v-3"/>
    `,
  },
  {
    filename: "shortcut-azkar.png",
    title: "Azkar",
    paths: `
      <path d="M8 13V7a1 1 0 0 1 2 0v4"/>
      <path d="M10 11V6a1 1 0 0 1 2 0v5"/>
      <path d="M12 11V7a1 1 0 0 1 2 0v4"/>
      <path d="M14 11v-2a1 1 0 0 1 2 0v5a6 6 0 0 1-6 6 6 6 0 0 1-6-6v-3a1 1 0 0 1 2 0v2"/>
    `,
  },
  {
    filename: "shortcut-tasbeeh.png",
    title: "Tasbeeh",
    paths: `
      <path d="M6 3a3 3 0 0 1 3 3v10a3 3 0 0 1-6 0V6a3 3 0 0 1 3-3z"/>
      <path d="M6 3v2"/>
      <path d="M3 8h6"/>
      <path d="M3 11h6"/>
      <path d="M3 14h6"/>
      <path d="M15 3l1 3h4l-3 3 1 4-3-2-3 2 1-4-3-3h4z"/>
    `,
  },
];

for (const { filename, title, paths } of icons) {
  const svg = makeIcon(title, paths);
  const resvg = new Resvg(svg, { fitTo: { mode: "width", value: SIZE } });
  const png = resvg.render().asPng();
  const outPath = join(OUT_DIR, filename);
  writeFileSync(outPath, png);
  console.log(`✓ ${filename} (${png.length} bytes)`);
}
