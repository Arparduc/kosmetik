/**
 * Logger utility - Development módban logol, production-ban néma
 *
 * Használat:
 * import { logger } from './lib/logger';
 * logger.log('Debug info');
 * logger.error('Error occurred');
 */

const isDev = import.meta.env.DEV;

export const logger = {
  /**
   * Általános log üzenetek (debug info)
   */
  log: (...args) => {
    if (isDev) console.log(...args);
  },

  /**
   * Error üzenetek (kritikus hibák)
   */
  error: (...args) => {
    if (isDev) console.error(...args);
  },

  /**
   * Figyelmeztetések (non-critical issues)
   */
  warn: (...args) => {
    if (isDev) console.warn(...args);
  },

  /**
   * Információs üzenetek (fontos events)
   */
  info: (...args) => {
    if (isDev) console.info(...args);
  },

  /**
   * Table formátumú log (objektum arrays)
   */
  table: (...args) => {
    if (isDev) console.table(...args);
  },
};

/**
 * Production error logging
 * Ezt később ki lehet bővíteni Sentry, LogRocket, stb. integrációval
 */
export function logProductionError(error, context = {}) {
  if (!isDev) {
    // TODO: Küldés external service-hez (Sentry, CloudWatch, stb.)
    // Jelenleg csak console.error production-ban is
    console.error('[PRODUCTION ERROR]', error, context);
  }
}
