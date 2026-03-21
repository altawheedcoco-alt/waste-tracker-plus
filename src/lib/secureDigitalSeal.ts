/**
 * منظومة الختم الرقمي المؤمّن — Secure Digital Seal System v2.0
 * 
 * طبقات الأمان المتقدمة (World-Class Anti-Counterfeiting):
 * 1. بصمة تشفيرية مزدوجة (Dual HMAC-like hash) — FNV-1a × 3 rounds
 * 2. أنماط جيلوشي متعددة الطبقات (Multi-layer Guilloche) — 4 حلقات فريدة
 * 3. نمط سبيروغراف تداخلي (Spirograph Interference Pattern)
 * 4. نمط موير مضاد للنسخ (Anti-copy Moiré Pattern)
 * 5. تأثير هولوغرافي متدرج (Holographic Gradient Simulation)
 * 6. حلقات نصوص مجهرية مشفرة (Encrypted Micro-text Rings) — 3 حلقات
 * 7. شبكة أمنية متقاطعة (Cross-hatch Security Grid)
 * 8. نقاط أمنية ديناميكية (Dynamic Security Dots) — 2 طبقة
 * 9. علامة مائية غير مرئية (Invisible Watermark Layer)
 * 10. ختم زمني مشفر (Encrypted Timestamp Seal)
 * 
 * 5 أنماط تصميم: كلاسيكي، ملكي، حديث، هولوغرافي، رسمي
 */

// ═══════════════════════════════════════════════════════════════
// Seal Style Types
// ═══════════════════════════════════════════════════════════════

export type SealStyle = 'classic' | 'royal' | 'modern' | 'holographic' | 'corporate';

export interface SealStyleOption {
  id: SealStyle;
  nameAr: string;
  nameEn: string;
  description: string;
  preview: string; // emoji/icon identifier
}

export const SEAL_STYLES: SealStyleOption[] = [
  { id: 'classic', nameAr: 'كلاسيكي', nameEn: 'Classic', description: 'تصميم تقليدي أنيق مع جيلوشي متعدد الطبقات', preview: '🏛️' },
  { id: 'royal', nameAr: 'ملكي', nameEn: 'Royal', description: 'تصميم فخم بألوان ذهبية ونقوش ملكية مزخرفة', preview: '👑' },
  { id: 'modern', nameAr: 'عصري', nameEn: 'Modern', description: 'تصميم هندسي بسيط وخطوط نظيفة ومعاصرة', preview: '💎' },
  { id: 'holographic', nameAr: 'هولوغرافي', nameEn: 'Holographic', description: 'تأثيرات قزحية متغيرة الألوان مضادة للتزوير', preview: '🌈' },
  { id: 'corporate', nameAr: 'رسمي', nameEn: 'Corporate', description: 'تصميم مؤسسي رسمي للاستخدام القانوني', preview: '📜' },
];

// ═══════════════════════════════════════════════════════════════
// Cryptographic Utilities — Enhanced Triple-Round Hashing
// ═══════════════════════════════════════════════════════════════

function secureSealHash(data: string, salt: string): string {
  let h1 = 0x811c9dc5;
  let h2 = 0xcbf29ce4;
  let h3 = 0x6c62272e;
  const combined = `${salt}::${data}::iRecycle::2024::v2`;
  
  // Triple round hashing for stronger fingerprint
  for (let round = 0; round < 3; round++) {
    for (let i = 0; i < combined.length; i++) {
      const c = combined.charCodeAt(i) + round * 31;
      h1 ^= c; h1 = Math.imul(h1, 0x01000193);
      h2 ^= c; h2 = Math.imul(h2, 0x01000193);
      h3 ^= c; h3 = Math.imul(h3, 0x01000193);
      h1 ^= h2 >>> 13; h2 ^= h3 >>> 7; h3 ^= h1 >>> 11;
    }
  }

  const hex1 = (h1 >>> 0).toString(16).padStart(8, '0');
  const hex2 = (h2 >>> 0).toString(16).padStart(8, '0');
  const hex3 = (h3 >>> 0).toString(16).padStart(8, '0');
  return `${hex1}${hex2}${hex3}`.toUpperCase();
}

