const express = require("express");
const router = express.Router();
const appointmentController = require("../controllers/appointmentController");
const { verifyToken, requireRole } = require("../middleware/auth");

// Szabad időpontok egy napra (nyilvános): ?date=YYYY-MM-DD
router.get("/available", appointmentController.getAvailableSlots);

// Foglalás létrehozása (bejelentkezett felhasználó)
router.post("/create", verifyToken, appointmentController.createAppointment);

// Felhasználó saját foglalásai (a user a tokenből jön)
router.get("/my", verifyToken, appointmentController.getUserAppointments);

// Saját foglalás lemondása (csak a tulajdonos)
router.put("/cancel/:id", verifyToken, appointmentController.cancelAppointment);

// Összes foglalás (szerelő / admin)
router.get("/all", verifyToken, requireRole("szerelo", "admin"), appointmentController.getAllAppointments);

// Foglalás jóváhagyása (szerelő / admin)
router.put("/approve/:id", verifyToken, requireRole("szerelo", "admin"), appointmentController.approveAppointment);

// Foglalás elutasítása (szerelő / admin)
router.put("/reject/:id", verifyToken, requireRole("szerelo", "admin"), appointmentController.rejectAppointment);

module.exports = router;