/**
 * HTML Sanitization utility using DOMPurify
 * Prevents stored XSS attacks from user-generated HTML content
 */
import DOMPurify from 'dompurify';

/**
 * Sanitize HTML content for safe rendering via dangerouslySetInnerHTML.
 * Allows standard HTML/CSS for document rendering but strips scripts and event handlers.
 */
export function sanitizeHtml(html: string): string {
  if (!html) return '';
  
  return DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true },
    ADD_TAGS: ['style'],
    ADD_ATTR: ['style', 'class', 'dir', 'lang', 'align', 'colspan', 'rowspan', 'cellpadding', 'cellspacing', 'border', 'width', 'height'],
    ALLOW_DATA_ATTR: false,
    FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form', 'input', 'textarea', 'select', 'button'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur', 'onsubmit', 'onchange'],
  });
}
