const db = require("../database/db");

module.exports = {

  // ÖSSZES IDŐPONT (szerelő)
  getAllAppointments: (req, res) => {
    db.query("SELECT * FROM appointments ORDER BY date ASC", (err, results) => {
      if (err) return res.status(500).json({ error: err });
      res.json(results);
    });
  },

  // IDŐPONT JÓVÁHAGYÁSA
  approveAppointment: (req, res) => {
    const id = req.params.id;

    db.query(
      "UPDATE appointments SET status = 'approved' WHERE id = ?",
      [id],
      (err) => {
        if (err) return res.status(500).json({ error: err });
        res.json({ message: "Időpont jóváhagyva!" });
      }
    );
  },

  // IDŐPONT ELUTASÍTÁSA
  rejectAppointment: (req, res) => {
    const id = req.params.id;

    db.query(
      "UPDATE appointments SET status = 'rejected' WHERE id = ?",
      [id],
      (err) => {
        if (err) return res.status(500).json({ error: err });
        res.json({ message: "Időpont elutasítva!" });
      }
    );
  },

  // SAJÁT IDŐPONTOK (ha a szerelő ID tárolva van)
  getMyAppointments: (req, res) => {
    const szerelo_id = req.params.szerelo_id;

    db.query(
      "SELECT * FROM appointments WHERE assigned_szerelo = ? ORDER BY date ASC",
      [szerelo_id],
      (err, results) => {
        if (err) return res.status(500).json({ error: err });
        res.json(results);
      }
    );
  }

};
