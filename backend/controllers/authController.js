const db = require("../database/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Egyszerű segéd: lekérdezés, ami a sorokat adja vissza
const query = (sql, params) => db.promise().query(sql, params).then(([rows]) => rows);

module.exports = {

  //REGISZTRÁCIÓ
  register: async (req, res) => {
    try {
      const { name, email, password } = req.body || {};

      if (typeof name !== "string" || !name.trim() ||
          typeof email !== "string" || typeof password !== "string") {
        return res.status(400).json({ message: "A név, az email és a jelszó megadása kötelező!" });
      }
      if (!EMAIL_RE.test(email.trim())) {
        return res.status(400).json({ message: "Érvénytelen email cím!" });
      }
      if (password.length < 8 || password.length > 72) {
        return res.status(400).json({ message: "A jelszó 8 és 72 karakter között legyen!" });
      }

      const cleanEmail = email.trim().toLowerCase();

      //létezik-e az email?
      const existing = await query("SELECT id FROM users WHERE email = ?", [cleanEmail]);
      if (existing.length > 0) {
        return res.status(400).json({ message: "Ez az email már létezik!" });
      }

      //jelszó hashelés + mentés (a szerepkör mindig "user")
      const hashedPassword = await bcrypt.hash(password, 10);
      await query(
        "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, 'user')",
        [name.trim(), cleanEmail, hashedPassword]
      );

      res.json({ message: "Sikeres regisztráció!" });

    } catch (err) {
      // két egyszerre érkező regisztráció ugyanazzal az emaillel
      if (err.code === "ER_DUP_ENTRY") {
        return res.status(400).json({ message: "Ez az email már létezik!" });
      }
      console.error(err);
      res.status(500).json({ message: "Szerverhiba a regisztráció során!" });
    }
  },

  //LOGIN
  login: async (req, res) => {
    try {
      const { email, password } = req.body || {};

      if (typeof email !== "string" || typeof password !== "string" || !email || !password) {
        return res.status(400).json({ message: "Az email és a jelszó megadása kötelező!" });
      }

      // Felhasználó keresése
      const results = await query("SELECT * FROM users WHERE email = ?", [email.trim().toLowerCase()]);
      if (results.length === 0) {
        return res.status(400).json({ message: "Hibás email vagy jelszó!" });
      }

      const user = results[0];

      //jelszó ellenőrzése
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: "Hibás email vagy jelszó!" });
      }

      //jwt token gen
      const token = jwt.sign(
        { id: user.id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: "1d" }
      );

      res.json({
        message: "Sikeres bejelentkezés!",
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      });

    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Szerverhiba a bejelentkezés során!" });
    }
  }

};