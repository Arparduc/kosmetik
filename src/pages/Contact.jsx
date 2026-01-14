import { useState } from "react";
import "./Booking.css";

function Contact() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    console.log("Contact message:", form);
    alert("Köszönjük! Az üzenetedet megkaptuk (demo).");
    setForm({ name: "", email: "", message: "" });
  }

  return (
    <section className="booking">
      <header className="booking-header">
        <h1>Kapcsolat</h1>
        <p className="muted">
          Elérhetőségeink és gyors kapcsolatfelvételi űrlap.
        </p>
      </header>

      <div className="booking-grid">
        <aside className="card">
          <h2>Elérhetőségek</h2>
          <p>
            <strong>Cím:</strong> Itt majd a szalon címe
          </p>
          <p>
            <strong>Telefon:</strong> +36 70 123 4567
          </p>
          <p>
            <strong>Email:</strong> info@kosmetik.hu
          </p>
          <p>
            <strong>Nyitvatartás:</strong> H–P 9:00–18:00
          </p>

          <p style={{ marginTop: "0.75rem" }}>
            <a href="https://maps.google.com" target="_blank" rel="noreferrer">
              Megnyitás térképen
            </a>
          </p>
        </aside>

        <form
          className="card booking-form"
          onSubmit={handleSubmit}
          aria-label="Kapcsolat űrlap"
        >
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
            <span className="label">Email</span>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="email@pelda.hu"
              required
            />
          </label>

          <label className="field">
            <span className="label">Üzenet</span>
            <textarea
              name="message"
              value={form.message}
              onChange={handleChange}
              placeholder="Írd ide az üzeneted..."
              required
            />
          </label>

          <div className="form-actions">
            <button type="submit" className="primary">
              Küldés
            </button>
            <button
              type="button"
              className="ghost"
              onClick={() => setForm({ name: "", email: "", message: "" })}
            >
              Törlés
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}

export default Contact;
