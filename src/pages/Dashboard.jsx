import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { getUserBookings } from "../lib/firebase";
import "./Dashboard.css";

function Dashboard() {
  const { user, logout } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBookings() {
      if (user) {
        setLoading(true);
        const data = await getUserBookings(user.uid);
        setBookings(data);
        setLoading(false);
      }
    }

    fetchBookings();
  }, [user]);

  const handleLogout = async () => {
    const { error } = await logout();
    if (error) {
      alert(error);
    }
  };

  return (
    <section className="dashboard">
      <h1>Profilom</h1>

      <div className="dashboard-grid">
        <div className="profile-card card">
          <div className="profile-header">
            {user?.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName || "User"}
                className="profile-avatar"
              />
            ) : (
              <div className="profile-avatar-placeholder">
                {user?.displayName?.charAt(0) || user?.email?.charAt(0) || "U"}
              </div>
            )}
            <div className="profile-info">
              <h2>{user?.displayName || "Ismeretlen"}</h2>
              <p className="profile-email">{user?.email}</p>
            </div>
          </div>

          <button
            type="button"
            className="logout-btn"
            onClick={handleLogout}
          >
            Kijelentkezés
          </button>
        </div>

        <div className="bookings-section card">
          <h2>Foglalásaim</h2>

          {loading ? (
            <div className="loading-state">
              <p>Foglalások betöltése...</p>
            </div>
          ) : bookings.length === 0 ? (
            <div className="empty-state">
              <p>Még nincs foglalásod</p>
              <Link to="/booking" className="book-now-btn">
                Időpont foglalása
              </Link>
            </div>
          ) : (
            <div className="bookings-list">
              {bookings.map((booking) => (
                <div key={booking.id} className="booking-item">
                  <div className="booking-header">
                    <span className="booking-date">
                      {booking.date} {booking.time}
                    </span>
                  </div>

                  <div className="booking-services">
                    {booking.servicesMeta?.map((service, idx) => (
                      <div key={idx} className="service-item">
                        <span className="service-name">{service.label}</span>
                        <span className="service-price">{service.price}</span>
                      </div>
                    ))}
                  </div>

                  <div className="booking-footer">
                    <strong>Összesen:</strong>
                    <span className="booking-total">
                      {booking.totalPrice
                        ? new Intl.NumberFormat("hu-HU").format(
                            booking.totalPrice
                          ) + " Ft"
                        : "—"}
                    </span>
                  </div>

                  {booking.notes && (
                    <div className="booking-notes">
                      <strong>Megjegyzés:</strong> {booking.notes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default Dashboard;
