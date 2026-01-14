import { useEffect, useState } from "react";
import "./Booking.css";
import { saveBooking, getBookingsByDate } from "../lib/firebase";

function Booking() {
  // --- helpers (IDŐ SZÁMOLÁS) ---
  function timeToMinutes(t) {
    const [h, m] = (t || "0:0").split(":").map(Number);
    return h * 60 + m;
  }

  function minutesToTime(mins) {
    const h = String(Math.floor(mins / 60)).padStart(2, "0");
    const m = String(mins % 60).padStart(2, "0");
    return `${h}:${m}`;
  }

  function expandBookingToSlots(booking, step = 30) {
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
    for (let m = startM; m < endM; m += 30) {
      slots.push(minutesToTime(m));
    }
    return slots;
  }

  function slugify(text) {
    return text
      .toString()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\w\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .toLowerCase();
  }

  const services = {
    // Alap kezelések
    [slugify("Szemöldökigazítás")]: {
      label: "Szemöldökigazítás",
      price: "1 000 Ft",
      duration: 30,
    },
    [slugify("Szemöldökfestés")]: {
      label: "Szemöldökfestés",
      price: "1 500 Ft",
      duration: 30,
    },
    [slugify("Szempillafestés")]: {
      label: "Szempillafestés",
      price: "1 500 Ft",
      duration: 30,
    },
    [slugify("Bajuszgyanta")]: {
      label: "Bajuszgyanta",
      price: "500 Ft",
      duration: 30,
    },
    [slugify("Arcgyanta")]: {
      label: "Arcgyanta",
      price: "800 Ft",
      duration: 30,
    },

    // Gyantázás
    [slugify("Hónaljgyanta")]: {
      label: "Hónaljgyanta",
      price: "1 500 Ft",
      duration: 30,
    },
    [slugify("Kargyanta (félig)")]: {
      label: "Kargyanta (félig)",
      price: "2 000 Ft",
      duration: 30,
    },
    [slugify("Kargyanta (teljes)")]: {
      label: "Kargyanta (teljes)",
      price: "2 500 Ft",
      duration: 30,
    },
    [slugify("Lábszárgyanta")]: {
      label: "Lábszárgyanta",
      price: "2 200 Ft",
      duration: 30,
    },
    [slugify("Lábgyanta (teljes)")]: {
      label: "Lábgyanta (teljes)",
      price: "3 800 Ft",
      duration: 30,
    },
    [slugify("Bikinivonalgyanta")]: {
      label: "Bikinivonalgyanta",
      price: "2 500 Ft",
      duration: 30,
    },
    [slugify("Teljes fazon gyanta")]: {
      label: "Teljes fazon gyanta",
      price: "4 000 Ft",
      duration: 30,
    },
    [slugify("Hasgyanta")]: {
      label: "Hasgyanta",
      price: "4 000 Ft",
      duration: 30,
    },
    [slugify("Férfi hátgyanta")]: {
      label: "Férfi hátgyanta",
      price: "3 500 Ft",
      duration: 30,
    },
    [slugify("Férfi mellkasgyanta")]: {
      label: "Férfi mellkasgyanta",
      price: "3 500 Ft",
      duration: 30,
    },

    // Masszírozás
    [slugify("Arcmasszázs")]: {
      label: "Arcmasszázs",
      price: "5 000 Ft",
      duration: 30,
    },
    [slugify("Arc- és dekoltázsmasszázs")]: {
      label: "Arc- és dekoltázsmasszázs",
      price: "6 000 Ft",
      duration: 30,
    },
    [slugify("Masszázs kezelésben")]: {
      label: "Masszázs kezelésben",
      price: "2 000 Ft",
      duration: 30,
    },

    // Arckezelések
    [slugify("Radír + maszk")]: {
      label: "Radír + maszk",
      price: "3 500 Ft",
      duration: 30,
    },
    [slugify("Tini kezelés")]: {
      label: "Tini kezelés",
      price: "8 000 Ft",
      duration: 30,
    },
    [slugify("Tisztító kezelés")]: {
      label: "Tisztító kezelés",
      price: "10 000 Ft",
      duration: 30,
    },
    [slugify("Glycopure kezelés")]: {
      label: "Glycopure kezelés",
      price: "9 500 Ft",
      duration: 30,
    },
    [slugify("Bioplasma kezelés")]: {
      label: "Bioplasma kezelés",
      price: "11 500 Ft",
      duration: 30,
    },
    [slugify("Nutri-Peptide kezelés")]: {
      label: "Nutri-Peptide kezelés",
      price: "12 500 Ft",
      duration: 30,
    },
    [slugify("Ester C kezelés")]: {
      label: "Ester C kezelés",
      price: "13 500 Ft",
      duration: 30,
    },
    [slugify("New Age G4 kezelés")]: {
      label: "New Age G4 kezelés",
      price: "17 000 Ft",
      duration: 30,
    },
  };

  const [form, setForm] = useState({
    name: "",
    phone: "",
    service: [],
    date: new Date().toISOString().slice(0, 10),
    time: "",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [bookedSlots, setBookedSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState("");

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
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    console.log("SUBMIT lefutott!", form);
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
      services: form.service,
      servicesMeta: selectedServices,
      totalPrice,
      durationMinutes,
    };

    try {
      console.log("MENTÉS INDUL -> payload:", payload);

      const res = await saveBooking(payload);

      console.log("MENTÉS SIKERES, ID:", res?.id);
      alert(
        "Köszönjük! Az időpontkérést rögzítettük. Hamarosan visszaigazoljuk."
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
      console.log("MENTÉS HIBA (raw):", err);
      console.log("MENTÉS HIBA (message):", err?.message);
      console.log("MENTÉS HIBA (code):", err?.code);
      console.log("MENTÉS HIBA (stack):", err?.stack);

      alert("Hiba történt a mentés során. Nézd meg a Console-t (F12).");
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

        const allBooked = items.flatMap((b) => expandBookingToSlots(b, 30));
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

  function generateTimeSlots(start = "08:00", end = "17:00", stepMinutes = 30) {
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

  const allSlots = generateTimeSlots();

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
    setSelectedSlot(t);
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
            <span className="label">Válassz dátum</span>
            <input
              type="date"
              name="date"
              value={form.date}
              onChange={handleChange}
            />
          </label>

          <div className="time-slots-wrap">
            <div className="time-slots">
              {slotsLoading ? (
                <div className="muted">Betöltés…</div>
              ) : (
                allSlots.map((t) => {
                  const booked = bookedSlots.includes(t);
                  const selected = form.time === t || selectedSlot === t;
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

          <div className="field-row">
            <label className="field">
              <span className="label">Dátum</span>
              <input
                type="date"
                name="date"
                value={form.date}
                onChange={handleChange}
                required
              />
            </label>

            <label className="field">
              <span className="label">Időpont</span>
              <input
                type="time"
                name="time"
                value={form.time}
                onChange={handleChange}
                required
              />
            </label>
          </div>

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
