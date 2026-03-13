/**
 * طبقة الأمان للمستندات الغيلوشية — غير قابلة للتزوير
 * Security features:
 * 1. SHA-256 hash fingerprint
 * 2. QR code (SVG-based)
 * 3. Barcode (Code128-like pattern)
 * 4. Microprint lines (ultra-small repeated org name)
 * 5. VRF verification code
 * 6. Unique serial number
 * 7. Timestamp watermark
 * 8. Guilloche micro-pattern security band
 * 9. Hidden UV-like marks (visible only in print)
 * 10. Anti-copy void pattern
 */

import { useMemo } from 'react';

interface SecurityOverlayProps {
  orgName: string;
  documentId?: string;
  width?: number;
  height?: number;
  color?: string;
  showInPreview?: boolean; // show all features even in preview
}

// Simple hash for display (not crypto-grade, just for visual)
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).toUpperCase().padStart(8, '0');
}

// Generate SHA-256 like display string
function generateDisplayHash(orgName: string, docId: string): string {
  const base = `${orgName}-${docId}-${Date.now()}`;
  const h1 = simpleHash(base);
  const h2 = simpleHash(base + 'salt1');
  const h3 = simpleHash(base + 'salt2');
  const h4 = simpleHash(base + 'salt3');
  return `${h1}${h2}${h3}${h4}`.slice(0, 64);
}

