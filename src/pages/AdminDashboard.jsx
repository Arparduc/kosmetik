import { useState, useEffect } from "react";
import { getAllBookings, approveBooking, rejectBooking, deleteBooking } from "../lib/firebase";
import { sendApprovalEmail, sendRejectionEmail } from "../lib/emailService";
import AdminCalendar from "./AdminCalendar";
import AdminServices from "./AdminServices";
import "./AdminDashboard.css";

function AdminDashboard() {
  const [view, setView] = useState("list"); // list, calendar, or services
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all, upcoming, past
  const [statusFilter, setStatusFilter] = useState("all"); // all, pending, approved, rejected
  const [searchTerm, setSearchTerm] = useState("");
  const [highlightedBooking, setHighlightedBooking] = useState(null);

  useEffect(() => {
    loadBookings();
  }, []);

  // Scroll to highlighted booking
  useEffect(() => {
    if (highlightedBooking && view === "list") {
      setTimeout(() => {
        const element = document.querySelector(`.booking-row.highlighted`);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 100);
    }
  }, [highlightedBooking, view]);

  async function loadBookings() {
    setLoading(true);
    const data = await getAllBookings();
    setBookings(data);
    setLoading(false);
  }

  async function handleApprove(bookingId) {
    if (!confirm("Biztosan jóváhagyod ezt a foglalást?")) return;

    try {
      // Foglalás jóváhagyása
      await approveBooking(bookingId);

      // Foglalás adatok lekérése email küldéshez
      const booking = bookings.find((b) => b.id === bookingId);

      // Debug: ellenőrizzük a booking adatokat
      console.log("📧 Email küldés - Booking adatok:", booking);
      console.log("📧 Email címzett:", booking?.userEmail);

      // Email küldése (háttérben, nem blokkol)
      if (booking && booking.userEmail) {
        sendApprovalEmail(booking)
          .then((result) => {
            if (result.success) {
              console.log("✅ Visszaigazoló email elküldve:", booking.userEmail);
            } else {
              console.warn("⚠️ Email küldése sikertelen, de a foglalás jóváhagyva.");
            }
          })
          .catch((err) => {
            console.error("❌ Email küldési hiba:", err);
          });
      } else {
        console.warn("⚠️ Nincs email cím a foglaláshoz, email nem kerül kiküldésre.");
        alert("Foglalás jóváhagyva! (Nincs email cím, értesítés nem került kiküldésre.)");
        loadBookings();
        return;
      }

      alert("Foglalás jóváhagyva! Email értesítés kiküldve.");
      loadBookings(); // Újratöltés
    } catch (err) {
      alert("Hiba történt a jóváhagyás során.");
    }
  }

  async function handleReject(bookingId) {
    if (!confirm("Biztosan elutasítod ezt a foglalást?")) return;

    try {
      // Foglalás elutasítása
      await rejectBooking(bookingId);

      // Foglalás adatok lekérése email küldéshez
      const booking = bookings.find((b) => b.id === bookingId);

      // Email küldése (háttérben, nem blokkol)
      if (booking && booking.userEmail) {
        sendRejectionEmail(booking)
          .then((result) => {
            if (result.success) {
              console.log("✅ Visszamondó email elküldve:", booking.userEmail);
            }
          })
          .catch((err) => {
            console.error("❌ Email küldési hiba:", err);
          });
      }

      alert("Foglalás elutasítva!");
      loadBookings(); // Újratöltés
    } catch (err) {
      alert("Hiba történt az elutasítás során.");
    }
  }

  async function handleDelete(bookingId) {
    if (!confirm("Biztosan törlöd ezt a foglalást? Ez véglegesen törli az adatbázisból, és az időpont újra szabaddá válik.")) return;

    try {
      // Foglalás adatok lekérése email küldéshez (törlés előtt!)
      const booking = bookings.find((b) => b.id === bookingId);

      // Foglalás törlése
      await deleteBooking(bookingId);

      // Email küldése CSAK akkor, ha jóváhagyott foglalást törlünk
      if (booking && booking.status === "approved" && booking.userEmail) {
        sendRejectionEmail(booking)
          .then((result) => {
            if (result.success) {
              console.log("✅ Lemondó email elküldve:", booking.userEmail);
            }
          })
          .catch((err) => {
            console.error("❌ Email küldési hiba:", err);
          });
      }

      alert("Foglalás törölve!");
      loadBookings(); // Újratöltés
    } catch (err) {
      alert("Hiba történt a törlés során.");
    }
  }

  function handleViewBooking(bookingId) {
    setView("list");
    setHighlightedBooking(bookingId);
    // 3 másodperc után töröljük a kiemelést
    setTimeout(() => {
      setHighlightedBooking(null);
    }, 3000);
  }

  const today = new Date().toISOString().split("T")[0];

  const filteredBookings = bookings.filter((booking) => {
    // Filter by time
    if (filter === "upcoming" && booking.date < today) return false;
    if (filter === "past" && booking.date >= today) return false;

    // Filter by status
    if (statusFilter !== "all" && booking.status !== statusFilter) return false;

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        booking.name?.toLowerCase().includes(term) ||
        booking.phone?.includes(term) ||
        booking.userEmail?.toLowerCase().includes(term) ||
        booking.date?.includes(term)
      );
    }

    return true;
  });

  const stats = {
    total: bookings.length,
    pending: bookings.filter((b) => b.status === "pending").length,
    approved: bookings.filter((b) => b.status === "approved").length,
    rejected: bookings.filter((b) => b.status === "rejected").length,
  };

  if (loading) {
    return (
      <div className="admin-dashboard">
        <div className="admin-loading">Betöltés...</div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <header className="admin-header">
        <div className="header-content">
          <div>
            <h1>Admin Dashboard</h1>
            <p className="admin-subtitle">Összes foglalás kezelése</p>
          </div>
          <div className="view-toggle">
            <button
              className={`view-btn ${view === "list" ? "active" : ""}`}
              onClick={() => setView("list")}
            >
              📋 Lista
            </button>
            <button
              className={`view-btn ${view === "calendar" ? "active" : ""}`}
              onClick={() => setView("calendar")}
            >
              📅 Naptár
            </button>
            <button
              className={`view-btn ${view === "services" ? "active" : ""}`}
              onClick={() => setView("services")}
            >
              💰 Szolgáltatások
            </button>
          </div>
        </div>
      </header>

      {view === "calendar" ? (
        <AdminCalendar onViewBooking={handleViewBooking} />
      ) : view === "services" ? (
        <AdminServices />
      ) : (
        <>

      <div className="admin-stats">
        <div
          className={`stat-card ${statusFilter === "all" ? "active" : ""}`}
          onClick={() => setStatusFilter("all")}
        >
          <div className="stat-number">{stats.total}</div>
          <div className="stat-label">Összes</div>
        </div>
        <div
          className={`stat-card pending ${statusFilter === "pending" ? "active" : ""}`}
          onClick={() => setStatusFilter("pending")}
        >
          <div className="stat-number">{stats.pending}</div>
          <div className="stat-label">Várakozó</div>
        </div>
        <div
          className={`stat-card approved ${statusFilter === "approved" ? "active" : ""}`}
          onClick={() => setStatusFilter("approved")}
        >
          <div className="stat-number">{stats.approved}</div>
          <div className="stat-label">Jóváhagyott</div>
        </div>
        <div
          className={`stat-card rejected ${statusFilter === "rejected" ? "active" : ""}`}
          onClick={() => setStatusFilter("rejected")}
        >
          <div className="stat-number">{stats.rejected}</div>
          <div className="stat-label">Elutasított</div>
        </div>
      </div>

      <div className="admin-controls">
        <div className="filter-section">
          <label className="filter-label">Időszak:</label>
          <div className="filter-buttons">
            <button
              className={`filter-btn ${filter === "all" ? "active" : ""}`}
              onClick={() => setFilter("all")}
            >
              Összes
            </button>
            <button
              className={`filter-btn ${filter === "upcoming" ? "active" : ""}`}
              onClick={() => setFilter("upcoming")}
            >
              Közelgő
            </button>
            <button
              className={`filter-btn ${filter === "past" ? "active" : ""}`}
              onClick={() => setFilter("past")}
            >
              Múltbeli
            </button>
          </div>
        </div>

        <div className="filter-section">
          <label className="filter-label">Státusz:</label>
          <div className="filter-buttons">
            <button
              className={`filter-btn ${statusFilter === "all" ? "active" : ""}`}
              onClick={() => setStatusFilter("all")}
            >
              Összes
            </button>
            <button
              className={`filter-btn status-pending ${statusFilter === "pending" ? "active" : ""}`}
              onClick={() => setStatusFilter("pending")}
            >
              Várakozó
            </button>
            <button
              className={`filter-btn status-approved ${statusFilter === "approved" ? "active" : ""}`}
              onClick={() => setStatusFilter("approved")}
            >
              Jóváhagyott
            </button>
            <button
              className={`filter-btn status-rejected ${statusFilter === "rejected" ? "active" : ""}`}
              onClick={() => setStatusFilter("rejected")}
            >
              Elutasított
            </button>
          </div>
        </div>

        <input
          type="text"
          className="search-input"
          placeholder="Keresés név, telefon, email vagy dátum alapján..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {filteredBookings.length === 0 ? (
        <div className="admin-empty">
          <p>Nincs megjeleníthető foglalás</p>
        </div>
      ) : (
        <div className="bookings-table-container">
          <table className="bookings-table">
            <thead>
              <tr>
                <th>Dátum</th>
                <th>Idő</th>
                <th>Név</th>
                <th>Telefon</th>
                <th>Email</th>
                <th>Szolgáltatások</th>
                <th>Ár</th>
                <th>Státusz</th>
                <th>Műveletek</th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.map((booking) => (
                <tr
                  key={booking.id}
                  className={`booking-row status-${booking.status || 'pending'} ${highlightedBooking === booking.id ? 'highlighted' : ''}`}
                >
                  <td data-label="Dátum">{booking.date}</td>
                  <td data-label="Idő">{booking.time}</td>
                  <td data-label="Név">{booking.name}</td>
                  <td data-label="Telefon">{booking.phone}</td>
                  <td data-label="Email" className="email-cell">{booking.userEmail}</td>
                  <td data-label="Szolgáltatások">
                    <ul className="services-list">
                      {booking.servicesMeta?.map((service, idx) => (
                        <li key={idx}>{service.label}</li>
                      ))}
                    </ul>
                  </td>
                  <td data-label="Ár" className="price-cell">
                    {booking.totalPrice
                      ? new Intl.NumberFormat("hu-HU").format(booking.totalPrice) + " Ft"
                      : "—"}
                  </td>
                  <td data-label="Státusz">
                    <span className={`status-badge status-${booking.status || 'pending'}`}>
                      {booking.status === "pending" && "⏳"}
                      {booking.status === "approved" && "✅"}
                      {booking.status === "rejected" && "❌"}
                      {!booking.status && "⏳"}
                    </span>
                  </td>
                  <td data-label="Műveletek" className="actions-cell">
                    <div className="action-buttons">
                      {booking.status === "pending" || !booking.status ? (
                        <>
                          <button
                            className="approve-btn"
                            onClick={() => handleApprove(booking.id)}
                            title="Jóváhagy"
                          >
                            ✓
                          </button>
                          <button
                            className="reject-btn"
                            onClick={() => handleReject(booking.id)}
                            title="Elutasít"
                          >
                            ✗
                          </button>
                        </>
                      ) : (
                        <span className="no-actions">—</span>
                      )}
                      <button
                        className="delete-btn"
                        onClick={() => handleDelete(booking.id)}
                        title="Törlés"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
        </>
      )}
    </div>
  );
}

export default AdminDashboard;
