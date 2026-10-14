const express = require("express");
const router = express.Router();
const productController = require("../controllers/productController");

// Összes termék lekérdezése
router.get("/all", productController.getAllProducts);

// Egy termék lekérdezése ID alapján
router.get("/:id", productController.getProductById);

// Termék létrehozása (admin fiok)
router.post("/create", productController.createProduct);

// Termék módosítása (admin fiok)
router.put("/update/:id", productController.updateProduct);

// Termék törlése (admin fiok)
router.delete("/delete/:id", productController.deleteProduct);

module.exports = router;
