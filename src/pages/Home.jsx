import { Link } from "react-router-dom";
import heroImg from "../assets/images/gallery-06-mask-application.jpg";
import "./Home.css";

function Home() {
  return (
    <main>
      <header
        className="home-hero"
        style={{ backgroundImage: `url(${heroImg})` }}
        aria-hidden={false}
      >
        <div className="hero-content">
          <h1>Black Beauty kozmetika</h1>
          <Link to="/booking" className="hero-cta shop-button">
            Időpontfoglalás
          </Link>
        </div>
      </header>

      <section>
        <h2>Üdvözöllek a Black Beauty-ben!</h2>
        <p>
          Számomra a kozmetika több mint szépítő kezelések sora – egy olyan élmény,
          ahol a szakértelem, a minőség és a törődés találkozik. Hiszek abban, hogy a
          szép bőr alapja a személyre szabott figyelem, ezért minden kezelést a bőr
          aktuális állapotához és egyéni igényeihez igazítok.
        </p>
        <p>
          A Black Beauty-ben prémium minőségű termékekkel, nyugodt, biztonságos
          környezetben várlak, ahol valóban megállhatsz egy pillanatra. Célom, hogy ne
          csak látható eredménnyel, hanem feltöltődve, kiegyensúlyozottan és elégedetten
          távozz – mert a szépség akkor a legszebb, amikor jól is érzed magad a bőrödben.
        </p>
        <p>
          Ha egy kis luxusra, odafigyelésre és valódi énidőre vágysz, jó helyen jársz.
        </p>
      </section>
    </main>
  );
}

export default Home;
