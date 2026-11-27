import { NavLink, Link } from "react-router-dom";
import "./Navbar.css";

export default function Navbar({ dark, onToggleDark }) {
return (
    <nav className="navbar">
      <div className="container navbar-inner">
        {/* Logó */}
        <Link to="/" className="navbar-logo">
          <div className="logo-icon">CK</div>
          <div>
            <div className="logo-title">Csákó Klíma</div>
            <div className="logo-subtitle">Klimatizálás &amp; Szerviz</div>
          </div>
        </Link>

        {/* Menüpontok */}
        <ul className="navbar-links">
          <li><NavLink to="/" end>Főoldal</NavLink></li>
          <li><NavLink to="/webshop">Webshop</NavLink></li>
          <li><NavLink to="/idopontfoglalas">Időpontfoglalás</NavLink></li>
          <li><NavLink to="/kalkulator">Kalkulátor</NavLink></li>
          <li><NavLink to="/szamlazas">Számlázás</NavLink></li>
        </ul>

        {/* Gombok jobb oldalon */}
        <div className="navbar-actions">
          <button className="icon-button" aria-label="Sötét mód" onClick={onToggleDark}>
            {dark ? "☀️" : "🌙"}
          </button>         
          <button className="icon-button" aria-label="Kosár">🛒</button>
          <button className="admin-button">Admin</button>
        </div>
      </div>
    </nav>
  );
}