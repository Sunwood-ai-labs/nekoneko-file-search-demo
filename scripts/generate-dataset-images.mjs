import { access, mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const root = resolve(new URL('..', import.meta.url).pathname);
const outDir = resolve(root, 'public/dataset/images');
const tmpDir = resolve(root, '.tmp-dataset-svg');

const cards = [
  {
    file: 'nyan-server-mini.png',
    title: 'にゃんサーバー Mini',
    subtitle: '魚型LED: 青点滅 = 静音モード',
    bg: '#f1a45b',
    fg: '#1d211d',
    accent: '#4b89dc',
    shape: 'server',
  },
  {
    file: 'kedama-cloud-shelf.png',
    title: '毛玉クラウド Pro',
    subtitle: '税込 49,800円 / 法人3年保証',
    bg: '#dbe9e4',
    fg: '#1d211d',
    accent: '#e7d775',
    shape: 'shelf',
  },
  {
    file: 'shippo-sensor-label.png',
    title: 'しっぽセンサー',
    subtitle: '航空便: UN3481 / 残量30%以下',
    bg: '#f7f1df',
    fg: '#1d211d',
    accent: '#c96b3c',
    shape: 'label',
  },
];

function svg(card) {
  const body =
    card.shape === 'server'
      ? '<rect x="180" y="120" width="420" height="250" rx="28" fill="#fff8e9" stroke="#1d211d" stroke-width="8"/><circle cx="260" cy="245" r="42" fill="#4b89dc"/><path d="M450 245 l80 -46 v92 z" fill="#4b89dc"/><rect x="220" y="300" width="320" height="24" fill="#1d211d"/>'
      : card.shape === 'shelf'
        ? '<path d="M150 160 C230 70 350 90 390 165 C460 120 560 155 585 230 C620 335 525 390 410 365 C350 430 230 395 225 325 C120 325 90 220 150 160Z" fill="#fff8e9" stroke="#1d211d" stroke-width="8"/><rect x="170" y="430" width="470" height="78" fill="#e7d775" stroke="#1d211d" stroke-width="8"/>'
        : '<rect x="135" y="92" width="530" height="420" rx="10" fill="#fff8e9" stroke="#1d211d" stroke-width="8"/><rect x="170" y="160" width="460" height="92" fill="#c96b3c"/><rect x="185" y="300" width="300" height="34" fill="#1d211d"/><rect x="185" y="354" width="405" height="34" fill="#1d211d"/>';

  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
  <rect width="800" height="600" fill="${card.bg}"/>
  <path d="M0 560 L800 500 L800 600 L0 600Z" fill="${card.accent}" opacity="0.9"/>
  ${body}
  <text x="64" y="76" font-family="Hiragino Sans, sans-serif" font-size="34" font-weight="800" fill="${card.fg}">${card.title}</text>
  <text x="64" y="560" font-family="Hiragino Sans, sans-serif" font-size="28" font-weight="800" fill="${card.fg}">${card.subtitle}</text>
</svg>`;
}

await mkdir(outDir, { recursive: true });
await mkdir(tmpDir, { recursive: true });

for (const card of cards) {
  const svgPath = resolve(tmpDir, card.file.replace('.png', '.svg'));
  const pngPath = resolve(outDir, card.file);
  await mkdir(dirname(svgPath), { recursive: true });
  await writeFile(svgPath, svg(card), 'utf8');
  try {
    await execFileAsync('sips', ['-s', 'format', 'png', svgPath, '--out', pngPath]);
  } catch (error) {
    try {
      await access(pngPath);
      console.warn(`sips is unavailable; kept existing fixture ${pngPath}`);
    } catch {
      throw error;
    }
  }
}

console.log(`Generated ${cards.length} dataset images in ${outDir}`);
