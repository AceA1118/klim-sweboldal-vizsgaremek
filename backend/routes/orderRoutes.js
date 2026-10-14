const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");

// Rendelés létrehozása
router.post("/create", orderController.createOrder);

// Felhasználó saját rendelései
router.get("/my/:user_id", orderController.getUserOrders);

// Egy rendelés részletei (order + items)
router.get("/:order_id", orderController.getOrderDetails);

// Rendelés státusz módosítása (admin)
router.put("/status/:order_id", orderController.updateStatus);

module.exports = router;
