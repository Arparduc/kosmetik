import { useState, useEffect } from "react";
import { getAllBookings, approveBooking, rejectBooking } from "../lib/firebase";
import "./AdminDashboard.css";

function AdminDashboard() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all, upcoming, past
  const [statusFilter, setStatusFilter] = useState("all"); // all, pending, approved, rejected
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadBookings();
  }, []);

  async function loadBookings() {
    setLoading(true);
    const data = await getAllBookings();
    setBookings(data);
    setLoading(false);
  }

  async function handleApprove(bookingId) {
    if (!confirm("Biztosan jóváhagyod ezt a foglalást?")) return;

    try {
      await approveBooking(bookingId);
      alert("Foglalás jóváhagyva!");
      loadBookings(); // Újratöltés
    } catch (err) {
      alert("Hiba történt a jóváhagyás során.");
    }
  }

  async function handleReject(bookingId) {
    if (!confirm("Biztosan elutasítod ezt a foglalást?")) return;

    try {
      await rejectBooking(bookingId);
      alert("Foglalás elutasítva!");
      loadBookings(); // Újratöltés
    } catch (err) {
      alert("Hiba történt az elutasítás során.");
    }
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
        <h1>Admin Dashboard</h1>
        <p className="admin-subtitle">Összes foglalás kezelése</p>
      </header>

      <div className="admin-stats">
        <div className="stat-card">
          <div className="stat-number">{stats.total}</div>
          <div className="stat-label">Összes</div>
        </div>
        <div className="stat-card pending">
          <div className="stat-number">{stats.pending}</div>
          <div className="stat-label">Várakozó</div>
        </div>
        <div className="stat-card approved">
          <div className="stat-number">{stats.approved}</div>
          <div className="stat-label">Jóváhagyott</div>
        </div>
        <div className="stat-card rejected">
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
                <tr key={booking.id} className={`booking-row status-${booking.status || 'pending'}`}>
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
                      {booking.status === "pending" && "Várakozó"}
                      {booking.status === "approved" && "Jóváhagyva"}
                      {booking.status === "rejected" && "Elutasítva"}
                      {!booking.status && "Várakozó"}
                    </span>
                  </td>
                  <td data-label="Műveletek" className="actions-cell">
                    {booking.status === "pending" || !booking.status ? (
                      <div className="action-buttons">
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
                      </div>
                    ) : (
                      <span className="no-actions">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;
