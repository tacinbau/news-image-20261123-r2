// The World in One Day - Monday 23 November 2026.
// A one-page newspaper image summing up 23 Nov 2026's world news: 36 stories,
// 7 regions, drawn in code. Node 22, standard library only. Deterministic:
// no clock, no randomness, no network - run it twice, get the same bytes.
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { deflateSync } from 'node:zlib';

const W = 1024;
const H = 1024;
const PAPER = [247, 243, 232];
const INK = [26, 35, 50];
const RED = [178, 34, 34];
const NAVY = [18, 32, 62];
const TEAL = [31, 122, 109];
const BLUE = [43, 94, 167];
const ORANGE = [217, 123, 41];
const GREEN = [74, 124, 67];
const PURPLE = [122, 90, 166];
const GREY = [107, 114, 128];
const LIGHT = [233, 228, 216];
const WHITE = [255, 255, 255];
const BLACK = [0, 0, 0];
const YELLOW = [240, 196, 64];

// 5x7 bitmap font. Each glyph is 7 rows of 5 bits (bit 4 = leftmost pixel).
const FONT = {
  A: [0x0e, 0x11, 0x11, 0x1f, 0x11, 0x11, 0x11],
  B: [0x1e, 0x11, 0x11, 0x1e, 0x11, 0x11, 0x1e],
  C: [0x0e, 0x11, 0x10, 0x10, 0x10, 0x11, 0x0e],
  D: [0x1e, 0x11, 0x11, 0x11, 0x11, 0x11, 0x1e],
  E: [0x1f, 0x10, 0x10, 0x1e, 0x10, 0x10, 0x1f],
  F: [0x1f, 0x10, 0x10, 0x1e, 0x10, 0x10, 0x10],
  G: [0x0e, 0x11, 0x10, 0x17, 0x11, 0x11, 0x0f],
  H: [0x11, 0x11, 0x11, 0x1f, 0x11, 0x11, 0x11],
  I: [0x0e, 0x04, 0x04, 0x04, 0x04, 0x04, 0x0e],
  J: [0x07, 0x02, 0x02, 0x02, 0x02, 0x12, 0x0c],
  K: [0x11, 0x12, 0x14, 0x18, 0x14, 0x12, 0x11],
  L: [0x10, 0x10, 0x10, 0x10, 0x10, 0x10, 0x1f],
  M: [0x11, 0x1b, 0x15, 0x15, 0x11, 0x11, 0x11],
  N: [0x11, 0x19, 0x15, 0x13, 0x11, 0x11, 0x11],
  O: [0x0e, 0x11, 0x11, 0x11, 0x11, 0x11, 0x0e],
  P: [0x1e, 0x11, 0x11, 0x1e, 0x10, 0x10, 0x10],
  Q: [0x0e, 0x11, 0x11, 0x11, 0x15, 0x12, 0x0d],
  R: [0x1e, 0x11, 0x11, 0x1e, 0x14, 0x12, 0x11],
  S: [0x0f, 0x10, 0x10, 0x0e, 0x01, 0x01, 0x1e],
  T: [0x1f, 0x04, 0x04, 0x04, 0x04, 0x04, 0x04],
  U: [0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x0e],
  V: [0x11, 0x11, 0x11, 0x11, 0x11, 0x0a, 0x04],
  W: [0x11, 0x11, 0x11, 0x15, 0x15, 0x1b, 0x11],
  X: [0x11, 0x11, 0x0a, 0x04, 0x0a, 0x11, 0x11],
  Y: [0x11, 0x11, 0x0a, 0x04, 0x04, 0x04, 0x04],
  Z: [0x1f, 0x01, 0x02, 0x04, 0x08, 0x10, 0x1f],
  '0': [0x0e, 0x11, 0x13, 0x15, 0x19, 0x11, 0x0e],
  '1': [0x04, 0x0c, 0x04, 0x04, 0x04, 0x04, 0x0e],
  '2': [0x0e, 0x11, 0x01, 0x02, 0x04, 0x08, 0x1f],
  '3': [0x1e, 0x01, 0x01, 0x0e, 0x01, 0x01, 0x1e],
  '4': [0x02, 0x06, 0x0a, 0x12, 0x1f, 0x02, 0x02],
  '5': [0x1f, 0x10, 0x1e, 0x01, 0x01, 0x11, 0x0e],
  '6': [0x0e, 0x10, 0x10, 0x1e, 0x11, 0x11, 0x0e],
  '7': [0x1f, 0x01, 0x02, 0x04, 0x08, 0x08, 0x08],
  '8': [0x0e, 0x11, 0x11, 0x0e, 0x11, 0x11, 0x0e],
  '9': [0x0e, 0x11, 0x11, 0x0f, 0x01, 0x01, 0x0e],
  ' ': [0, 0, 0, 0, 0, 0, 0],
  '.': [0, 0, 0, 0, 0, 0x0c, 0x0c],
  ',': [0, 0, 0, 0, 0x0c, 0x04, 0x08],
  ':': [0, 0x0c, 0x0c, 0, 0x0c, 0x0c, 0],
  ';': [0, 0x0c, 0x0c, 0, 0x0c, 0x04, 0x08],
  '!': [0x04, 0x04, 0x04, 0x04, 0x04, 0, 0x04],
  '?': [0x0e, 0x11, 0x01, 0x02, 0x04, 0, 0x04],
  "'": [0x04, 0x04, 0x08, 0, 0, 0, 0],
  '"': [0x0a, 0x0a, 0, 0, 0, 0, 0],
  '(': [0x02, 0x04, 0x08, 0x08, 0x08, 0x04, 0x02],
  ')': [0x08, 0x04, 0x02, 0x02, 0x02, 0x04, 0x08],
  '-': [0, 0, 0, 0x0e, 0, 0, 0],
  '/': [0x01, 0x02, 0x02, 0x04, 0x08, 0x08, 0x10],
  '&': [0x0c, 0x12, 0x14, 0x08, 0x15, 0x12, 0x0d],
  '%': [0x19, 0x1a, 0x02, 0x04, 0x08, 0x0b, 0x13],
  '$': [0x04, 0x0f, 0x14, 0x0e, 0x05, 0x1e, 0x04],
  '+': [0, 0x04, 0x04, 0x1f, 0x04, 0x04, 0],
  '=': [0, 0, 0x1f, 0, 0x1f, 0, 0],
  '·': [0, 0, 0, 0x0c, 0x0c, 0, 0],
  '|': [0x04, 0x04, 0x04, 0x04, 0x04, 0x04, 0x04],
};

