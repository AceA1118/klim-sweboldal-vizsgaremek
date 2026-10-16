const express = require("express");
const router = express.Router();
const appointmentController = require("../controllers/appointmentController");

//foglalás létrehozása
router.post("/create", appointmentController.createAppointment);

// Felhasználó saját fglalásai
router.get("/my/:user_id", appointmentController.getUserAppointments);

// Összes foglalás (admin/szerelő)
router.get("/all", appointmentController.getAllAppointments);

//foglalás jóváhagyása
router.put("/approve/:id", appointmentController.approveAppointment);

//fogallás elutasítása
router.put("/reject/:id", appointmentController.rejectAppointment);

module.exports = router;
