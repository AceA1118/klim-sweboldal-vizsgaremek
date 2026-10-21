const express = require("express");
const router = express.Router();
const productController = require("../controllers/productController");
const { verifyToken, requireRole } = require("../middleware/auth");

// Összes termék lekérdezése (nyilvános)
router.get("/all", productController.getAllProducts);

// Egy termék lekérdezése ID alapján (nyilvános)
router.get("/:id", productController.getProductById);

// Termék létrehozása (admin)
router.post("/create", verifyToken, requireRole("admin"), productController.createProduct);

// Termék módosítása (admin)
router.put("/update/:id", verifyToken, requireRole("admin"), productController.updateProduct);

// Termék törlése (admin)
router.delete("/delete/:id", verifyToken, requireRole("admin"), productController.deleteProduct);

module.exports = router;
