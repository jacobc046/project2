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

class DbService {
  static getDbServiceInstance() {
    // only one instance is sufficient
    return instance ? instance : new DbService();
  }
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

app.listen(5050, () => {
  console.log("I am listening on the fixed port 5050.");
});
