const invoiceService = require("../services/invoiceService");

module.exports = {

  // SZÁMLA LÉTREHOZÁSA (admin)
  createInvoice: async (req, res) => {
    try {
      const { order_id, user_id, amount, date } = req.body || {};

      if (!order_id || !user_id || amount === undefined) {
        return res.status(400).json({ message: "Az order_id, user_id és amount megadása kötelező!" });
      }

      const invoiceDate = date || new Date().toISOString().slice(0, 10);
      const invoiceId = await invoiceService.createInvoice(order_id, user_id, amount, invoiceDate);

      res.json({ message: "Számla sikeresen létrehozva!", invoiceId });

    } catch (err) {
      res.status(500).json({ error: err });
    }
  },

  // EGY RENDELÉS SZÁMLÁJA (csak a tulajdonos vagy admin)
  getInvoiceByOrder: async (req, res) => {
    try {
      const order_id = req.params.order_id;

      const invoice = await invoiceService.getInvoiceByOrder(order_id);

      if (invoice.length === 0) {
        return res.status(404).json({ message: "Ehhez a rendeléshez nincs számla!" });
      }

      if (invoice[0].user_id !== req.user.id && req.user.role !== "admin") {
        return res.status(403).json({ message: "Nincs jogosultságod ehhez a számlához!" });
      }

      res.json(invoice[0]);

    } catch (err) {
      res.status(500).json({ error: err });
    }
  },

  // FELHASZNÁLÓ SAJÁT SZÁMLÁI
  getUserInvoices: async (req, res) => {
    try {
      const invoices = await invoiceService.getUserInvoices(req.user.id);
      res.json(invoices);

    } catch (err) {
      res.status(500).json({ error: err });
    }
  },

  // ÖSSZES SZÁMLA (admin)
  getAllInvoices: async (req, res) => {
    try {
      const invoices = await invoiceService.getAllInvoices();
      res.json(invoices);

    } catch (err) {
      res.status(500).json({ error: err });
    }
  }

};