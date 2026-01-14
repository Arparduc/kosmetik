import { Link } from "react-router-dom";
import heroImg from "../assets/images/gallery-11-portrait.jpg";
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
        <h2>Üdvözöl a Black Beauty</h2>
        <p>
          Barátságos, hangulatos kozmetikai szalon, ahol a fókusz a pihenésen és
          a felfrissülésen van.
        </p>
        <p>
          Nézd meg szolgáltatásainkat, árainkat, és foglalj időpontot pár
          kattintással!
        </p>
      </section>
    </main>
  );
}

export default Home;
