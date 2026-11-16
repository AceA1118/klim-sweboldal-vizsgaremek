import "./Footer.css";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="container footer-inner">
        <div className="footer-copy">
          © {year} Csákó Klíma Kft. · Minden jog fenntartva
        </div>

        <div className="footer-contact">
          <span>+36 20 827 8312</span>
          <span>·</span>
          <span>csako@klima.hu</span>
          <span>·</span>
          <span>Bodroghalom, 3987</span>
        </div>
      </div>
    </footer>
  );
}