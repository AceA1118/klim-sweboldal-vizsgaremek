const db = require("../database/db");

module.exports = {

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
