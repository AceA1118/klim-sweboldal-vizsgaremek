const db = require("../database/db");

module.exports = {

  // SZÁMLA LÉTREHOZÁSA
  createInvoice: (order_id, user_id, amount, date) => {
    return new Promise((resolve, reject) => {
      db.query(
        "INSERT INTO invoices (order_id, user_id, amount, date) VALUES (?, ?, ?, ?)",
        [order_id, user_id, amount, date],
        (err, result) => {
          if (err) return reject(err);
          resolve(result.insertId);
        }
      );
    });
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
