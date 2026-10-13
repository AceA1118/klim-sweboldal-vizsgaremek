const db = require("../database/db");

module.exports = {

  //FOGLALÁS LÉTREHOZÁSA
  createAppointment: (req, res) => {
    const { user_id, date, time, message } = req.body;

    db.query(
      "INSERT INTO appointments (user_id, date, time, status, message) VALUES (?, ?, ?, 'pending', ?)",
      [user_id, date, time, message],
      (err) => {
        if (err) return res.status(500).json({ error: err });
        res.json({ message: "Időpont sikeresen létrehozva!" });
      }
    );
  },

  // FELHASZNÁLÓ SAJÁT FOGLALÁSAI
  getUserAppointments: (req, res) => {
    const user_id = req.params.user_id;

    db.query(
      "SELECT * FROM appointments WHERE user_id = ? ORDER BY date ASC",
      [user_id],
      (err, results) => {
        if (err) return res.status(500).json({ error: err });
        res.json(results);
      }
    );
  },

  //üsszes foglalás (admin/szerelő)
  getAllAppointments: (req, res) => {
    db.query("SELECT * FROM appointments ORDER BY date ASC", (err, results) => {
      if (err) return res.status(500).json({ error: err });
      res.json(results);
    });
  },

  //foglaláosk jováhagyása
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

  //foglalás elutasítása
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
  }

};
