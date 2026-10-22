const calculatorService = require("../services/calculatorService");

module.exports = {

  // KALKULÁCIÓ FUTTATÁSA + MENTÉSE (a felhasználó a tokenből jön)
  runCalculator: async (req, res) => {
    try {
      const user_id = req.user.id;
      const { room_size, insulation, sunlight } = req.body || {};

      const size = Number(room_size);
      if (!size || size <= 0) {
        return res.status(400).json({ message: "A helyiség mérete kötelező, és pozitív szám legyen!" });
      }

      // Egyszerű logika: ajánlott modell kiválasztása
      let recommended_model = "";

      if (size <= 20) {
        recommended_model = "Gree Amber 2.5 kW";
      } else if (size <= 35) {
        recommended_model = "Gree Amber 3.5 kW";
      } else {
        recommended_model = "Gree Amber 5 kW";
      }

      // Mentés service-en keresztül
      const calcId = await calculatorService.saveCalculation(
        user_id,
        size,
        insulation || "",
        sunlight || "",
        recommended_model
      );

      res.json({
        message: "Kalkuláció elmentve!",
        recommended_model,
        id: calcId
      });

    } catch (err) {
      res.status(500).json({ error: err });
    }
  },

  // FELHASZNÁLÓ SAJÁT KALKULÁCIÓI
  getUserResults: async (req, res) => {
    try {
      const results = await calculatorService.getUserResults(req.user.id);
      res.json(results);
    } catch (err) {
      res.status(500).json({ error: err });
    }
  },

  // ÖSSZES KALKULÁCIÓ (admin)
  getAllResults: async (req, res) => {
    try {
      const results = await calculatorService.getAllResults();
      res.json(results);
    } catch (err) {
      res.status(500).json({ error: err });
    }
  }

};