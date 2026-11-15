/**
 * remove-bg.mjs
 * Removes the white background from the logo PNG.
 *
 * Step 1: BFS flood-fill from all four edges to find connected background pixels.
 * Step 2: Fully transparent → all flood-filled pixels.
 * Step 3: Semi-transparent edge blending → near-white pixels adjacent to the
 *         background get their alpha reduced in proportion to how white they are,
 *         eliminating the white halo on anti-aliased edges.
 */
import sharp from "sharp";
import { writeFileSync } from "fs";

const INPUT = "src/assets/24hournews-logo.png";
const OUTPUT = "src/assets/24hournews-logo.png";

console.log("Reading logo...");
const { data: rawBuf, info } = await sharp(INPUT)
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });

const W = info.width;
const H = info.height;
const data = new Uint8Array(rawBuf);

// ── Step 1: BFS flood-fill to identify background pixels ─────────────────────
// Threshold: pixels whose R, G, B are ALL above this are considered "near white"
const BG_THRESHOLD = 240;

function isNearWhite(idx) {
  return (
    data[idx] >= BG_THRESHOLD && data[idx + 1] >= BG_THRESHOLD && data[idx + 2] >= BG_THRESHOLD
  );
}

const isBg = new Uint8Array(W * H); // 1 = confirmed background
const queue = new Int32Array(W * H * 2);
let qHead = 0,
  qTail = 0;

function enqueue(x, y) {
  if (x < 0 || x >= W || y < 0 || y >= H) return;
  const p = y * W + x;
  if (isBg[p]) return;
  const b = p * 4;
  if (!isNearWhite(b)) return;
  isBg[p] = 1;
  queue[qTail++] = x;
  queue[qTail++] = y;
}

// Seed from all edges
for (let x = 0; x < W; x++) {
  enqueue(x, 0);
  enqueue(x, H - 1);
}
for (let y = 1; y < H - 1; y++) {
  enqueue(0, y);
  enqueue(W - 1, y);
}

while (qHead < qTail) {
  const x = queue[qHead++];
  const y = queue[qHead++];
  enqueue(x + 1, y);
  enqueue(x - 1, y);
  enqueue(x, y + 1);
  enqueue(x, y - 1);
}

// ── Step 2: Make flood-filled pixels fully transparent ────────────────────────
let removedFull = 0;
for (let i = 0; i < W * H; i++) {
  if (isBg[i]) {
    data[i * 4 + 3] = 0;
    removedFull++;
  }
}

// ── Step 3: Feather anti-aliased edges ────────────────────────────────────────
// Any non-background pixel adjacent to a background pixel that is still
// near-whitish gets its alpha reduced proportionally to how white it is.
// This kills the white halo without touching the colourful logo body.
const EDGE_THRESHOLD = 220; // slightly lower — catches anti-alias fringe

let feathered = 0;
for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    const p = y * W + x;
    if (isBg[p]) continue;
    const b = p * 4;
    if (data[b + 3] === 0) continue; // already transparent

    // Check if this pixel neighbours a background pixel
    const hasNearbyBg =
      (x > 0 && isBg[p - 1]) ||
      (x < W - 1 && isBg[p + 1]) ||
      (y > 0 && isBg[p - W]) ||
      (y < H - 1 && isBg[p + W]);

    if (!hasNearbyBg) continue;

    const r = data[b],
      g = data[b + 1],
      bv = data[b + 2];
    const whiteness = Math.min(r, g, bv); // 0 = colourful, 255 = pure white

    if (whiteness >= EDGE_THRESHOLD) {
      // Reduce alpha proportionally: fully white → transparent, threshold → opaque
      const ratio = (whiteness - EDGE_THRESHOLD) / (255 - EDGE_THRESHOLD);
      data[b + 3] = Math.round(data[b + 3] * (1 - ratio));
      feathered++;
    }
  }
}

console.log(`Background pixels removed : ${removedFull.toLocaleString()}`);
console.log(`Edge pixels feathered     : ${feathered.toLocaleString()}`);

// ── Write output ──────────────────────────────────────────────────────────────
const outBuf = await sharp(Buffer.from(data), {
  raw: { width: W, height: H, channels: 4 },
})
  .png({ compressionLevel: 9 })
  .toBuffer();

writeFileSync(OUTPUT, outBuf);
console.log(`✅  Saved → ${OUTPUT}  (${(outBuf.length / 1024).toFixed(0)} KB)`);
