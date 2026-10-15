const calculatorService = require("../services/calculatorService");

module.exports = {

  // KALKULÁCIÓ FUTTATÁSA + MENTÉSE
  runCalculator: async (req, res) => {
    try {
      const { user_id, room_size, insulation, sunlight } = req.body;

      // Egyszerű logika: ajánlott modell kiválasztása
      let recommended_model = "";

      if (room_size <= 20) {
        recommended_model = "Gree Amber 2.5 kW";
      } else if (room_size <= 35) {
        recommended_model = "Gree Amber 3.5 kW";
      } else {
        recommended_model = "Gree Amber 5 kW";
      }

      // Mentés service-en keresztül
      const calcId = await calculatorService.saveCalculation(
        user_id,
        room_size,
        insulation,
        sunlight,
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
      const user_id = req.params.user_id;
      const results = await calculatorService.getUserResults(user_id);
      res.json(results);
    } catch (err) {
      res.status(500).json({ error: err });
    }
  },

  // ÖSSZES KALKULÁCIÓ (ADMIN)
  getAllResults: async (req, res) => {
    try {
      const results = await calculatorService.getAllResults();
      res.json(results);
    } catch (err) {
      res.status(500).json({ error: err });
    }
  }

};
