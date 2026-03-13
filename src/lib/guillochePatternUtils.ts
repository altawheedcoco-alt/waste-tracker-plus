/**
 * Shared Guilloche pattern utilities — used by GuillochePatterns page AND print system.
 */

// Color palettes
export const GUILLOCHE_COLOR_PALETTES = [
  { id: 'green', name: 'أخضر بيئي', primary: '#059669', secondary: '#34d399', bg: '#ecfdf5' },
  { id: 'blue', name: 'أزرق مائي', primary: '#0284c7', secondary: '#38bdf8', bg: '#f0f9ff' },
  { id: 'purple', name: 'بنفسجي ملكي', primary: '#7c3aed', secondary: '#a78bfa', bg: '#f5f3ff' },
  { id: 'gold', name: 'ذهبي فاخر', primary: '#b45309', secondary: '#fbbf24', bg: '#fffbeb' },
  { id: 'red', name: 'أحمر رسمي', primary: '#dc2626', secondary: '#f87171', bg: '#fef2f2' },
  { id: 'teal', name: 'أخضر مائي', primary: '#0d9488', secondary: '#2dd4bf', bg: '#f0fdfa' },
  { id: 'slate', name: 'رمادي احترافي', primary: '#475569', secondary: '#94a3b8', bg: '#f8fafc' },
  { id: 'emerald', name: 'زمردي', primary: '#047857', secondary: '#6ee7b7', bg: '#ecfdf5' },
];

export interface PatternConfig {
  id: string;
  name: string;
  category: string;
  categoryName: string;
  patternType: string;
  colorPalette: typeof GUILLOCHE_COLOR_PALETTES[0];
  complexity: string;
  density: string;
  rotation: number;
  scale: number;
  opacity: number;
  strokeWidth: number;
  seed: number;
}

/** Serializable version stored in preferences */
export interface SavedPatternRef {
  id: string;
  patternType: string;
  colorPaletteId: string;
  rotation: number;
  scale: number;
  opacity: number;
  strokeWidth: number;
  seed: number;
  category: string;
}

export function patternToRef(p: PatternConfig): SavedPatternRef {
  return {
    id: p.id,
    patternType: p.patternType,
    colorPaletteId: p.colorPalette.id,
    rotation: p.rotation,
    scale: p.scale,
    opacity: p.opacity,
    strokeWidth: p.strokeWidth,
    seed: p.seed,
    category: p.category,
  };
}

export function refToPattern(ref: SavedPatternRef): PatternConfig | null {
  const palette = GUILLOCHE_COLOR_PALETTES.find(c => c.id === ref.colorPaletteId);
  if (!palette) return null;
  return {
    id: ref.id,
    name: ref.id,
    category: ref.category,
    categoryName: '',
    patternType: ref.patternType,
    colorPalette: palette,
    complexity: 'medium',
    density: 'normal',
    rotation: ref.rotation,
    scale: ref.scale,
    opacity: ref.opacity,
    strokeWidth: ref.strokeWidth,
    seed: ref.seed,
  };
}

