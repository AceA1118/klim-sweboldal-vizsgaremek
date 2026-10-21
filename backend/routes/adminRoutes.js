const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const { verifyToken, requireRole } = require("../middleware/auth");

// Minden admin végpont csak adminnak érhető el
router.use(verifyToken, requireRole("admin"));

// Felhasználók listázása
router.get("/users", adminController.getAllUsers);

// Rendelések listázása
router.get("/orders", adminController.getAllOrders);

// Időpontok listázása
router.get("/appointments", adminController.getAllAppointments);

module.exports = router;