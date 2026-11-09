const db = require("../database/db");

// Saját hibatípus, hogy tiszta HTTP választ adhassunk
const httpError = (status, message) => Object.assign(new Error(message), { status });

const handleError = (err, res) => {
  if (err.status) {
    return res.status(err.status).json({ message: err.message });
  }
  // a termék szerepel egy rendelésben, ezért nem törölhető
  if (err.code === "ER_ROW_IS_REFERENCED_2") {
    return res.status(409).json({
      message: "A termék szerepel rendelésben, ezért nem törölhető. Állítsd a készletét 0-ra!"
    });
  }
  console.error(err);
  res.status(500).json({ message: "Szerverhiba történt!" });
};

// ---------- Termék adatainak ellenőrzése ----------
const isText = (v, max) => typeof v === "string" && v.trim().length > 0 && v.length <= max;
const isInt = (v, min) => Number.isInteger(Number(v)) && v !== "" && v !== null && Number(v) >= min;
const toFlag = (v) => (v === true || v === 1 || v === "1" || v === "true") ? 1
                    : (v === false || v === 0 || v === "0" || v === "false") ? 0 : null;

// Mezőnként: ellenőrzés + átalakítás az adatbázis formátumára
const FIELDS = {
  name:        { required: true,  check: v => isText(v, 255),                 fix: v => v.trim(),          msg: "A név kötelező (max. 255 karakter)" },
  price:       { required: true,  check: v => isInt(v, 0),                    fix: Number,                 msg: "Az ár nemnegatív egész szám (Ft)" },
  description: { required: false, check: v => typeof v === "string",          fix: v => v,                 msg: "A leírás szöveg legyen", def: "" },
  stock:       { required: true,  check: v => isInt(v, 0),                    fix: Number,                 msg: "A készlet nemnegatív egész szám" },
  category:    { required: true,  check: v => isText(v, 255),                 fix: v => v.trim(),          msg: "A kategória kötelező (max. 255 karakter)" },
  brand:       { required: true,  check: v => isText(v, 255),                 fix: v => v.trim(),          msg: "A márka kötelező (max. 255 karakter)" },
  btu:         { required: true,  check: v => isInt(v, 1),                    fix: Number,                 msg: "A BTU pozitív egész szám" },
  wifi:        { required: false, check: v => toFlag(v) !== null,             fix: toFlag,                 msg: "A wifi értéke true vagy false legyen", def: 0 },
  inverter:    { required: false, check: v => toFlag(v) !== null,             fix: toFlag,                 msg: "Az inverter értéke true vagy false legyen", def: 0 },
  image_url:   { required: false, check: v => typeof v === "string" && v.length <= 255, fix: v => v,      msg: "A képcím szöveg legyen (max. 255 karakter)", def: "" }
};
const FIELD_NAMES = Object.keys(FIELDS);

// partial = true: csak a megadott mezőket ellenőrzi (módosításhoz)
const parseProduct = (body, partial = false) => {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { error: "Hiányzó vagy hibás adatok!" };
  }

  const value = {};
  for (const name of FIELD_NAMES) {
    const rule = FIELDS[name];
    const given = body[name];

    if (given === undefined) {
      if (partial) continue;
      if (rule.required) return { error: `Hiányzó mező: ${name} (${rule.msg})` };
      value[name] = rule.def;
      continue;
    }
    if (!rule.check(given)) return { error: `Hibás mező: ${name} (${rule.msg})` };
    value[name] = rule.fix(given);
  }

  if (partial && Object.keys(value).length === 0) {
    return { error: "Adj meg legalább egy módosítandó mezőt!" };
  }
  return { value };
};

// ---------- Szűrés / rendezés ----------
const SORTS = {
  price_asc: "price ASC",
  price_desc: "price DESC",
  name: "name ASC",
  btu_asc: "btu ASC, price ASC",
  btu_desc: "btu DESC, price ASC",
  newest: "id DESC"
};

