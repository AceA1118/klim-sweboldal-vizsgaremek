import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";
import Home from "./pages/Home.jsx";
import Shop from "./pages/Shop.jsx";
import Booking from "./pages/Booking.jsx";
import Calculator from "./pages/Calculator.jsx";
import Invoice from "./pages/Invoice.jsx";

export default function App() {
  return (
    <>
      <Navbar />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/webshop" element={<Shop />} />
        <Route path="/idopontfoglalas" element={<Booking />} />
        <Route path="/kalkulator" element={<Calculator />} />
        <Route path="/szamlazas" element={<Invoice />} />
      </Routes>

      <Footer />
    </>
  );
}