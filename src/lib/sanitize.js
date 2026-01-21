/**
 * Sanitization utility - XSS védelem HTML tartalmakhoz
 *
 * FONTOS: React automatikusan escape-eli a {} blokkokat,
 * szóval alapértelmezetten védettek vagyunk XSS ellen.
 *
 * Ez a utility csak akkor kell, ha dangerouslySetInnerHTML-t használunk!
 */

import DOMPurify from 'dompurify';

/**
 * HTML string tisztítása - eltávolít minden veszélyes elemeket
 * @param {string} dirty - Tisztítatlan HTML string
 * @returns {string} - Biztonságos HTML string
 */
export function sanitizeHTML(dirty) {
  if (!dirty || typeof dirty !== 'string') return '';

  return DOMPurify.sanitize(dirty, {
    // Engedélyezett tagek (csak biztonságosak)
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'br', 'p', 'ul', 'ol', 'li'],
    // Engedélyezett attribútumok (üres = semmi)
    ALLOWED_ATTR: [],
  });
}

/**
 * Plain text biztosítása - minden HTML tag eltávolítása
 * @param {string} text - Tisztítatlan text
 * @returns {string} - Pure text, HTML nélkül
 */
export function stripHTML(text) {
  if (!text || typeof text !== 'string') return '';

  return DOMPurify.sanitize(text, {
    ALLOWED_TAGS: [], // Semmi HTML tag
    ALLOWED_ATTR: [],
  });
}

/**
 * User input validáció - veszélyes karakterek ellenőrzése
 * @param {string} input - User input
 * @returns {boolean} - true ha biztonságos
 */
export function isInputSafe(input) {
  if (!input || typeof input !== 'string') return true;

  // Script tagek ellenőrzése
  const scriptPattern = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;
  if (scriptPattern.test(input)) return false;

  // Event handlerek ellenőrzése (onclick, onerror, stb.)
  const eventPattern = /on\w+\s*=/gi;
  if (eventPattern.test(input)) return false;

  // Javascript: protocol ellenőrzése
  const jsProtocolPattern = /javascript:/gi;
  if (jsProtocolPattern.test(input)) return false;

  return true;
}
