// database services, accessbile by DbService methods.

const mysql = require("mysql");
const dotenv = require("dotenv");
const bcrypt = require("bcrypt");
const express = require("express");
const cors = require("cors");

dotenv.config(); // read from .env file
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

let instance = null;

console.log("HOST: " + process.env.HOST);
console.log("DB USER: " + process.env.DB_USER);
console.log("PASSWORD: " + process.env.PASSWORD);
console.log("DATABASE: " + process.env.DATABASE);
console.log("DB PORT: " + process.env.DB_PORT);

const connection = mysql.createConnection({
  host: process.env.HOST,
  user: process.env.DB_USER,
  password: process.env.PASSWORD,
  database: process.env.DATABASE,
  port: process.env.DB_PORT,
});

connection.connect((err) => {
  if (err) {
    console.log(err.message);
  }
  console.log("db " + connection.state); // to see if the DB is connected or not
});

async function hashPassword(plainPassword) {
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(plainPassword, salt);
  return hash;
}

app.post("/signup", async (req, result) => {
  console.log("app: sign up request body:", req.body);

  const userData = req.body;

  try {
    const hashedPassword = await hashPassword(userData.password);

    const insertUserId = await new Promise((resolve, reject) => {
      const query = `
        INSERT INTO Users (email, password, first_name, last_name, phone_number, street, city, state, zipcode, card_number, ex_date, cvv, account_type)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      connection.query(
        query,
        [
          userData.email,
          hashedPassword,
          userData.firstName,
          userData.lastName,
          userData.phoneNumber,
          userData.street,
          userData.city,
          userData.state,
          userData.zipcode,
          userData.cardNumber,
          userData.exDate,
          userData.cvv,
          "client",
        ],
        (err, result) => {
          if (err) reject(err);
          else resolve(result.insertId);
        }
      );
    });

    result.json({ success: true, userId: insertUserId });
  } catch (error) {
    console.error("app: signup error:", error);
    result
      .status(500)
      .json({ success: false, error: "Server error during signup" });
  }
});

app.post("/signin", async (req, result) => {
  console.log("app: sign in request body:", req.body);

  const userData = req.body;

  try {
    // 1. Fetch user by username
    const user = await new Promise((resolve, reject) => {
      const query = `SELECT email, password, account_type FROM Users WHERE email = ?`;
      connection.query(query, [userData.email], (err, result) => {
        if (err) reject(err);
        else if (result.length === 0) resolve(null);
        else resolve(result[0]);
      });
    });

    if (!user) {
      return result.json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // 2. Compare provided password with stored hash
    const match = await bcrypt.compare(userData.password, user.password);

    if (match) {
      return result.json({
        success: true,
        email: user.email,
        account_type: user.account_type,
      });
    } else {
      return result.json({
        success: false,
        message: "Invalid email or password",
      });
    }
  } catch (error) {
    console.error("app: signup error:", error);
    return result
      .status(500)
      .json({ success: false, error: "Server error during signin" });
  }
});

//list of requests, just getting the clients name
app.get("/requests", (req, res) => {
  const status = req.query.status || "new";
  const sql = `
    SELECT r.requestID,
           CONCAT(u.first_name, ' ', u.last_name) AS client_name
    FROM Requests r
    JOIN Users u ON u.client_id = r.client_id
    WHERE r.status = ?
    ORDER BY r.date DESC
  `;
  connection.query(sql, [status], (err, rows) => {
    if (err)
      return res.status(500).json({ success: false, error: err.message });
    res.json(rows); // [{requestID, client_name}, ...]
  });
});

//full info for the request
app.get("/requests/:id", (req, res) => {
  const sql = `
    SELECT r.requestID,
           CONCAT(u.first_name, ' ', u.last_name) AS client_name,
           r.address,
           r.number_of_rooms,
           r.date,
           r.budget,
           r.cleaning_type,
           r.notes,
           r.status
    FROM Requests r
    JOIN Users u ON u.client_id = r.client_id
    WHERE r.requestID = ?
    LIMIT 1
  `;
  connection.query(sql, [req.params.id], (err, rows) => {
    if (err)
      return res.status(500).json({ success: false, error: err.message });
    if (!rows.length)
      return res.status(404).json({ success: false, error: "Not found" });
    res.json(rows[0]);
  });
});

app.listen(5050, () => {
  console.log("I am listening on the fixed port 5050.");
});
