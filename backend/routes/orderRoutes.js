const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");
const { verifyToken, requireRole } = require("../middleware/auth");

// Rendelés létrehozása (bejelentkezett felhasználó)
router.post("/create", verifyToken, orderController.createOrder);

// Felhasználó saját rendelései (a user a tokenből jön)
router.get("/my", verifyToken, orderController.getUserOrders);

// Egy rendelés részletei (csak a tulajdonos vagy admin)
router.get("/:order_id", verifyToken, orderController.getOrderDetails);

// Rendelés státusz módosítása (admin)
router.put("/status/:order_id", verifyToken, requireRole("admin"), orderController.updateStatus);

module.exports = router;