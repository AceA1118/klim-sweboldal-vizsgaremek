const express = require("express");
const router = express.Router();
const calculatorController = require("../controllers/calculatorController");
const { verifyToken, requireRole } = require("../middleware/auth");

// Kalkuláció lefuttatása és mentése (bejelentkezett felhasználó)
router.post("/run", verifyToken, calculatorController.runCalculator);

// Felhasználó saját kalkulációi (a user a tokenből jön)
router.get("/my", verifyToken, calculatorController.getUserResults);

// Összes kalkuláció (admin)
router.get("/all", verifyToken, requireRole("admin"), calculatorController.getAllResults);

module.exports = router;