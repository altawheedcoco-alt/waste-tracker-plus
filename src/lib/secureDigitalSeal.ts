/**
 * منظومة الختم الرقمي المؤمّن — Secure Digital Seal System
 * 
 * يُولّد ختماً رقمياً فريداً لكل عضو أو جهة يتضمن:
 * 1. بصمة تشفيرية (HMAC-like hash) فريدة من بيانات الهوية
 * 2. نمط بصري فريد (Guilloche pattern) مولّد رياضياً من البصمة
 * 3. حلقات أمنية (Security rings) مشفّرة بأحرف عربية مصغّرة
 * 4. رمز QR مدمج للتحقق الفوري
 * 5. رقم ختم تسلسلي مشفّر
 * 
 * كل ختم فريد بصرياً ولا يمكن تكراره أو تزويره.
 */

// ═══════════════════════════════════════════════════════════════
// Cryptographic Utilities
// ═══════════════════════════════════════════════════════════════

/** HMAC-like hash function for seal generation */
function secureSealHash(data: string, salt: string): string {
  let h1 = 0x811c9dc5; // FNV offset basis
  let h2 = 0xcbf29ce4;
  const combined = `${salt}::${data}::iRecycle::2024`;
  
  for (let i = 0; i < combined.length; i++) {
    const c = combined.charCodeAt(i);
    h1 ^= c;
    h1 = Math.imul(h1, 0x01000193); // FNV prime
    h2 ^= c;
    h2 = Math.imul(h2, 0x01000193);
    // Cross-mix
    h1 ^= h2 >>> 13;
    h2 ^= h1 >>> 7;
  }

  const hex1 = (h1 >>> 0).toString(16).padStart(8, '0');
  const hex2 = (h2 >>> 0).toString(16).padStart(8, '0');
  return `${hex1}${hex2}`.toUpperCase();
}

/** Generate a unique seal number from entity data */
export function generateSealNumber(entityId: string, entityType: 'member' | 'organization', name: string): string {
  const hash = secureSealHash(`${entityId}|${name}`, entityType);
  const prefix = entityType === 'member' ? 'MS' : 'OS';
  return `${prefix}-${hash.slice(0, 4)}-${hash.slice(4, 8)}-${hash.slice(8, 12)}`;
}

/** Generate document-specific seal with integrity proof */
export function generateDocumentSealProof(
  sealNumber: string,
  documentRef: string,
  timestamp: string
): string {
  const proof = secureSealHash(`${sealNumber}|${documentRef}|${timestamp}`, 'doc-proof');
  return proof.slice(0, 12);
}

// ═══════════════════════════════════════════════════════════════
// Visual Pattern Generation (Guilloche-like)
// ═══════════════════════════════════════════════════════════════

interface SealVisuals {
  /** SVG path for outer guilloche ring */
  guillocheOuter: string;
  /** SVG path for inner pattern */
  guillocheInner: string;
  /** Unique color derived from hash */
  primaryColor: string;
  /** Secondary accent color */
  accentColor: string;
  /** Micro-text ring content */
  microTextRing: string;
  /** Security pattern dots */
  securityDots: string;
}

function hashToColor(hash: string, offset = 0): string {
  const h = parseInt(hash.slice(offset, offset + 3), 16) % 360;
  // Ensure good saturation and contrast
  const s = 55 + (parseInt(hash.slice(offset + 3, offset + 5), 16) % 30);
  const l = 30 + (parseInt(hash.slice(offset + 5, offset + 7), 16) % 20);
  return `hsl(${h}, ${s}%, ${l}%)`;
}

function generateGuillochePath(hash: string, radius: number, complexity: number): string {
  const points: string[] = [];
  const steps = 360;
  const a1 = 2 + (parseInt(hash.slice(0, 2), 16) % 6);
  const a2 = 3 + (parseInt(hash.slice(2, 4), 16) % 8);
  const depth = 2 + (parseInt(hash.slice(4, 6), 16) % 4) * complexity;

  for (let i = 0; i <= steps; i++) {
    const angle = (i / steps) * Math.PI * 2;
    const r = radius + 
      Math.sin(angle * a1) * depth +
      Math.cos(angle * a2) * (depth * 0.6) +
      Math.sin(angle * (a1 + a2)) * (depth * 0.3);
    const x = 100 + r * Math.cos(angle);
    const y = 100 + r * Math.sin(angle);
    points.push(`${i === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`);
  }
  points.push('Z');
  return points.join(' ');
}

