import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { slugify } from "../lib/utils";
import imgArckezeles from "../assets/images/gallery-06-mask-application.jpg";
import imgGepi from "../assets/images/gallery-03-device-treatment.jpg";
import imgProducts from "../assets/images/gallery-10-products-close.jpg";
import imgHangulat from "../assets/images/gallery-02-treatment-full.jpg";
import imgReception from "../assets/images/gallery-07-reception.jpg";

const serviceGroups = [
  {
    category: "Alap kezelések",
    items: [
      { name: "Szemöldökigazítás", price: "1 000 Ft" },
      { name: "Szemöldökfestés", price: "1 500 Ft" },
      { name: "Szempillafestés", price: "1 500 Ft" },
      { name: "Bajuszgyanta", price: "500 Ft" },
      { name: "Arcgyanta", price: "800 Ft" },
    ],
  },
  {
    category: "Gyantázás",
    items: [
      { name: "Hónaljgyanta", price: "1 500 Ft" },
      { name: "Kargyanta (félig)", price: "2 000 Ft" },
      { name: "Kargyanta (teljes)", price: "2 500 Ft" },
      { name: "Lábszárgyanta", price: "2 200 Ft" },
      { name: "Lábgyanta (teljes)", price: "3 800 Ft" },
      { name: "Bikinivonalgyanta", price: "2 500 Ft" },
      { name: "Teljes fazon gyanta", price: "4 000 Ft" },
      { name: "Hasgyanta", price: "4 000 Ft" },
      { name: "Férfi hátgyanta", price: "3 500 Ft" },
      { name: "Férfi mellkasgyanta", price: "3 500 Ft" },
    ],
  },
  {
    category: "Masszírozás",
    items: [
      { name: "Arcmasszázs", price: "5 000 Ft" },
      { name: "Arc- és dekoltázsmasszázs", price: "6 000 Ft" },
      { name: "Masszázs kezelésben", price: "2 000 Ft" },
    ],
  },
  {
    category: "Arckezelések",
    items: [
      { name: "Radír + maszk", price: "3 500 Ft" },
      { name: "Tini kezelés", price: "8 000 Ft" },
      { name: "Tisztító kezelés", price: "10 000 Ft" },
      { name: "Glycopure kezelés", price: "9 500 Ft" },
      { name: "Bioplasma kezelés", price: "11 500 Ft" },
      { name: "Nutri-Peptide kezelés", price: "12 500 Ft" },
      { name: "Ester C kezelés", price: "13 500 Ft" },
      { name: "New Age G4 kezelés", price: "17 000 Ft" },
    ],
  },
];

function Services() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState(null);

  const handleSelect = (serviceName) => {
    try {
      const key = slugify(serviceName);
      localStorage.setItem("preselectedServices", JSON.stringify([key]));
      setSelected(serviceName);
      setTimeout(() => {
        navigate("/booking");
      }, 350);
    } catch (err) {
      console.error("Hiba a szolgáltatás kiválasztásakor:", err);
      alert("Hiba történt a szolgáltatás kiválasztásakor.");
    }
  };

  return (
    <section>
      <h1>Szolgáltatások és árlista</h1>

      <p className="services-intro">
        Az alábbi listában megtalálod a leggyakrabban kért kezeléseket. Az árak
        tájékoztató jellegűek, bőröd és igényeid alapján személyre szabott
        javaslatot kapsz a szalonban.
      </p>

      {serviceGroups.map((group) => {
        const sectionImages = {
          "Alap kezelések": imgReception,
          Gyantázás: imgHangulat,
          Arckezelések: imgArckezeles,
          "Különleges arckezelések": imgGepi,
        };

        const imageFor = sectionImages[group.category] || imgProducts;

        return (
          <div key={group.category} className="service-group">
            <div
              className="section-image"
              style={{ backgroundImage: `url(${imageFor})` }}
              aria-hidden="true"
            />

            <div className="service-group-header">
              <h2>{group.category}</h2>
              {group.note && <span>{group.note}</span>}
            </div>

            <div className="shop-grid services-list">
              {group.items.map((item) => (
                <article
                  key={item.name}
                  className={`shop-card ${
                    selected === item.name ? "selected" : ""
                  }`}
                >
                  <div className="shop-card-inner">
                    <h3 className="shop-name">{item.name}</h3>
                    <p className="shop-description">
                      egyéni igényekhez igazítva
                    </p>
                    <div className="shop-footer" style={{ marginTop: "auto" }}>
                      <span className="shop-price">{item.price}</span>
                      <button
                        type="button"
                        className="shop-button"
                        onClick={() => handleSelect(item.name)}
                      >
                        Kiválasztás
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        );
      })}
    </section>
  );
}

export default Services;
