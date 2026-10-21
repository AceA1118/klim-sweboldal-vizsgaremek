const express = require("express");
const router = express.Router();
const szereloController = require("../controllers/szereloController");
const appointmentController = require("../controllers/appointmentController");
const { verifyToken, requireRole } = require("../middleware/auth");

// Minden szerelő végpont bejelentkezést és szerelő/admin szerepkört igényel
router.use(verifyToken, requireRole("szerelo", "admin"));

// Összes időpont
router.get("/appointments", appointmentController.getAllAppointments);

// Időpont jóváhagyása / elutasítása (ugyanaz a logika, mint az /appointments alatt)
router.put("/approve/:id", appointmentController.approveAppointment);
router.put("/reject/:id", appointmentController.rejectAppointment);

// A szerelő saját időpontjai (a szerelő ID a tokenből jön)
router.get("/my", requireRole("szerelo"), szereloController.getMyAppointments);

module.exports = router;