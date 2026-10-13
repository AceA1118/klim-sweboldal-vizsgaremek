const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

const db = require("./database/db");

const authRoutes = require("./routes/authRoutes");
const appointmentRoutes = require("./routes/appointentRoutes");
const productRoutes = require("./routes/productRoutes");
const orderRoutes = require("./routes/orderRoutes");
const invoiceRoutes = require("./routes/invoiceRoutes");
const calculatorRoutes = require("./routes/calculatorRoutes");
const adminRoutes = require("./routes/adminRoutes");
const szereloRoutes = require("./routes/szereloRoutes");

app.use("/auth", authRoutes);
app.use("/appointments", appointmentRoutes);
app.use("/products", productRoutes);
app.use("/orders",orderRoutes);
app.use("/invoice", invoiceRoutes);
app.use("/calculator",calculatorRoutes);
app.use("/admin", adminRoutes);
app.use("/szerelo", szereloRoutes);

app.listen(3000, () => {
    console.log("backend running on port 3000")
});