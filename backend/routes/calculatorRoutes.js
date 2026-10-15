const express = require("express");
const router = express.Router();
const calculatorController = require("../controllers/calculatorController");

// Kalkuláció lefuttatása és mentése
router.post("/run", calculatorController.runCalculator);

// Felhasználó saját kalkulációi
router.get("/my/:user_id", calculatorController.getUserResults);

// Összes kalkuláció (admin)
router.get("/all", calculatorController.getAllResults);

module.exports = router;