/** Generate SVG path data for a pattern type */
export function generatePatternPaths(
  patternType: string,
  size: number,
  scale: number,
  seed: number
): string[] {
  const paths: string[] = [];
  const centerX = size / 2;
  const centerY = size / 2;

  switch (patternType) {
    case 'concentric-circles':
      for (let i = 1; i <= 8; i++) {
        const r = (size / 2) * (i / 8) * scale;
        paths.push(`M ${centerX - r} ${centerY} A ${r} ${r} 0 1 1 ${centerX + r} ${centerY} A ${r} ${r} 0 1 1 ${centerX - r} ${centerY}`);
      }
      break;
    case 'radial-lines':
      for (let i = 0; i < 24; i++) {
        const angle = (i * 15 * Math.PI) / 180;
        const x1 = centerX + Math.cos(angle) * 10;
        const y1 = centerY + Math.sin(angle) * 10;
        const x2 = centerX + Math.cos(angle) * (size / 2 - 10);
        const y2 = centerY + Math.sin(angle) * (size / 2 - 10);
        paths.push(`M ${x1} ${y1} L ${x2} ${y2}`);
      }
      break;
    case 'wave-horizontal':
      for (let row = 0; row < 10; row++) {
        let d = `M 0 ${(row + 1) * (size / 11)}`;
        for (let x = 0; x <= size; x += 10) {
          const y = (row + 1) * (size / 11) + Math.sin((x / 20 + seed) * scale) * 8;
          d += ` L ${x} ${y}`;
        }
        paths.push(d);
      }
      break;
    case 'wave-vertical':
      for (let col = 0; col < 10; col++) {
        let d = `M ${(col + 1) * (size / 11)} 0`;
        for (let y = 0; y <= size; y += 10) {
          const x = (col + 1) * (size / 11) + Math.sin((y / 20 + seed) * scale) * 8;
          d += ` L ${x} ${y}`;
        }
        paths.push(d);
      }
      break;
    case 'diamond-grid':
      for (let i = 0; i < 12; i++) {
        const offset = i * (size / 12);
        paths.push(`M 0 ${offset} L ${size} ${offset}`);
        paths.push(`M ${offset} 0 L ${offset} ${size}`);
        paths.push(`M 0 ${offset} L ${offset} 0`);
        paths.push(`M ${size - offset} 0 L ${size} ${offset}`);
      }
      break;
    case 'spiral': {
      let spiralPath = `M ${centerX} ${centerY}`;
      for (let t = 0; t < 10 * Math.PI; t += 0.1) {
        const r = t * 3 * scale;
        const x = centerX + r * Math.cos(t + seed);
        const y = centerY + r * Math.sin(t + seed);
        spiralPath += ` L ${x} ${y}`;
      }
      paths.push(spiralPath);
      break;
    }
    case 'crosshatch':
      for (let i = 0; i < 15; i++) {
        const offset = i * (size / 15);
        paths.push(`M 0 ${offset} L ${size} ${offset}`);
        paths.push(`M ${offset} 0 L ${offset} ${size}`);
        paths.push(`M 0 ${offset} L ${offset} 0`);
        paths.push(`M ${offset} ${size} L ${size} ${offset}`);
      }
      break;
    case 'chevron':
      for (let row = 0; row < 8; row++) {
        const y = row * (size / 8);
        let d = '';
        for (let x = 0; x < size; x += 20) {
          d += `M ${x} ${y + 10} L ${x + 10} ${y} L ${x + 20} ${y + 10} `;
        }
        paths.push(d);
      }
      break;
    case 'guilloche-classic':
      for (let i = 0; i < 6; i++) {
        let d = `M 0 ${centerY}`;
        for (let x = 0; x <= size; x += 2) {
          const y = centerY + Math.sin(x / 10 + i) * (10 + i * 5) * scale;
          d += ` L ${x} ${y}`;
        }
        paths.push(d);
      }
      break;
    case 'guilloche-wave':
      for (let i = 0; i < 8; i++) {
        let d = `M 0 ${centerY}`;
        for (let x = 0; x <= size; x += 2) {
          const y = centerY + Math.sin(x / 15 + i * 0.5 + seed) * 15 +
            Math.cos(x / 8 + i) * 10 * scale;
          d += ` L ${x} ${y}`;
        }
        paths.push(d);
      }
      break;
    case 'rosette':
      for (let layer = 0; layer < 5; layer++) {
        const r = (size / 2 - 20) * ((layer + 1) / 5);
        for (let i = 0; i < 12; i++) {
          const angle1 = (i * 30 * Math.PI) / 180;
          const angle2 = ((i + 1) * 30 * Math.PI) / 180;
          const x1 = centerX + r * Math.cos(angle1);
          const y1 = centerY + r * Math.sin(angle1);
          const x2 = centerX + r * Math.cos(angle2);
          const y2 = centerY + r * Math.sin(angle2);
          const cx = centerX + r * 1.1 * Math.cos((angle1 + angle2) / 2);
          const cy = centerY + r * 1.1 * Math.sin((angle1 + angle2) / 2);
          paths.push(`M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`);
        }
      }
      break;
    case 'starburst':
      for (let i = 0; i < 36; i++) {
        const angle = (i * 10 * Math.PI) / 180;
        const length = i % 2 === 0 ? size / 2 - 10 : size / 3;
        const x = centerX + Math.cos(angle) * length;
        const y = centerY + Math.sin(angle) * length;
        paths.push(`M ${centerX} ${centerY} L ${x} ${y}`);
      }
      break;
    case 'mandala':
      for (let ring = 1; ring <= 5; ring++) {
        const r = (size / 2 - 10) * (ring / 5);
        paths.push(`M ${centerX - r} ${centerY} A ${r} ${r} 0 1 1 ${centerX + r} ${centerY} A ${r} ${r} 0 1 1 ${centerX - r} ${centerY}`);
        for (let i = 0; i < 8 * ring; i++) {
          const angle = (i * (360 / (8 * ring)) * Math.PI) / 180;
          const x = centerX + r * Math.cos(angle);
          const y = centerY + r * Math.sin(angle);
          paths.push(`M ${centerX} ${centerY} L ${x} ${y}`);
        }
      }
      break;
    default:
      for (let i = 1; i <= 6; i++) {
        const r = (size / 2) * (i / 6) * scale;
        paths.push(`M ${centerX - r} ${centerY} A ${r} ${r} 0 1 1 ${centerX + r} ${centerY} A ${r} ${r} 0 1 1 ${centerX - r} ${centerY}`);
      }
  }
  return paths;
}

