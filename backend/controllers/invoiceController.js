const invoiceService = require("../services/invoiceService");

module.exports = {

  createInvoice: async (req, res) => {
    try {
      const { order_id, user_id, amount, date } = req.body;

      const invoiceId = await invoiceService.createInvoice(order_id, user_id, amount, date);

      res.json({ message: "Számla sikeresen létrehozva!", invoiceId });

    } catch (err) {
      res.status(500).json({ error: err });
    }
  },

  getInvoiceByOrder: async (req, res) => {
    try {
      const order_id = req.params.order_id;

      const invoice = await invoiceService.getInvoiceByOrder(order_id);

      if (invoice.length === 0) {
        return res.status(404).json({ message: "Ehhez a rendeléshez nincs számla!" });
      }

      res.json(invoice[0]);

    } catch (err) {
      res.status(500).json({ error: err });
    }
  },

  getUserInvoices: async (req, res) => {
    try {
      const user_id = req.params.user_id;

      const invoices = await invoiceService.getUserInvoices(user_id);

      res.json(invoices);

    } catch (err) {
      res.status(500).json({ error: err });
    }
  },

  getAllInvoices: async (req, res) => {
    try {
      const invoices = await invoiceService.getAllInvoices();
      res.json(invoices);

    } catch (err) {
      res.status(500).json({ error: err });
    }
  }

};
