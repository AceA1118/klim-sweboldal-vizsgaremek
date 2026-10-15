const express = require("express");
const router = express.Router();
const szereloController = require("../controllers/szereloController");

// Összes időpont (szerelő)
router.get("/appointments", szereloController.getAllAppointments);

// Időpont jóváhagyása
router.put("/approve/:id", szereloController.approveAppointment);

// Időpont elutasítása
router.put("/reject/:id", szereloController.rejectAppointment);

// Szerelő saját időpontjai (ha van szerelő ID)
router.get("/my/:szerelo_id", szereloController.getMyAppointments);

module.exports = router;
