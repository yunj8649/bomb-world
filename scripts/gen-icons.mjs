// 폭탄 마스코트로 앱 아이콘/스플래시 원본 + 웹 런타임 아이콘 생성
// 실행: node scripts/gen-icons.mjs   (그 뒤 npx @capacitor/assets generate)
import sharp from "sharp";
import { mkdirSync } from "node:fs";

mkdirSync("assets", { recursive: true });

// 귀여운 폭탄 마스코트 (자기 중심 0,0 기준) — 둥근 검은 몸 + 반짝 눈 + 미소 + 불붙은 심지
function mascot(cx, cy, s) {
  return `<g transform="translate(${cx},${cy}) scale(${s})">
    <ellipse cx="0" cy="235" rx="180" ry="34" fill="rgba(0,0,0,0.30)"/>
    <circle cx="0" cy="30" r="200" fill="#2b2440"/>
    <circle cx="0" cy="30" r="200" fill="url(#body)"/>
    <ellipse cx="-64" cy="-40" rx="46" ry="60" fill="#fff"/>
    <ellipse cx="64" cy="-40" rx="46" ry="60" fill="#fff"/>
    <circle cx="-56" cy="-24" r="26" fill="#1a1228"/>
    <circle cx="72" cy="-24" r="26" fill="#1a1228"/>
    <circle cx="-64" cy="-34" r="9" fill="#fff"/>
    <circle cx="64" cy="-34" r="9" fill="#fff"/>
    <ellipse cx="-104" cy="70" rx="34" ry="20" fill="#ff6b8b" opacity="0.7"/>
    <ellipse cx="104" cy="70" rx="34" ry="20" fill="#ff6b8b" opacity="0.7"/>
    <path d="M -46 78 Q 0 128 46 78" stroke="#1a1228" stroke-width="16" fill="none" stroke-linecap="round"/>
    <!-- 심지 -->
    <path d="M 40 -150 Q 120 -220 90 -300" stroke="#8a6a3a" stroke-width="18" fill="none" stroke-linecap="round"/>
    <!-- 불꽃 -->
    <circle cx="90" cy="-312" r="30" fill="#ffb14e"/>
    <circle cx="90" cy="-320" r="18" fill="#ff6b3d"/>
    <circle cx="90" cy="-326" r="9" fill="#fff3b0"/>
  </g>`;
}

function stars(n, w, h, color = "#fff3b0") {
  let out = "";
  for (let i = 0; i < n; i++) {
    const x = (i * 97 + 31) % w, y = (i * 53 + 17) % Math.floor(h * 0.9);
    const r = (i % 3 === 0) ? w * 0.004 : w * 0.0022;
    out += `<circle cx="${x}" cy="${y}" r="${r}" fill="${color}" opacity="${0.5 + (i % 4) * 0.12}"/>`;
  }
  return out;
}

function defs() {
  return `<defs>
    <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#3a2a5e"/><stop offset="1" stop-color="#1a1228"/></linearGradient>
    <radialGradient id="body" cx="0.38" cy="0.30" r="0.75">
      <stop offset="0" stop-color="#4a4066"/><stop offset="0.5" stop-color="#2b2440"/><stop offset="1" stop-color="#14101f"/></radialGradient>
    <radialGradient id="glow" cx="0.5" cy="0.46" r="0.42">
      <stop offset="0" stop-color="#ffb14e" stop-opacity="0.16"/><stop offset="1" stop-color="#ffb14e" stop-opacity="0"/></radialGradient>
  </defs>`;
}
function bg(size) { return `<rect width="${size}" height="${size}" fill="url(#g)"/>`; }

const svgs = {
  "icon-only.png": (S = 1024) => `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}">
    ${defs()}${bg(S)}${stars(22, S, S)}<rect width="${S}" height="${S}" fill="url(#glow)"/>
    ${mascot(S / 2, S / 2 + 40, 0.82)}</svg>`,
  "icon-background.png": (S = 1024) => `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}">
    ${defs()}${bg(S)}${stars(22, S, S)}</svg>`,
  "icon-foreground.png": (S = 1024) => `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}">
    ${defs()}${mascot(S / 2, S / 2 + 30, 0.56)}</svg>`,
  "splash.png": (S = 2732) => `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}">
    ${defs()}<rect width="${S}" height="${S}" fill="url(#g)"/>${stars(48, S, S)}<rect width="${S}" height="${S}" fill="url(#glow)"/>
    ${mascot(S / 2, S / 2, 2.2)}</svg>`,
  "splash-dark.png": (S = 2732) => `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}">
    ${defs()}<rect width="${S}" height="${S}" fill="#06040a"/>${stars(48, S, S)}<rect width="${S}" height="${S}" fill="url(#glow)"/>
    ${mascot(S / 2, S / 2, 2.2)}</svg>`,
};

for (const [name, fn] of Object.entries(svgs)) {
  await sharp(Buffer.from(fn())).png().toFile(`assets/${name}`);
  console.log("✓ assets/" + name);
}

// 웹/PWA 런타임 아이콘도 바로 생성 (www/)
const iconSvg = svgs["icon-only.png"](1024);
const runtime = [
  ["www/icon-512.png", 512],
  ["www/icon-192.png", 192],
  ["www/apple-touch-icon.png", 180],
  ["www/favicon-32.png", 32],
];
for (const [path, size] of runtime) {
  await sharp(Buffer.from(iconSvg)).resize(size, size).png().toFile(path);
  console.log("✓ " + path);
}
console.log("완료");
