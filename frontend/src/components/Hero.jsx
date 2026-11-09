import "./Hero.css";

// A négy statisztika adatai. Ezt a listát járjuk végig a .map()-pel lent.
const stats = [
  { value: "500+", label: "Elégedett ügyfél" },
  { value: "12 év", label: "Tapasztalat" },
  { value: "24/7", label: "Ügyfélszolgálat" },
  { value: "98%", label: "Pozitív értékelés" },
];

export default function Hero() {
  return (
    <section className="hero">
      <div className="container hero-grid">
        {/* Bal oldal: szöveg */}
        <div>
          <div className="hero-badge">Szabad időpont elérhető</div>

          <h1 className="hero-title">
            <span>Csákó</span>
            <span className="gradient-text">Klíma</span>
          </h1>

          <p className="hero-description">
            Profi klímaszerelés, karbantartás és szerviz Budapesten és környékén.
            12 éves tapasztalattal és 500+ elégedett ügyféllel.
          </p>

          <div className="hero-buttons">
            <button className="button button-primary">Időpontot foglalok</button>
            <button className="button button-outline">Klímát vásárolok</button>
            <button className="button button-muted">Kalkulátor →</button>
          </div>
        </div>

        {/* Jobb oldal: kártya */}
        <div className="hero-card">
          <div className="hero-card-header">
            <div className="hero-card-icon">❄</div>
            <div>
              <div className="hero-card-title">Gyors reagálás</div>
              <div className="hero-card-subtitle">Átlag 2 órán belül</div>
            </div>
          </div>

          <div className="stats-grid">
            {stats.map((stat) => (
              <div key={stat.label} className="stat">
                <div className="stat-value gradient-text">{stat.value}</div>
                <div className="stat-label">{stat.label}</div>
              </div>
            ))}
          </div>

          <div className="hero-phone">+36 20 123 4567 — Hívjon most!</div>
        </div>
      </div>
    </section>
  );
}