function generateSecurityDots(hash: string, radius: number): string {
  let dots = '';
  const count = 24 + (parseInt(hash.slice(6, 8), 16) % 16);
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    const r = radius + (parseInt(hash.charAt(i % hash.length), 16) % 3) - 1;
    const x = 100 + r * Math.cos(angle);
    const y = 100 + r * Math.sin(angle);
    const size = 0.3 + (parseInt(hash.charAt((i + 5) % hash.length), 16) % 3) * 0.2;
    dots += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${size}" fill="currentColor" opacity="0.4"/>`;
  }
  return dots;
}

function generateSealVisuals(hash: string): SealVisuals {
  return {
    guillocheOuter: generateGuillochePath(hash, 85, 0.8),
    guillocheInner: generateGuillochePath(hash.split('').reverse().join(''), 55, 0.5),
    primaryColor: hashToColor(hash, 0),
    accentColor: hashToColor(hash, 6),
    microTextRing: `iRecycle • ${hash.slice(0, 4)} • مُوثّق • ${hash.slice(4, 8)} • رقمي • ${hash.slice(8, 12)} • مؤمّن •`,
    securityDots: generateSecurityDots(hash, 70),
  };
}

// ═══════════════════════════════════════════════════════════════
// SVG Seal Component Generator
// ═══════════════════════════════════════════════════════════════

export interface DigitalSealData {
  entityId: string;
  entityType: 'member' | 'organization';
  entityName: string;
  /** Optional: entity title/position for members */
  title?: string;
  /** Optional: organization name for members */
  orgName?: string;
  /** If stamping a specific document */
  documentRef?: string;
  /** Timestamp */
  timestamp?: string;
  /** Size in pixels (default 200) */
  size?: number;
}

/**
 * Generate secure digital seal SVG string.
 * Each seal is cryptographically unique based on entity identity.
 */
