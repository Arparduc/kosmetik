import { useState, useEffect } from "react";
import { getAllServices, saveService, updateService, deleteService, permanentlyDeleteService } from "../lib/firebase";
import { slugify } from "../lib/utils";
import { migrateServicesToFirestore } from "../lib/migrateServices";
import "./AdminServices.css";

function AdminServices() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [migrating, setMigrating] = useState(false);
  const [form, setForm] = useState({
    label: "",
    price: "",
    duration: "",
    category: "Alap kezelések",
    active: true,
  });

  const categories = [
    "Alap kezelések",
    "Gyantázás",
    "Masszírozás",
    "Arckezelések",
  ];

  useEffect(() => {
    loadServices();
  }, []);

  async function loadServices() {
    setLoading(true);
    const data = await getAllServices();
    setServices(data);
    setLoading(false);
  }

  function handleEdit(service) {
    setEditingService(service);
    setForm({
      label: service.label,
      price: service.price.toString(),
      duration: service.duration.toString(),
      category: service.category || "Alap kezelések",
      active: service.active !== false,
    });
    setShowModal(true);
  }

  function handleAdd() {
    setEditingService(null);
    setForm({
      label: "",
      price: "",
      duration: "",
      category: "Alap kezelések",
      active: true,
    });
    setShowModal(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const serviceData = {
      slug: slugify(form.label),
      label: form.label,
      price: parseInt(form.price),
      duration: parseInt(form.duration),
      category: form.category,
      active: form.active,
    };

    try {
      if (editingService) {
        await updateService(editingService.id, serviceData);
        alert("Szolgáltatás sikeresen frissítve!");
      } else {
        await saveService(serviceData);
        alert("Szolgáltatás sikeresen hozzáadva!");
      }
      setShowModal(false);
      loadServices();
    } catch (err) {
      alert("Hiba történt a mentés során.");
      console.error(err);
    }
  }

  async function handleDeactivate(serviceId) {
    if (!confirm("Biztosan deaktiválod ezt a szolgáltatást?")) return;

    try {
      await deleteService(serviceId);
      alert("Szolgáltatás deaktiválva!");
      loadServices();
    } catch (err) {
      alert("Hiba történt a deaktiválás során.");
      console.error(err);
    }
  }

  async function handlePermanentDelete(serviceId) {
    if (!confirm("Biztosan véglegesen törlöd ezt a szolgáltatást? Ez a művelet NEM visszavonható!")) return;

    try {
      await permanentlyDeleteService(serviceId);
      alert("Szolgáltatás véglegesen törölve!");
      loadServices();
    } catch (err) {
      alert("Hiba történt a törlés során.");
      console.error(err);
    }
  }

  async function handleMigration() {
    if (!confirm("Ez importálni fogja az összes alapértelmezett szolgáltatást a Firestore-ba. Folytatod?")) return;

    setMigrating(true);
    try {
      const result = await migrateServicesToFirestore();
      alert(`Migráció befejezve!\nSikeres: ${result.success}\nSikertelen: ${result.error}`);
      loadServices();
    } catch (err) {
      alert("Hiba történt a migráció során.");
      console.error(err);
    } finally {
      setMigrating(false);
    }
  }

  const groupedServices = services.reduce((acc, service) => {
    const cat = service.category || "Egyéb";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(service);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="admin-services">
        <div className="services-loading">Betöltés...</div>
      </div>
    );
  }

  return (
    <div className="admin-services">
      <div className="services-header">
        <h2>Szolgáltatások kezelése</h2>
        <div className="header-actions">
          <button className="add-service-btn" onClick={handleAdd}>
            + Új szolgáltatás
          </button>
          {services.length === 0 && (
            <button
              className="migrate-btn"
              onClick={handleMigration}
              disabled={migrating}
            >
              {migrating ? "Importálás..." : "📥 Alapértelmezett szolgáltatások importálása"}
            </button>
          )}
        </div>
      </div>

      <div className="services-stats">
        <div className="stat-item">
          <span className="stat-number">{services.filter(s => s.active !== false).length}</span>
          <span className="stat-label">Aktív</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">{services.filter(s => s.active === false).length}</span>
          <span className="stat-label">Inaktív</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">{services.length}</span>
          <span className="stat-label">Összes</span>
        </div>
      </div>

      {Object.entries(groupedServices).map(([category, items]) => (
        <div key={category} className="service-category">
          <h3 className="category-title">{category}</h3>
          <div className="services-grid">
            {items.map((service) => (
              <div
                key={service.id}
                className={`service-card ${service.active === false ? "inactive" : ""}`}
              >
                <div className="service-card-header">
                  <h4>{service.label}</h4>
                  {service.active === false && (
                    <span className="inactive-badge">Inaktív</span>
                  )}
                </div>
                <div className="service-card-body">
                  <div className="service-info">
                    <span className="info-label">Ár:</span>
                    <span className="info-value">{new Intl.NumberFormat("hu-HU").format(service.price)} Ft</span>
                  </div>
                  <div className="service-info">
                    <span className="info-label">Időtartam:</span>
                    <span className="info-value">{service.duration} perc</span>
                  </div>
                </div>
                <div className="service-card-actions">
                  <button
                    className="edit-btn"
                    onClick={() => handleEdit(service)}
                  >
                    Szerkesztés
                  </button>
                  {service.active !== false ? (
                    <button
                      className="deactivate-btn"
                      onClick={() => handleDeactivate(service.id)}
                    >
                      Deaktiválás
                    </button>
                  ) : (
                    <button
                      className="delete-btn"
                      onClick={() => handlePermanentDelete(service.id)}
                    >
                      Törlés
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingService ? "Szolgáltatás szerkesztése" : "Új szolgáltatás"}</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}>
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="service-form">
              <div className="form-field">
                <label>Név *</label>
                <input
                  type="text"
                  value={form.label}
                  onChange={(e) => setForm({ ...form, label: e.target.value })}
                  placeholder="pl. Szemöldökigazítás"
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-field">
                  <label>Ár (Ft) *</label>
                  <input
                    type="number"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    placeholder="1000"
                    min="0"
                    required
                  />
                </div>

                <div className="form-field">
                  <label>Időtartam (perc) *</label>
                  <input
                    type="number"
                    value={form.duration}
                    onChange={(e) => setForm({ ...form, duration: e.target.value })}
                    placeholder="15"
                    min="5"
                    step="5"
                    required
                  />
                </div>
              </div>

              <div className="form-field">
                <label>Kategória *</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  required
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-field checkbox-field">
                <label>
                  <input
                    type="checkbox"
                    checked={form.active}
                    onChange={(e) => setForm({ ...form, active: e.target.checked })}
                  />
                  Aktív szolgáltatás
                </label>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => setShowModal(false)}
                >
                  Mégse
                </button>
                <button type="submit" className="submit-btn">
                  {editingService ? "Frissítés" : "Hozzáadás"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminServices;
