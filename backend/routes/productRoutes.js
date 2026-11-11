const express = require("express");
const router = express.Router();
const productController = require("../controllers/productController");
const { verifyToken, requireRole } = require("../middleware/auth");

// Termékek listája szűréssel, kereséssel, lapozással (nyilvános)
router.get("/all", productController.getAllProducts);

// Szűrők listája a frontendnek (nyilvános)
router.get("/filters", productController.getFilters);

// Egy termék lekérdezése ID alapján (nyilvános) - ez legyen a /all és /filters UTÁN
router.get("/:id", productController.getProductById);

// Termék létrehozása (admin)
router.post("/create", verifyToken, requireRole("admin"), productController.createProduct);

// Termékek tömeges feltöltése (admin)
router.post("/bulk", verifyToken, requireRole("admin"), productController.createProductsBulk);

// Termék módosítása (admin)
router.put("/update/:id", verifyToken, requireRole("admin"), productController.updateProduct);

// Termék törlése (admin)
router.delete("/delete/:id", verifyToken, requireRole("admin"), productController.deleteProduct);

module.exports = router;