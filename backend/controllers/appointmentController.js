const db = require("../database/db");

// Munkaidő: egész órás időpontok, 8:00 és 16:00 között (16:00 az utolsó kezdés)
const FIRST_HOUR = 8;
const LAST_HOUR = 16;

// Ezek a státuszok foglalnak helyet az időpontból
const ACTIVE = "('pending','approved')";

// Saját hibatípus, hogy tiszta HTTP választ adhassunk
const httpError = (status, message) => Object.assign(new Error(message), { status });

const handleError = (err, res) => {
  if (err.status) {
    return res.status(err.status).json({ message: err.message });
  }
  if (err.code === "ER_LOCK_DEADLOCK") {
    return res.status(409).json({ message: "Az időpont éppen foglalás alatt van, próbáld újra!" });
  }
  console.error(err);
  res.status(500).json({ message: "Szerverhiba történt!" });
};

// YYYY-MM-DD, létező naptári nap
const isValidDate = (s) => {
  if (typeof s !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(s + "T00:00:00Z");
  return !isNaN(d) && d.toISOString().slice(0, 10) === s;
};

// HH:00 vagy HH:00:00 -> "HH:00:00", különben null
const normalizeTime = (t) => {
  if (typeof t !== "string") return null;
  const m = /^(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(t);
  if (!m) return null;
  const hour = Number(m[1]);
  if (m[2] !== "00" || (m[3] && m[3] !== "00")) return null;
  if (hour < FIRST_HOUR || hour > LAST_HOUR) return null;
  return String(hour).padStart(2, "0") + ":00:00";
};

// Ennyi foglalás fér egy időpontba: ahány szerelő van (legalább 1)
const getCapacity = async (conn) => {
  const [[row]] = await conn.query("SELECT COUNT(*) AS c FROM users WHERE role = 'szerelo'");
  return Math.max(1, row.c);
};

module.exports = {

  // SZABAD IDŐPONTOK EGY NAPRA (nyilvános)  GET /appointments/available?date=YYYY-MM-DD
  getAvailableSlots: async (req, res) => {
    try {
      const date = req.query.date;
      if (!isValidDate(date)) {
        return res.status(400).json({ message: "Érvénytelen dátum! Formátum: YYYY-MM-DD" });
      }

      const pool = db.promise();
      const capacity = await getCapacity(pool);

      const [booked] = await pool.query(
        `SELECT time, COUNT(*) AS booked FROM appointments
         WHERE date = ? AND status IN ${ACTIVE} GROUP BY time`,
        [date]
      );
      const [[nowRow]] = await pool.query("SELECT DATE_FORMAT(NOW(), '%Y-%m-%d %H:%i:%s') AS now");

      const slots = [];
      for (let hour = FIRST_HOUR; hour <= LAST_HOUR; hour++) {
        const time = String(hour).padStart(2, "0") + ":00:00";
        const count = booked.filter(b => b.time === time).reduce((sum, b) => sum + b.booked, 0);
        const isPast = `${date} ${time}` <= nowRow.now;
        slots.push({ time: time.slice(0, 5), available: !isPast && count < capacity });
      }

      res.json({ date, slots });

    } catch (err) {
      handleError(err, res);
    }
  },

  // FOGLALÁS LÉTREHOZÁSA (a felhasználó a tokenből jön)
  createAppointment: async (req, res) => {
    const user_id = req.user.id;
    const { date, time, message } = req.body || {};
    const normalizedTime = normalizeTime(time);

    if (!isValidDate(date) || !normalizedTime) {
      return res.status(400).json({
        message: `Érvénytelen dátum vagy időpont! Formátum: YYYY-MM-DD és HH:00 (${FIRST_HOUR}:00 és ${LAST_HOUR}:00 között, egész órák)`
      });
    }
    if (message !== undefined && typeof message !== "string") {
      return res.status(400).json({ message: "Az üzenet szöveg legyen!" });
    }

    const conn = await db.promise().getConnection();

    try {
      await conn.beginTransaction();

      const [[past]] = await conn.query("SELECT TIMESTAMP(?, ?) <= NOW() AS is_past", [date, normalizedTime]);
      if (past.is_past) {
        throw httpError(400, "Múltbeli időpontra nem lehet foglalni!");
      }

      const capacity = await getCapacity(conn);

      const [taken] = await conn.query(
        `SELECT user_id FROM appointments
         WHERE date = ? AND time = ? AND status IN ${ACTIVE} FOR UPDATE`,
        [date, normalizedTime]
      );

      if (taken.some(r => r.user_id === user_id)) {
        throw httpError(409, "Erre az időpontra már van foglalásod!");
      }
      if (taken.length >= capacity) {
        throw httpError(409, "Ez az időpont már foglalt!");
      }

      await conn.query(
        "INSERT INTO appointments (user_id, date, time, status, message) VALUES (?, ?, ?, 'pending', ?)",
        [user_id, date, normalizedTime, (message || "").slice(0, 1000)]
      );

      await conn.commit();
      res.json({ message: "Időpont sikeresen létrehozva!" });

    } catch (err) {
      await conn.rollback();
      handleError(err, res);
    } finally {
      conn.release();
    }
  },

  // FELHASZNÁLÓ SAJÁT FOGLALÁSAI
  getUserAppointments: async (req, res) => {
    try {
      const [rows] = await db.promise().query(
        "SELECT * FROM appointments WHERE user_id = ? ORDER BY date ASC, time ASC",
        [req.user.id]
      );
      res.json(rows);
    } catch (err) {
      handleError(err, res);
    }
  },

  // ÖSSZES FOGLALÁS (admin/szerelő)
  getAllAppointments: async (req, res) => {
    try {
      const [rows] = await db.promise().query("SELECT * FROM appointments ORDER BY date ASC, time ASC");
      res.json(rows);
    } catch (err) {
      handleError(err, res);
    }
  },

  // SAJÁT FOGLALÁS LEMONDÁSA (csak a tulajdonos)
  cancelAppointment: async (req, res) => {
    try {
      const pool = db.promise();

      const [rows] = await pool.query(
        "SELECT id, user_id, status, TIMESTAMP(date, time) <= NOW() AS is_past FROM appointments WHERE id = ?",
        [req.params.id]
      );

      if (rows.length === 0) {
        throw httpError(404, "Időpont nem található!");
      }

      const appointment = rows[0];

      if (appointment.user_id !== req.user.id) {
        throw httpError(403, "Nincs jogosultságod ehhez az időponthoz!");
      }
      if (!["pending", "approved"].includes(appointment.status)) {
        throw httpError(400, "Ez az időpont már nem mondható le!");
      }
      if (appointment.is_past) {
        throw httpError(400, "Múltbeli időpont nem mondható le!");
      }

      await pool.query("UPDATE appointments SET status = 'cancelled' WHERE id = ?", [appointment.id]);

      res.json({ message: "Időpont lemondva!" });

    } catch (err) {
      handleError(err, res);
    }
  },

  // FOGLALÁS JÓVÁHAGYÁSA
  // Szerelő: önmagához rendeli az időpontot.
  // Admin: a body-ban megadhat egy szerelo_id-t (opcionális).
  approveAppointment: async (req, res) => {
    try {
      const pool = db.promise();

      const [rows] = await pool.query(
        "SELECT id, date, time, status FROM appointments WHERE id = ?",
        [req.params.id]
      );

      if (rows.length === 0) {
        throw httpError(404, "Időpont nem található!");
      }

      const appointment = rows[0];

      if (!["pending", "approved"].includes(appointment.status)) {
        throw httpError(400, `A(z) ${appointment.status} státuszú időpont nem hagyható jóvá!`);
      }

      const szerelo_id =
        req.user.role === "szerelo" ? req.user.id : Number((req.body || {}).szerelo_id) || null;

      if (szerelo_id) {
        // Admin által megadott szerelő ellenőrzése
        if (req.user.role === "admin") {
          const [users] = await pool.query(
            "SELECT id FROM users WHERE id = ? AND role = 'szerelo'",
            [szerelo_id]
          );
          if (users.length === 0) {
            throw httpError(400, "A megadott szerelő nem létezik!");
          }
        }

        // Ugyanaz a szerelő ne legyen két helyen egyszerre
        const [busy] = await pool.query(
          `SELECT id FROM appointments
           WHERE assigned_szerelo = ? AND date = ? AND time = ? AND status = 'approved' AND id <> ?`,
          [szerelo_id, appointment.date, appointment.time, appointment.id]
        );
        if (busy.length > 0) {
          throw httpError(409, "A szerelőnek erre az időpontra már van másik munkája!");
        }
      }

      await pool.query(
        "UPDATE appointments SET status = 'approved', assigned_szerelo = COALESCE(?, assigned_szerelo) WHERE id = ?",
        [szerelo_id, appointment.id]
      );

      res.json({ message: "Időpont jóváhagyva!" });

    } catch (err) {
      handleError(err, res);
    }
  },

  // FOGLALÁS ELUTASÍTÁSA
  rejectAppointment: async (req, res) => {
    try {
      const pool = db.promise();

      const [rows] = await pool.query("SELECT id, status FROM appointments WHERE id = ?", [req.params.id]);

      if (rows.length === 0) {
        throw httpError(404, "Időpont nem található!");
      }
      if (!["pending", "approved"].includes(rows[0].status)) {
        throw httpError(400, `A(z) ${rows[0].status} státuszú időpont nem utasítható el!`);
      }

      await pool.query("UPDATE appointments SET status = 'rejected' WHERE id = ?", [rows[0].id]);

      res.json({ message: "Időpont elutasítva!" });

    } catch (err) {
      handleError(err, res);
    }
  }

};