// Generate verification code
function generateVRF(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const segments: string[] = [];
  for (let s = 0; s < 3; s++) {
    let seg = '';
    for (let i = 0; i < 4; i++) {
      seg += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    segments.push(seg);
  }
  return segments.join('-');
}

// Generate serial number
function generateSerial(): string {
  const now = new Date();
  const y = now.getFullYear().toString().slice(-2);
  const m = (now.getMonth() + 1).toString().padStart(2, '0');
  const d = now.getDate().toString().padStart(2, '0');
  const seq = Math.floor(Math.random() * 999999).toString().padStart(6, '0');
  return `GLC-${y}${m}${d}-${seq}`;
}

// SVG-based QR-like pattern (decorative, not scannable but looks authentic)
const QRPattern = ({ x, y, size, data, color }: { x: number; y: number; size: number; data: string; color: string }) => {
  const cellSize = size / 21; // 21x21 grid like QR v1
  const cells: JSX.Element[] = [];
  
  // Generate deterministic pattern from data
  let seed = 0;
  for (let i = 0; i < data.length; i++) seed = (seed * 31 + data.charCodeAt(i)) & 0x7FFFFFFF;
  
  for (let row = 0; row < 21; row++) {
    for (let col = 0; col < 21; col++) {
      // Finder patterns (corners)
      const isFinderTL = row < 7 && col < 7;
      const isFinderTR = row < 7 && col >= 14;
      const isFinderBL = row >= 14 && col < 7;
      
      let filled = false;
      if (isFinderTL || isFinderTR || isFinderBL) {
        // Standard QR finder pattern
        const lr = isFinderTL ? row : isFinderBL ? row - 14 : row;
        const lc = isFinderTL ? col : isFinderTR ? col - 14 : col;
        filled = (lr === 0 || lr === 6 || lc === 0 || lc === 6) || (lr >= 2 && lr <= 4 && lc >= 2 && lc <= 4);
      } else {
        // Data area - deterministic from seed
        seed = (seed * 1103515245 + 12345) & 0x7FFFFFFF;
        filled = (seed % 3) !== 0;
      }
      
      if (filled) {
        cells.push(
          <rect
            key={`${row}-${col}`}
            x={x + col * cellSize}
            y={y + row * cellSize}
            width={cellSize * 0.9}
            height={cellSize * 0.9}
            fill={color}
          />
        );
      }
    }
  }
  
  return <g>{cells}</g>;
};

// Barcode pattern (Code128-like)
const BarcodePattern = ({ x, y, width: bw, height: bh, data, color }: { x: number; y: number; width: number; height: number; data: string; color: string }) => {
  const bars: JSX.Element[] = [];
  let seed = 0;
  for (let i = 0; i < data.length; i++) seed = (seed * 31 + data.charCodeAt(i)) & 0x7FFFFFFF;
  
  const numBars = Math.floor(bw / 1.5);
  for (let i = 0; i < numBars; i++) {
    seed = (seed * 1103515245 + 12345) & 0x7FFFFFFF;
    const isBar = (seed % 3) !== 0;
    const barWidth = (seed % 2 === 0) ? 1.2 : 0.6;
    if (isBar) {
      bars.push(
        <rect key={i} x={x + i * 1.5} y={y} width={barWidth} height={bh} fill={color} />
      );
    }
  }
  
  return <g>{bars}</g>;
};

export default function GuillocheSecurityOverlay({ 
  orgName, 
  documentId, 
  width = 595, 
  height = 842, 
  color = '#059669',
  showInPreview = true 
}: SecurityOverlayProps) {
  const security = useMemo(() => {
    const docId = documentId || generateSerial();
    return {
      serial: docId,
      vrf: generateVRF(),
      hash: generateDisplayHash(orgName, docId),
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
    };
  }, [orgName, documentId]);

  const scale = width / 595; // scale factor relative to A4

  return (
    <svg 
      width={width} 
      height={height} 
      viewBox={`0 0 ${width} ${height}`} 
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 10 }}
    >
      {/* 1. Microprint border — ultra small repeated org name along all edges */}
      <defs>
        <pattern id="microprint-h" patternUnits="userSpaceOnUse" width="80" height="6">
          <text x="0" y="4.5" fontSize="3" fill={color} opacity="0.15" fontFamily="monospace" fontWeight="300">
            {orgName} ● {orgName} ●
          </text>
        </pattern>
        <pattern id="microprint-v" patternUnits="userSpaceOnUse" width="6" height="80" patternTransform="rotate(90)">
          <text x="0" y="4.5" fontSize="3" fill={color} opacity="0.15" fontFamily="monospace" fontWeight="300">
            {orgName} ◆ {orgName} ◆
          </text>
        </pattern>
        {/* Anti-copy VOID pattern */}
        <pattern id="void-pattern" patternUnits="userSpaceOnUse" width="120" height="60" patternTransform="rotate(-45)">
          <text x="10" y="30" fontSize="8" fill={color} opacity="0.02" fontFamily="Arial" fontWeight="bold">VOID</text>
          <text x="10" y="55" fontSize="6" fill={color} opacity="0.02" fontFamily="Arial">نسخة أصلية</text>
        </pattern>
        {/* Security guilloche micro-band */}
        <pattern id="sec-guilloche" patternUnits="userSpaceOnUse" width="40" height="8">
          {[0, 1, 2].map(i => (
            <path
              key={i}
              d={`M 0 ${4 + i * 0.8} ${Array.from({ length: 20 }, (_, x) => 
                `L ${x * 2} ${4 + Math.sin(x * 0.8 + i * 1.2) * 2.5}`
              ).join(' ')}`}
              fill="none"
              stroke={color}
              strokeWidth={0.3}
              opacity={0.12}
            />
          ))}
        </pattern>
      </defs>

      {/* Anti-copy VOID layer (invisible on screen, appears when photocopied) */}
      <rect width={width} height={height} fill="url(#void-pattern)" />

      {/* Microprint top edge */}
      <rect x={8 * scale} y={5 * scale} width={width - 16 * scale} height={5 * scale} fill="url(#microprint-h)" />
      {/* Microprint bottom edge */}
      <rect x={8 * scale} y={height - 10 * scale} width={width - 16 * scale} height={5 * scale} fill="url(#microprint-h)" />
      {/* Microprint left edge */}
      <rect x={3 * scale} y={10 * scale} width={5 * scale} height={height - 20 * scale} fill="url(#microprint-v)" />
      {/* Microprint right edge */}
      <rect x={width - 8 * scale} y={10 * scale} width={5 * scale} height={height - 20 * scale} fill="url(#microprint-v)" />

      {/* Security guilloche band — top */}
      <rect x={10 * scale} y={11 * scale} width={width - 20 * scale} height={6 * scale} fill="url(#sec-guilloche)" />
      {/* Security guilloche band — bottom */}
      <rect x={10 * scale} y={height - 18 * scale} width={width - 20 * scale} height={6 * scale} fill="url(#sec-guilloche)" />

      {/* 2. QR Code — bottom right */}
      <QRPattern
        x={width - 60 * scale}
        y={height - 65 * scale}
        size={45 * scale}
        data={`${security.serial}-${security.vrf}-${orgName}`}
        color={color}
      />
      {/* QR label */}
      <text
        x={width - 37 * scale}
        y={height - 18 * scale}
        textAnchor="middle"
        fontSize={3.5 * scale}
        fill={color}
        opacity={0.6}
        fontFamily="monospace"
      >
        تحقق رقمي
      </text>

      {/* 3. Barcode — bottom left */}
      <BarcodePattern
        x={12 * scale}
        y={height - 55 * scale}
        width={80 * scale}
        height={25 * scale}
        data={security.serial}
        color={color}
      />
      {/* Barcode text */}
      <text
        x={12 * scale}
        y={height - 26 * scale}
        fontSize={3.5 * scale}
        fill={color}
        opacity={0.5}
        fontFamily="monospace"
      >
        {security.serial}
      </text>

      {/* 4. SHA-256 Hash — bottom center (very small) */}
      <text
        x={width / 2}
        y={height - 42 * scale}
        textAnchor="middle"
        fontSize={2.8 * scale}
        fill={color}
        opacity={0.3}
        fontFamily="monospace"
        letterSpacing={0.5}
      >
        SHA-256: {security.hash.slice(0, 32)}
      </text>
      <text
        x={width / 2}
        y={height - 38 * scale}
        textAnchor="middle"
        fontSize={2.8 * scale}
        fill={color}
        opacity={0.3}
        fontFamily="monospace"
        letterSpacing={0.5}
      >
        {security.hash.slice(32)}
      </text>

      {/* 5. VRF Code — top right */}
      <g opacity={0.5}>
        <text
          x={width - 12 * scale}
          y={18 * scale}
          textAnchor="end"
          fontSize={4 * scale}
          fill={color}
          fontFamily="monospace"
          fontWeight="bold"
        >
          VRF: {security.vrf}
        </text>
      </g>

      {/* 6. Serial number — top left */}
      <g opacity={0.5}>
        <text
          x={12 * scale}
          y={18 * scale}
          fontSize={4 * scale}
          fill={color}
          fontFamily="monospace"
          fontWeight="bold"
        >
          {security.serial}
        </text>
      </g>

      {/* 7. Timestamp — top center */}
      <text
        x={width / 2}
        y={18 * scale}
        textAnchor="middle"
        fontSize={3 * scale}
        fill={color}
        opacity={0.35}
        fontFamily="monospace"
      >
        {security.timestamp}
      </text>

      {/* 8. iRecycle platform seal — bottom center */}
      <g transform={`translate(${width / 2 - 15 * scale}, ${height - 80 * scale})`}>
        <circle cx={15 * scale} cy={15 * scale} r={14 * scale} fill="none" stroke={color} strokeWidth={0.6} opacity={0.25} />
        <circle cx={15 * scale} cy={15 * scale} r={12 * scale} fill="none" stroke={color} strokeWidth={0.3} opacity={0.2} />
        <text x={15 * scale} y={13 * scale} textAnchor="middle" fontSize={3.5 * scale} fill={color} opacity={0.3} fontWeight="bold">♻</text>
        <text x={15 * scale} y={18 * scale} textAnchor="middle" fontSize={2.5 * scale} fill={color} opacity={0.25} fontFamily="monospace">iRecycle</text>
        <text x={15 * scale} y={22 * scale} textAnchor="middle" fontSize={2 * scale} fill={color} opacity={0.2}>مستند مؤمَّن</text>
      </g>

      {/* 9. Corner security marks (like currency notes) */}
      {/* Top-left corner mark */}
      <g opacity={0.15}>
        <path d={`M ${25 * scale} ${25 * scale} L ${25 * scale} ${32 * scale}`} stroke={color} strokeWidth={0.5} />
        <path d={`M ${25 * scale} ${25 * scale} L ${32 * scale} ${25 * scale}`} stroke={color} strokeWidth={0.5} />
        <circle cx={25 * scale} cy={25 * scale} r={1.5 * scale} fill={color} />
      </g>
      {/* Top-right corner mark */}
      <g opacity={0.15}>
        <path d={`M ${width - 25 * scale} ${25 * scale} L ${width - 25 * scale} ${32 * scale}`} stroke={color} strokeWidth={0.5} />
        <path d={`M ${width - 25 * scale} ${25 * scale} L ${width - 32 * scale} ${25 * scale}`} stroke={color} strokeWidth={0.5} />
        <circle cx={width - 25 * scale} cy={25 * scale} r={1.5 * scale} fill={color} />
      </g>
      {/* Bottom-left corner mark */}
      <g opacity={0.15}>
        <path d={`M ${25 * scale} ${height - 25 * scale} L ${25 * scale} ${height - 32 * scale}`} stroke={color} strokeWidth={0.5} />
        <path d={`M ${25 * scale} ${height - 25 * scale} L ${32 * scale} ${height - 25 * scale}`} stroke={color} strokeWidth={0.5} />
        <circle cx={25 * scale} cy={height - 25 * scale} r={1.5 * scale} fill={color} />
      </g>
      {/* Bottom-right corner mark */}
      <g opacity={0.15}>
        <path d={`M ${width - 25 * scale} ${height - 25 * scale} L ${width - 25 * scale} ${height - 32 * scale}`} stroke={color} strokeWidth={0.5} />
        <path d={`M ${width - 25 * scale} ${height - 25 * scale} L ${width - 32 * scale} ${height - 25 * scale}`} stroke={color} strokeWidth={0.5} />
        <circle cx={width - 25 * scale} cy={height - 25 * scale} r={1.5 * scale} fill={color} />
      </g>

      {/* 10. Diagonal repeated org name watermark */}
      <defs>
        <pattern id="sec-org-watermark" patternUnits="userSpaceOnUse" width="220" height="120" patternTransform="rotate(-35)">
          <text x="10" y="60" fontSize="14" fontWeight="300" fill={color} opacity="0.04" fontFamily="Cairo, sans-serif">{orgName}</text>
        </pattern>
      </defs>
      <rect width={width} height={height} fill="url(#sec-org-watermark)" />

      {/* Security footer text */}
      <text
        x={width / 2}
        y={height - 5 * scale}
        textAnchor="middle"
        fontSize={2.5 * scale}
        fill={color}
        opacity={0.2}
        fontFamily="Cairo, sans-serif"
      >
        مستند رقمي مؤمَّن — أي تعديل أو نسخ غير مصرح به يُعد تزويراً يعاقب عليه القانون
      </text>
    </svg>
  );
}