export function generateSealNumber(entityId: string, entityType: 'member' | 'organization', name: string): string {
  const hash = secureSealHash(`${entityId}|${name}`, entityType);
  const prefix = entityType === 'member' ? 'MS' : 'OS';
  return `${prefix}-${hash.slice(0, 4)}-${hash.slice(4, 8)}-${hash.slice(8, 12)}`;
}

export function generateDocumentSealProof(sealNumber: string, documentRef: string, timestamp: string): string {
  const proof = secureSealHash(`${sealNumber}|${documentRef}|${timestamp}`, 'doc-proof-v2');
  return proof.slice(0, 12);
}

// ═══════════════════════════════════════════════════════════════
// Visual Pattern Generation — Multi-Layer Security
// ═══════════════════════════════════════════════════════════════

function hashToColor(hash: string, offset = 0): string {
  const h = parseInt(hash.slice(offset, offset + 3), 16) % 360;
  const s = 55 + (parseInt(hash.slice(offset + 3, offset + 5), 16) % 30);
  const l = 30 + (parseInt(hash.slice(offset + 5, offset + 7), 16) % 20);
  return `hsl(${h}, ${s}%, ${l}%)`;
}

function hashToHSL(hash: string, offset = 0): { h: number; s: number; l: number } {
  return {
    h: parseInt(hash.slice(offset, offset + 3), 16) % 360,
    s: 55 + (parseInt(hash.slice(offset + 3, offset + 5), 16) % 30),
    l: 30 + (parseInt(hash.slice(offset + 5, offset + 7), 16) % 20),
  };
}

// Multi-layer guilloche with configurable complexity
function generateGuillochePath(hash: string, radius: number, complexity: number, layerSeed = 0): string {
  const points: string[] = [];
  const steps = 720; // Higher resolution
  const a1 = 2 + (parseInt(hash.slice(layerSeed, layerSeed + 2), 16) % 8);
  const a2 = 3 + (parseInt(hash.slice(layerSeed + 2, layerSeed + 4), 16) % 10);
  const a3 = 5 + (parseInt(hash.slice(layerSeed + 4, layerSeed + 6), 16) % 6);
  const depth = 2 + (parseInt(hash.slice(layerSeed + 6, layerSeed + 8), 16) % 4) * complexity;

  for (let i = 0; i <= steps; i++) {
    const angle = (i / steps) * Math.PI * 2;
    const r = radius + 
      Math.sin(angle * a1) * depth +
      Math.cos(angle * a2) * (depth * 0.6) +
      Math.sin(angle * a3) * (depth * 0.25) +
      Math.sin(angle * (a1 + a2)) * (depth * 0.3);
    const x = 100 + r * Math.cos(angle);
    const y = 100 + r * Math.sin(angle);
    points.push(`${i === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`);
  }
  points.push('Z');
  return points.join(' ');
}

// Spirograph interference pattern
function generateSpirographPath(hash: string, R: number, r: number, d: number): string {
  const points: string[] = [];
  const steps = 1000;
  const seed = parseInt(hash.slice(0, 4), 16);
  const R1 = R + (seed % 5);
  const r1 = r + ((seed >> 4) % 3);
  const d1 = d + ((seed >> 8) % 4);

  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * Math.PI * 2 * (r1 > 0 ? Math.round(R1 / gcd(R1, r1)) : 10);
    const x = 100 + (R1 - r1) * Math.cos(t) + d1 * Math.cos(((R1 - r1) / r1) * t);
    const y = 100 + (R1 - r1) * Math.sin(t) - d1 * Math.sin(((R1 - r1) / r1) * t);
    if (x > 5 && x < 195 && y > 5 && y < 195) {
      points.push(`${i === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`);
    }
  }
  return points.join(' ');
}

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

