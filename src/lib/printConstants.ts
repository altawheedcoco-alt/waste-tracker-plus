/**
 * Centralized Print Margin & Layout Constants
 * 
 * Standard A4 Document Architecture:
 *   - Guilloche frame inset: 10mm (1cm) from page edge
 *   - Text/content padding: 15mm (1.5cm) from page edge (top, left, right), 20mm bottom
 *   - Security elements (MICR, watermark, text filler): respect 15mm inset
 *   - @page CSS margin: 15mm 15mm 20mm 15mm
 * 
 * IMPORTANT: Any changes here affect ALL print outputs across the system.
 */

// Guilloche decorative frame margin from page edge (1cm)
export const GUILLOCHE_FRAME_MARGIN_CM = 1;
export const GUILLOCHE_FRAME_MARGIN_MM = 10;
export const GUILLOCHE_FRAME_INSET = '10mm';

// Text/content safe margin from page edge (1.5cm top/left/right, 2cm bottom)
export const TEXT_MARGIN_MM_TOP = 15;
export const TEXT_MARGIN_MM_SIDE = 15;
export const TEXT_MARGIN_MM_BOTTOM = 20;
export const TEXT_CONTENT_PADDING = '15mm 15mm 20mm 15mm';
export const TEXT_CONTENT_PADDING_UNIFORM = '15mm';

// CSS @page margin (matches text content padding)
export const PAGE_MARGIN_CSS = '15mm 15mm 20mm 15mm';

// Security layer inset (matches text margin)
export const SECURITY_LAYER_INSET = '15mm';

// A4 dimensions
export const A4_WIDTH_MM = 210;
export const A4_HEIGHT_MM = 297;
export const A4_WIDTH_PX = 794; // at 96 DPI
export const A4_HEIGHT_PX = 1123; // at 96 DPI

// Vertical stamp position (just inside text margin)
export const VERTICAL_STAMP_LEFT = '16mm';

/**
 * Generate the standard @page CSS rule
 */
export function getPageMarginCSS(orientation: 'portrait' | 'landscape' = 'portrait'): string {
  return `@page { size: A4 ${orientation}; margin: ${PAGE_MARGIN_CSS}; }`;
}

/**
 * Generate the standard body padding for standalone print HTML
 */
export function getBodyPaddingCSS(): string {
  return `padding: ${TEXT_CONTENT_PADDING};`;
}

/**
 * Generate inline style object for PrintWrapper and similar containers
 */
export function getPrintContainerStyle(): Record<string, string> {
  return {
    width: `${A4_WIDTH_MM}mm`,
    minHeight: `${A4_HEIGHT_MM}mm`,
    margin: '0 auto',
    padding: TEXT_CONTENT_PADDING,
    boxSizing: 'border-box',
  };
}
