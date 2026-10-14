const db = require("../database/db");

module.exports = {

  //összes termék
  getAllProducts: (req, res) => {
    db.query("SELECT * FROM products", (err, results) => {
      if (err) return res.status(500).json({ error: err });
      res.json(results);
    });
  },

  //termék keresése id  alapján
  getProductById: (req, res) => {
    const id = req.params.id;

    db.query("SELECT * FROM products WHERE id = ?", [id], (err, results) => {
      if (err) return res.status(500).json({ error: err });
      if (results.length === 0) {
        return res.status(404).json({ message: "Termék nem található!" });
      }
      res.json(results[0]);
    });
  },

  //termék létrehozása
  createProduct: (req, res) => {
    const { name, price, description, stock, category, brand, btu, wifi, inverter, image_url } = req.body;

    db.query(
      "INSERT INTO products (name, price, description, stock, category, brand, btu, wifi, inverter, image_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [name, price, description, stock, category, brand, btu, wifi, inverter, image_url],
      (err) => {
        if (err) return res.status(500).json({ error: err });
        res.json({ message: "Termék sikeresen létrehozva!" });
      }
    );
  },

  //termék modosítása
  updateProduct: (req, res) => {
    const id = req.params.id;
    const { name, price, description, stock, category, brand, btu, wifi, inverter, image_url } = req.body;

    db.query(
      "UPDATE products SET name=?, price=?, description=?, stock=?, category=?, brand=?, btu=?, wifi=?, inverter=?, image_url=? WHERE id=?",
      [name, price, description, stock, category, brand, btu, wifi, inverter, image_url, id],
      (err) => {
        if (err) return res.status(500).json({ error: err });
        res.json({ message: "Termék sikeresen módosítva!" });
      }
    );
  },

  //termék törlése
  deleteProduct: (req, res) => {
    const id = req.params.id;

    db.query("DELETE FROM products WHERE id = ?", [id], (err) => {
      if (err) return res.status(500).json({ error: err });
      res.json({ message: "Termék törölve!" });
    });
  }

};
