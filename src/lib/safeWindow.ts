/**
 * Safe window.open — prevents Reverse Tabnapping by enforcing noopener,noreferrer
 */
export function safeWindowOpen(url: string, target: string = '_blank'): Window | null {
  return window.open(url, target, 'noopener,noreferrer');
}