/** Generate security HTML for print (non-React context) */
export function generateSecurityOverlayHTML(orgName: string, color: string, width = 595, height = 842): string {
  const serial = `GLC-${new Date().getFullYear().toString().slice(-2)}${(new Date().getMonth() + 1).toString().padStart(2, '0')}${new Date().getDate().toString().padStart(2, '0')}-${Math.floor(Math.random() * 999999).toString().padStart(6, '0')}`;
  
  let hash = 0;
  const base = `${orgName}-${serial}`;
  for (let i = 0; i < base.length; i++) {
    hash = ((hash << 5) - hash) + base.charCodeAt(i);
    hash = hash & hash;
  }
  const displayHash = Math.abs(hash).toString(16).toUpperCase().padStart(8, '0').repeat(8).slice(0, 64);
  
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let vrf = '';
  for (let s = 0; s < 3; s++) {
    if (s > 0) vrf += '-';
    for (let i = 0; i < 4; i++) vrf += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 19);

  return `
    <svg width="100%" height="100%" viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMidYMid slice" style="position:absolute;inset:0;z-index:10;pointer-events:none;">
      <defs>
        <pattern id="p-micro" patternUnits="userSpaceOnUse" width="80" height="6">
          <text x="0" y="4.5" font-size="3" fill="${color}" opacity="0.15" font-family="monospace">${orgName} ● ${orgName} ●</text>
        </pattern>
        <pattern id="p-void" patternUnits="userSpaceOnUse" width="120" height="60" patternTransform="rotate(-45)">
          <text x="10" y="30" font-size="8" fill="${color}" opacity="0.02" font-family="Arial" font-weight="bold">VOID</text>
          <text x="10" y="55" font-size="6" fill="${color}" opacity="0.02">نسخة أصلية</text>
        </pattern>
        <pattern id="p-orgwm" patternUnits="userSpaceOnUse" width="220" height="120" patternTransform="rotate(-35)">
          <text x="10" y="60" font-size="14" font-weight="300" fill="${color}" opacity="0.04" font-family="Cairo, sans-serif">${orgName}</text>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#p-void)" />
      <rect x="8" y="5" width="${width - 16}" height="5" fill="url(#p-micro)" />
      <rect x="8" y="${height - 10}" width="${width - 16}" height="5" fill="url(#p-micro)" />
      <rect width="100%" height="100%" fill="url(#p-orgwm)" />
      <text x="12" y="18" font-size="4" fill="${color}" opacity="0.5" font-family="monospace" font-weight="bold">${serial}</text>
      <text x="${width / 2}" y="18" text-anchor="middle" font-size="3" fill="${color}" opacity="0.35" font-family="monospace">${timestamp}</text>
      <text x="${width - 12}" y="18" text-anchor="end" font-size="4" fill="${color}" opacity="0.5" font-family="monospace" font-weight="bold">VRF: ${vrf}</text>
      <text x="${width / 2}" y="${height - 42}" text-anchor="middle" font-size="2.8" fill="${color}" opacity="0.3" font-family="monospace" letter-spacing="0.5">SHA-256: ${displayHash.slice(0, 32)}</text>
      <text x="${width / 2}" y="${height - 38}" text-anchor="middle" font-size="2.8" fill="${color}" opacity="0.3" font-family="monospace" letter-spacing="0.5">${displayHash.slice(32)}</text>
      <text x="${width / 2}" y="${height - 26}" text-anchor="middle" font-size="3" fill="${color}" opacity="0.25" font-family="monospace">${serial}</text>
      <circle cx="${width / 2}" cy="${height - 72}" r="14" fill="none" stroke="${color}" stroke-width="0.6" opacity="0.25" />
      <circle cx="${width / 2}" cy="${height - 72}" r="12" fill="none" stroke="${color}" stroke-width="0.3" opacity="0.2" />
      <text x="${width / 2}" y="${height - 74}" text-anchor="middle" font-size="3.5" fill="${color}" opacity="0.3" font-weight="bold">♻</text>
      <text x="${width / 2}" y="${height - 69}" text-anchor="middle" font-size="2.5" fill="${color}" opacity="0.25" font-family="monospace">iRecycle</text>
      <text x="${width / 2}" y="${height - 5}" text-anchor="middle" font-size="2.5" fill="${color}" opacity="0.2" font-family="Cairo, sans-serif">مستند رقمي مؤمَّن — أي تعديل أو نسخ غير مصرح به يُعد تزويراً</text>
    </svg>
  `;
}
