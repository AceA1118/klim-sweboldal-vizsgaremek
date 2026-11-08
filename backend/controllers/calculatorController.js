const calculatorService = require("../services/calculatorService");

const NO_MATCH = "Egyedi felmérés szükséges";

// Egységes hibakezelés: általános 500, az SQL-hiba nem szivárog ki
const handleError = (err, res) => {
  console.error(err);
  res.status(500).json({ message: "Szerverhiba történt!" });
};

module.exports = {

  // KALKULÁCIÓ FUTTATÁSA + MENTÉSE (a felhasználó a tokenből jön)
  // Body: { room_size: 25, insulation: "good|average|poor", sunlight: "low|medium|high" }
  // Az insulation és a sunlight elhagyható (alapérték: average / medium).
  runCalculator: async (req, res) => {
    try {
      const user_id = req.user.id;
      const { room_size, insulation = "average", sunlight = "medium" } = req.body || {};

      const size = Number(room_size);
      if (!Number.isFinite(size) || size <= 0 || size > 500) {
        return res.status(400).json({ message: "A helyiség mérete (m²) 0 és 500 közötti szám legyen!" });
      }
      if (!Object.hasOwn(calculatorService.INSULATION, insulation)) {
        return res.status(400).json({
          message: `Érvénytelen szigetelés! Engedélyezett: ${Object.keys(calculatorService.INSULATION).join(", ")}`
        });
      }
      if (!Object.hasOwn(calculatorService.SUNLIGHT, sunlight)) {
        return res.status(400).json({
          message: `Érvénytelen napsütés! Engedélyezett: ${Object.keys(calculatorService.SUNLIGHT).join(", ")}`
        });
      }

      // 1. Hűtési igény
      const { required_kw, required_btu } = calculatorService.calculateLoad(size, insulation, sunlight);

      // 2. Megfelelő termékek az adatbázisból
      const [best, ...alternatives] = await calculatorService.findSuitableProducts(required_btu);

      const recommended_model = best ? best.name : NO_MATCH;

      // 3. Mentés
      const id = await calculatorService.saveCalculation(user_id, size, insulation, sunlight, recommended_model);

      res.json({
        message: "Kalkuláció elmentve!",
        id,
        required_kw,
        required_btu,
        recommended_model,
        recommended_product: best || null,
        alternatives,
        note: best
          ? undefined
          : "Ekkora hűtési igényhez nincs megfelelő készleten lévő készülék, kérj egyedi felmérést!"
      });

    } catch (err) {
      handleError(err, res);
    }
  },

  // FELHASZNÁLÓ SAJÁT KALKULÁCIÓI
  getUserResults: async (req, res) => {
    try {
      const results = await calculatorService.getUserResults(req.user.id);
      res.json(results);
    } catch (err) {
      handleError(err, res);
    }
  },

  // ÖSSZES KALKULÁCIÓ (admin)
  getAllResults: async (req, res) => {
    try {
      const results = await calculatorService.getAllResults();
      res.json(results);
    } catch (err) {
      handleError(err, res);
    }
  }

};