const express = require("express");
const cors = require("cors");
require("dotenv").config();

if (!process.env.JWT_SECRET) {
  console.error("Hiba: a JWT_SECRET nincs beállítva a .env fájlban!");
  process.exit(1);
}

const app = express();

app.use(cors());
app.use(express.json());

const authRoutes = require("./routes/authRoutes");
const appointmentRoutes = require("./routes/appointmentRoutes");
const productRoutes = require("./routes/productRoutes");
const orderRoutes = require("./routes/orderRoutes");
const invoiceRoutes = require("./routes/invoiceRoutes");
const calculatorRoutes = require("./routes/calculatorRoutes");
const adminRoutes = require("./routes/adminRoutes");
const szereloRoutes = require("./routes/szereloRoutes");

app.use("/auth", authRoutes);
app.use("/appointments", appointmentRoutes);
app.use("/products", productRoutes);
app.use("/orders", orderRoutes);
app.use("/invoice", invoiceRoutes);
app.use("/calculator", calculatorRoutes);
app.use("/admin", adminRoutes);
app.use("/szerelo", szereloRoutes);

// 404 - nem létező végpont
app.use((req, res) => {
  res.status(404).json({ message: "A kért végpont nem található!" });
});

// Központi hibakezelő
app.use((err, req, res, next) => {
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ message: "Hibás JSON a kérés törzsében!" });
  }
  console.error(err);
  res.status(500).json({ message: "Szerverhiba történt!" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`backend running on port ${PORT}`);
});