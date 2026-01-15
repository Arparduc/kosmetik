import { useNavigate } from "react-router-dom";
import { slugify } from "../lib/utils";
import packages from "../data/packages";

function TreatmentShop() {
  const navigate = useNavigate();

  const handleSelect = (pkg) => {
    const keys = (pkg.services || []).map((s) => slugify(s));
    try {
      localStorage.setItem("preselectedServices", JSON.stringify(keys));
      navigate("/booking");
    } catch (err) {
      console.error("Hiba a csomag kiválasztásakor:", err);
      alert("Hiba történt a csomag kiválasztásakor.");
    }
  };

  return (
    <section className="shop-section">
      <div className="shop-header">
        <h2>Ajánlott csomagok</h2>
        <p>
          Válassz előre összeállított kezelési csomagjaink közül, könnyített
          foglaláshoz.
        </p>
      </div>

      <div className="shop-grid">
        {packages.map((item) => (
          <article key={item.id} className="shop-card">
            <div className="shop-card-inner">
              <div className="shop-tag">{item.tag}</div>
              <h3 className="shop-name">{item.name}</h3>
              <p className="shop-description">{item.description}</p>
              <ul className="shop-services">
                {item.services.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
              <div className="shop-footer">
                {item.price && <span className="shop-price">{item.price}</span>}
                <button
                  type="button"
                  className="shop-button"
                  onClick={() => handleSelect(item)}
                >
                  Kiválasztás
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export default TreatmentShop;
