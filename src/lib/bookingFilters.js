/**
 * Booking filter utilities
 * Központi hely a foglalások szűréséhez
 */

/**
 * Foglalások szűrése időszak alapján
 * @param {Object[]} bookings - Foglalások listája
 * @param {string} filter - 'all' | 'upcoming' | 'past'
 * @returns {Object[]} - Szűrt foglalások
 */
export function filterByTimeRange(bookings, filter) {
  if (filter === 'all') return bookings;

  const today = new Date().toISOString().split('T')[0];

  return bookings.filter(booking => {
    if (filter === 'upcoming') {
      return booking.date >= today;
    }
    if (filter === 'past') {
      return booking.date < today;
    }
    return true;
  });
}

/**
 * Foglalások szűrése státusz alapján
 * @param {Object[]} bookings - Foglalások listája
 * @param {string} statusFilter - 'all' | 'pending' | 'approved' | 'rejected'
 * @returns {Object[]} - Szűrt foglalások
 */
export function filterByStatus(bookings, statusFilter) {
  if (statusFilter === 'all') return bookings;

  return bookings.filter(booking => booking.status === statusFilter);
}

/**
 * Foglalások szűrése keresési szöveg alapján
 * @param {Object[]} bookings - Foglalások listája
 * @param {string} searchTerm - Keresési szöveg
 * @returns {Object[]} - Szűrt foglalások
 */
export function filterBySearchTerm(bookings, searchTerm) {
  if (!searchTerm || searchTerm.trim() === '') return bookings;

  const term = searchTerm.toLowerCase().trim();

  return bookings.filter(booking => {
    return (
      booking.name?.toLowerCase().includes(term) ||
      booking.phone?.includes(term) ||
      booking.userEmail?.toLowerCase().includes(term) ||
      booking.date?.includes(term) ||
      booking.time?.includes(term)
    );
  });
}

/**
 * Kombinált szűrés - összes szűrő alkalmazása
 * @param {Object[]} bookings - Foglalások listája
 * @param {Object} filters - Szűrők objektum
 * @param {string} filters.timeRange - 'all' | 'upcoming' | 'past'
 * @param {string} filters.status - 'all' | 'pending' | 'approved' | 'rejected'
 * @param {string} filters.searchTerm - Keresési szöveg
 * @returns {Object[]} - Szűrt foglalások
 */
export function filterBookings(bookings, filters) {
  let filtered = bookings;

  // 1. Időszak szűrés
  if (filters.timeRange) {
    filtered = filterByTimeRange(filtered, filters.timeRange);
  }

  // 2. Státusz szűrés
  if (filters.status) {
    filtered = filterByStatus(filtered, filters.status);
  }

  // 3. Keresési szűrés
  if (filters.searchTerm) {
    filtered = filterBySearchTerm(filtered, filters.searchTerm);
  }

  return filtered;
}

/**
 * Foglalások statisztikák számítása
 * @param {Object[]} bookings - Foglalások listája
 * @returns {Object} - Statisztikák
 */
export function calculateBookingStats(bookings) {
  const today = new Date().toISOString().split('T')[0];

  return {
    total: bookings.length,
    pending: bookings.filter(b => !b.status || b.status === 'pending').length,
    approved: bookings.filter(b => b.status === 'approved').length,
    rejected: bookings.filter(b => b.status === 'rejected').length,
    upcoming: bookings.filter(b => b.date >= today).length,
    past: bookings.filter(b => b.date < today).length,
  };
}
