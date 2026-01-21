/**
 * Üzleti szabályok és konstansok
 * Központi hely az alkalmazás konfigurációjához
 */

/**
 * Nyitvatartási idők
 */
export const BUSINESS_HOURS = {
  // Nyitási idő (8:00)
  OPEN_TIME: "08:00",
  OPEN_TIME_MINUTES: 8 * 60, // 480 perc

  // Zárási idő (17:00)
  CLOSE_TIME: "17:00",
  CLOSE_TIME_MINUTES: 17 * 60, // 1020 perc

  // Zárt napok (0 = vasárnap)
  CLOSED_DAYS: [0],

  // Nyitvatartás szöveg
  HOURS_TEXT: "H-Szo 8:00-17:00",
};

/**
 * Foglalási szabályok
 */
export const BOOKING_RULES = {
  // Minimum hány nappal előre kell foglalni
  MIN_BOOKING_DAYS: 2,

  // Időslot hossza percekben
  TIME_SLOT_MINUTES: 15,

  // Maximum foglalható napok előre (opcionális)
  MAX_BOOKING_DAYS_AHEAD: 90, // 3 hónap
};

/**
 * Szolgáltatás kategóriák
 */
export const SERVICE_CATEGORIES = [
  "Alap kezelések",
  "Gyantázás",
  "Masszírozás",
  "Arckezelések",
];

/**
 * Foglalási státuszok
 */
export const BOOKING_STATUS = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
};

/**
 * Státusz színek (CSS class names)
 */
export const STATUS_COLORS = {
  [BOOKING_STATUS.PENDING]: "status-pending", // sárga
  [BOOKING_STATUS.APPROVED]: "status-approved", // zöld
  [BOOKING_STATUS.REJECTED]: "status-rejected", // piros
};

/**
 * Státusz szövegek (magyar)
 */
export const STATUS_LABELS = {
  [BOOKING_STATUS.PENDING]: "Várakozó",
  [BOOKING_STATUS.APPROVED]: "Jóváhagyva",
  [BOOKING_STATUS.REJECTED]: "Elutasítva",
};

/**
 * Kapcsolati információk
 */
export const CONTACT_INFO = {
  PHONE: "+36 30 716 0818",
  EMAIL: "feketeadrienn08@gmail.com",
  ADDRESS: "Fő út 70., Csongrád, 6640",
  FACEBOOK_URL: "https://www.facebook.com/profile.php?id=61555810863545",
};
