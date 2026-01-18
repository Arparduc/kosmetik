import { useEffect, useState } from "react";
import "./Booking.css";
import { saveBooking, getBookingsByDate } from "../lib/firebase";
import { slugify, timeToMinutes, minutesToTime } from "../lib/utils";
import { useAuth } from "../contexts/AuthContext";

// --- helpers (IDŐ SZÁMOLÁS) ---
// Minimum foglalható dátum kiszámítása (mai nap + 2 nap, vasárnap kihagyva)
function getMinBookingDate() {
  const today = new Date();
  const minDate = new Date(today);
  minDate.setDate(today.getDate() + 2); // +2 nap előretekintés

  // Ha vasárnap lenne (0), akkor még +1 nap (hétfő)
  if (minDate.getDay() === 0) {
    minDate.setDate(minDate.getDate() + 1);
  }

  return minDate.toISOString().split("T")[0];
}

function expandBookingToSlots(booking, step = 15) {
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
  for (let m = startM; m < endM; m += 15) {
    slots.push(minutesToTime(m));
  }
  return slots;
}

// Szolgáltatások konfigurációja (komponens szinten kívül a teljesítmény javítása érdekében)
const services = {
    // Alap kezelések
    [slugify("Szemöldökigazítás")]: {
      label: "Szemöldökigazítás",
      price: "1 000 Ft",
      duration: 15,
    },
    [slugify("Szemöldökfestés")]: {
      label: "Szemöldökfestés",
      price: "1 500 Ft",
      duration: 15,
    },
    [slugify("Szempillafestés")]: {
      label: "Szempillafestés",
      price: "1 500 Ft",
      duration: 20,
    },
    [slugify("Bajuszgyanta")]: {
      label: "Bajuszgyanta",
      price: "500 Ft",
      duration: 5,
    },
    [slugify("Arcgyanta")]: {
      label: "Arcgyanta",
      price: "800 Ft",
      duration: 10,
    },

    // Gyantázás
    [slugify("Hónaljgyanta")]: {
      label: "Hónaljgyanta",
      price: "1 500 Ft",
      duration: 10,
    },
    [slugify("Kargyanta (félig)")]: {
      label: "Kargyanta (félig)",
      price: "2 000 Ft",
      duration: 10,
    },
    [slugify("Kargyanta (teljes)")]: {
      label: "Kargyanta (teljes)",
      price: "2 500 Ft",
      duration: 15,
    },
    [slugify("Lábszárgyanta")]: {
      label: "Lábszárgyanta",
      price: "2 200 Ft",
      duration: 10,
    },
    [slugify("Lábgyanta (teljes)")]: {
      label: "Lábgyanta (teljes)",
      price: "3 800 Ft",
      duration: 20,
    },
    [slugify("Bikinivonalgyanta")]: {
      label: "Bikinivonalgyanta",
      price: "2 500 Ft",
      duration: 10,
    },
    [slugify("Teljes fazon gyanta")]: {
      label: "Teljes fazon gyanta",
      price: "4 000 Ft",
      duration: 30,
    },
    [slugify("Hasgyanta")]: {
      label: "Hasgyanta",
      price: "4 000 Ft",
      duration: 10,
    },
    [slugify("Férfi hátgyanta")]: {
      label: "Férfi hátgyanta",
      price: "3 500 Ft",
      duration: 15,
    },
    [slugify("Férfi mellkasgyanta")]: {
      label: "Férfi mellkasgyanta",
      price: "3 500 Ft",
      duration: 10,
    },

    // Masszírozás
    [slugify("Arcmasszázs")]: {
      label: "Arcmasszázs",
      price: "5 000 Ft",
      duration: 25,
    },
    [slugify("Arc- és dekoltázsmasszázs")]: {
      label: "Arc- és dekoltázsmasszázs",
      price: "6 000 Ft",
      duration: 25,
    },
    [slugify("Masszázs kezelésben")]: {
      label: "Masszázs kezelésben",
      price: "2 000 Ft",
      duration: 25,
    },

    // Arckezelések
    [slugify("Radír + maszk")]: {
      label: "Radír + maszk",
      price: "3 500 Ft",
      duration: 15,
    },
    [slugify("Tini kezelés")]: {
      label: "Tini kezelés",
      price: "8 000 Ft",
      duration: 60,
    },
    [slugify("Tisztító kezelés")]: {
      label: "Tisztító kezelés",
      price: "10 000 Ft",
      duration: 60,
    },
    [slugify("Glycopure kezelés")]: {
      label: "Glycopure kezelés",
      price: "9 500 Ft",
      duration: 60,
    },
    [slugify("Bioplasma kezelés")]: {
      label: "Bioplasma kezelés",
      price: "11 500 Ft",
      duration: 60,
    },
    [slugify("Nutri-Peptide kezelés")]: {
      label: "Nutri-Peptide kezelés",
      price: "12 500 Ft",
      duration: 60,
    },
    [slugify("Ester C kezelés")]: {
      label: "Ester C kezelés",
      price: "13 500 Ft",
      duration: 60,
    },
    [slugify("New Age G4 kezelés")]: {
      label: "New Age G4 kezelés",
      price: "17 000 Ft",
      duration: 60,
    },
  };

function Booking() {
  const { user } = useAuth();
  const [form, setForm] = useState({
    name: "",
    phone: "",
    service: [],
    date: getMinBookingDate(),
    time: "",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [bookedSlots, setBookedSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);

  // Pre-fill form with user data
  useEffect(() => {
    if (user) {
      setForm((prev) => ({
        ...prev,
        name: user.displayName || "",
      }));
    }
  }, [user]);

  // Load preselected services from TreatmentShop (if any)
  useEffect(() => {
    try {
      const raw = localStorage.getItem("preselectedServices");
      if (!raw) return;
      const arr = JSON.parse(raw);
      if (Array.isArray(arr) && arr.length) {
        setForm((p) => ({ ...p, service: arr }));
        localStorage.removeItem("preselectedServices");
      }
    } catch (err) {
      console.warn("no preselected services", err);
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
      userId: user?.uid,
      userEmail: user?.email,
      userName: user?.displayName || form.name,
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
          Add meg adataidat és válaszd ki a szolgáltatást. A végleges időpontot
          a kozmetikus fogja visszaigazolni.
        </p>
      </header>

      <div className="booking-grid">
        <div className="calendar-card card">
          <label className="field">
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
                <strong>Jelenleg nyitva:</strong> 08:00–17:00
              </span>
            </div>
          </div>
        </div>
        <form
          className="booking-form card"
          onSubmit={handleSubmit}
          aria-label="Időpontfoglalás űrlap"
        >
          <div className="field-row">
            <label className="field">
              <span className="label">Név</span>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Teljes név"
                required
              />
            </label>

            <label className="field">
              <span className="label">Telefonszám</span>
              <input
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="Pl. +36 70 123 4567"
                required
              />
            </label>
          </div>

          <label className="field">
            <span className="label">Szolgáltatások (több is választható)</span>
            <div className="service-list">
              {Object.entries(services).map(([key, s]) => (
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
                    <span className="service-name">{s.label}</span>
                    <span className="service-price">{s.price}</span>
                  </div>
                </label>
              ))}
            </div>
          </label>

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
                  name: "",
                  phone: "",
                  service: [],
                  date: "",
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
            <span>{form.name || "—"}</span>
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
