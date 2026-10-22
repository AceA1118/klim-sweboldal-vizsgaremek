const db = require("../database/db");

// A jóváhagyás/elutasítás/listázás az appointmentController-ben van,
// itt csak a szerelő saját időpontjai maradtak.
module.exports = {

  // SAJÁT IDŐPONTOK (a szerelő ID a tokenből jön)
  getMyAppointments: (req, res) => {
    db.query(
      "SELECT * FROM appointments WHERE assigned_szerelo = ? ORDER BY date ASC",
      [req.user.id],
      (err, results) => {
        if (err) return res.status(500).json({ error: err });
        res.json(results);
      }
    );
  }

};