const buf = Buffer.alloc(W * H * 3);
function px(x, y, c) {
  if (x < 0 || y < 0 || x >= W || y >= H) return;
  const i = (y * W + x) * 3;
  buf[i] = c[0]; buf[i + 1] = c[1]; buf[i + 2] = c[2];
}
function rect(x, y, w, h, c) {
  for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) px(i, j, c);
}
function frame(x, y, w, h, c, t) {
  rect(x, y, w, t, c); rect(x, y + h - t, w, t, c);
  rect(x, y, t, h, c); rect(x + w - t, y, t, h, c);
}
function line(x0, y0, x1, y1, c) {
  const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
  let e = dx + dy, x = x0, y = y0;
  for (;;) { px(x, y, c); if (x === x1 && y === y1) break; const e2 = 2 * e; if (e2 >= dy) { e += dy; x += sx; } if (e2 <= dx) { e += dx; y += sy; } }
}
function circle(cx, cy, r, c) {
  for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) {
    if (x * x + y * y <= r * r) px(cx + x, cy + y, c);
  }
}
function ring(cx, cy, r, c) {
  for (let a = 0; a < 360; a += 2) {
    const t = (a * Math.PI) / 180;
    px(Math.round(cx + r * Math.cos(t)), Math.round(cy + r * Math.sin(t)), c);
  }
}
function tri(x0, y0, x1, y1, x2, y2, c) {
  const minY = Math.min(y0, y1, y2), maxY = Math.max(y0, y1, y2);
  for (let y = minY; y <= maxY; y++) {
    const xs = [];
    const edges = [[x0, y0, x1, y1], [x1, y1, x2, y2], [x2, y2, x0, y0]];
    for (const [ax, ay, bx, by] of edges) {
      if ((ay <= y && by > y) || (by <= y && ay > y)) {
        xs.push(ax + ((y - ay) * (bx - ax)) / (by - ay));
      }
    }
    if (xs.length >= 2) {
      const a = Math.ceil(Math.min(...xs)), b = Math.floor(Math.max(...xs));
      for (let x = a; x <= b; x++) px(x, y, c);
    }
  }
}
function text(str, x, y, s, c) {
  const up = String(str).toUpperCase();
  let cx = x;
  for (const ch of up) {
    const g = FONT[ch] || FONT[' '];
    for (let r = 0; r < 7; r++) for (let col = 0; col < 5; col++) {
      if (g[r] & (1 << (4 - col))) rect(cx + col * s, y + r * s, s, s, c);
    }
    cx += 6 * s;
  }
  return cx;
}
function textW(str, s) { return String(str).length * 6 * s; }
function wrap(str, maxW, s) {
  const words = String(str).toUpperCase().split(/\s+/).filter(Boolean);
  const lines = [];
  let cur = '';
  for (const w of words) {
    const test = cur ? cur + ' ' + w : w;
    if (textW(test, s) <= maxW || !cur) cur = test;
    else { lines.push(cur); cur = w; }
  }
  if (cur) lines.push(cur);
  return lines;
}
function para(str, x, y, maxW, s, c, lh) {
  const lines = wrap(str, maxW, s);
  lines.forEach((ln, i) => text(ln, x, y + i * (lh || 7 * s + 2), s, c));
  return lines.length;
}

