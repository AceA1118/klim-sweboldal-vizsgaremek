const db = require("../database/db");
const invoiceService = require("../services/invoiceService");

const ALLOWED_STATUSES = ["pending", "paid", "shipped", "cancelled"];

// Melyik státuszból melyikbe lehet lépni
const TRANSITIONS = {
  pending: ["paid", "cancelled"],
  paid: ["shipped", "cancelled"],
  shipped: [],
  cancelled: []
};

// Saját hibatípus, hogy a tranzakción belül dobott hibákból tiszta HTTP válasz legyen
const httpError = (status, message) => Object.assign(new Error(message), { status });

module.exports = {

  // RENDELÉS LÉTREHOZÁSA
  // A kliens csak [{ product_id, quantity }] listát küld, az árat és az összeget
  // a szerver számolja az adatbázisban lévő árakból, tranzakcióban, készletkezeléssel.
  createOrder: async (req, res) => {
    const user_id = req.user.id;
    const { items } = req.body || {};

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "A rendelésnek legalább egy tételt tartalmaznia kell!" });
    }

    // Tételek ellenőrzése, az azonos termékeket összevonjuk
    const wanted = new Map();
    for (const item of items) {
      const product_id = Number(item && item.product_id);
      const quantity = Number(item && item.quantity);

      if (!Number.isInteger(product_id) || product_id <= 0 ||
          !Number.isInteger(quantity) || quantity <= 0 || quantity > 100) {
        return res.status(400).json({
          message: "Minden tételnél kötelező a product_id és a quantity (1-100 közötti egész szám)!"
        });
      }
      wanted.set(product_id, (wanted.get(product_id) || 0) + quantity);
    }

    // Azonos zárolási sorrend (product_id szerint), hogy ne legyen holtpont
    const lines = [...wanted.entries()].sort((a, b) => a[0] - b[0]);

    const conn = await db.promise().getConnection();

    try {
      await conn.beginTransaction();

      let total = 0;
      const orderLines = [];

      for (const [product_id, quantity] of lines) {
        const [rows] = await conn.query(
          "SELECT id, name, price, stock FROM products WHERE id = ? FOR UPDATE",
          [product_id]
        );

        if (rows.length === 0) {
          throw httpError(404, `A(z) ${product_id} azonosítójú termék nem létezik!`);
        }

        const product = rows[0];
        if (product.stock < quantity) {
          throw httpError(400, `Nincs elég készlet ebből: ${product.name} (elérhető: ${product.stock} db)`);
        }

        total += product.price * quantity;
        orderLines.push({ product_id, quantity, price: product.price });
      }

      const [orderResult] = await conn.query(
        "INSERT INTO orders (user_id, total_price, status) VALUES (?, ?, 'pending')",
        [user_id, total]
      );
      const order_id = orderResult.insertId;

      for (const line of orderLines) {
        await conn.query(
          "INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)",
          [order_id, line.product_id, line.quantity, line.price]
        );
        await conn.query(
          "UPDATE products SET stock = stock - ? WHERE id = ?",
          [line.quantity, line.product_id]
        );
      }

      await conn.commit();

      res.json({
        message: "Rendelés sikeresen létrehozva!",
        order_id,
        total_price: total
      });

    } catch (err) {
      await conn.rollback();

      if (err.status) {
        return res.status(err.status).json({ message: err.message });
      }
      console.error(err);
      res.status(500).json({ message: "Szerverhiba a rendelés létrehozásakor!" });

    } finally {
      conn.release();
    }
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
  // - csak engedélyezett átmenetek (pending -> paid/cancelled, paid -> shipped/cancelled)
  // - lemondáskor a készlet visszakerül
  // - kifizetéskor (paid) automatikusan számla készül a rendelésből
  updateStatus: async (req, res) => {
    const order_id = req.params.order_id;
    const { status } = req.body || {};

    if (!ALLOWED_STATUSES.includes(status)) {
      return res.status(400).json({
        message: `Érvénytelen státusz! Engedélyezett: ${ALLOWED_STATUSES.join(", ")}`
      });
    }

    const conn = await db.promise().getConnection();

    try {
      await conn.beginTransaction();

      const [rows] = await conn.query(
        "SELECT id, status FROM orders WHERE id = ? FOR UPDATE",
        [order_id]
      );

      if (rows.length === 0) {
        throw httpError(404, "Rendelés nem található!");
      }

      const current = rows[0].status;

      if (!TRANSITIONS[current].includes(status)) {
        throw httpError(400, `A(z) ${current} státuszú rendelés nem állítható erre: ${status}`);
      }

      // Lemondás: a rendelt mennyiségek visszakerülnek a készletre
      if (status === "cancelled") {
        await conn.query(
          `UPDATE products p
           JOIN order_items oi ON oi.product_id = p.id
           SET p.stock = p.stock + oi.quantity
           WHERE oi.order_id = ?`,
          [order_id]
        );
      }

      await conn.query("UPDATE orders SET status = ? WHERE id = ?", [status, order_id]);

      // Kifizetés: automatikus számla
      let invoice_id = null;
      if (status === "paid") {
        invoice_id = await invoiceService.createInvoiceFromOrder(order_id, conn);
      }

      await conn.commit();

      res.json({
        message: "Rendelés státusza frissítve!",
        status,
        invoice_id
      });

    } catch (err) {
      await conn.rollback();

      if (err.status) {
        return res.status(err.status).json({ message: err.message });
      }
      console.error(err);
      res.status(500).json({ message: "Szerverhiba a státusz módosításakor!" });

    } finally {
      conn.release();
    }
  }
};