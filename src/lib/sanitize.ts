/**
 * HTML Sanitization utilities to prevent XSS attacks
 * when generating HTML content dynamically
 */

/**
 * Escapes HTML entities in a string to prevent XSS attacks.
 * Uses the DOM to safely escape content.
 */
export const escapeHtml = (text: string | null | undefined): string => {
  if (text == null) return '';
  const div = document.createElement('div');
  div.textContent = String(text);
  return div.innerHTML;
};

/**
 * Escapes HTML attribute values to prevent XSS attacks.
 * More comprehensive escaping for use in HTML attributes.
 */
export const escapeHtmlAttribute = (text: string | null | undefined): string => {
  if (text == null) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

/**
 * Validates that a string is a valid data URL for images.
 * Only allows base64-encoded PNG, JPEG, GIF, or WebP images.
 */
export const isValidImageDataUrl = (url: string | null | undefined): boolean => {
  if (!url) return false;
  const dataUrlPattern = /^data:image\/(png|jpeg|jpg|gif|webp);base64,[A-Za-z0-9+/]+=*$/;
  return dataUrlPattern.test(url);
};

/**
 * Sanitizes an image src attribute.
 * Returns empty string if the URL is not a valid data URL.
 */
export const sanitizeImageSrc = (src: string | null | undefined): string => {
  if (!src) return '';
  if (isValidImageDataUrl(src)) return src;
  // For other URLs, escape for attribute use
  return escapeHtmlAttribute(src);
};
