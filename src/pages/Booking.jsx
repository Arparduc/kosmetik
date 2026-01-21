import { useEffect, useState } from "react";
import "./Booking.css";
import { saveBooking, getBookingsByDate, getAllServices } from "../lib/firebase";
import { slugify, timeToMinutes, minutesToTime } from "../lib/utils";
import { useAuth } from "../contexts/AuthContext";
import { BUSINESS_HOURS, BOOKING_RULES } from "../constants/business";
import { logger } from "../lib/logger";

// --- helpers (IDŐ SZÁMOLÁS) ---
// Ellenőrzi hogy jelenleg nyitva van-e
function isCurrentlyOpen() {
  const now = new Date();
  const day = now.getDay(); // 0=vasárnap, 1=hétfő, ..., 6=szombat
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const currentTime = hours * 60 + minutes;

  // Zárt napok ellenőrzése
  if (BUSINESS_HOURS.CLOSED_DAYS.includes(day)) return false;

  // Nyitvatartás ellenőrzése
  return currentTime >= BUSINESS_HOURS.OPEN_TIME_MINUTES &&
         currentTime < BUSINESS_HOURS.CLOSE_TIME_MINUTES;
}

// Minimum foglalható dátum kiszámítása (mai nap + MIN_BOOKING_DAYS, vasárnap kihagyva)
function getMinBookingDate() {
  const today = new Date();
  const minDate = new Date(today);
  minDate.setDate(today.getDate() + BOOKING_RULES.MIN_BOOKING_DAYS);

  // Ha vasárnap lenne (0), akkor még +1 nap (hétfő)
  if (BUSINESS_HOURS.CLOSED_DAYS.includes(minDate.getDay())) {
    minDate.setDate(minDate.getDate() + 1);
  }

  return minDate.toISOString().split("T")[0];
}

function expandBookingToSlots(booking, step = BOOKING_RULES.TIME_SLOT_MINUTES) {
  const start = booking.time;
  const dur = booking.durationMinutes ?? 30;
  if (!start) return [];

  const startM = timeToMinutes(start);
  const endM = startM + dur;

  const slots = [];
  for (let m = startM; m < endM; m += step) {
    slots.push(minutesToTime(m));
  }
  return slots;
}

function requiredSlotsForStart(startTime, durationMinutes) {
  const dur = Number(durationMinutes) || 30;

  const startM = timeToMinutes(startTime);
  const endM = startM + dur;

  const slots = [];
  for (let m = startM; m < endM; m += BOOKING_RULES.TIME_SLOT_MINUTES) {
    slots.push(minutesToTime(m));
  }
  return slots;
}

