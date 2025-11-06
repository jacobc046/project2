// database services, accessbile by DbService methods.

const mysql = require("mysql");
const dotenv = require("dotenv");
const bcrypt = require("bcrypt");
const express = require("express");
const cors = require("cors");
const session = require("express-session");
const MySQLStore = require("express-mysql-session")(session);

//for image uploading
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });

dotenv.config(); // read from .env file
const app = express();

app.use(cors({
  origin: "http://localhost:5173",
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

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

const sessionStore = new MySQLStore({
  host: process.env.HOST,
  user: process.env.DB_USER,
  password: process.env.PASSWORD,
  database: process.env.DATABASE,
  port: process.env.DB_PORT,
});


// SESSION DATA STRUCTURE (JSON):
// req.session = {
//   clientId: number,
// };
// access or assign value by req.session.clientId

app.use(session({
  secret: "supersecret",
  resave: false,
  store: sessionStore,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 1000 * 60 * 60 * 24, httpOnly: true }
}));

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

    const clientId = await new Promise((resolve, reject) => {
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
    
    req.session.clientId = clientId;
    result.json({ success: true });
    
  } catch (error) {
    console.error("app: signup error:", error);
    result
      .status(500)
      .json({ success: false, error: "Server error during signup" });
  }
});

app.post("/signin", async (req, res) => {
  console.log("app: sign in request body:", req.body);

  const { email, password } = req.body;

  try {
    // Fetch user by email
    const user = await new Promise((resolve, reject) => {
      const query = `SELECT client_id, email, password, account_type FROM Users WHERE email = ?`;
      connection.query(query, [email], (err, results) => {
        if (err) reject(err);
        else resolve(results[0] || null);
      });
    });

    if (!user) {
      return res.json({ success: false, message: "Invalid email or password" });
    }

    // Compare password
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.json({ success: false, message: "Invalid email or password" });
    }

    req.session.clientId = user.client_id;
    res.json({ success: true, clientId: user.client_id, email: user.email, account_type: user.account_type });

  } catch (error) {
    console.error("app: signin error:", error);
    res.status(500).json({ success: false, error: "Server error during signin" });
  }
});

app.post("/request", upload.array("images", 5), (req, res) => {
  const userData = req.body;
  const files = req.files;

  const imageBuffers = [];
  for (let i = 0; i < 5; i++) {
    imageBuffers[i] = files && files[i] ? files[i].buffer : null;
  }
  
  const query = `INSERT INTO 
      Requests(client_id, address, number_of_rooms, date, budget, notes, cleaning_type, image1, image2, image3, image4, image5) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`;

  connection.query(query, [
    req.session.clientId,
    userData.address,
    userData.rooms,
    userData.serviceDate,
    userData.budget,
    userData.notes || null,
    userData.cleaningType,
    imageBuffers[0],
    imageBuffers[1],
    imageBuffers[2],
    imageBuffers[3],
    imageBuffers[4]
  ], (err, result) => {
    if (err) {
      console.error("DB error", err);
      return res.status(500).json({ success: false });
    }
    res.json({ success: true, id: result.insertId });
  });
});

app.listen(5050, () => {
  console.log("I am listening on the fixed port 5050.");
});