// CRC32 for PNG chunks.
const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();
function crc32(b) {
  let c = 0xffffffff;
  for (let i = 0; i < b.length; i++) c = CRC_TABLE[(c ^ b[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}
function encodePNG() {
  const raw = Buffer.alloc(H * (1 + W * 3));
  for (let y = 0; y < H; y++) {
    raw[y * (1 + W * 3)] = 0;
    buf.copy(raw, y * (1 + W * 3) + 1, y * W * 3, (y + 1) * W * 3);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(H, 4);
  ihdr[8] = 8; ihdr[9] = 2; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
}

// ---- pictograms (all drawn, no images) ----
function icon(kind, x, y, w, h) {
  const cx = x + Math.floor(w / 2), cy = y + Math.floor(h / 2);
  if (kind === 'rescue') {
    rect(x, y, w, h, [16, 22, 44]);
    for (let i = 0; i < 40; i++) px(x + ((i * 37) % w), y + ((i * 23) % Math.floor(h / 2)), [200, 200, 220]);
    rect(x + 18, y + h - 58, 46, 58, [70, 76, 92]);
    for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) rect(x + 24 + c * 14, y + h - 52 + r * 16, 6, 8, YELLOW);
    tri(x + w - 8, y + 4, x + w - 60, y + 4, x + w - 30, y + h - 20, [120, 130, 170]);
    tri(x + 8, y + h, x + 44, y + h - 26, x + 80, y + h, [50, 54, 68]);
    tri(x + 60, y + h, x + 92, y + h - 18, x + 124, y + h, [40, 44, 58]);
    rect(x + w - 52, y + h - 34, 6, 34, [150, 150, 160]);
    line(x + w - 52, y + h - 34, x + w - 30, y + h - 48, [150, 150, 160]);
  } else if (kind === 'summit') {
    rect(x, y, w, h, [24, 64, 58]);
    circle(x + 30, y + 26, 16, [90, 170, 120]);
    circle(x + 24, y + 22, 5, [40, 110, 80]); circle(x + 36, y + 30, 4, [40, 110, 80]);
    rect(x + 8, y + h - 26, w - 16, 10, [120, 84, 50]);
    for (let i = 0; i < 5; i++) { circle(x + 14 + i * Math.floor((w - 28) / 4), y + h - 38, 6, [220, 200, 170]); }
    rect(x + 8, y + h - 16, w - 16, 4, [90, 60, 36]);
  } else if (kind === 'chart') {
    rect(x, y, w, h, WHITE);
    for (let i = 1; i < 4; i++) line(x + 6, y + (h * i) / 4, x + w - 6, y + (h * i) / 4, [220, 220, 220]);
    const pts = [[8, 14], [30, 22], [52, 18], [74, 34], [96, 30], [118, 48], [140, 44]];
    for (let i = 0; i < pts.length - 1; i++) {
      line(x + pts[i][0], y + pts[i][1], x + pts[i + 1][0], y + pts[i + 1][1], RED);
      line(x + pts[i][0], y + pts[i][1] + 1, x + pts[i + 1][0], y + pts[i + 1][1] + 1, RED);
    }
    for (const [bx, by] of pts) rect(x + bx - 2, y + by - 2, 5, 5, RED);
    text('-5.06%', x + 8, y + h - 14, 1, RED);
  } else if (kind === 'ship') {
    rect(x, y, w, h, [14, 30, 58]);
    for (let i = 0; i < 24; i++) px(x + ((i * 53) % w), y + ((i * 17) % 20), [180, 180, 200]);
    tri(x + 14, y + h - 30, x + w - 14, y + h - 30, x + w - 30, y + h - 14, [110, 116, 130]);
    rect(x + 14, y + h - 30, w - 28, 6, [110, 116, 130]);
    rect(cx - 2, y + 12, 4, h - 42, [150, 150, 160]);
    tri(cx + 2, y + 12, cx + 22, y + 20, cx + 2, y + 28, [200, 60, 50]);
    line(x + 4, y + h - 8, x + w - 4, y + h - 8, [90, 140, 190]);
    line(x + 10, y + h - 4, x + w - 10, y + h - 4, [90, 140, 190]);
  } else if (kind === 'dome') {
    rect(x, y, w, h, [232, 226, 210]);
    circle(cx, y + 26, 18, [170, 175, 190]);
    rect(x + 10, y + 26, w - 20, 4, [170, 175, 190]);
    for (let i = 0; i < 4; i++) rect(x + 16 + i * Math.floor((w - 32) / 3), y + 30, 5, 12, [200, 195, 180]);
    rect(x + 8, y + h - 8, w - 16, 5, [180, 170, 150]);
  } else if (kind === 'plane') {
    rect(x, y, w, h, [170, 205, 235]);
    circle(cx, cy, 5, WHITE);
    rect(cx - 26, cy - 3, 52, 6, WHITE);
    tri(cx - 6, cy - 3, cx + 6, cy - 3, cx, cy - 14, WHITE);
    tri(cx - 2, cy + 3, cx + 10, cy + 3, cx + 2, cy + 12, WHITE);
    line(x + 4, y + h - 6, x + w - 4, y + h - 6, [120, 120, 120]);
  } else if (kind === 'radar') {
    rect(x, y, w, h, [12, 26, 20]);
    ring(cx, cy, 16, [60, 160, 90]); ring(cx, cy, 10, [60, 160, 90]); ring(cx, cy, 4, [60, 160, 90]);
    line(cx, cy, cx + 14, cy - 8, [90, 220, 120]);
    circle(cx + 8, cy - 4, 2, [120, 240, 150]); circle(cx - 6, cy + 6, 2, [120, 240, 150]);
  } else if (kind === 'flame') {
    rect(x, y, w, h, [20, 20, 28]);
    tri(cx - 12, y + h - 8, cx, y + 6, cx + 12, y + h - 8, [230, 110, 30]);
    tri(cx - 6, y + h - 8, cx, y + 18, cx + 6, y + h - 8, YELLOW);
    rect(x + 8, y + h - 6, w - 16, 4, [90, 90, 100]);
  } else if (kind === 'columns') {
    rect(x, y, w, h, [236, 230, 214]);
    tri(x + 8, y + 6, x + w - 8, y + 6, cx, y + 16, [200, 190, 165]);
    for (let i = 0; i < 4; i++) rect(x + 14 + i * Math.floor((w - 28) / 3), y + 18, 6, 18, [180, 170, 145]);
    rect(x + 8, y + h - 8, w - 16, 5, [180, 170, 145]);
  } else if (kind === 'barrel') {
    rect(x, y, w, h, [225, 220, 205]);
    for (const bx of [x + 16, x + w - 40]) {
      rect(bx, y + 10, 24, h - 20, [150, 60, 40]);
      rect(bx, y + 16, 24, 2, [110, 40, 26]); rect(bx, y + h - 18, 24, 2, [110, 40, 26]);
    }
    text('!', cx - 3, y + 4, 1, [120, 30, 20]);
  } else if (kind === 'star') {
    rect(x, y, w, h, NAVY);
    tri(cx, cy - 14, cx + 4, cy - 4, cx - 4, cy - 4, YELLOW);
    tri(cx, cy + 14, cx + 4, cy + 4, cx - 4, cy + 4, YELLOW);
    tri(cx - 14, cy, cx - 4, cy - 4, cx - 4, cy + 4, YELLOW);
    tri(cx + 14, cy, cx + 4, cy - 4, cx + 4, cy + 4, YELLOW);
    circle(cx, cy, 4, YELLOW);
  } else if (kind === 'burst') {
    rect(x, y, w, h, [30, 24, 20]);
    for (let a = 0; a < 8; a++) {
      const t = (a * Math.PI) / 4;
      const x2 = Math.round(cx + 16 * Math.cos(t)), y2 = Math.round(cy + 14 * Math.sin(t));
      line(cx, cy, x2, y2, YELLOW); line(cx, cy, x2, y2, YELLOW);
    }
    circle(cx, cy, 6, [230, 120, 30]);
  } else if (kind === 'mic') {
    rect(x, y, w, h, [238, 232, 218]);
    circle(cx, y + 14, 9, [60, 60, 70]);
    rect(cx - 2, y + 22, 4, 10, [60, 60, 70]);
    rect(cx - 10, y + 32, 20, 3, [60, 60, 70]);
    ring(cx, y + 14, 12, [150, 140, 120]);
  } else if (kind === 'runway') {
    rect(x, y, w, h, [180, 210, 235]);
    line(x + 8, y + h - 8, x + w - 8, y + 10, [70, 70, 80]);
    line(x + 10, y + h - 6, x + w - 6, y + 12, [70, 70, 80]);
    circle(cx - 8, cy - 6, 3, [40, 40, 50]);
    rect(cx - 22, cy - 8, 28, 4, [40, 40, 50]);
    tri(cx - 4, cy - 8, cx + 4, cy - 8, cx, cy - 14, [40, 40, 50]);
  }
}

// ---- dotted world map (coarse land blocks in a 100 x 50 grid) ----
const LAND = [
  [4, 3, 30, 10], [8, 10, 28, 16], [14, 16, 22, 22], [31, 1, 37, 5],
  [26, 24, 34, 30], [27, 30, 32, 44],
  [47, 4, 57, 12], [45, 3, 47, 7],
  [47, 15, 59, 22], [49, 22, 57, 36], [57, 12, 63, 18],
  [58, 2, 92, 9], [60, 9, 88, 16], [66, 15, 72, 23], [76, 17, 84, 24],
  [78, 24, 90, 27], [80, 33, 92, 41], [90, 10, 93, 16],
];
function inLand(gx, gy) {
  for (const [x0, y0, x1, y1] of LAND) if (gx >= x0 && gx <= x1 && gy >= y0 && gy <= y1) return true;
  return false;
}
// story number -> [lat, lon]
const PINS = {
  1: [50.8, 30.3], 2: [36.9, 30.7], 3: [35.7, 139.7], 4: [32.1, 20.1],
  5: [38.9, -77.0], 6: [33.7, -84.4], 7: [26.5, 56.2], 8: [26.2, 50.6],
  9: [28.6, 77.2], 10: [-6.2, 106.8], 11: [50.8, 4.35], 12: [15.6, 32.5],
  13: [-37.8, 145.0], 14: [25.0, 121.6], 15: [50.8, 4.35],
};

// ---- the day's news: 36 stories, all dated Monday 23 November 2026 ----
const STATS = [
  { n: '15', label: 'DEAD ACROSS KYIV REGION' },
  { n: '258', label: "DEMOCRATS' HOUSE SEATS" },
  { n: '5.06%', label: "NIKKEI'S FALL IN AI ROUT" },
  { n: '1,600', label: 'DELTA FLIGHTS DELAYED' },
  { n: '405t', label: 'ROCKET CHEMICAL SEIZED' },
  { n: '3.7%', label: "S&P 500'S FALL" },
];
const TIMELINE = [
  { t: '02:30', s: 'ABU DHABI WRAP' },
  { t: '05:04', s: 'MQ-9 CLAIM' },
  { t: '06:00', s: 'NIKKEI -5.06%' },
  { t: '07:11', s: 'DEMOCRATS 258' },
  { t: '07:32', s: 'MERKURY SINKS' },
  { t: '08:00', s: 'MEDINSKY UNMOVED' },
];
const REGIONS = [
  { name: 'EUROPE', n: 8, c: TEAL },
  { name: 'MIDDLE EAST', n: 5, c: RED },
  { name: 'AMERICAS', n: 7, c: BLUE },
  { name: 'ASIA-PACIFIC', n: 9, c: ORANGE },
  { name: 'AFRICA', n: 4, c: GREEN },
  { name: 'OCEANIA', n: 1, c: PURPLE },
  { name: 'WORLD', n: 2, c: GREY },
];
const HEROES = [
  {
    n: 1, tag: 'RESCUE IN DYMER', place: 'DYMER, UKRAINE', beat: 'WAR', cert: 'REPORTED', icon: 'rescue',
    head: 'Dymer toll climbs to 15; a boy is pulled alive',
    body: 'Rescuers dug through the night after the strike on a five-storey block. A seven-year-old was pulled alive from the rubble; at least 14 people are still missing. (Reuters, BBC)',
  },
  {
    n: 2, tag: 'NO DEAL', place: 'ANTALYA, TURKIYE', beat: 'CLIMATE', cert: 'REPORTED', icon: 'summit',
    head: 'COP31 collapses with no deal on fossil fuels',
    body: 'The summit ended after two days of overtime, the longest ever, with the EU and about 130 parties rejecting a text that named no fossil fuels. No cover decision was adopted. (Reuters, BBC)',
  },
  {
    n: 3, tag: 'MARKETS SLIDE', place: 'TOKYO, JAPAN', beat: 'MARKETS', cert: 'REPORTED', icon: 'chart',
    head: 'Nikkei falls 5.06% as AI sell-off spreads',
    body: 'Tokyo led a rout in Asia as fears that AI shares are overpriced spread. The S&P 500 fell 3.7% and Hong Kong stocks hit a 19-month low. (Reuters, AP)',
  },
];
const GRID = [
  {
    n: 4, tag: 'SHIP SUNK', place: 'BENGHAZI, LIBYA', beat: 'SEA', cert: 'REPORTED', icon: 'ship',
    head: 'Russian corvette Merkury sinks after sea-drone hit',
    body: 'Capsized at the naval base in a suspected Ukrainian drone strike. (Reuters)',
  },
  {
    n: 5, tag: '258 SEATS', place: 'WASHINGTON, US', beat: 'POLITICS', cert: 'REPORTED', icon: 'dome',
    head: 'Democrats take 258 House seats, most since 1992',
    body: 'North Carolina recount clinched the biggest majority since 1992. (AP)',
  },
  {
    n: 6, tag: '1,600 DELAYED', place: 'ATLANTA, US', beat: 'TRAVEL', cert: 'REPORTED', icon: 'plane',
    head: 'Delta outage delays 1,600 flights',
    body: 'Weight-and-balance failure hit Atlanta as Thanksgiving travel began. (Reuters)',
  },
  {
    n: 7, tag: 'CLAIM', place: 'STRAIT OF HORMUZ', beat: 'IRAN', cert: 'CLAIM', icon: 'radar',
    head: 'Iran claims it downed a US MQ-9 drone',
    body: 'Tehran says it shot down the Reaper over the strait, its 58th claim. (AP)',
  },
  {
    n: 8, tag: 'TANKERS ABLAZE', place: 'MANAMA, BAHRAIN', beat: 'IRAN', cert: 'CLAIM', icon: 'flame',
    head: 'Bahrain says Iran hit civilian site',
    body: 'Two tankers hit near Hormuz; Bahrain says the target was civilian. (France 24)',
  },
  {
    n: 9, tag: 'STATE VISIT', place: 'NEW DELHI, INDIA', beat: 'DIPLOMACY', cert: 'REPORTED', icon: 'columns',
    head: 'Nepal PM Shah welcomed in Delhi',
    body: 'Balen Shah was received by Modi on his first visit as prime minister. (AP)',
  },
  {
    n: 10, tag: 'SHIP SEIZED', place: 'JAKARTA, INDONESIA', beat: 'SEA', cert: 'REPORTED', icon: 'barrel',
    head: 'Indonesia seizes ship carrying rocket chemical',
    body: 'The vessel held 405 tonnes of sodium perchlorate, used in missiles. (Inshorts)',
  },
  {
    n: 11, tag: 'NATO MEETS', place: 'BRUSSELS, BELGIUM', beat: 'NATO', cert: 'REPORTED', icon: 'star',
    head: 'NATO calls emergency talks on Poland strikes',
    body: 'Prosecutors confirmed three Russian Kh-101 missiles landed in Poland. (Nexus)',
  },
  {
    n: 12, tag: '5 CHILDREN DEAD', place: 'KHARTOUM, SUDAN', beat: 'WAR', cert: 'REPORTED', icon: 'burst',
    head: 'Drone strikes kill five children',
    body: 'Strikes hit homes in Khartoum and Omdurman, damaging a UN building. (France 24)',
  },
  {
    n: 13, tag: 'DIED AT 83', place: 'MELBOURNE, AUSTRALIA', beat: 'OBITUARY', cert: 'REPORTED', icon: 'mic',
    head: 'Molly Meldrum dies at 83',
    body: 'The broadcaster who shaped Australian music for decades has died. (Digest)',
  },
  {
    n: 14, tag: 'SHORTS BANNED', place: 'TAIPEI, TAIWAN', beat: 'MARKETS', cert: 'REPORTED', icon: 'chart',
    head: 'Taiwan bans short sales below Friday close',
    body: 'Third curb this month as Taipei steadies its market in the AI rout. (EventGraph)',
  },
  {
    n: 15, tag: 'FLIGHTS GROUNDED', place: 'BRUSSELS, BELGIUM', beat: 'STRIKE', cert: 'REPORTED', icon: 'runway',
    head: 'Belgian airports shut as strike grounds flights',
    body: 'An anti-austerity strike shut airports and grounded most flights. (OneTurn)',
  },
];
const ALSO = [
  ['16', 'EUROPE', 'Moldova reports seven Russian drone incursions (Nexus)'],
  ['17', 'EUROPE', 'Denmark says Russia plotted to kill a rapper (Euronews)'],
  ['18', 'EUROPE', 'Thousands evacuated at Don Toliver concert in London (Euronews)'],
  ['19', 'EUROPE', 'Ex-police chief De Gennaro dies by suicide in Rome (Nexus)'],
  ['20', 'MIDDLE EAST', 'Houthis claim Saudi refinery hit; Saudis strike Hodeida (OneTurn)'],
  ['21', 'MIDDLE EAST', 'Gaza war left widespread contamination, experts say (OneTurn)'],
  ['22', 'MIDDLE EAST', 'Villagers return as Israeli pullback begins in Lebanon (Digest)'],
  ['23', 'AMERICAS', "Trump signs Common Cents Act; the penny's run ends (George)"],
  ['24', 'AMERICAS', 'US envoys head to Moscow after Abu Dhabi talks wrap (Nexus)'],
  ['25', 'AMERICAS', 'US Army to detonate unstable explosives in Iowa (OneTurn)'],
  ['26', 'AMERICAS', 'Thanksgiving storm to hit New York: rain, high winds (George)'],
  ['27', 'AMERICAS', "US intel chief backs Trump's 'my friend' Putin line (Guardian)"],
  ['28', 'ASIA-PACIFIC', 'Seoul minister quits over AI exam-cheating scandal (EventGraph)'],
  ['29', 'ASIA-PACIFIC', "Kim stresses 'sovereignty', rebuffs Trump talks offer (Euronews)"],
  ['30', 'ASIA-PACIFIC', 'India holds third in Lowy Asia Power Index (Inshorts)'],
  ['31', 'ASIA-PACIFIC', 'Hong Kong stocks hit 19-month low in AI rout (OneTurn)'],
  ['32', 'ASIA-PACIFIC', 'China, Korea, Taiwan rush stock rescues (EventGraph)'],
  ['33', 'AFRICA', 'Paramilitary attack kills at least 24 civilians in S. Sudan (OneTurn)'],
  ['34', 'AFRICA', 'Five EU states back deportation centres in Rwanda (OneTurn)'],
  ['35', 'WORLD', 'Riemann proof confirmed correct, Lean and Mathlib agree (EventGraph)'],
  ['36', 'WORLD', 'METR: AI skills outpacing safety tests (EventGraph)'],
];
const DATE_CHECK = "Left out as other days' news: the 186-drone night (Sun 22 Nov) - 'El Chapo Isidro' captured (Fri 20 Nov) - Sparta II hit (Sat 21 Nov) - Hong Kong Election Committee vote (Sun 22 Nov) - India 720/9 declared (Sun 22 Nov) - Verstappen's Las Vegas win (Sun 22 Nov).";

// ---- layout ----
function centered(str, y, s, c) {
  text(str, Math.floor((W - textW(str, s)) / 2), y, s, c);
}
function rightAligned(str, x, y, s, c) {
  text(str, x - textW(str, s), y, s, c);
}
function certColor(cert) {
  return cert === 'CLAIM' ? RED : cert === 'FORECAST' ? ORANGE : TEAL;
}

function render() {
  rect(0, 0, W, H, PAPER);
  // masthead bar
  rect(0, 0, W, 28, NAVY);
  text('THE WORLD IN ONE DAY', 16, 10, 1, WHITE);
  rightAligned('36 STORIES · 7 REGIONS · EVERY ONE DATED MONDAY 23 NOVEMBER 2026', 1008, 10, 1, WHITE);
  // date headline (bold caps, revised from top-1's serif)
  text('MONDAY 23 NOVEMBER 2026', 80, 36, 6, INK);
  centered('DYMER TOLL AT 15 · COP31 COLLAPSES · NIKKEI DOWN 5.06%', 88, 2, RED);
  rect(16, 106, 992, 2, NAVY);
  // stat strip
  STATS.forEach((st, i) => {
    const cx = 16 + i * 165 + 82;
    const nw = textW(st.n, 3);
    text(st.n, cx - Math.floor(nw / 2), 112, 3, RED);
    const ls = wrap(st.label, 160, 1);
    ls.forEach((ln, j) => text(ln, cx - Math.floor(textW(ln, 1) / 2), 138 + j * 9, 1, INK));
  });
  // region bar (proportional to counts)
  {
    let x = 16;
    const widths = [220, 138, 193, 248, 110, 28, 55];
    REGIONS.forEach((r, i) => {
      rect(x, 158, widths[i], 20, r.c);
      if (widths[i] >= 56) {
        const lbl = r.name + ' ' + r.n;
        text(lbl, x + Math.floor((widths[i] - textW(lbl, 1)) / 2), 165, 1, WHITE);
      }
      x += widths[i];
    });
    text('OCEANIA 1', 939 - Math.floor(textW('OCEANIA 1', 1) / 2), 180, 1, PURPLE);
  }
  // timeline strip
  rect(0, 190, W, 20, NAVY);
  text('THE DAY IN UTC', 24, 197, 1, WHITE);
  {
    let x = 130;
    for (const e of TIMELINE) {
      text(e.t, x, 197, 1, [255, 120, 110]);
      text(e.s, x + textW(e.t + ' ', 1), 197, 1, WHITE);
      x += textW(e.t + ' ' + e.s, 1) + 14;
    }
  }
  // hero stories
  HEROES.forEach((h, i) => {
    const x = 16 + i * 333;
    icon(h.icon, x, 218, 326, 104);
    const chipW = textW(h.tag, 1) + 10;
    rect(x, 218, chipW, 14, RED);
    text(h.tag, x + 5, 220, 1, WHITE);
    text(h.n + ' ' + h.place + ' · ' + h.beat, x, 330, 1, INK);
    rightAligned(h.cert, x + 326, 330, 1, certColor(h.cert));
    const hl = para(h.head, x, 346, 326, 2, INK, 17);
    para(h.body, x, 346 + hl * 17 + 6, 326, 1, INK, 9);
  });
  rect(16, 452, 992, 1, [200, 195, 180]);
  // grid stories 4-15
  GRID.forEach((g, i) => {
    const col = i % 6, row = Math.floor(i / 6);
    const x = 16 + col * 166, y = 460 + row * 124;
    icon(g.icon, x, y, 160, 44);
    const chipW = textW(g.tag, 1) + 8;
    rect(x, y, chipW, 12, RED);
    text(g.tag, x + 4, y + 2, 1, WHITE);
    text(g.n + ' ' + g.place.split(',')[0] + ' · ' + g.beat, x, y + 50, 1, INK);
    const hl = para(g.head, x, y + 64, 160, 1, INK, 9);
    para(g.body, x, y + 64 + hl * 9 + 4, 160, 1, INK, 9);
  });
  rect(16, 708, 992, 1, [200, 195, 180]);
  // world map with numbered pins
  text('WHERE IT HAPPENED', 16, 716, 1, INK);
  rightAligned('PINS MATCH STORY NUMBERS', 416, 716, 1, GREY);
  {
    const mx0 = 16, my0 = 734, sx = 4, sy = 3.48;
    for (let gy = 0; gy <= 50; gy += 1) for (let gx = 0; gx <= 100; gx += 1) {
      if (inLand(gx, gy)) rect(Math.round(mx0 + gx * sx), Math.round(my0 + gy * sy), 2, 2, [90, 100, 120]);
    }
    const off = { 1: [-16, -8], 2: [16, 10], 4: [-8, -6], 7: [-14, -12], 8: [14, 10], 11: [-14, 8], 12: [4, 14], 15: [16, -10] };
    for (let n = 1; n <= 15; n++) {
      const [lat, lon] = PINS[n];
      const gx = ((lon + 180) / 360) * 100, gy = ((90 - lat) / 180) * 50;
      const o = off[n] || [0, 0];
      const px = Math.round(mx0 + gx * sx) + o[0], py = Math.round(my0 + gy * sy) + o[1];
      circle(px, py, 7, RED);
      ring(px, py, 7, WHITE);
      const s = String(n);
      text(s, px - Math.floor(textW(s, 1) / 2), py - 3, 1, WHITE);
    }
  }
  // also list 16-36
  text('ALSO ON MONDAY 23 NOVEMBER — 21 MORE STORIES', 424, 716, 1, INK);
  {
    const cols = [ALSO.slice(0, 11), ALSO.slice(11)];
    const colX = [424, 716], colW = [284, 292];
    cols.forEach((items, ci) => {
      let y = 734;
      for (const [n, region, t] of items) {
        const rc = (REGIONS.find((r) => r.name === region) || { c: GREY }).c;
        const full = n + ' ' + region + ': ' + t;
        const lines = wrap(full, colW[ci] - 10, 1);
        rect(colX[ci], y + 1, 6, 6, rc);
        lines.forEach((ln, j) => text(ln, colX[ci] + 10, y + j * 9, 1, INK));
        y += lines.length * 9;
      }
    });
  }
  // date check
  frame(16, 936, 992, 32, RED, 2);
  text('DATE CHECK', 24, 946, 1, RED);
  para(DATE_CHECK, 110, 942, 880, 1, INK, 9);
  // sources + certainty legend
  text('SOURCES: REUTERS, BBC, AP, FRANCE 24, EURONEWS, GUARDIAN, INSHORTS, NEXUS EUROPA. PICTURES AND MAP: ORIGINAL, DRAWN IN CODE.', 16, 974, 1, GREY);
  text("CERTAINTY: REPORTED = CARRIED BY THE DAY'S WIRES · CLAIM = ONE SIDE'S ACCOUNT, LABELLED AS SUCH · FORECAST = STILL TO HAPPEN WHEN DRAWN", 16, 984, 1, GREY);
  // footer bar
  rect(0, 996, W, 28, NAVY);
  text('THE WORLD IN ONE DAY', 16, 1006, 1, WHITE);
  rightAligned('MONDAY 23 NOVEMBER 2026 · ONE PAGE', 1008, 1006, 1, WHITE);
}

const outDir = process.env.MAKEFUN_OUTPUT_DIR || '/output';
render();
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, 'entry.png'), encodePNG());
