/**
 * Közös segédfüggvények
 */

/**
 * Szöveget slugifikál (URL-barát formátumra alakít)
 * @param {string} text - A feldolgozandó szöveg
 * @returns {string} - Slugifikált szöveg
 */
export function slugify(text) {
  return text
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .toLowerCase();
}

/**
 * Időt percekre konvertál (HH:mm -> percek)
 * @param {string} t - Idő HH:mm formátumban
 * @returns {number} - Percek száma
 */
export function timeToMinutes(t) {
  const [h, m] = (t || "0:0").split(":").map(Number);
  return h * 60 + m;
}

/**
 * Perceket időre konvertál (percek -> HH:mm)
 * @param {number} mins - Percek száma
 * @returns {string} - Idő HH:mm formátumban
 */
export function minutesToTime(mins) {
  const h = String(Math.floor(mins / 60)).padStart(2, "0");
  const m = String(mins % 60).padStart(2, "0");
  return `${h}:${m}`;
}
