/**
 * Utility functions for number formatting
 * Forces English/Western numerals (0-9) instead of Arabic-Indic numerals (٠-٩)
 */

// Map of Arabic-Indic numerals to Western numerals
const arabicToEnglishMap: Record<string, string> = {
  '٠': '0',
  '١': '1',
  '٢': '2',
  '٣': '3',
  '٤': '4',
  '٥': '5',
  '٦': '6',
  '٧': '7',
  '٨': '8',
  '٩': '9',
};

/**
 * Converts Arabic-Indic numerals to Western/English numerals
 */
export function toEnglishNumerals(str: string): string {
  return str.replace(/[٠-٩]/g, (match) => arabicToEnglishMap[match] || match);
}

/**
 * Formats a number with thousand separators using English numerals
 * @param amount - The number to format
 * @param decimals - Number of decimal places (default: 0)
 */
export function formatNumber(amount: number, decimals: number = 0): string {
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount);
  return formatted;
}

/**
 * Formats currency with English numerals (Egyptian Pound)
 * @param amount - The amount to format
 * @param showCurrency - Whether to show currency symbol/text
 */
export function formatCurrency(amount: number, showCurrency: boolean = true): string {
  const formatted = formatNumber(amount, 0);
  return showCurrency ? `${formatted} ج.م` : formatted;
}

/**
 * Formats percentage with English numerals
 * @param value - The percentage value
 * @param decimals - Number of decimal places
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${formatNumber(value, decimals)}%`;
}

/**
 * Formats quantity with unit
 * @param quantity - The quantity value
 * @param unit - The unit (default: كجم)
 */
export function formatQuantity(quantity: number, unit: string = 'كجم'): string {
  return `${formatNumber(quantity)} ${unit}`;
}

/**
 * Formats a date string to dd/MM/yyyy with English numerals
 */
export function formatDateString(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Formats a date with time in English numerals
 */
export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const dateStr = formatDateString(d);
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${dateStr} - ${hours}:${minutes}`;
}
