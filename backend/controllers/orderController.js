const db = require("../database/db");

module.exports = {

  // RENDELÉS LÉTREHOZÁSA
  createOrder: (req, res) => {
    const { user_id, items, total_price } = req.body;

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
    const user_id = req.params.user_id;

    db.query(
      "SELECT * FROM orders WHERE user_id = ? ORDER BY id DESC",
      [user_id],
      (err, results) => {
        if (err) return res.status(500).json({ error: err });
        res.json(results);
      }
    );
  },

  // RENDELÉS + TÉTELEK LEKÉRÉSE
  getOrderDetails: (req, res) => {
    const order_id = req.params.order_id;

    // 1. Rendelés adatai
    db.query("SELECT * FROM orders WHERE id = ?", [order_id], (err, orderResult) => {
      if (err) return res.status(500).json({ error: err });
      if (orderResult.length === 0) {
        return res.status(404).json({ message: "Rendelés nem található!" });
      }

      const order = orderResult[0];

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

  // RENDELÉS STÁTUSZ MÓDOSÍTÁSA
  updateStatus: (req, res) => {
    const order_id = req.params.order_id;
    const { status } = req.body;

    db.query(
      "UPDATE orders SET status = ? WHERE id = ?",
      [status, order_id],
      (err) => {
        if (err) return res.status(500).json({ error: err });
        res.json({ message: "Rendelés státusza frissítve!" });
      }
    );
  }

};
