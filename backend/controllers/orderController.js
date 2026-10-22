const db = require("../database/db");

const ALLOWED_STATUSES = ["pending", "paid", "shipped", "cancelled"];

module.exports = {

  // RENDELÉS LÉTREHOZÁSA (a felhasználó a tokenből jön)
  // FIGYELEM: az ár még a kliensről jön, a következő lépésben ezt szerveroldalra visszük!
  createOrder: (req, res) => {
    const user_id = req.user.id;
    const { items, total_price } = req.body || {};

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "A rendelésnek legalább egy tételt tartalmaznia kell!" });
    }

    // 1. Rendelés mentése az orders táblába
    db.query(
      "INSERT INTO orders (user_id, total_price, status) VALUES (?, ?, 'pending')",
      [user_id, total_price],
      (err, result) => {
        if (err) return res.status(500).json({ error: err });

        const order_id = result.insertId;

        // 2. Tételek mentése az order_items táblába
        items.forEach(item => {
          db.query(
            "INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)",
            [order_id, item.product_id, item.quantity, item.price]
          );
        });

        res.json({ message: "Rendelés sikeresen létrehozva!", order_id });
      }
    );
  },

  // FELHASZNÁLÓ SAJÁT RENDELÉSEI
  getUserOrders: (req, res) => {
    db.query(
      "SELECT * FROM orders WHERE user_id = ? ORDER BY id DESC",
      [req.user.id],
      (err, results) => {
        if (err) return res.status(500).json({ error: err });
        res.json(results);
      }
    );
  },

  // RENDELÉS + TÉTELEK LEKÉRÉSE (csak a tulajdonos vagy admin)
  getOrderDetails: (req, res) => {
    const order_id = req.params.order_id;

    // 1. Rendelés adatai
    db.query("SELECT * FROM orders WHERE id = ?", [order_id], (err, orderResult) => {
      if (err) return res.status(500).json({ error: err });
      if (orderResult.length === 0) {
        return res.status(404).json({ message: "Rendelés nem található!" });
      }

      const order = orderResult[0];

      if (order.user_id !== req.user.id && req.user.role !== "admin") {
        return res.status(403).json({ message: "Nincs jogosultságod ehhez a rendeléshez!" });
      }

      // 2. Tételek adatai
      db.query(
        "SELECT * FROM order_items WHERE order_id = ?",
        [order_id],
        (err, itemsResult) => {
          if (err) return res.status(500).json({ error: err });

          res.json({
            order,
            items: itemsResult
          });
        }
      );
    });
  },

  // RENDELÉS STÁTUSZ MÓDOSÍTÁSA (admin)
  updateStatus: (req, res) => {
    const order_id = req.params.order_id;
    const { status } = req.body || {};

    if (!ALLOWED_STATUSES.includes(status)) {
      return res.status(400).json({
        message: `Érvénytelen státusz! Engedélyezett: ${ALLOWED_STATUSES.join(", ")}`
      });
    }

    db.query(
      "UPDATE orders SET status = ? WHERE id = ?",
      [status, order_id],
      (err, result) => {
        if (err) return res.status(500).json({ error: err });
        if (result.affectedRows === 0) {
          return res.status(404).json({ message: "Rendelés nem található!" });
        }
        res.json({ message: "Rendelés státusza frissítve!" });
      }
    );
  }

};