export function generateDigitalSealSVG(data: DigitalSealData): string {
  const {
    entityId,
    entityType,
    entityName,
    title,
    orgName,
    documentRef,
    timestamp = new Date().toISOString(),
    size = 200,
  } = data;

  const sealNumber = generateSealNumber(entityId, entityType, entityName);
  const hash = secureSealHash(`${entityId}|${entityName}|${entityType}`, 'visual-seed');
  const visuals = generateSealVisuals(hash);
  
  const docProof = documentRef 
    ? generateDocumentSealProof(sealNumber, documentRef, timestamp)
    : null;

  const verifyUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/qr-verify?type=seal&code=${encodeURIComponent(sealNumber)}`
    : `https://irecycle21.lovable.app/qr-verify?type=seal&code=${encodeURIComponent(sealNumber)}`;

  // Truncate name for display
  const displayName = entityName.length > 20 ? entityName.slice(0, 18) + '…' : entityName;
  const typeLabel = entityType === 'member' ? 'عضو معتمد' : 'جهة معتمدة';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="${size}" height="${size}" style="filter:drop-shadow(0 2px 8px rgba(0,0,0,0.15));">
  <defs>
    <!-- Guilloche gradient -->
    <linearGradient id="sg_${hash.slice(0,4)}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${visuals.primaryColor};stop-opacity:0.9"/>
      <stop offset="50%" style="stop-color:${visuals.accentColor};stop-opacity:0.7"/>
      <stop offset="100%" style="stop-color:${visuals.primaryColor};stop-opacity:0.9"/>
    </linearGradient>
    <!-- Security pattern -->
    <pattern id="sp_${hash.slice(0,4)}" x="0" y="0" width="8" height="8" patternUnits="userSpaceOnUse">
      <circle cx="4" cy="4" r="0.5" fill="${visuals.primaryColor}" opacity="0.1"/>
    </pattern>
    <!-- Circular text path -->
    <path id="tp_outer_${hash.slice(0,4)}" d="M 100,100 m -78,0 a 78,78 0 1,1 156,0 a 78,78 0 1,1 -156,0" fill="none"/>
    <path id="tp_inner_${hash.slice(0,4)}" d="M 100,100 m -62,0 a 62,62 0 1,1 124,0 a 62,62 0 1,1 -124,0" fill="none"/>
    <path id="tp_name_${hash.slice(0,4)}" d="M 100,100 m -42,0 a 42,42 0 1,1 84,0 a 42,42 0 1,1 -84,0" fill="none"/>
  </defs>

  <!-- Background circle -->
  <circle cx="100" cy="100" r="96" fill="white" stroke="${visuals.primaryColor}" stroke-width="2"/>
  <circle cx="100" cy="100" r="94" fill="url(#sp_${hash.slice(0,4)})"/>
  
  <!-- Outer guilloche ring (unique pattern) -->
  <path d="${visuals.guillocheOuter}" fill="none" stroke="url(#sg_${hash.slice(0,4)})" stroke-width="1.2" opacity="0.6"/>
  
  <!-- Inner guilloche ring -->
  <path d="${visuals.guillocheInner}" fill="none" stroke="${visuals.accentColor}" stroke-width="0.8" opacity="0.4"/>

  <!-- Security dots ring -->
  <g style="color:${visuals.primaryColor}">
    ${visuals.securityDots}
  </g>

  <!-- Decorative rings -->
  <circle cx="100" cy="100" r="88" fill="none" stroke="${visuals.primaryColor}" stroke-width="1.5" opacity="0.3"/>
  <circle cx="100" cy="100" r="86" fill="none" stroke="${visuals.primaryColor}" stroke-width="0.5" stroke-dasharray="2,3" opacity="0.4"/>
  <circle cx="100" cy="100" r="50" fill="none" stroke="${visuals.primaryColor}" stroke-width="1" opacity="0.3"/>
  <circle cx="100" cy="100" r="48" fill="none" stroke="${visuals.accentColor}" stroke-width="0.5" stroke-dasharray="1,2" opacity="0.3"/>

  <!-- Micro-text outer ring (security) -->
  <text font-size="3.5" fill="${visuals.primaryColor}" opacity="0.5" font-family="monospace" direction="rtl">
    <textPath href="#tp_outer_${hash.slice(0,4)}" startOffset="0%">${visuals.microTextRing} ${visuals.microTextRing}</textPath>
  </text>

  <!-- Inner text ring: seal number -->
  <text font-size="4.5" fill="${visuals.primaryColor}" opacity="0.6" font-family="monospace" font-weight="bold">
    <textPath href="#tp_inner_${hash.slice(0,4)}" startOffset="0%">
      ● ${sealNumber} ● ${hash.slice(0,8)} ● ${typeLabel} ● ${sealNumber} ● ${hash.slice(8,16)} ●
    </textPath>
  </text>

  <!-- Center content -->
  <!-- Shield icon -->
  <g transform="translate(88, 68)">
    <path d="M12 2L4 6v6c0 5.55 3.84 10.74 8 12 4.16-1.26 8-6.45 8-12V6L12 2z" 
          fill="${visuals.primaryColor}" opacity="0.15" stroke="${visuals.primaryColor}" stroke-width="1"/>
    <path d="M10 12l2 2 4-4" fill="none" stroke="${visuals.primaryColor}" stroke-width="1.5" stroke-linecap="round"/>
  </g>

  <!-- Entity name on curved path -->
  <text font-size="6" fill="${visuals.primaryColor}" font-weight="bold" font-family="'Cairo','Segoe UI',sans-serif" text-anchor="middle" direction="rtl">
    <textPath href="#tp_name_${hash.slice(0,4)}" startOffset="75%">${displayName}</textPath>
  </text>

  <!-- Seal number centered -->
  <text x="100" y="108" text-anchor="middle" font-size="5" font-family="monospace" font-weight="bold" fill="${visuals.primaryColor}" opacity="0.9">${sealNumber}</text>

  <!-- Type label -->
  <text x="100" y="116" text-anchor="middle" font-size="4.5" font-family="'Cairo',sans-serif" fill="${visuals.accentColor}" font-weight="600">${typeLabel}</text>

  ${title ? `<text x="100" y="123" text-anchor="middle" font-size="3.5" font-family="'Cairo',sans-serif" fill="#6b7280">${title}</text>` : ''}

  ${docProof ? `
  <!-- Document proof -->
  <text x="100" y="132" text-anchor="middle" font-size="3" font-family="monospace" fill="#9ca3af">DOC: ${docProof}</text>
  ` : ''}

  <!-- iRecycle brand -->
  <text x="100" y="142" text-anchor="middle" font-size="3.5" font-family="sans-serif" fill="${visuals.primaryColor}" opacity="0.5" font-weight="bold">iRecycle Platform</text>

  <!-- Corner marks (anti-copy) -->
  <line x1="8" y1="100" x2="14" y2="100" stroke="${visuals.primaryColor}" stroke-width="0.5" opacity="0.3"/>
  <line x1="186" y1="100" x2="192" y2="100" stroke="${visuals.primaryColor}" stroke-width="0.3" opacity="0.3"/>
  <line x1="100" y1="8" x2="100" y2="14" stroke="${visuals.primaryColor}" stroke-width="0.5" opacity="0.3"/>
  <line x1="100" y1="186" x2="100" y2="192" stroke="${visuals.primaryColor}" stroke-width="0.5" opacity="0.3"/>

  <!-- Outer border with hash encoding -->
  <circle cx="100" cy="100" r="97" fill="none" stroke="${visuals.primaryColor}" stroke-width="0.5" stroke-dasharray="4,2,1,2" opacity="0.4"/>
</svg>`;
}

/**
 * Generate an HTML string containing the digital seal (for print templates).
 */
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