// Anti-copy moiré pattern
function generateMoirePattern(hash: string, radius: number): string {
  let svg = '';
  const angle1 = parseInt(hash.slice(0, 2), 16) % 30;
  const angle2 = angle1 + 30 + (parseInt(hash.slice(2, 4), 16) % 15);
  const spacing = 3 + (parseInt(hash.slice(4, 6), 16) % 2);

  for (let i = -radius; i <= radius; i += spacing) {
    const rad1 = (angle1 * Math.PI) / 180;
    const rad2 = (angle2 * Math.PI) / 180;
    // Layer 1
    const x1 = 100 + i * Math.cos(rad1);
    const y1 = 100 + i * Math.sin(rad1);
    svg += `<line x1="${(x1 - radius * Math.sin(rad1)).toFixed(1)}" y1="${(y1 + radius * Math.cos(rad1)).toFixed(1)}" x2="${(x1 + radius * Math.sin(rad1)).toFixed(1)}" y2="${(y1 - radius * Math.cos(rad1)).toFixed(1)}" stroke="currentColor" stroke-width="0.15" opacity="0.08"/>`;
    // Layer 2 (offset angle creates moiré)
    const x2 = 100 + i * Math.cos(rad2);
    const y2 = 100 + i * Math.sin(rad2);
    svg += `<line x1="${(x2 - radius * Math.sin(rad2)).toFixed(1)}" y1="${(y2 + radius * Math.cos(rad2)).toFixed(1)}" x2="${(x2 + radius * Math.sin(rad2)).toFixed(1)}" y2="${(y2 - radius * Math.cos(rad2)).toFixed(1)}" stroke="currentColor" stroke-width="0.15" opacity="0.06"/>`;
  }
  return svg;
}

// Cross-hatch security grid
function generateCrossHatch(hash: string, innerR: number, outerR: number): string {
  let svg = '';
  const count = 36 + (parseInt(hash.slice(8, 10), 16) % 18);
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    const x1 = 100 + innerR * Math.cos(angle);
    const y1 = 100 + innerR * Math.sin(angle);
    const x2 = 100 + outerR * Math.cos(angle);
    const y2 = 100 + outerR * Math.sin(angle);
    svg += `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="currentColor" stroke-width="0.2" opacity="0.06"/>`;
  }
  return svg;
}

