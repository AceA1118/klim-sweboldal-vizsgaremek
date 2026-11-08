const db = require("../database/db");

// --- Számítási paraméterek ---
// Alap hűtési igény: 0,1 kW / m², ezt módosítja a szigetelés és a napsütés.
const KW_PER_M2 = 0.1;
const BTU_PER_KW = 3412;

const INSULATION = { good: 0.9, average: 1.0, poor: 1.2 };
const SUNLIGHT = { low: 0.95, medium: 1.0, high: 1.15 };

module.exports = {

  INSULATION,
  SUNLIGHT,

  // HŰTÉSI IGÉNY SZÁMÍTÁSA (nem nyúl az adatbázishoz)
  calculateLoad: (room_size, insulation, sunlight) => {
    const kw = room_size * KW_PER_M2 * INSULATION[insulation] * SUNLIGHT[sunlight];
    return {
      required_kw: Math.round(kw * 10) / 10,
      required_btu: Math.round(kw * BTU_PER_KW)
    };
  },

  // MEGFELELŐ TERMÉKEK A products TÁBLÁBÓL
  // A legkisebb elég erős (btu >= igény), készleten lévő teljesítményosztályt adja,
  // azon belül ár szerint növekvő sorrendben (max. 3 termék).
  findSuitableProducts: async (required_btu) => {
    const [rows] = await db.promise().query(
      `SELECT id, name, price, btu, wifi, inverter, image_url
       FROM products
       WHERE stock > 0 AND btu >= ?
       ORDER BY btu ASC, price ASC`,
      [required_btu]
    );

    if (rows.length === 0) return [];

    return rows.filter(p => p.btu === rows[0].btu).slice(0, 3);
  },

  // KALKULÁCIÓ MENTÉSE
  saveCalculation: (user_id, room_size, insulation, sunlight, recommended_model) => {
    return new Promise((resolve, reject) => {
      db.query(
        "INSERT INTO calculator_results (user_id, room_size, insulation, sunlight, recommended_model) VALUES (?, ?, ?, ?, ?)",
        [user_id, room_size, insulation, sunlight, recommended_model],
        (err, result) => {
          if (err) return reject(err);
          resolve(result.insertId);
        }
      );
    });
  },

  // FELHASZNÁLÓ SAJÁT KALKULÁCIÓI
  getUserResults: (user_id) => {
    return new Promise((resolve, reject) => {
      db.query(
        "SELECT * FROM calculator_results WHERE user_id = ? ORDER BY created_at DESC",
        [user_id],
        (err, results) => {
          if (err) return reject(err);
          resolve(results);
        }
      );
    });
  },

  // ÖSSZES KALKULÁCIÓ (ADMIN)
  getAllResults: () => {
    return new Promise((resolve, reject) => {
      db.query("SELECT * FROM calculator_results ORDER BY created_at DESC", (err, results) => {
        if (err) return reject(err);
        resolve(results);
      });
    });
  }

};