const invoiceService = require("../services/invoiceService");

// Egységes hibakezelés: tudatos hibáknál a saját üzenet, egyébként általános 500
const handleError = (err, res) => {
  if (err.status) {
    return res.status(err.status).json({ message: err.message });
  }
  console.error(err);
  res.status(500).json({ message: "Szerverhiba történt!" });
};

module.exports = {

  // SZÁMLA LÉTREHOZÁSA (admin) - csak az order_id kell, az összeg a rendelésből jön
  createInvoice: async (req, res) => {
    try {
      const order_id = Number((req.body || {}).order_id);

      if (!Number.isInteger(order_id) || order_id <= 0) {
        return res.status(400).json({ message: "Az order_id megadása kötelező!" });
      }

      const invoiceId = await invoiceService.createInvoiceFromOrder(order_id);

      res.json({ message: "Számla sikeresen létrehozva!", invoiceId });

    } catch (err) {
      handleError(err, res);
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
      handleError(err, res);
    }
  },

  // FELHASZNÁLÓ SAJÁT SZÁMLÁI
  getUserInvoices: async (req, res) => {
    try {
      const invoices = await invoiceService.getUserInvoices(req.user.id);
      res.json(invoices);

    } catch (err) {
      handleError(err, res);
    }
  },

  // ÖSSZES SZÁMLA (admin)
  getAllInvoices: async (req, res) => {
    try {
      const invoices = await invoiceService.getAllInvoices();
      res.json(invoices);

    } catch (err) {
      handleError(err, res);
    }
  }

};