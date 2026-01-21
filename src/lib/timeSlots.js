/**
 * Time slot generation utilities
 * Központi hely az időslotok generálásához
 */

import { timeToMinutes, minutesToTime } from './utils';
import { BUSINESS_HOURS, BOOKING_RULES } from '../constants/business';

/**
 * Időslotok generálása a nyitvatartási időben
 * @param {string} startTime - Kezdő idő (HH:mm)
 * @param {string} endTime - Záró idő (HH:mm)
 * @param {number} stepMinutes - Időslot hossza percekben
 * @returns {string[]} - HH:mm formátumú időpontok
 */
export function generateTimeSlots(
  startTime = BUSINESS_HOURS.OPEN_TIME,
  endTime = BUSINESS_HOURS.CLOSE_TIME,
  stepMinutes = BOOKING_RULES.TIME_SLOT_MINUTES
) {
  const slots = [];
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);

  for (let m = startMinutes; m < endMinutes; m += stepMinutes) {
    slots.push(minutesToTime(m));
  }

  return slots;
}

/**
 * Egy foglalás időtartamát 15 perces slotokra bontja
 * @param {Object} booking - booking object with time and durationMinutes
 * @param {number} stepMinutes - időrés hossza percekben
 * @returns {string[]} - HH:mm formátumú időpontok
 */
export function expandBookingToSlots(booking, stepMinutes = BOOKING_RULES.TIME_SLOT_MINUTES) {
  const start = booking.time;
  const dur = booking.durationMinutes ?? 30;

  if (!start) return [];

  const startM = timeToMinutes(start);
  const endM = startM + dur;

  const slots = [];
  for (let m = startM; m < endM; m += stepMinutes) {
    slots.push(minutesToTime(m));
  }

  return slots;
}

/**
 * Szükséges slotok egy adott kezdési időponttól
 * @param {string} startTime - Kezdési idő (HH:mm)
 * @param {number} durationMinutes - Időtartam percekben
 * @returns {string[]} - HH:mm formátumú időpontok
 */
export function requiredSlotsForStart(startTime, durationMinutes) {
  const dur = Number(durationMinutes) || 30;
  const startM = timeToMinutes(startTime);
  const endM = startM + dur;

  const slots = [];
  for (let m = startM; m < endM; m += BOOKING_RULES.TIME_SLOT_MINUTES) {
    slots.push(minutesToTime(m));
  }

  return slots;
}

/**
 * Ellenőrzi hogy egy időslot foglalt-e
 * @param {string} slot - Időpont (HH:mm)
 * @param {Object[]} bookings - Foglalások listája
 * @returns {boolean} - true ha foglalt
 */
export function isSlotBooked(slot, bookings) {
  return bookings.some(booking => {
    const bookedSlots = expandBookingToSlots(booking);
    return bookedSlots.includes(slot);
  });
}

/**
 * Ellenőrzi hogy egy időtartam összes slotja szabad-e
 * @param {string} startTime - Kezdési idő (HH:mm)
 * @param {number} durationMinutes - Időtartam percekben
 * @param {Object[]} bookings - Foglalások listája
 * @returns {boolean} - true ha minden slot szabad
 */
export function isTimeAvailable(startTime, durationMinutes, bookings) {
  const requiredSlots = requiredSlotsForStart(startTime, durationMinutes);

  return requiredSlots.every(slot => !isSlotBooked(slot, bookings));
}