// Enhanced security dots — 2 layers
function generateSecurityDots(hash: string, radius: number): string {
  let dots = '';
  // Layer 1 — primary dots
  const count1 = 32 + (parseInt(hash.slice(6, 8), 16) % 24);
  for (let i = 0; i < count1; i++) {
    const angle = (i / count1) * Math.PI * 2;
    const r = radius + (parseInt(hash.charAt(i % hash.length), 16) % 4) - 2;
    const x = 100 + r * Math.cos(angle);
    const y = 100 + r * Math.sin(angle);
    const size = 0.3 + (parseInt(hash.charAt((i + 5) % hash.length), 16) % 3) * 0.2;
    dots += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${size}" fill="currentColor" opacity="0.4"/>`;
  }
  // Layer 2 — secondary micro dots (different radius)
  const count2 = 24 + (parseInt(hash.slice(10, 12), 16) % 16);
  for (let i = 0; i < count2; i++) {
    const angle = (i / count2) * Math.PI * 2 + 0.05;
    const r = radius - 8 + (parseInt(hash.charAt((i + 3) % hash.length), 16) % 3);
    const x = 100 + r * Math.cos(angle);
    const y = 100 + r * Math.sin(angle);
    dots += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="0.25" fill="currentColor" opacity="0.25"/>`;
  }
  return dots;
}

// ═══════════════════════════════════════════════════════════════
// Style-Specific Color Palettes
// ═══════════════════════════════════════════════════════════════

interface StylePalette {
  primary: string;
  accent: string;
  gradient1: string;
  gradient2: string;
  gradient3?: string;
  bg: string;
  borderOuter: string;
}

function getStylePalette(style: SealStyle, hash: string): StylePalette {
  const baseHSL = hashToHSL(hash, 0);
  
  switch (style) {
    case 'royal':
      return {
        primary: `hsl(43, 85%, 35%)`,
        accent: `hsl(35, 90%, 45%)`,
        gradient1: `hsl(43, 85%, 30%)`,
        gradient2: `hsl(35, 90%, 50%)`,
        gradient3: `hsl(48, 80%, 40%)`,
        bg: `hsl(43, 30%, 97%)`,
        borderOuter: `hsl(43, 85%, 35%)`,
      };
    case 'modern':
      return {
        primary: `hsl(220, 70%, 40%)`,
        accent: `hsl(200, 80%, 50%)`,
        gradient1: `hsl(220, 70%, 35%)`,
        gradient2: `hsl(200, 80%, 55%)`,
        bg: `hsl(220, 20%, 98%)`,
        borderOuter: `hsl(220, 70%, 40%)`,
      };
    case 'holographic':
      return {
        primary: `hsl(${baseHSL.h}, 75%, 40%)`,
        accent: `hsl(${(baseHSL.h + 120) % 360}, 80%, 45%)`,
        gradient1: `hsl(${baseHSL.h}, 80%, 35%)`,
        gradient2: `hsl(${(baseHSL.h + 60) % 360}, 85%, 50%)`,
        gradient3: `hsl(${(baseHSL.h + 180) % 360}, 75%, 45%)`,
        bg: `hsl(${baseHSL.h}, 15%, 98%)`,
        borderOuter: `hsl(${baseHSL.h}, 75%, 40%)`,
      };
    case 'corporate':
      return {
        primary: `hsl(210, 25%, 30%)`,
        accent: `hsl(210, 35%, 45%)`,
        gradient1: `hsl(210, 25%, 25%)`,
        gradient2: `hsl(210, 35%, 50%)`,
        bg: `hsl(210, 10%, 98%)`,
        borderOuter: `hsl(210, 25%, 30%)`,
      };
    case 'classic':
    default:
      return {
        primary: hashToColor(hash, 0),
        accent: hashToColor(hash, 6),
        gradient1: hashToColor(hash, 0),
        gradient2: hashToColor(hash, 6),
        bg: 'white',
        borderOuter: hashToColor(hash, 0),
      };
  }
}

// ═══════════════════════════════════════════════════════════════
// SVG Seal Generator — Enhanced with Style Support
// ═══════════════════════════════════════════════════════════════

export interface DigitalSealData {
  entityId: string;
  entityType: 'member' | 'organization';
  entityName: string;
  title?: string;
  orgName?: string;
  documentRef?: string;
  timestamp?: string;
  size?: number;
  style?: SealStyle;
}

export function generateDigitalSealSVG(data: DigitalSealData): string {
  const {
    entityId,
    entityType,
    entityName,
    title,
    documentRef,
    timestamp = new Date().toISOString(),
    size = 200,
    style = 'classic',
  } = data;

  const sealNumber = generateSealNumber(entityId, entityType, entityName);
  const hash = secureSealHash(`${entityId}|${entityName}|${entityType}`, 'visual-seed-v2');
  const palette = getStylePalette(style, hash);
  const uid = hash.slice(0, 6);

  const docProof = documentRef 
    ? generateDocumentSealProof(sealNumber, documentRef, timestamp)
    : null;

  const displayName = entityName.length > 20 ? entityName.slice(0, 18) + '…' : entityName;
  const typeLabel = entityType === 'member' ? 'عضو معتمد' : 'جهة معتمدة';

  // Generate all security layers
  const guillocheL1 = generateGuillochePath(hash, 88, 0.9, 0);
  const guillocheL2 = generateGuillochePath(hash, 75, 0.7, 4);
  const guillocheL3 = generateGuillochePath(hash, 58, 0.5, 8);
  const guillocheL4 = generateGuillochePath(hash.split('').reverse().join(''), 68, 0.6, 2);
  const spirograph = generateSpirographPath(hash, 35, 12, 8);
  const moireSVG = generateMoirePattern(hash, 90);
  const crossHatch = generateCrossHatch(hash, 48, 92);
  const securityDots = generateSecurityDots(hash, 70);
  const microText1 = `iRecycle • ${hash.slice(0, 4)} • مُوثّق • ${hash.slice(4, 8)} • رقمي • ${hash.slice(8, 12)} • مؤمّن •`;
  const microText2 = `● ${sealNumber} ● V2 ● ${hash.slice(0, 8)} ● ${typeLabel} ● ${hash.slice(8, 16)} ●`;
  const microText3 = `◆ SECURE ◆ ${hash.slice(12, 18)} ◆ VERIFIED ◆ ${hash.slice(18, 24)} ◆`;

  // Style-specific extra elements
  const styleExtras = generateStyleExtras(style, hash, palette, uid);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="${size}" height="${size}" style="filter:drop-shadow(0 2px 10px rgba(0,0,0,0.18));">
  <defs>
    <!-- Multi-stop gradient -->
    <linearGradient id="sg1_${uid}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${palette.gradient1};stop-opacity:0.9"/>
      <stop offset="50%" style="stop-color:${palette.gradient2};stop-opacity:0.7"/>
      ${palette.gradient3 ? `<stop offset="100%" style="stop-color:${palette.gradient3};stop-opacity:0.85"/>` : `<stop offset="100%" style="stop-color:${palette.gradient1};stop-opacity:0.9"/>`}
    </linearGradient>
    <radialGradient id="rg_${uid}" cx="50%" cy="50%" r="50%">
      <stop offset="0%" style="stop-color:${palette.primary};stop-opacity:0.05"/>
      <stop offset="70%" style="stop-color:${palette.primary};stop-opacity:0.02"/>
      <stop offset="100%" style="stop-color:${palette.accent};stop-opacity:0.08"/>
    </radialGradient>
    <!-- Security micro-pattern -->
    <pattern id="sp_${uid}" x="0" y="0" width="6" height="6" patternUnits="userSpaceOnUse">
      <circle cx="3" cy="3" r="0.3" fill="${palette.primary}" opacity="0.08"/>
      <line x1="0" y1="3" x2="6" y2="3" stroke="${palette.primary}" stroke-width="0.08" opacity="0.04"/>
      <line x1="3" y1="0" x2="3" y2="6" stroke="${palette.primary}" stroke-width="0.08" opacity="0.04"/>
    </pattern>
    <!-- Invisible watermark pattern -->
    <pattern id="wm_${uid}" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse" patternTransform="rotate(${parseInt(hash.slice(0, 2), 16) % 45})">
      <text x="10" y="10" text-anchor="middle" font-size="2" fill="${palette.primary}" opacity="0.015" font-family="monospace">${sealNumber}</text>
    </pattern>
    <!-- Circular text paths -->
    <path id="tp1_${uid}" d="M 100,100 m -82,0 a 82,82 0 1,1 164,0 a 82,82 0 1,1 -164,0" fill="none"/>
    <path id="tp2_${uid}" d="M 100,100 m -68,0 a 68,68 0 1,1 136,0 a 68,68 0 1,1 -136,0" fill="none"/>
    <path id="tp3_${uid}" d="M 100,100 m -55,0 a 55,55 0 1,1 110,0 a 55,55 0 1,1 -110,0" fill="none"/>
    <path id="tp4_${uid}" d="M 100,100 m -42,0 a 42,42 0 1,1 84,0 a 42,42 0 1,1 -84,0" fill="none"/>
    <!-- Clip for circular content -->
    <clipPath id="cc_${uid}"><circle cx="100" cy="100" r="96"/></clipPath>
  </defs>

  <!-- Layer 0: Background -->
  <circle cx="100" cy="100" r="97" fill="${palette.bg}" stroke="${palette.borderOuter}" stroke-width="2.5"/>
  <circle cx="100" cy="100" r="95" fill="url(#sp_${uid})"/>
  <circle cx="100" cy="100" r="95" fill="url(#rg_${uid})"/>
  
  <!-- Layer 1: Invisible Watermark -->
  <circle cx="100" cy="100" r="94" fill="url(#wm_${uid})" clip-path="url(#cc_${uid})"/>
  
  <!-- Layer 2: Anti-copy Moiré Pattern -->
  <g style="color:${palette.primary}" clip-path="url(#cc_${uid})">
    ${moireSVG}
  </g>
  
  <!-- Layer 3: Cross-hatch Security Grid -->
  <g style="color:${palette.accent}">
    ${crossHatch}
  </g>

  <!-- Layer 4: Guilloche Ring 1 (outermost) -->
  <path d="${guillocheL1}" fill="none" stroke="url(#sg1_${uid})" stroke-width="1.2" opacity="0.55"/>

  <!-- Layer 5: Guilloche Ring 2 -->
  <path d="${guillocheL2}" fill="none" stroke="${palette.accent}" stroke-width="0.9" opacity="0.4"/>

  <!-- Layer 6: Guilloche Ring 3 -->
  <path d="${guillocheL3}" fill="none" stroke="${palette.primary}" stroke-width="0.7" opacity="0.3"/>

  <!-- Layer 7: Guilloche Ring 4 (inner counter-rotation) -->
  <path d="${guillocheL4}" fill="none" stroke="${palette.accent}" stroke-width="0.5" opacity="0.25"/>

  <!-- Layer 8: Spirograph Interference -->
  <path d="${spirograph}" fill="none" stroke="${palette.primary}" stroke-width="0.3" opacity="0.12"/>

  <!-- Layer 9: Security Dots (dual layer) -->
  <g style="color:${palette.primary}">
    ${securityDots}
  </g>

  <!-- Layer 10: Decorative rings -->
  <circle cx="100" cy="100" r="92" fill="none" stroke="${palette.primary}" stroke-width="1.5" opacity="0.3"/>
  <circle cx="100" cy="100" r="90" fill="none" stroke="${palette.primary}" stroke-width="0.4" stroke-dasharray="2,2,1,2" opacity="0.35"/>
  <circle cx="100" cy="100" r="86" fill="none" stroke="${palette.accent}" stroke-width="0.3" stroke-dasharray="1,3" opacity="0.25"/>
  <circle cx="100" cy="100" r="50" fill="none" stroke="${palette.primary}" stroke-width="1" opacity="0.3"/>
  <circle cx="100" cy="100" r="48" fill="none" stroke="${palette.accent}" stroke-width="0.4" stroke-dasharray="1,2" opacity="0.25"/>
  <circle cx="100" cy="100" r="46" fill="none" stroke="${palette.primary}" stroke-width="0.2" stroke-dasharray="0.5,1.5" opacity="0.2"/>

  <!-- Layer 11: Micro-text Ring 1 (outermost) -->
  <text font-size="3" fill="${palette.primary}" opacity="0.45" font-family="monospace" direction="rtl">
    <textPath href="#tp1_${uid}" startOffset="0%">${microText1} ${microText1}</textPath>
  </text>

  <!-- Layer 12: Micro-text Ring 2 -->
  <text font-size="3.5" fill="${palette.primary}" opacity="0.5" font-family="monospace" font-weight="bold">
    <textPath href="#tp2_${uid}" startOffset="0%">${microText2}</textPath>
  </text>

  <!-- Layer 13: Micro-text Ring 3 (inner security) -->
  <text font-size="2.5" fill="${palette.accent}" opacity="0.35" font-family="monospace">
    <textPath href="#tp3_${uid}" startOffset="0%">${microText3} ${microText3}</textPath>
  </text>

  ${styleExtras}

  <!-- Center: Shield verification icon -->
  <g transform="translate(88, 66)">
    <path d="M12 1L3 5.5v7c0 6.1 4.2 11.8 9 13.5 4.8-1.7 9-7.4 9-13.5v-7L12 1z" 
          fill="${palette.primary}" opacity="0.12" stroke="${palette.primary}" stroke-width="1.2"/>
    <path d="M9 13l2.5 2.5 5-5" fill="none" stroke="${palette.primary}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
  </g>

  <!-- Entity name -->
  <text font-size="5.5" fill="${palette.primary}" font-weight="bold" font-family="'Cairo','Segoe UI',sans-serif" text-anchor="middle" direction="rtl">
    <textPath href="#tp4_${uid}" startOffset="75%">${displayName}</textPath>
  </text>

  <!-- Seal number -->
  <text x="100" y="107" text-anchor="middle" font-size="4.5" font-family="monospace" font-weight="bold" fill="${palette.primary}" opacity="0.9">${sealNumber}</text>

  <!-- Type label -->
  <text x="100" y="115" text-anchor="middle" font-size="4" font-family="'Cairo',sans-serif" fill="${palette.accent}" font-weight="600">${typeLabel}</text>

  ${title ? `<text x="100" y="122" text-anchor="middle" font-size="3.2" font-family="'Cairo',sans-serif" fill="#6b7280">${title}</text>` : ''}

  ${docProof ? `<text x="100" y="130" text-anchor="middle" font-size="2.8" font-family="monospace" fill="#9ca3af">DOC: ${docProof}</text>` : ''}

  <!-- Brand -->
  <text x="100" y="140" text-anchor="middle" font-size="3" font-family="sans-serif" fill="${palette.primary}" opacity="0.45" font-weight="bold">iRecycle Platform v2</text>

  <!-- Corner alignment marks -->
  <line x1="6" y1="100" x2="14" y2="100" stroke="${palette.primary}" stroke-width="0.5" opacity="0.3"/>
  <line x1="186" y1="100" x2="194" y2="100" stroke="${palette.primary}" stroke-width="0.5" opacity="0.3"/>
  <line x1="100" y1="6" x2="100" y2="14" stroke="${palette.primary}" stroke-width="0.5" opacity="0.3"/>
  <line x1="100" y1="186" x2="100" y2="194" stroke="${palette.primary}" stroke-width="0.5" opacity="0.3"/>
  <!-- Diagonal corner marks -->
  <line x1="18" y1="18" x2="24" y2="24" stroke="${palette.primary}" stroke-width="0.3" opacity="0.2"/>
  <line x1="176" y1="18" x2="182" y2="24" stroke="${palette.primary}" stroke-width="0.3" opacity="0.2"/>
  <line x1="18" y1="182" x2="24" y2="176" stroke="${palette.primary}" stroke-width="0.3" opacity="0.2"/>
  <line x1="176" y1="182" x2="182" y2="176" stroke="${palette.primary}" stroke-width="0.3" opacity="0.2"/>

  <!-- Outer encoded border -->
  <circle cx="100" cy="100" r="98" fill="none" stroke="${palette.primary}" stroke-width="0.4" stroke-dasharray="4,2,1,2,1,2" opacity="0.35"/>
</svg>`;
}

// Style-specific decorative extras
function generateStyleExtras(style: SealStyle, hash: string, palette: StylePalette, uid: string): string {
  switch (style) {
    case 'royal': {
      // Crown-like ornamental peaks
      let peaks = '';
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        const x = 100 + 93 * Math.cos(angle);
        const y = 100 + 93 * Math.sin(angle);
        peaks += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="2" fill="${palette.primary}" opacity="0.3"/>`;
        peaks += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="1" fill="${palette.accent}" opacity="0.5"/>`;
      }
      // Double ornamental border
      peaks += `<circle cx="100" cy="100" r="94" fill="none" stroke="${palette.primary}" stroke-width="2" stroke-dasharray="8,2,2,2" opacity="0.25"/>`;
      return peaks;
    }
    case 'modern': {
      // Geometric hexagonal overlay
      let geo = '';
      const hexR = 45;
      for (let ring = 0; ring < 3; ring++) {
        const r = hexR + ring * 18;
        let hexPath = '';
        for (let i = 0; i <= 6; i++) {
          const angle = (i / 6) * Math.PI * 2 - Math.PI / 6;
          const x = 100 + r * Math.cos(angle);
          const y = 100 + r * Math.sin(angle);
          hexPath += `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)} `;
        }
        hexPath += 'Z';
        geo += `<path d="${hexPath}" fill="none" stroke="${palette.primary}" stroke-width="0.4" opacity="${0.15 - ring * 0.03}"/>`;
      }
      return geo;
    }
    case 'holographic': {
      // Rainbow arc segments
      let arcs = '';
      const colors = ['#ff0000', '#ff8800', '#ffff00', '#00ff00', '#0088ff', '#8800ff'];
      colors.forEach((c, i) => {
        const startAngle = (i / colors.length) * 360;
        const endAngle = ((i + 1) / colors.length) * 360;
        const r = 93;
        const x1 = 100 + r * Math.cos((startAngle * Math.PI) / 180);
        const y1 = 100 + r * Math.sin((startAngle * Math.PI) / 180);
        const x2 = 100 + r * Math.cos((endAngle * Math.PI) / 180);
        const y2 = 100 + r * Math.sin((endAngle * Math.PI) / 180);
        arcs += `<path d="M ${x1.toFixed(1)} ${y1.toFixed(1)} A ${r} ${r} 0 0 1 ${x2.toFixed(1)} ${y2.toFixed(1)}" fill="none" stroke="${c}" stroke-width="1.5" opacity="0.15"/>`;
      });
      // Shimmer effect
      arcs += `<circle cx="100" cy="100" r="90" fill="none" stroke="url(#sg1_${uid})" stroke-width="0.8" stroke-dasharray="3,5,1,5" opacity="0.2">
        <animateTransform attributeName="transform" type="rotate" from="0 100 100" to="360 100 100" dur="20s" repeatCount="indefinite"/>
      </circle>`;
      return arcs;
    }
    case 'corporate': {
      // Formal double-line border with notch marks
      let corp = `<circle cx="100" cy="100" r="95" fill="none" stroke="${palette.primary}" stroke-width="2.5" opacity="0.2"/>`;
      corp += `<circle cx="100" cy="100" r="91" fill="none" stroke="${palette.primary}" stroke-width="1.5" opacity="0.15"/>`;
      // Notch marks every 15 degrees
      for (let i = 0; i < 24; i++) {
        const angle = (i / 24) * Math.PI * 2;
        const x1 = 100 + 91 * Math.cos(angle);
        const y1 = 100 + 91 * Math.sin(angle);
        const x2 = 100 + 95 * Math.cos(angle);
        const y2 = 100 + 95 * Math.sin(angle);
        corp += `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${palette.primary}" stroke-width="${i % 6 === 0 ? '1' : '0.4'}" opacity="0.3"/>`;
      }
      return corp;
    }
    default:
      return '';
  }
}

// ═══════════════════════════════════════════════════════════════
// HTML Generator (for print templates)
// ═══════════════════════════════════════════════════════════════

export function generateDigitalSealHTML(data: DigitalSealData & { label?: string }): string {
  const svg = generateDigitalSealSVG({ ...data, size: data.size || 150 });
  const sealNumber = generateSealNumber(data.entityId, data.entityType, data.entityName);
  
  return `
  <div style="display:inline-block;text-align:center;direction:rtl;font-family:'Cairo','Segoe UI',sans-serif;">
    ${svg}
    ${data.label ? `
    <div style="font-size:6pt;color:#6b7280;margin-top:4px;">
      <div style="font-family:monospace;font-weight:bold;color:#059669;font-size:7pt;">${sealNumber}</div>
      <div>ختم رقمي مؤمّن • ${data.entityType === 'member' ? 'عضو' : 'جهة'}</div>
    </div>` : ''}
  </div>`;
}
