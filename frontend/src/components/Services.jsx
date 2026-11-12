import "./Services.css";

const services = [
  {
    icon: "❄",
    title: "Klíma telepítés",
    desc: "Profi beltéri és kültéri egység beszerelése, csővezetékek fektetésével.",
  },
  {
    icon: "✔",
    title: "Klíma tisztítás",
    desc: "Éves karbantartás és mélytisztítás professzionális eszközökkel.",
  },
  {
    icon: "🔧",
    title: "Szervizelés",
    desc: "Gyors hibaelhárítás, alkatrészcsere és garancia javítás.",
  },
  {
    icon: "💬",
    title: "Tanácsadás",
    desc: "Ingyenes helyszíni felmérés és testre szabott ajánlat.",
  },
];

export default function Services() {
  return (
    <section className="services">
      <div className="container">
        <div className="services-header">
          <h2 className="services-title">Szolgáltatásaink</h2>
          <p className="services-subtitle">
            Mindent megtalál nálunk, amire klímájával kapcsolatban szüksége lehet.
          </p>
        </div>

        <div className="services-grid">
          {services.map((service) => (
            <div key={service.title} className="service-card">
              <div className="service-icon">{service.icon}</div>
              <h3 className="service-title">{service.title}</h3>
              <p className="service-desc">{service.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}