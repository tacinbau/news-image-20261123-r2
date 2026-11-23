// One Day on Earth - Monday 23 November 2026.
// A one-page atlas summing up the day's world news in one image.
// Node 22, standard library only. Deterministic: same bytes every run.
// Draws everything in code (bitmap font, polygons, pictograms) - no assets.
//
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { deflateSync } from 'node:zlib';

const W = 1024;
const H = 1024;

// ---------- palette ----------
const PAPER = [250, 247, 240];
const WHITE = [255, 255, 255];
const INK = [20, 20, 20];
const TEAL = [14, 124, 123];
const TEAL_PALE = [205, 232, 228];
const TEAL_DARK = [9, 84, 83];
const AMBER = [217, 142, 0];
const CRIMSON = [192, 57, 43];
const NAVY = [31, 78, 121];
const OLIVE = [91, 122, 58];
const PURPLE = [122, 74, 140];
const GREY = [102, 102, 102];
const GREY_LINE = [200, 196, 186];
const SKY1 = [16, 24, 48];
const SKY2 = [38, 52, 92];
const SKY3 = [74, 92, 140];
const BUILD = [28, 32, 54];
const RUBBLE = [120, 116, 108];
const BEAM = [150, 158, 190];
const LAMP = [255, 190, 80];

// ---------- canvas ----------
const buf = Buffer.alloc(W * H * 3);
function px(x, y, c) {
  if (x < 0 || y < 0 || x >= W || y >= H) return;
  const i = (y * W + x) * 3;
  buf[i] = c[0]; buf[i + 1] = c[1]; buf[i + 2] = c[2];
}
function fillRect(x, y, w, h, c) {
  for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) px(i, j, c);
}
function hline(x, y, w, c) { fillRect(x, y, w, 1, c); }
function vline(x, y, h, c) { fillRect(x, y, 1, h, c); }
function rect(x, y, w, h, c) {
  hline(x, y, w, c); hline(x, y + h - 1, w, c);
  vline(x, y, h, c); vline(x + w - 1, y, h, c);
}
function line(x0, y0, x1, y1, c) {
  const dx = Math.abs(x1 - x0);
  const sx = x0 < x1 ? 1 : -1;
  const dy = -Math.abs(y1 - y0);
  const sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;
  for (;;) {
    px(x0, y0, c);
    if (x0 === x1 && y0 === y1) break;
    const e2 = 2 * err;
    if (e2 >= dy) { err += dy; x0 += sx; }
    if (e2 <= dx) { err += dx; y0 += sy; }
  }
}
function disc(cx, cy, r, c) {
  for (let j = -r; j <= r; j++) {
    const w = Math.floor(Math.sqrt(r * r - j * j));
    for (let i = -w; i <= w; i++) px(cx + i, cy + j, c);
  }
}
function ring(cx, cy, r, c) {
  for (let a = 0; a < 360; a += 1) {
    const t = (a * Math.PI) / 180;
    px(Math.round(cx + r * Math.cos(t)), Math.round(cy + r * Math.sin(t)), c);
  }
}
function poly(points, c) {
  let minY = Infinity;
  let maxY = -Infinity;
  for (const p of points) { minY = Math.min(minY, p[1]); maxY = Math.max(maxY, p[1]); }
  for (let y = Math.ceil(minY); y <= maxY; y++) {
    const xs = [];
    for (let i = 0; i < points.length; i++) {
      const a = points[i];
      const b = points[(i + 1) % points.length];
      if ((a[1] <= y && b[1] > y) || (b[1] <= y && a[1] > y)) {
        xs.push(a[0] + ((y - a[1]) * (b[0] - a[0])) / (b[1] - a[1]));
      }
    }
    xs.sort((p, q) => p - q);
    for (let k = 0; k + 1 < xs.length; k += 2) {
      for (let x = Math.ceil(xs[k]); x <= xs[k + 1]; x++) px(x, y, c);
    }
  }
}
function polyOutline(points, c) {
  for (let i = 0; i < points.length; i++) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    line(Math.round(a[0]), Math.round(a[1]), Math.round(b[0]), Math.round(b[1]), c);
  }
}

