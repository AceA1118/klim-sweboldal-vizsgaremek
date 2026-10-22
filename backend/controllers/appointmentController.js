const db = require("../database/db");

module.exports = {

  //FOGLALÁS LÉTREHOZÁSA (a felhasználó a tokenből jön)
  createAppointment: (req, res) => {
    const user_id = req.user.id;
    const { date, time, message } = req.body || {};

    if (!date || !time) {
      return res.status(400).json({ message: "A dátum és az időpont megadása kötelező!" });
    }

    db.query(
      "INSERT INTO appointments (user_id, date, time, status, message) VALUES (?, ?, ?, 'pending', ?)",
      [user_id, date, time, message || ""],
      (err) => {
        if (err) return res.status(500).json({ error: err });
        res.json({ message: "Időpont sikeresen létrehozva!" });
      }
    );
  },

  // FELHASZNÁLÓ SAJÁT FOGLALÁSAI
  getUserAppointments: (req, res) => {
    db.query(
      "SELECT * FROM appointments WHERE user_id = ? ORDER BY date ASC",
      [req.user.id],
      (err, results) => {
        if (err) return res.status(500).json({ error: err });
        res.json(results);
      }
    );
  },

  //összes foglalás (admin/szerelő)
  getAllAppointments: (req, res) => {
    db.query("SELECT * FROM appointments ORDER BY date ASC", (err, results) => {
      if (err) return res.status(500).json({ error: err });
      res.json(results);
    });
  },

  //foglalás jóváhagyása
  // Szerelő: önmagához rendeli az időpontot.
  // Admin: a body-ban megadhat egy szerelo_id-t (opcionális).
  approveAppointment: (req, res) => {
    const id = req.params.id;
    const assignTo =
      req.user.role === "szerelo" ? req.user.id : (req.body || {}).szerelo_id || null;

    const runUpdate = () => {
      db.query(
        "UPDATE appointments SET status = 'approved', assigned_szerelo = COALESCE(?, assigned_szerelo) WHERE id = ?",
        [assignTo, id],
        (err, result) => {
          if (err) return res.status(500).json({ error: err });
          if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Időpont nem található!" });
          }
          res.json({ message: "Időpont jóváhagyva!" });
        }
      );
    };

    // Admin által megadott szerelő ellenőrzése
    if (req.user.role === "admin" && assignTo) {
      return db.query(
        "SELECT id FROM users WHERE id = ? AND role = 'szerelo'",
        [assignTo],
        (err, rows) => {
          if (err) return res.status(500).json({ error: err });
          if (rows.length === 0) {
            return res.status(400).json({ message: "A megadott szerelő nem létezik!" });
          }
          runUpdate();
        }
      );
    }

    runUpdate();
  },

  //foglalás elutasítása
  rejectAppointment: (req, res) => {
    const id = req.params.id;

    db.query(
      "UPDATE appointments SET status = 'rejected' WHERE id = ?",
      [id],
      (err, result) => {
        if (err) return res.status(500).json({ error: err });
        if (result.affectedRows === 0) {
          return res.status(404).json({ message: "Időpont nem található!" });
        }
        res.json({ message: "Időpont elutasítva!" });
      }
    );
  }

};