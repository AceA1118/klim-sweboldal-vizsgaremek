const db = require("../database/db");

module.exports = {

  // ÖSSZES FELHASZNÁLÓ
  getAllUsers: (req, res) => {
    db.query("SELECT id, name, email, role FROM users", (err, results) => {
      if (err) return res.status(500).json({ error: err });
      res.json(results);
    });
  },

  // ÖSSZES RENDELÉS
  getAllOrders: (req, res) => {
    db.query("SELECT * FROM orders ORDER BY id DESC", (err, results) => {
      if (err) return res.status(500).json({ error: err });
      res.json(results);
    });
  },

  // ÖSSZES IDŐPONT
  getAllAppointments: (req, res) => {
    db.query("SELECT * FROM appointments ORDER BY date ASC", (err, results) => {
      if (err) return res.status(500).json({ error: err });
      res.json(results);
    });
  }

};