// ---------- 5x7 bitmap font (uppercase) ----------
// Each glyph: 7 rows, each a 5-bit number, bit 4 = leftmost pixel.
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
  W: [0x11, 0x11, 0x11, 0x15, 0x15, 0x15, 0x0a],
  X: [0x11, 0x11, 0x0a, 0x04, 0x0a, 0x11, 0x11],
  Y: [0x11, 0x11, 0x0a, 0x04, 0x04, 0x04, 0x04],
  Z: [0x1f, 0x01, 0x02, 0x04, 0x08, 0x10, 0x1f],
  '0': [0x0e, 0x11, 0x13, 0x15, 0x19, 0x11, 0x0e],
  '1': [0x04, 0x0c, 0x04, 0x04, 0x04, 0x04, 0x0e],
  '2': [0x0e, 0x11, 0x01, 0x06, 0x08, 0x10, 0x1f],
  '3': [0x1f, 0x02, 0x04, 0x02, 0x01, 0x11, 0x0e],
  '4': [0x02, 0x06, 0x0a, 0x12, 0x1f, 0x02, 0x02],
  '5': [0x1f, 0x10, 0x1e, 0x01, 0x01, 0x11, 0x0e],
  '6': [0x06, 0x08, 0x10, 0x1e, 0x11, 0x11, 0x0e],
  '7': [0x1f, 0x01, 0x02, 0x04, 0x08, 0x08, 0x08],
  '8': [0x0e, 0x11, 0x11, 0x0e, 0x11, 0x11, 0x0e],
  '9': [0x0e, 0x11, 0x11, 0x0f, 0x01, 0x02, 0x0c],
  ' ': [0, 0, 0, 0, 0, 0, 0],
  '.': [0, 0, 0, 0, 0, 0x0c, 0x0c],
  ',': [0, 0, 0, 0, 0x0c, 0x04, 0x08],
  ':': [0, 0x0c, 0, 0, 0, 0x0c, 0],
  ';': [0, 0x0c, 0, 0, 0x0c, 0x04, 0x08],
  "'": [0x04, 0x04, 0x08, 0, 0, 0, 0],
  '-': [0, 0, 0, 0x0e, 0, 0, 0],
  '(': [0x02, 0x04, 0x08, 0x08, 0x08, 0x04, 0x02],
  ')': [0x08, 0x04, 0x02, 0x02, 0x02, 0x04, 0x08],
  '/': [0x01, 0x02, 0x02, 0x04, 0x08, 0x08, 0x10],
  '%': [0x19, 0x1a, 0x02, 0x04, 0x08, 0x0b, 0x13],
  '+': [0, 0x04, 0x04, 0x1f, 0x04, 0x04, 0],
  '?': [0x0e, 0x11, 0x01, 0x02, 0x04, 0, 0x04],
  '!': [0x04, 0x04, 0x04, 0x04, 0x04, 0, 0x04],
  $: [0x04, 0x0f, 0x14, 0x0e, 0x05, 0x1e, 0x04],
  '&': [0x0c, 0x12, 0x14, 0x08, 0x15, 0x12, 0x0d],
  '"': [0x0a, 0x0a, 0, 0, 0, 0, 0],
  '*': [0, 0x15, 0x0e, 0x15, 0, 0, 0],
  '=': [0, 0, 0x1f, 0, 0x1f, 0, 0],
  '#': [0x0a, 0x0a, 0x1f, 0x0a, 0x1f, 0x0a, 0x0a],
  _: [0, 0, 0, 0, 0, 0, 0x1f],
  '@': [0x0e, 0x11, 0x17, 0x15, 0x16, 0x10, 0x0e],
  '·': [0, 0, 0, 0x0c, 0x0c, 0, 0],
  '—': [0, 0, 0, 0x1f, 0, 0, 0],
};

// ---------- text ----------
function norm(s) {
  return s
    .toUpperCase()
    .replace(/[’‘]/g, "'")
    .replace(/[–]/g, '—')
    .replace(/…/g, '...');
}
function textW(s, scale) {
  return norm(s).length * 6 * scale - scale;
}
function drawChar(x, y, ch, scale, c) {
  const g = FONT[ch] || FONT['?'];
  for (let r = 0; r < 7; r++) {
    const row = g[r];
    for (let col = 0; col < 5; col++) {
      if (row & (16 >> col)) fillRect(x + col * scale, y + r * scale, scale, scale, c);
    }
  }
}
function drawText(x, y, s, scale, c, bold = false) {
  let cx = x;
  for (const ch of norm(s)) {
    if (ch === ' ') { cx += 6 * scale; continue; }
    drawChar(cx, y, ch, scale, c);
    if (bold && scale >= 2) drawChar(cx + 1, y, ch, scale, c);
    cx += 6 * scale;
  }
  return cx;
}
function drawTextC(cx, y, s, scale, c, bold = false) {
  drawText(cx - Math.floor(textW(s, scale) / 2), y, s, scale, c, bold);
}
function drawTextR(x, y, s, scale, c, bold = false) {
  drawText(x - textW(s, scale), y, s, scale, c, bold);
}
function wrap(s, maxW, scale) {
  const words = norm(s).split(' ');
  const lines = [];
  let cur = '';
  for (const w of words) {
    const t = cur ? cur + ' ' + w : w;
    if (textW(t, scale) <= maxW) cur = t;
    else { if (cur) lines.push(cur); cur = w; }
  }
  if (cur) lines.push(cur);
  return lines;
}
function drawBlock(x, y, s, scale, c, maxW, lineH) {
  const lines = wrap(s, maxW, scale);
  lines.forEach((ln, i) => drawText(x, y + i * lineH, ln, scale, c));
  return lines.length;
}
// Fit a headline into at most maxLines lines at the given scale/width.
// Appends " (SRC)" when it fits, otherwise drops the source.
function fitHeadline(headline, src, maxW, scale, maxLines) {
  const withSrc = headline + ' (' + src + ')';
  let lines = wrap(withSrc, maxW, scale);
  if (lines.length <= maxLines) return lines;
  lines = wrap(headline, maxW, scale);
  if (lines.length <= maxLines) return lines;
  const keep = lines.slice(0, maxLines);
  let last = keep[keep.length - 1];
  while (textW(last + '...', scale) > maxW && last.length > 1) {
    last = last.slice(0, last.lastIndexOf(' ') > 0 ? last.lastIndexOf(' ') : last.length - 1);
  }
  keep[keep.length - 1] = last + '...';
  return keep;
}

