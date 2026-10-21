const express = require("express");
const router = express.Router();
const invoiceController = require("../controllers/invoiceController");
const { verifyToken, requireRole } = require("../middleware/auth");

// Számla létrehozása (admin)
router.post("/create", verifyToken, requireRole("admin"), invoiceController.createInvoice);

// Egy rendelés számlájának lekérése (csak a tulajdonos vagy admin)
router.get("/order/:order_id", verifyToken, invoiceController.getInvoiceByOrder);

// Felhasználó saját számlái (a user a tokenből jön)
router.get("/my", verifyToken, invoiceController.getUserInvoices);

// Összes számla (admin)
router.get("/all", verifyToken, requireRole("admin"), invoiceController.getAllInvoices);

module.exports = router;