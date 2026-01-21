import "./Booking.css";
import { CONTACT_INFO, BUSINESS_HOURS } from "../constants/business";

function Contact() {
  return (
    <section className="booking">
      <div style={{ maxWidth: "600px", margin: "0 auto" }}>
        <header style={{ textAlign: "center", marginBottom: "2rem" }}>
          <h1 style={{ marginBottom: "0.5rem" }}>Kapcsolat</h1>
          <p className="muted" style={{ margin: "0" }}>
            Lépj velünk kapcsolatba bármelyik elérhetőségünkön keresztül!
          </p>
        </header>

        <div className="card">
          <h2>Elérhetőségek</h2>
          <p>
            <strong>Cím:</strong> {CONTACT_INFO.ADDRESS}
          </p>
          <p>
            <strong>Telefon:</strong> <a href={`tel:${CONTACT_INFO.PHONE.replace(/\s/g, '')}`}>{CONTACT_INFO.PHONE}</a>
          </p>
          <p>
            <strong>Email:</strong> <a href={`mailto:${CONTACT_INFO.EMAIL}`}>{CONTACT_INFO.EMAIL}</a>
          </p>
          <p>
            <strong>Facebook:</strong> <a href={CONTACT_INFO.FACEBOOK_URL} target="_blank" rel="noreferrer">Black Beauty</a>
          </p>
          <p>
            <strong>Nyitvatartás:</strong> {BUSINESS_HOURS.HOURS_TEXT}
          </p>

          <p style={{ marginTop: "1.5rem" }}>
            <a
              href="https://www.google.com/maps/search/?api=1&query=F%C5%91+%C3%BAt+70.%2C+Csongr%C3%A1d%2C+6640"
              target="_blank"
              rel="noreferrer"
              className="primary"
              style={{ display: "inline-block", padding: "0.7rem 1rem", borderRadius: "8px", textDecoration: "none" }}
            >
              📍 Megnyitás térképen
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}

export default Contact;