function Booking() {
  const { user } = useAuth();
  const [services, setServices] = useState({});
  const [expandedCategories, setExpandedCategories] = useState({
    "Alap kezelések": true,
    "Gyantázás": false,
    "Masszírozás": false,
    "Arckezelések": false,
  });
  const [form, setForm] = useState({
    lastName: "",
    firstName: "",
    phone: "",
    service: [],
    date: getMinBookingDate(),
    time: "",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [bookedSlots, setBookedSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);

  // Load services from Firestore
  useEffect(() => {
    async function loadServices() {
      try {
        const data = await getAllServices();
        // Convert array to slug-based object for compatibility
        const servicesObj = {};
        data.forEach((service) => {
          if (service.active !== false) {
            servicesObj[service.slug] = {
              label: service.label,
              price: new Intl.NumberFormat("hu-HU").format(service.price) + " Ft",
              duration: service.duration,
              category: service.category || "Alap kezelések",
            };
          }
        });
        setServices(servicesObj);
      } catch (err) {
        console.error("Hiba a szolgáltatások betöltése közben:", err);
      }
    }
    loadServices();
  }, []);

  function toggleCategory(category) {
    setExpandedCategories((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  }

  // Group services by category
  const servicesByCategory = Object.entries(services).reduce((acc, [key, service]) => {
    const cat = service.category || "Alap kezelések";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push({ key, ...service });
    return acc;
  }, {});

  // Pre-fill form with user data
  useEffect(() => {
    if (user && user.displayName) {
      const nameParts = user.displayName.split(" ");
      const lastName = nameParts[0] || "";
      const firstName = nameParts.slice(1).join(" ") || "";
      setForm((prev) => ({
        ...prev,
        lastName,
        firstName,
      }));
    }
  }, [user]);

  // Load preselected services from TreatmentShop (if any)
  useEffect(() => {
    try {
      const raw = localStorage.getItem("preselectedServices");
      if (!raw) return;

      const arr = JSON.parse(raw);

      // Validáció: Array-e és van-e benne elem?
      if (!Array.isArray(arr)) {
        throw new Error("Invalid preselected services format");
      }

      if (arr.length > 0) {
        setForm((p) => ({ ...p, service: arr }));
      }

      // Tisztítás, függetlenül attól hogy volt-e adat
      localStorage.removeItem("preselectedServices");
    } catch (error) {
      // JSON parse error vagy validációs hiba
      if (error instanceof SyntaxError) {
        logger.warn("Corrupt preselectedServices in localStorage");
      } else {
        logger.warn("Error loading preselectedServices:", error.message);
      }
      // Tisztítás hogy legközelebb ne legyen probléma
      localStorage.removeItem("preselectedServices");
    }
  }, []);

  function handleChange(e) {
    const { name, value } = e.target;

    // Vasárnap ellenőrzése dátum választásnál
    if (name === "date") {
      const selectedDate = new Date(value + "T00:00:00");
      if (selectedDate.getDay() === 0) {
        alert("Vasárnap szabadnap, kérjük válassz másik napot!");
        return;
      }
    }

    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);

    const fullName = `${form.lastName} ${form.firstName}`.trim();

    const selectedServices = form.service
      .map((k) => services[k])
      .filter(Boolean);
    const totalPrice = selectedServices.reduce((sum, s) => {
      const n = parseInt((s.price || "").replace(/\D/g, "")) || 0;
      return sum + n;
    }, 0);

    const durationMinutes = selectedServices.reduce(
      (sum, s) => sum + (Number(s.duration) || 30),
      0
    );

    const payload = {
      ...form,
      name: fullName,
      userId: user?.uid,
      userEmail: user?.email,
      userName: user?.displayName || fullName,
      services: form.service,
      servicesMeta: selectedServices,
      totalPrice,
      durationMinutes,
      status: "pending", // Várakozó státusz, admin jóváhagyásra vár
    };

    try {
      await saveBooking(payload);
      alert(
        "Köszönjük! Az időpontkérést elküldtük. Amint az admin jóváhagyja, értesítünk."
      );

      setForm({
        name: "",
        phone: "",
        service: [],
        date: "",
        time: "",
        notes: "",
      });
    } catch (err) {
      console.error("Hiba a foglalás mentése közben:", err);
      alert("Hiba történt a mentés során. Kérjük, próbálja újra később.");
    } finally {
      setSubmitting(false);
    }
  }

  useEffect(() => {
    async function fetchSlots() {
      if (!form.date) return setBookedSlots([]);
      setSlotsLoading(true);
      try {
        const items = await getBookingsByDate(form.date);

        // Csak a jóváhagyott foglalások blokkoljanak időpontot
        const approvedBookings = items.filter((b) => b.status === "approved");
        const allBooked = approvedBookings.flatMap((b) => expandBookingToSlots(b));
        setBookedSlots([...new Set(allBooked)]);
      } catch (err) {
        console.error("fetch slots", err);
        setBookedSlots([]);
      } finally {
        setSlotsLoading(false);
      }
    }

    fetchSlots();
  }, [form.date]);

  function generateTimeSlots(start = "08:00", end = "17:00", stepMinutes = 15) {
    const pad = (n) => n.toString().padStart(2, "0");
    const [sh, sm] = start.split(":").map(Number);
    const [eh, em] = end.split(":").map(Number);
    let cur = sh * 60 + sm;
    const endMins = eh * 60 + em;
    const slots = [];
    while (cur < endMins) {
      const hh = Math.floor(cur / 60);
      const mm = cur % 60;
      slots.push(`${pad(hh)}:${pad(mm)}`);
      cur += stepMinutes;
    }
    return slots;
  }

  // Szűrés: ha ma van kiválasztva, csak jövőbeli időpontok
  const allSlots = generateTimeSlots();
  const today = new Date().toISOString().split("T")[0];
  const now = new Date();
  const currentTimeMinutes = now.getHours() * 60 + now.getMinutes();

  const availableSlots = allSlots.filter((slot) => {
    // Ha nem mai nap van kiválasztva, minden slot elérhető
    if (form.date !== today) return true;

    // Ha mai nap, csak a jövőbeli időpontok
    const slotMinutes = timeToMinutes(slot);
    return slotMinutes > currentTimeMinutes;
  });

  function handleSlotClick(t) {
    const selectedServices = form.service
      .map((k) => services[k])
      .filter(Boolean);

    if (!selectedServices.length) {
      alert("Először válassz legalább 1 szolgáltatást.");
      return;
    }

    // ⏱️ teljes idő percben (service.duration ha van, különben 30 perc)
    const durationMinutes = selectedServices.reduce(
      (sum, s) => sum + (Number(s.duration) || 30),
      0
    );

    const needed = requiredSlotsForStart(t, durationMinutes);
    const conflict = needed.some((s) => bookedSlots.includes(s));

    if (conflict) {
      alert("Ez az időpont ütközik egy másik foglalással. Válassz másikat.");
      return;
    }

    setForm((p) => ({ ...p, time: t }));
  }

  const selectedServices = form.service.map((k) => services[k]).filter(Boolean);
  const totalPrice = selectedServices.reduce((sum, s) => {
    const n = parseInt((s.price || "").replace(/\D/g, "")) || 0;
    return sum + n;
  }, 0);

  function toggleService(key) {
    setForm((prev) => {
      const exists = prev.service.includes(key);
      const next = exists
        ? prev.service.filter((s) => s !== key)
        : [...prev.service, key];
      return { ...prev, service: next };
    });
  }

  return (
    <section className="booking">
      <header className="booking-header">
        <h1>Időpontfoglalás</h1>
        <p className="muted">
          Válaszd ki a szolgáltatást, add meg adataidat, majd válassz időpontot.
          A végleges időpontot a kozmetikus fogja visszaigazolni.
        </p>
      </header>

      <div className="booking-grid">
        <form
          className="booking-form card"
          onSubmit={handleSubmit}
          aria-label="Időpontfoglalás űrlap"
        >
          {/* 1. SZOLGÁLTATÁSOK */}
          <div className="field">
            <span className="label">Szolgáltatások (több is választható)</span>
            <div className="service-categories">
              {Object.entries(servicesByCategory).map(([category, items]) => (
                <div key={category} className="service-category">
                  <button
                    type="button"
                    className="category-header"
                    onClick={() => toggleCategory(category)}
                  >
                    <span className="category-name">{category}</span>
                    <span className="category-icon">
                      {expandedCategories[category] ? "▼" : "▶"}
                    </span>
                  </button>
                  {expandedCategories[category] && (
                    <div className="service-list">
                      {items.map(({ key, label, price }) => (
                        <label
                          key={key}
                          className={`service-option ${
                            form.service.includes(key) ? "checked" : ""
                          }`}
                        >
                          <input
                            type="checkbox"
                            name="service"
                            value={key}
                            checked={form.service.includes(key)}
                            onChange={() => toggleService(key)}
                          />
                          <div className="service-meta">
                            <span className="service-name">{label}</span>
                            <span className="service-price">{price}</span>
                          </div>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 2. ADATOK */}
          <div className="field-row">
            <label className="field">
              <span className="label">Vezetéknév</span>
              <input
                type="text"
                name="lastName"
                value={form.lastName}
                onChange={handleChange}
                placeholder="Vezetéknév"
                pattern="[A-Za-zÀ-ž\s\-]+"
                title="Csak betűk, szóközök és kötőjel engedélyezett"
                required
              />
            </label>

            <label className="field">
              <span className="label">Keresztnév</span>
              <input
                type="text"
                name="firstName"
                value={form.firstName}
                onChange={handleChange}
                placeholder="Keresztnév"
                pattern="[A-Za-zÀ-ž\s\-]+"
                title="Csak betűk, szóközök és kötőjel engedélyezett"
                required
              />
            </label>
          </div>

          <label className="field">
            <span className="label">Telefonszám</span>
            <input
              type="tel"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="+36 30 716 0818"
              pattern="^(\+36|06)[\s\-]?[1-9][0-9][\s\-]?[0-9]{3}[\s\-]?[0-9]{4}$"
              title="Kérlek valós magyar telefonszámot adj meg (pl. +36 30 716 0818 vagy 06 30 716 0818)"
              required
            />
          </label>

          {/* 3. DÁTUM ÉS IDŐPONT */}
          <div className="field">
            <label className="date-field">
              <span className="label">Válassz dátumot</span>
              <input
                type="date"
                name="date"
                value={form.date}
                onChange={handleChange}
                min={getMinBookingDate()}
              />
            </label>

            <div className="time-slots-wrap">
              <span className="label">Válassz időpontot</span>
              <div className="time-slots">
                {slotsLoading ? (
                  <div className="muted">Betöltés…</div>
                ) : availableSlots.length === 0 ? (
                  <div className="muted">
                    Nincs elérhető időpont erre a napra. Válassz másik dátumot.
                  </div>
                ) : (
                  availableSlots.map((t) => {
                    const booked = bookedSlots.includes(t);
                    const selected = form.time === t;
                    return (
                      <button
                        key={t}
                        type="button"
                        className={`slot ${booked ? "booked" : "available"} ${
                          selected ? "selected" : ""
                        }`}
                        onClick={() => handleSlotClick(t)}
                        disabled={booked}
                        aria-pressed={selected}
                      >
                        {t}
                      </button>
                    );
                  })
                )}
              </div>
              <div className="slot-legend">
                <span>
                  {isCurrentlyOpen() ? (
                    <><strong style={{ color: '#27ae60' }}>● Jelenleg nyitva</strong> - {BUSINESS_HOURS.HOURS_TEXT}</>
                  ) : (
                    <><strong style={{ color: '#e74c3c' }}>● Jelenleg zárva</strong> - Nyitvatartás: {BUSINESS_HOURS.HOURS_TEXT}</>
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* 4. MEGJEGYZÉS */}
          <label className="field">
            <span className="label">Megjegyzés (opcionális)</span>
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              placeholder="Pl. érzékeny bőr, kérés..."
            />
          </label>

          <div className="form-actions">
            <button type="submit" className="primary" disabled={submitting}>
              {submitting ? "Küldés…" : "Időpont kérése"}
            </button>
            <button
              type="button"
              className="ghost"
              onClick={() =>
                setForm({
                  lastName: "",
                  firstName: "",
                  phone: "",
                  service: [],
                  date: getMinBookingDate(),
                  time: "",
                  notes: "",
                })
              }
            >
              Űrlap törlése
            </button>
          </div>
        </form>

        <aside className="booking-summary card" aria-live="polite">
          <h2>Rendelés áttekintés</h2>
          <div className="summary-item">
            <span className="summary-label">Név</span>
            <span>{form.lastName && form.firstName ? `${form.lastName} ${form.firstName}` : "—"}</span>
          </div>

          <div className="summary-item">
            <span className="summary-label">Telefonszám</span>
            <span>{form.phone || "—"}</span>
          </div>

          <div
            className="summary-item"
            style={{ flexDirection: "column", alignItems: "flex-start" }}
          >
            <span className="summary-label">Szolgáltatások</span>
            <div style={{ marginTop: 6 }}>
              {selectedServices.length ? (
                selectedServices.map((s) => (
                  <div
                    key={s.label}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 8,
                    }}
                  >
                    <span>{s.label}</span>
                    <span style={{ marginLeft: 12 }}>{s.price}</span>
                  </div>
                ))
              ) : (
                <span>—</span>
              )}
            </div>
          </div>

          <div className="summary-item">
            <span className="summary-label">Összesen</span>
            <span>
              {totalPrice
                ? new Intl.NumberFormat("hu-HU").format(totalPrice) + " Ft"
                : "—"}
            </span>
          </div>

          <div className="summary-item">
            <span className="summary-label">Dátum & idő</span>
            <span>
              {form.date && form.time ? `${form.date} ${form.time}` : "—"}
            </span>
          </div>

          <div className="summary-notes">
            <strong>Megjegyzés</strong>
            <p>{form.notes || "Nincs megjegyzés"}</p>
          </div>
        </aside>
      </div>
    </section>
  );
}

export default Booking;