module.exports = {

  // TERMÉKEK LISTÁJA (nyilvános) - szűrés, keresés, rendezés, lapozás
  // GET /products/all?category=&brand=&btu=&wifi=true&inverter=true&min_price=&max_price=
  //                  &in_stock=true&q=&sort=price_asc&page=1&limit=20
  getAllProducts: async (req, res) => {
    try {
      const q = req.query;
      const where = [];
      const params = [];

      if (q.category) { where.push("category = ?"); params.push(String(q.category)); }
      if (q.brand)    { where.push("brand = ?");    params.push(String(q.brand)); }
      if (q.btu !== undefined) {
        if (!isInt(q.btu, 1)) return res.status(400).json({ message: "A btu pozitív egész szám legyen!" });
        where.push("btu = ?"); params.push(Number(q.btu));
      }
      for (const flag of ["wifi", "inverter"]) {
        if (q[flag] !== undefined) {
          const f = toFlag(q[flag]);
          if (f === null) return res.status(400).json({ message: `A(z) ${flag} értéke true vagy false legyen!` });
          where.push(`${flag} = ?`); params.push(f);
        }
      }
      if (q.min_price !== undefined) {
        if (!isInt(q.min_price, 0)) return res.status(400).json({ message: "A min_price nemnegatív egész szám legyen!" });
        where.push("price >= ?"); params.push(Number(q.min_price));
      }
      if (q.max_price !== undefined) {
        if (!isInt(q.max_price, 0)) return res.status(400).json({ message: "A max_price nemnegatív egész szám legyen!" });
        where.push("price <= ?"); params.push(Number(q.max_price));
      }
      if (q.in_stock === "true") where.push("stock > 0");
      if (q.q) {
        where.push("(name LIKE ? OR description LIKE ?)");
        params.push(`%${String(q.q)}%`, `%${String(q.q)}%`);
      }

      const orderBy = q.sort === undefined ? SORTS.newest : SORTS[q.sort];
      if (!orderBy) {
        return res.status(400).json({ message: `Érvénytelen rendezés! Engedélyezett: ${Object.keys(SORTS).join(", ")}` });
      }

      const page = q.page === undefined ? 1 : Number(q.page);
      const limit = q.limit === undefined ? 20 : Number(q.limit);
      if (!Number.isInteger(page) || page < 1 || !Number.isInteger(limit) || limit < 1 || limit > 100) {
        return res.status(400).json({ message: "A page legalább 1, a limit 1 és 100 közötti egész szám legyen!" });
      }

      const whereSql = where.length ? "WHERE " + where.join(" AND ") : "";
      const pool = db.promise();

      const [[{ total }]] = await pool.query(`SELECT COUNT(*) AS total FROM products ${whereSql}`, params);
      const [items] = await pool.query(
        `SELECT * FROM products ${whereSql} ORDER BY ${orderBy} LIMIT ? OFFSET ?`,
        [...params, limit, (page - 1) * limit]
      );

      res.json({ items, total, page, limit });

    } catch (err) {
      handleError(err, res);
    }
  },

  // SZŰRŐK LISTÁJA a frontendnek (nyilvános): kategóriák, márkák, BTU értékek, árhatárok
  getFilters: async (req, res) => {
    try {
      const pool = db.promise();
      const [categories] = await pool.query("SELECT DISTINCT category FROM products ORDER BY category");
      const [brands] = await pool.query("SELECT DISTINCT brand FROM products ORDER BY brand");
      const [btus] = await pool.query("SELECT DISTINCT btu FROM products ORDER BY btu");
      const [[range]] = await pool.query("SELECT MIN(price) AS min_price, MAX(price) AS max_price FROM products");

      res.json({
        categories: categories.map(r => r.category),
        brands: brands.map(r => r.brand),
        btus: btus.map(r => r.btu),
        min_price: range.min_price,
        max_price: range.max_price
      });
    } catch (err) {
      handleError(err, res);
    }
  },

  // EGY TERMÉK (nyilvános)
  getProductById: async (req, res) => {
    try {
      const [rows] = await db.promise().query("SELECT * FROM products WHERE id = ?", [req.params.id]);
      if (rows.length === 0) {
        return res.status(404).json({ message: "Termék nem található!" });
      }
      res.json(rows[0]);
    } catch (err) {
      handleError(err, res);
    }
  },

  // TERMÉK LÉTREHOZÁSA (admin)
  createProduct: async (req, res) => {
    try {
      const { value, error } = parseProduct(req.body);
      if (error) return res.status(400).json({ message: error });

      const [result] = await db.promise().query("INSERT INTO products SET ?", [value]);

      res.json({ message: "Termék sikeresen létrehozva!", id: result.insertId });
    } catch (err) {
      handleError(err, res);
    }
  },

  // TERMÉKEK TÖMEGES FELTÖLTÉSE (admin)
  // Body: { "products": [ { name, price, stock, category, brand, btu, ... }, ... ] } (max. 500)
  // Mindent ellenőriz, és vagy az összes termék bekerül, vagy egy sem.
  createProductsBulk: async (req, res) => {
    try {
      const list = (req.body || {}).products;

      if (!Array.isArray(list) || list.length === 0 || list.length > 500) {
        return res.status(400).json({ message: "A products egy 1 és 500 közötti elemszámú tömb legyen!" });
      }

      const rows = [];
      for (let i = 0; i < list.length; i++) {
        const { value, error } = parseProduct(list[i]);
        if (error) {
          return res.status(400).json({ message: `Hiba a(z) ${i + 1}. terméknél: ${error}` });
        }
        rows.push(FIELD_NAMES.map(name => value[name]));
      }

      // egyetlen INSERT = egyetlen atomi művelet (vagy mind, vagy egy sem)
      const [result] = await db.promise().query(
        `INSERT INTO products (${FIELD_NAMES.join(", ")}) VALUES ?`,
        [rows]
      );

      res.json({ message: `${rows.length} termék sikeresen létrehozva!`, count: rows.length, first_id: result.insertId });
    } catch (err) {
      handleError(err, res);
    }
  },

  // TERMÉK MÓDOSÍTÁSA (admin) - elég a módosítandó mezőket megadni
  updateProduct: async (req, res) => {
    try {
      const { value, error } = parseProduct(req.body, true);
      if (error) return res.status(400).json({ message: error });

      const [result] = await db.promise().query("UPDATE products SET ? WHERE id = ?", [value, req.params.id]);

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Termék nem található!" });
      }
      res.json({ message: "Termék sikeresen módosítva!" });
    } catch (err) {
      handleError(err, res);
    }
  },

  // TERMÉK TÖRLÉSE (admin)
  deleteProduct: async (req, res) => {
    try {
      const [result] = await db.promise().query("DELETE FROM products WHERE id = ?", [req.params.id]);

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Termék nem található!" });
      }
      res.json({ message: "Termék törölve!" });
    } catch (err) {
      handleError(err, res);
    }
  }

};