/** Generate pure SVG string for a single pattern tile */
function generatePatternTileSVG(ref: SavedPatternRef, tileSize = 200): string {
  const palette = GUILLOCHE_COLOR_PALETTES.find(c => c.id === ref.colorPaletteId);
  if (!palette) return '';
  const paths = generatePatternPaths(ref.patternType, tileSize, ref.scale, ref.seed);
  const gradId = `grad-${ref.id}`;
  return `
    <defs>
      <linearGradient id="${gradId}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${palette.primary}" />
        <stop offset="100%" stop-color="${palette.secondary}" />
      </linearGradient>
    </defs>
    <g transform="rotate(${ref.rotation} ${tileSize / 2} ${tileSize / 2})" opacity="${ref.opacity * 10}">
      ${paths.map(d => `<path d="${d}" fill="none" stroke="url(#${gradId})" stroke-width="${ref.strokeWidth}" stroke-linecap="round" stroke-linejoin="round" />`).join('\n')}
    </g>
  `;
}

/**
 * Generate full HTML for guilloche pattern background overlay.
 * Returns an absolutely-positioned div with tiled SVG patterns.
 * Used in print contexts (window.open, html2canvas, etc.)
 */
export function generateGuillocheBackgroundHTML(patterns: SavedPatternRef[]): string {
  if (!patterns.length) return '';
  const tileSize = 200;
  const bgColor = GUILLOCHE_COLOR_PALETTES.find(c => c.id === patterns[0].colorPaletteId)?.bg || '#fff';

  const layers = patterns.map((ref, idx) => {
    const opacity = 0.08 - idx * 0.015;
    const patId = `bg-pat-${ref.id}`;
    const tileSVG = generatePatternTileSVG(ref, tileSize);
    return `
      <div style="position:absolute;inset:0;opacity:${opacity};">
        <svg width="100%" height="100%" viewBox="0 0 595 842" preserveAspectRatio="xMidYMid slice">
          <defs>
            <pattern id="${patId}" patternUnits="userSpaceOnUse" width="${tileSize}" height="${tileSize}">
              <g transform="rotate(${ref.rotation} ${tileSize / 2} ${tileSize / 2})">
                <svg width="${tileSize}" height="${tileSize}" viewBox="0 0 ${tileSize} ${tileSize}">
                  ${tileSVG}
                </svg>
              </g>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#${patId})" />
        </svg>
      </div>
    `;
  }).join('');

  return `<div style="position:absolute;inset:0;pointer-events:none;background-color:${bgColor};">${layers}</div>`;
}

/**
 * Generate inline React-compatible style + SVG data for PrintWrapper.
 */
export function getGuillocheBackgroundStyle(patterns: SavedPatternRef[]): {
  backgroundColor: string;
} | null {
  if (!patterns.length) return null;
  const bg = GUILLOCHE_COLOR_PALETTES.find(c => c.id === patterns[0].colorPaletteId)?.bg || '#fff';
  return { backgroundColor: bg };
}
