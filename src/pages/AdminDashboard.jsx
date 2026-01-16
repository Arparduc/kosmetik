import { useState, useEffect } from "react";
import { getAllBookings } from "../lib/firebase";
import "./AdminDashboard.css";

function AdminDashboard() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all, upcoming, past
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

  const today = new Date().toISOString().split("T")[0];

  const filteredBookings = bookings.filter((booking) => {
    // Filter by time
    if (filter === "upcoming" && booking.date < today) return false;
    if (filter === "past" && booking.date >= today) return false;

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
    upcoming: bookings.filter((b) => b.date >= today).length,
    past: bookings.filter((b) => b.date < today).length,
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
          <div className="stat-label">Összes foglalás</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{stats.upcoming}</div>
          <div className="stat-label">Közelgő</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{stats.past}</div>
          <div className="stat-label">Múltbeli</div>
        </div>
      </div>

      <div className="admin-controls">
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
              </tr>
            </thead>
            <tbody>
              {filteredBookings.map((booking) => (
                <tr key={booking.id}>
                  <td>{booking.date}</td>
                  <td>{booking.time}</td>
                  <td>{booking.name}</td>
                  <td>{booking.phone}</td>
                  <td className="email-cell">{booking.userEmail}</td>
                  <td>
                    <ul className="services-list">
                      {booking.services?.map((service, idx) => (
                        <li key={idx}>{service}</li>
                      ))}
                    </ul>
                  </td>
                  <td className="price-cell">{booking.totalPrice} Ft</td>
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
