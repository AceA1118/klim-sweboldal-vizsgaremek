const express = require("express");
const router = express.Router();
const invoiceController = require("../controllers/invoiceController");

// Számla létrehozása
router.post("/create", invoiceController.createInvoice);

// Egy rendelés számlájának lekérése
router.get("/order/:order_id", invoiceController.getInvoiceByOrder);

// Felhasználó számlái
router.get("/my/:user_id", invoiceController.getUserInvoices);

// Összes számla (admin)
router.get("/all", invoiceController.getAllInvoices);

module.exports = router;
