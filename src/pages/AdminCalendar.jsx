import { useState, useEffect } from "react";
import { getAllBookings, saveBooking } from "../lib/firebase";
import "./AdminCalendar.css";

function AdminCalendar({ onViewBooking }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState("week"); // week or day
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);

  useEffect(() => {
    loadBookings();
  }, []);

  async function loadBookings() {
    setLoading(true);
    const data = await getAllBookings();
    setBookings(data);
    setLoading(false);
  }

  // Generál egy hét dátumokat
  function getWeekDates(date) {
    const start = new Date(date);
    start.setDate(start.getDate() - start.getDay() + 1); // Hétfő

    const dates = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      dates.push(d);
    }
    return dates;
  }

  // Időrések generálása (8:00-17:00, 15 perces)
  function generateTimeSlots() {
    const slots = [];
    for (let hour = 8; hour < 17; hour++) {
      for (let min = 0; min < 60; min += 15) {
        const h = hour.toString().padStart(2, "0");
        const m = min.toString().padStart(2, "0");
        slots.push(`${h}:${m}`);
      }
    }
    return slots;
  }

  // Ellenőrzi, hogy van-e foglalás egy adott időpontra (elutasítottakat kihagyva)
  function getBookingForSlot(date, time) {
    const dateStr = date.toISOString().split("T")[0];
    return bookings.find(
      (b) => b.date === dateStr && b.time === time && b.status !== "rejected"
    );
  }

  // Slot kattintás kezelés
  function handleSlotClick(date, time) {
    const dateStr = date.toISOString().split("T")[0];
    const booking = getBookingForSlot(date, time);

    if (booking) {
      // Meglévő foglalás - navigálás lista nézetre
      if (onViewBooking) {
        onViewBooking(booking.id);
      }
    } else {
      // Új foglalás létrehozása
      setSelectedSlot({ date: dateStr, time });
      setShowBookingForm(true);
    }
  }

  const weekDates = getWeekDates(selectedDate);
  const timeSlots = generateTimeSlots();

  // Navigáció előző/következő hétre
  function goToPreviousWeek() {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 7);
    setSelectedDate(newDate);
  }

  function goToNextWeek() {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 7);
    setSelectedDate(newDate);
  }

  function goToToday() {
    setSelectedDate(new Date());
  }

  if (loading) {
    return (
      <div className="admin-calendar">
        <div className="calendar-loading">Betöltés...</div>
      </div>
    );
  }

  return (
    <div className="admin-calendar">
      <div className="calendar-header">
        <h2>Foglalási Naptár</h2>
        <div className="calendar-navigation">
          <button onClick={goToPreviousWeek} className="nav-btn">
            ← Előző hét
          </button>
          <button onClick={goToToday} className="today-btn">
            Ma
          </button>
          <button onClick={goToNextWeek} className="nav-btn">
            Következő hét →
          </button>
        </div>
      </div>

      <div className="calendar-grid">
        <div className="calendar-time-column">
          <div className="calendar-corner-cell"></div>
          {timeSlots.map((time) => (
            <div key={time} className="time-cell">
              {time}
            </div>
          ))}
        </div>

        {weekDates.map((date) => {
          const isToday =
            date.toISOString().split("T")[0] ===
            new Date().toISOString().split("T")[0];
          const isSunday = date.getDay() === 0;

          return (
            <div key={date.toISOString()} className="calendar-day-column">
              <div className={`day-header ${isToday ? "today" : ""} ${isSunday ? "sunday" : ""}`}>
                <div className="day-name">
                  {date.toLocaleDateString("hu-HU", { weekday: "short" })}
                </div>
                <div className="day-date">
                  {date.toLocaleDateString("hu-HU", {
                    month: "short",
                    day: "numeric",
                  })}
                </div>
              </div>

              {isSunday ? (
                <div className="sunday-closed">
                  <p>Zárva</p>
                </div>
              ) : (
                timeSlots.map((time) => {
                  const booking = getBookingForSlot(date, time);
                  const hasBooking = !!booking;
                  const isPending = booking?.status === "pending";
                  const isApproved = booking?.status === "approved";
                  const isRejected = booking?.status === "rejected";

                  return (
                    <div
                      key={time}
                      className={`calendar-slot ${hasBooking ? "has-booking" : "empty"} ${isPending ? "pending" : ""} ${isApproved ? "approved" : ""} ${isRejected ? "rejected" : ""}`}
                      onClick={() => handleSlotClick(date, time)}
                      title={
                        hasBooking
                          ? `${booking.name} - ${booking.servicesMeta?.map((s) => s.label).join(", ")}`
                          : "Kattints foglaláshoz"
                      }
                    >
                      {hasBooking && (
                        <div className="booking-info">
                          <div className="booking-name">{booking.name}</div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          );
        })}
      </div>

      {showBookingForm && (
        <AdminBookingModal
          slot={selectedSlot}
          onClose={() => {
            setShowBookingForm(false);
            setSelectedSlot(null);
          }}
          onSuccess={() => {
            setShowBookingForm(false);
            setSelectedSlot(null);
            loadBookings();
          }}
        />
      )}
    </div>
  );
}

// Admin foglalási modal
function AdminBookingModal({ slot, onClose, onSuccess }) {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);

    try {
      const payload = {
        ...form,
        date: slot.date,
        time: slot.time,
        service: [],
        servicesMeta: [],
        totalPrice: 0,
        durationMinutes: 30,
        status: "approved", // Admin foglalás azonnal jóváhagyott
        userId: "admin",
        userEmail: form.email || "admin@system.local",
        userName: form.name,
      };

      await saveBooking(payload);

      alert("Foglalás sikeresen létrehozva!");
      onSuccess();
    } catch (err) {
      console.error("Hiba a foglalás létrehozása közben:", err);
      alert("Hiba történt a foglalás létrehozása során.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Új foglalás létrehozása</h3>
          <button className="close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="modal-body">
          <p className="selected-slot-info">
            <strong>Időpont:</strong> {slot.date} {slot.time}
          </p>

          <form onSubmit={handleSubmit}>
            <div className="form-field">
              <label>Név *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>

            <div className="form-field">
              <label>Telefonszám *</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                required
              />
            </div>

            <div className="form-field">
              <label>Email (opcionális)</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>

            <div className="form-field">
              <label>Megjegyzés</label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={3}
              />
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="cancel-btn"
                onClick={onClose}
                disabled={submitting}
              >
                Mégse
              </button>
              <button
                type="submit"
                className="submit-btn"
                disabled={submitting}
              >
                {submitting ? "Foglalás..." : "Foglalás létrehozása"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default AdminCalendar;