// ---------- PNG encoder ----------
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
function pngChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}
function encodePNG() {
  const raw = Buffer.alloc(H * (1 + W * 3));
  for (let y = 0; y < H; y++) {
    raw[y * (1 + W * 3)] = 0;
    buf.copy(raw, y * (1 + W * 3) + 1, y * W * 3, (y + 1) * W * 3);
  }
  const idat = deflateSync(raw, { level: 9 });
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(W, 0);
  ihdr.writeUInt32BE(H, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', idat),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

// ---------- world map (coarse equirectangular outlines, lon/lat) ----------
const MAP = { x0: 24, y0: 384, x1: 664, y1: 572 };
function project(lon, lat) {
  const x = MAP.x0 + ((lon + 180) / 360) * (MAP.x1 - MAP.x0);
  const y = MAP.y0 + ((83 - lat) / 141) * (MAP.y1 - MAP.y0);
  return [Math.round(x), Math.round(y)];
}
const LAND = [
  // North America
  [[-168, 66], [-165, 60], [-158, 58], [-152, 60], [-140, 60], [-135, 58], [-130, 54], [-125, 49], [-124, 42], [-120, 34], [-114, 29], [-110, 24], [-105, 20], [-97, 16], [-94, 17], [-90, 14], [-86, 12], [-83, 9], [-80, 8], [-77, 8], [-80, 10], [-83, 15], [-87, 16], [-88, 18], [-90, 21], [-91, 19], [-97, 19], [-97, 26], [-93, 30], [-89, 30], [-84, 30], [-81, 25], [-80, 32], [-76, 35], [-74, 40], [-70, 42], [-68, 44], [-65, 44], [-60, 47], [-55, 47], [-60, 52], [-64, 58], [-68, 58], [-72, 62], [-78, 62], [-85, 66], [-92, 66], [-95, 69], [-110, 68], [-125, 70], [-140, 70], [-155, 71], [-162, 70]],
  // Greenland
  [[-58, 64], [-52, 60], [-43, 60], [-40, 64], [-32, 68], [-22, 70], [-20, 74], [-25, 78], [-40, 80], [-58, 78], [-62, 74], [-58, 70], [-55, 66]],
  // South America
  [[-80, 9], [-77, 4], [-80, -3], [-81, -6], [-77, -12], [-72, -18], [-70, -23], [-70, -30], [-72, -37], [-73, -44], [-74, -50], [-70, -54], [-66, -55], [-68, -50], [-65, -45], [-62, -41], [-58, -35], [-52, -32], [-48, -28], [-41, -23], [-39, -17], [-35, -9], [-35, -6], [-40, -3], [-44, -2], [-50, 0], [-52, 4], [-58, 6], [-62, 9], [-68, 11], [-72, 12], [-76, 10]],
  // Africa
  [[-17, 15], [-16, 20], [-15, 25], [-10, 30], [-5, 35], [0, 36], [10, 37], [11, 34], [20, 32], [30, 31], [32, 31], [35, 28], [38, 22], [40, 15], [43, 12], [48, 11], [51, 12], [46, 5], [42, 0], [40, -5], [38, -10], [35, -18], [33, -25], [28, -33], [20, -35], [16, -30], [12, -18], [12, -10], [9, -1], [9, 4], [4, 6], [-8, 5], [-13, 8], [-17, 12]],
  // Europe
  [[-10, 36], [-9, 38], [-9, 43], [-2, 44], [-1, 46], [-4, 48], [-2, 50], [0, 51], [3, 53], [8, 54], [8, 57], [10, 59], [5, 60], [5, 62], [12, 64], [18, 66], [22, 70], [30, 70], [35, 68], [40, 66], [44, 64], [48, 60], [46, 55], [44, 50], [40, 47], [38, 46], [33, 45], [30, 46], [28, 44], [23, 40], [22, 38], [26, 38], [23, 36], [19, 40], [15, 44], [12, 44], [8, 44], [3, 43], [0, 40], [-2, 37], [-6, 36], [-9, 37]],
  // Asia
  [[30, 70], [40, 68], [50, 68], [60, 69], [70, 72], [80, 73], [90, 75], [100, 76], [110, 74], [120, 73], [130, 72], [140, 72], [150, 70], [160, 69], [170, 67], [178, 65], [170, 60], [162, 56], [158, 52], [150, 59], [142, 59], [140, 53], [138, 46], [135, 43], [130, 42], [127, 40], [122, 38], [120, 32], [122, 28], [120, 25], [116, 23], [110, 20], [108, 18], [105, 10], [103, 8], [100, 8], [98, 12], [97, 16], [94, 17], [92, 21], [89, 22], [86, 20], [82, 17], [80, 13], [77, 8], [75, 12], [73, 16], [70, 20], [66, 25], [62, 25], [58, 26], [56, 27], [54, 26], [52, 28], [50, 29], [48, 30], [44, 29], [40, 31], [36, 36], [33, 36], [30, 36], [28, 38], [27, 40], [30, 42], [33, 44], [35, 46], [38, 47], [40, 50], [44, 52], [46, 55], [48, 58], [44, 62], [40, 64], [35, 66], [30, 68]],
  // Australia
  [[113, -22], [114, -30], [115, -35], [118, -35], [124, -33], [129, -32], [132, -32], [135, -35], [138, -35], [140, -38], [145, -38], [150, -37], [153, -32], [153, -27], [150, -23], [146, -19], [142, -15], [142, -11], [137, -12], [135, -15], [132, -12], [130, -13], [126, -14], [122, -17], [118, -20], [114, -22]],
  // United Kingdom
  [[-5, 50], [-3, 53], [-5, 56], [-3, 58], [-1, 57], [0, 53], [1, 51]],
  // Japan
  [[130, 31], [132, 33], [135, 34], [137, 35], [139, 37], [140, 39], [141, 41], [142, 44], [144, 44], [142, 42], [140, 39], [138, 36], [135, 34], [133, 34], [130, 32]],
  // New Zealand
  [[167, -45], [170, -43], [173, -41], [175, -38], [177, -38], [175, -40], [172, -43], [168, -46]],
  // Madagascar
  [[44, -16], [47, -15], [50, -16], [48, -20], [46, -24], [44, -25], [43, -21], [43, -17]],
  // Sumatra
  [[95, 5], [100, 0], [104, -4], [106, -6], [100, -2], [96, 3]],
  // Borneo
  [[109, 1], [113, 4], [117, 6], [119, 1], [117, -3], [112, -4], [109, -1]],
  // New Guinea
  [[131, -1], [136, -2], [141, -3], [146, -6], [150, -9], [146, -8], [141, -8], [136, -6], [132, -4]],
  // Iceland
  [[-22, 64], [-18, 63], [-14, 64], [-16, 66], [-20, 66]],
];

// ---------- the 36 stories: Monday 23 November 2026 ----------
// Regions: EU Europe, ME Middle East, AM Americas, AP Asia-Pacific,
// AF Africa, OC Oceania, WO World. lon/lat place the map pin.
const REGIONS = {
  EU: { name: 'EUROPE', color: TEAL, count: 9 },
  ME: { name: 'MIDDLE EAST', color: CRIMSON, count: 6 },
  AM: { name: 'AMERICAS', color: NAVY, count: 7 },
  AP: { name: 'ASIA-PACIFIC', color: AMBER, count: 8 },
  AF: { name: 'AFRICA', color: OLIVE, count: 3 },
  OC: { name: 'OCEANIA', color: PURPLE, count: 1 },
  WO: { name: 'WORLD', color: GREY, count: 2 },
};
const STORIES = [
  { n: 1, r: 'EU', place: 'DYMER, UKRAINE', tag: 'WAR', h: 'DYMER TOLL HITS 15', src: 'BBC', lon: 30.5, lat: 50.9, dx: -10, dy: 0 },
  { n: 2, r: 'EU', place: 'ANTALYA, TÜRKIYE', tag: 'CLIMATE', h: 'COP31: NO DEAL', src: 'REU', lon: 30.7, lat: 36.9, dx: 0, dy: 0 },
  { n: 3, r: 'AM', place: 'WASHINGTON, US', tag: 'POLITICS', h: 'DEMOCRATS TAKE 258', src: 'AP', lon: -77, lat: 38.9, dx: -8, dy: 0 },
  { n: 4, r: 'AP', place: 'TOKYO, JAPAN', tag: 'MARKETS', h: 'NIKKEI FALLS 5.06%', src: 'REU', lon: 139.7, lat: 35.7, dx: 0, dy: 0 },
  { n: 5, r: 'EU', place: 'THE HAGUE', tag: 'LAW', h: 'GENOCIDE VERDICT', src: 'CNN', lon: 4.3, lat: 52.1, dx: -14, dy: -6 },
  { n: 6, r: 'AF', place: 'BENGHAZI, LIBYA', tag: 'SEA', h: 'MERKURY SINKS', src: 'REU', lon: 20.1, lat: 32.1, dx: 0, dy: 0 },
  { n: 7, r: 'ME', place: 'STRAIT OF HORMUZ', tag: 'IRAN', h: 'IRAN: WE DOWNED MQ-9', src: 'AP', lon: 56.5, lat: 26.5, dx: 0, dy: 0 },
  { n: 8, r: 'ME', place: 'MANAMA, BAHRAIN', tag: 'IRAN', h: 'TANKERS BLAZE', src: 'FR24', lon: 50.6, lat: 26.2, dx: 0, dy: 0 },
  { n: 9, r: 'AP', place: 'NEW DELHI', tag: 'DIPLOMACY', h: 'NEPAL PM MEETS MODI', src: 'AP', lon: 77.2, lat: 28.6, dx: 0, dy: 0 },
  { n: 10, r: 'AP', place: 'JAKARTA', tag: 'SEA', h: 'ROCKET SHIP SEIZED', src: 'INSH', lon: 106.8, lat: -6.2, dx: 0, dy: 0 },
  { n: 11, r: 'EU', place: 'BRUSSELS', tag: 'NATO', h: 'NATO MEETS ON POLAND', src: 'NEX', lon: 4.35, lat: 50.85, dx: 12, dy: 4 },
  { n: 12, r: 'AF', place: 'KHARTOUM', tag: 'WAR', h: 'FIVE CHILDREN KILLED', src: 'FR24', lon: 32.5, lat: 15.6, dx: 0, dy: 0 },
  { n: 13, r: 'OC', place: 'MELBOURNE', tag: 'OBITUARY', h: 'MOLLY MELDRUM DIES', src: 'DIG', lon: 145, lat: -37.8, dx: 0, dy: 0 },
  { n: 14, r: 'AP', place: 'TAIPEI', tag: 'MARKETS', h: 'TAIWAN BANS SHORTS', src: 'EVT', lon: 121.6, lat: 25, dx: 0, dy: 0 },
  { n: 15, r: 'EU', place: 'BRUSSELS', tag: 'STRIKE', h: 'AIRPORTS SHUT', src: 'ONT', lon: 4.35, lat: 50.85, dx: -12, dy: 12 },
  { n: 16, r: 'AM', place: 'ATLANTA, US', tag: 'TRAVEL', h: 'DELTA DELAYS 1,600', src: 'REU', lon: -84.4, lat: 33.75, dx: 0, dy: 0 },
  { n: 17, r: 'EU', place: 'CHISINAU, MOLDOVA', tag: 'EUROPE', h: 'MOLDOVA: 7 INCURSIONS', src: 'NEX', lon: 28.8, lat: 47, dx: 12, dy: 8 },
  { n: 18, r: 'EU', place: 'COPENHAGEN', tag: 'EUROPE', h: 'PLOT TO KILL RAPPER', src: 'EUR', lon: 12.6, lat: 55.7, dx: 0, dy: 0 },
  { n: 19, r: 'AM', place: 'SEATTLE, US', tag: 'IMMIGRATION', h: 'ICE JET-BRIDGE ARREST', src: 'ZRK', lon: -122.3, lat: 47.6, dx: 0, dy: 0 },
  { n: 20, r: 'AP', place: 'SEOUL', tag: 'POLITICS', h: 'SEOUL MINISTER QUITS', src: 'W60', lon: 127, lat: 37.5, dx: -10, dy: -8 },
  { n: 21, r: 'AP', place: 'SEOUL', tag: 'MARKETS', h: 'KOSPI FALLS 5%', src: 'W60', lon: 127, lat: 37.5, dx: 12, dy: 10 },
  { n: 22, r: 'ME', place: 'RIYADH', tag: 'MIDDLE EAST', h: 'DRONES DOWNED: RIYADH', src: 'W60', lon: 46.7, lat: 24.6, dx: 0, dy: 0 },
  { n: 23, r: 'AM', place: 'BOSTON, US', tag: 'HEALTH', h: 'PIG KIDNEY: ONE YEAR', src: 'NYT', lon: -71, lat: 42.4, dx: 0, dy: 0 },
  { n: 24, r: 'EU', place: 'ROME', tag: 'EUROPE', h: 'DE GENNARO DIES', src: 'NEX', lon: 12.5, lat: 41.9, dx: 0, dy: 0 },
  { n: 25, r: 'AM', place: 'WASHINGTON, US', tag: 'POLITICS', h: 'COMMON CENTS ACT', src: 'NEX', lon: -77, lat: 38.9, dx: 12, dy: -10 },
  { n: 26, r: 'ME', place: 'BEIRUT', tag: 'MIDDLE EAST', h: 'LEBANON PULLBACK', src: 'NET', lon: 35.5, lat: 33.9, dx: 8, dy: 0 },
  { n: 27, r: 'EU', place: 'MOSCOW', tag: 'WAR', h: '170 DRONES DOWNED', src: 'W60', lon: 37.6, lat: 55.75, dx: 0, dy: 0 },
  { n: 28, r: 'AM', place: 'ABU DHABI', tag: 'DIPLOMACY', h: 'ENVOYS TO MOSCOW', src: 'NEX', lon: 54.4, lat: 24.5, dx: 12, dy: 0 },
  { n: 29, r: 'AP', place: 'MUMBAI, INDIA', tag: 'SPORT', h: 'INDIA THIRD IN CUP', src: 'NET', lon: 72.8, lat: 19.1, dx: 0, dy: 0 },
  { n: 30, r: 'AP', place: 'HONG KONG', tag: 'MARKETS', h: 'HONG KONG SINKS', src: 'ONT', lon: 114.2, lat: 22.3, dx: 0, dy: 0 },
  { n: 31, r: 'AM', place: 'NEW YORK, US', tag: 'WEATHER', h: 'STORM HITS NEW YORK', src: 'ONT', lon: -74, lat: 40.7, dx: 0, dy: 0 },
  { n: 32, r: 'AF', place: 'DARFUR', tag: 'WAR', h: '11 KILLED IN DARFUR', src: 'EVT', lon: 24.5, lat: 13.5, dx: 0, dy: 0 },
  { n: 33, r: 'ME', place: 'HODEIDA, YEMEN', tag: 'WAR', h: 'SAUDIS HIT HODEIDA', src: 'NET', lon: 42.9, lat: 14.8, dx: 0, dy: 0 },
  { n: 34, r: 'ME', place: 'JEDDAH', tag: 'MIDDLE EAST', h: 'REFINERY HIT CLAIM', src: 'NET', lon: 39.2, lat: 21.5, dx: 0, dy: 0 },
  { n: 35, r: 'WO', place: 'WORLD', tag: 'SCIENCE', h: 'RIEMANN PROOF HOLDS', src: 'EVT', lon: null, lat: null, dx: 0, dy: 0 },
  { n: 36, r: 'WO', place: 'WORLD', tag: 'TECH', h: 'AI OUTPACES SAFETY', src: 'EVT', lon: null, lat: null, dx: 0, dy: 0 },
];

// ---------- hero: the night rescue in Dymer ----------
function drawHero() {
  const x0 = 24, y0 = 88, x1 = 420, y1 = 284;
  // Night sky in three bands.
  fillRect(x0, y0, x1 - x0, 52, SKY1);
  fillRect(x0, y0 + 52, x1 - x0, 50, SKY2);
  fillRect(x0, y0 + 102, x1 - x0, 50, SKY3);
  fillRect(x0, y1 - 44, x1 - x0, 44, [12, 12, 16]);
  // Stars.
  const stars = [[60, 100], [120, 112], [200, 98], [260, 116], [330, 104], [380, 122], [90, 132], [300, 140], [160, 128], [360, 96]];
  for (const s of stars) { px(s[0], s[1], WHITE); px(s[0] + 1, s[1], WHITE); }
  // Moon.
  disc(372, 112, 12, [235, 232, 205]);
  disc(368, 109, 10, SKY1);
  // Searchlight beam from the ground, sweeping up.
  poly([[300, 240], [318, 240], [392, 92], [372, 92]], BEAM);
  // Distant skyline.
  const skyline = [[24, 240, 46, 196], [52, 240, 40, 206], [98, 240, 52, 188], [156, 240, 36, 210], [198, 240, 44, 200], [248, 240, 38, 214], [292, 240, 46, 202], [344, 240, 40, 216], [390, 240, 30, 208]];
  for (const b of skyline) fillRect(b[0], b[3], b[2], b[1] - b[3], [52, 60, 96]);
  // The five-storey block, left half standing, right half collapsed.
  poly([[60, 240], [60, 150], [150, 150], [150, 168], [168, 168], [168, 186], [186, 186], [186, 240]], BUILD);
  // Jagged broken edge on the collapsed side.
  poly([[186, 240], [186, 186], [210, 196], [228, 184], [252, 200], [276, 192], [300, 240]], [44, 46, 66]);
  // Lit windows in the standing half.
  const wins = [[72, 162], [96, 162], [120, 162], [72, 184], [120, 184], [72, 206], [96, 206], [120, 206], [96, 184]];
  for (const w of wins) fillRect(w[0], w[1], 10, 12, LAMP);
  // Dark windows.
  fillRect(96, 162, 10, 12, [10, 12, 26]);
  fillRect(120, 206, 10, 12, [10, 12, 26]);
  // Rubble mound at the base.
  poly([[150, 240], [190, 208], [220, 224], [250, 206], [290, 228], [320, 240]], RUBBLE);
  poly([[210, 240], [236, 222], [262, 240]], [90, 86, 78]);
  // Two rescuers with helmets at the rubble.
  fillRect(232, 226, 4, 12, INK);
  disc(234, 224, 3, LAMP);
  fillRect(262, 228, 4, 10, INK);
  disc(264, 226, 3, LAMP);
  // Small ambulance van, right foreground.
  fillRect(330, 226, 52, 14, WHITE);
  fillRect(330, 226, 52, 4, CRIMSON);
  disc(342, 240, 4, INK);
  disc(370, 240, 4, INK);
  fillRect(336, 230, 8, 6, TEAL);
  // Caption bar across the panel bottom.
  fillRect(x0, y1 - 22, x1 - x0, 22, INK);
  drawText(x0 + 10, y1 - 15, 'DYMER, UKRAINE — RESCUERS DIG THROUGH THE NIGHT', 1, WHITE);
  // Lead tag, top left.
  fillRect(x0, y0, 92, 20, CRIMSON);
  drawText(x0 + 8, y0 + 6, 'LEAD · WAR', 1, WHITE);
}

// ---------- numbers strip ----------
const NUMBERS = [
  { v: '15', label: 'DEAD ACROSS KYIV REGION' },
  { v: '258', label: "DEMOCRATS' HOUSE SEATS" },
  { v: '-5.06%', label: "NIKKEI'S FALL IN AI ROUT" },
  { v: '1,600', label: 'DELTA FLIGHTS DELAYED' },
  { v: '405T', label: 'TONNES OF ROCKET CHEMICAL SEIZED' },
  { v: '3.7%', label: "S&P 500'S FALL" },
];
function drawNumbers() {
  hline(24, 290, 976, TEAL);
  hline(24, 292, 976, TEAL);
  drawText(24, 298, 'THE DAY IN NUMBERS', 1, TEAL_DARK, true);
  const colW = 976 / 6;
  for (let i = 0; i < 6; i++) {
    const cx = 24 + i * colW + colW / 2;
    drawTextC(Math.round(cx), 310, NUMBERS[i].v, 4, TEAL, true);
    const lines = wrap(NUMBERS[i].label, colW - 12, 1);
    lines.forEach((ln, j) => drawTextC(Math.round(cx), 342 + j * 9, ln, 1, INK));
  }
}

// ---------- map + legend ----------
function drawMap() {
  drawText(24, 366, 'WHERE IT HAPPENED', 2, INK, true);
  drawTextR(1000, 368, 'PINS MATCH STORY NUMBERS', 1, GREY);
  // Frame.
  fillRect(MAP.x0, MAP.y0, MAP.x1 - MAP.x0, MAP.y1 - MAP.y0, [248, 248, 244]);
  // Graticule every 30 degrees.
  for (let lon = -150; lon <= 150; lon += 30) {
    const a = project(lon, 80);
    const b = project(lon, -55);
    line(a[0], a[1], b[0], b[1], [226, 224, 216]);
  }
  for (let lat = 60; lat >= -30; lat -= 30) {
    const a = project(-180, lat);
    const b = project(180, lat);
    line(a[0], a[1], b[0], b[1], [226, 224, 216]);
  }
  // Land, filled pale teal with a teal coast.
  for (const c of LAND) {
    const pts = c.map((p) => project(p[0], p[1]));
    poly(pts, TEAL_PALE);
    polyOutline(pts, TEAL);
  }
  rect(MAP.x0, MAP.y0, MAP.x1 - MAP.x0, MAP.y1 - MAP.y0, INK);
  // Pins.
  for (const s of STORIES) {
    if (s.lon === null) continue;
    const col = REGIONS[s.r].color;
    const [tx, ty] = project(s.lon, s.lat);
    const cx = tx + s.dx;
    const cy = ty + s.dy;
    if (s.dx !== 0 || s.dy !== 0) line(tx, ty, cx, cy, col);
    disc(cx, cy, 9, col);
    ring(cx, cy, 9, WHITE);
    const num = String(s.n);
    drawText(cx - Math.floor(textW(num, 1) / 2), cy - 3, num, 1, WHITE);
  }
  // Legend, right of the map.
  let ly = 384;
  for (const k of ['EU', 'ME', 'AM', 'AP', 'AF', 'OC', 'WO']) {
    const r = REGIONS[k];
    fillRect(680, ly, 14, 14, r.color);
    drawText(702, ly + 3, r.name + ' · ' + r.count, 2, INK);
    ly += 26;
  }
  drawText(680, ly + 4, '35-36 WORLD: NO SINGLE PLACE.', 1, GREY);
}

// ---------- masthead + standfirst + hero text ----------
function drawTop() {
  fillRect(0, 0, W, 56, INK);
  drawText(24, 14, 'ONE DAY ON EARTH', 4, WHITE, true);
  drawTextR(1000, 22, 'MONDAY 23 NOVEMBER 2026', 2, AMBER, true);
  drawTextC(512, 64, '36 STORIES · SEVEN REGIONS · EVERY ONE DATED MONDAY 23 NOVEMBER 2026', 1, TEAL_DARK, true);
  hline(24, 80, 976, TEAL);
  hline(24, 82, 976, TEAL);
  // Hero text, right of the picture.
  drawText(436, 96, 'KYIV REGION · WAR', 2, CRIMSON, true);
  drawBlock(436, 120, 'BOY PULLED ALIVE AS DYMER TOLL HITS 15', 3, INK, 564, 24);
  hline(436, 176, 564, GREY_LINE);
  const sumLines = drawBlock(
    436, 186,
    'RESCUERS PULLED DAVYD, 7, ALIVE AFTER 14 HOURS UNDER THE RUBBLE OF A FIVE-STOREY BLOCK IN DYMER. ELEVEN WERE KILLED THERE AND FIFTEEN ACROSS THE KYIV REGION AS SEARCHES WENT ON THROUGH THE NIGHT FOR THE MISSING.',
    2, INK, 564, 17,
  );
  drawText(436, 186 + sumLines * 17 + 4, '(BBC · REUTERS)', 1, GREY);
}

// ---------- story index ----------
function drawIndex() {
  drawText(24, 588, 'ALL 36 STORIES', 2, INK, true);
  drawTextR(1000, 590, 'HEADLINES IN BRIEF — SEE MAP FOR PLACES', 1, GREY);
  const colX = [24, 356, 688];
  const colW = [332, 332, 312];
  const rowH = 28;
  const y0 = 612;
  for (let c = 0; c < 3; c++) {
    for (let r = 0; r < 12; r++) {
      const s = STORIES[c * 12 + r];
      const y = y0 + r * rowH;
      const col = REGIONS[s.r].color;
      drawText(colX[c], y, String(s.n), 2, col, true);
      const hx = colX[c] + 30;
      // One line per row: headline scale 2, source tag scale 1 right after
      // it. If a long headline + tag would spill past the column edge, the
      // tag drops to a small second line, clear of the next row (7 px glyph
      // at y+16, next row starts at y+28).
      const tag = '(' + s.src + ')';
      const maxW = colW[c] - 30;
      if (textW(s.h, 2) + 6 + textW(tag, 1) <= maxW) {
        drawText(hx, y, s.h, 2, INK);
        drawText(hx + textW(s.h, 2) + 6, y + 7, tag, 1, GREY);
      } else {
        drawText(hx, y, s.h, 2, INK);
        drawText(hx, y + 16, tag, 1, GREY);
      }
    }
  }
}

// ---------- date check + footer ----------
function drawBottom() {
  fillRect(24, 950, 976, 30, TEAL);
  drawBlock(
    36, 956,
    "DATE CHECK — NOT 23 NOV: THE 186-DRONE NIGHT (SUN 22 NOV) · 'EL CHAPO ISIDRO' CAPTURED (FRI 20 NOV) · HONG KONG ELECTION VOTE (SUN 22 NOV) · INDIA 720/9 DECLARED (SUN 22 NOV) · SPARTA II HIT (SAT 21 NOV) · VERSTAPPEN'S LAS VEGAS WIN (SUN 22 NOV)",
    1, WHITE, 952, 9,
  );
  drawText(24, 988, 'SOURCES: REUTERS · BBC · AP · AFP · FRANCE 24 · EURONEWS · CNN · NYT · NEXUS · EVENTGRAPH — PICTURES AND MAP: ORIGINAL, DRAWN IN CODE.', 1, GREY);
  drawTextR(1000, 988, 'ONE DAY ON EARTH', 1, GREY);
}

// ---------- main ----------
fillRect(0, 0, W, H, PAPER);
drawTop();
drawHero();
drawNumbers();
drawMap();
drawIndex();
drawBottom();

const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, 'entry.png'), encodePNG());
