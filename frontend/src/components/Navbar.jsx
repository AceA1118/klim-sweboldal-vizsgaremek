import "./Navbar.css";

export default function Navbar() {
  return (
    <nav className="navbar">
      <div className="container navbar-inner">
        {/* Logó */}
        <div className="navbar-logo">
          <div className="logo-icon">CK</div>
          <div>
            <div className="logo-title">Csákó Klíma</div>
            <div className="logo-subtitle">Klimatizálás &amp; Szerviz</div>
          </div>
        </div>

        {/* Menüpontok */}
        <ul className="navbar-links">
          <li><a href="#" className="active">Főoldal</a></li>
          <li><a href="#">Webshop</a></li>
          <li><a href="#">Időpontfoglalás</a></li>
          <li><a href="#">Kalkulátor</a></li>
          <li><a href="#">Számlázás</a></li>
        </ul>

        {/* Gombok jobb oldalon */}
        <div className="navbar-actions">
          <button className="icon-button">🌙</button>
          <button className="icon-button">🛒</button>
          <button className="admin-button">Admin</button>
        </div>
      </div>
    </nav>
  );
}