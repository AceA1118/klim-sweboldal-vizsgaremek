const jwt = require("jsonwebtoken");

// Ellenőrzi az "Authorization: Bearer <token>" fejlécet.
// Siker esetén req.user = { id, role }
exports.verifyToken = (req, res, next) => {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ message: "Bejelentkezés szükséges!" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.id, role: decoded.role };
    next();
  } catch (err) {
    return res.status(401).json({ message: "Érvénytelen vagy lejárt token!" });
  }
};

// Szerepkör szerinti korlátozás
exports.requireRole = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ message: "Nincs jogosultságod ehhez a művelethez!" });
  }
  next();
};