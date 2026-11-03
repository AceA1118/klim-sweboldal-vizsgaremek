const db = require("../database/db");

// Saját hibatípus, hogy a service-ből tiszta HTTP válasz készülhessen
const httpError = (status, message) => Object.assign(new Error(message), { status });

module.exports = {

  // SZÁMLA LÉTREHOZÁSA A RENDELÉSBŐL
  // Az összeget és a vevőt a rendelésből vesszük, kézzel nem adható meg.
  createInvoiceFromOrder: async (order_id, conn = db.promise()) => {
    const [rows] = await conn.query(
      "SELECT id, user_id, total_price, status FROM orders WHERE id = ?",
      [order_id]
    );

    if (rows.length === 0) {
      throw httpError(404, "Rendelés nem található!");
    }

    const order = rows[0];

    if (!["paid", "shipped"].includes(order.status)) {
      throw httpError(400, "Csak kifizetett rendelésről állítható ki számla!");
    }

    try {
      const [result] = await conn.query(
        "INSERT INTO invoices (order_id, user_id, amount, date) VALUES (?, ?, ?, CURDATE())",
        [order.id, order.user_id, order.total_price]
      );
      return result.insertId;
    } catch (err) {
      // az invoices.order_id egyedi, így egy rendelésre csak egy számla készülhet
      if (err.code === "ER_DUP_ENTRY") {
        throw httpError(409, "Ehhez a rendeléshez már van számla!");
      }
      throw err;
    }
  },

  // SZÁMLA LEKÉRÉSE RENDELÉS ALAPJÁN
  getInvoiceByOrder: (order_id) => {
    return new Promise((resolve, reject) => {
      db.query(
        "SELECT * FROM invoices WHERE order_id = ?",
        [order_id],
        (err, results) => {
          if (err) return reject(err);
          resolve(results);
        }
      );
    });
  },

  // FELHASZNÁLÓ SAJÁT SZÁMLÁI
  getUserInvoices: (user_id) => {
    return new Promise((resolve, reject) => {
      db.query(
        "SELECT * FROM invoices WHERE user_id = ? ORDER BY date DESC",
        [user_id],
        (err, results) => {
          if (err) return reject(err);
          resolve(results);
        }
      );
    });
  },

  // ÖSSZES SZÁMLA (ADMIN)
  getAllInvoices: () => {
    return new Promise((resolve, reject) => {
      db.query("SELECT * FROM invoices ORDER BY date DESC", (err, results) => {
        if (err) return reject(err);
        resolve(results);
      });
    });
  }

};