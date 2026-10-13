const db = require("../database/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

module.exports = {

  //REGISZTRÁCIÓ
  register: (req, res) => {
    const { name, email, password } = req.body;

    //létezik-e az email?
    db.query("SELECT * FROM users WHERE email = ?", [email], async (err, results) => {
      if (err) return res.status(500).json({ error: err });
      if (results.length > 0) {
        return res.status(400).json({ message: "Ez az email már létezik!" });
      }

      //jelszó hashelés
      const hashedPassword = await bcrypt.hash(password, 10);

      //Mentés az adatbázisba
      db.query(
        "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
        [name, email, hashedPassword, "user"],
        (err) => {
          if (err) return res.status(500).json({ error: err });
          res.json({ message: "Sikeres regisztráció!" });
        }
      );
    });
  },

  //login
  login: (req, res) => {
    const { email, password } = req.body;

    // Felhasználó keresése
    db.query("SELECT * FROM users WHERE email = ?", [email], async (err, results) => {
      if (err) return res.status(500).json({ error: err });
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
    });
  }

};
