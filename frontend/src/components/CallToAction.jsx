import "./CallToAction.css";

export default function CallToAction() {
  return (
    <section className="cta">
      <div className="container">
        <div className="cta-box">
          <h2 className="cta-title">Nem tudja melyik klíma a megfelelő?</h2>
          <p className="cta-text">
            Használja ingyenes kalkulátorunkat — megtaláljuk az ideális klímát
            szobája mérete és igényei alapján.
          </p>
          <button className="cta-button">Kalkulátor megnyitása →</button>
        </div>
      </div>
    </section>
  );
}