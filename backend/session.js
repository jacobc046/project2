const session = require("express-session");
const MySQLStore = require("express-mysql-session")(session);
require("dotenv").config();

const sessionStore = new MySQLStore({
  host: process.env.HOST,
  user: process.env.DB_USER,
  password: process.env.PASSWORD,
  database: process.env.DATABASE,
  port: process.env.DB_PORT,
});

// SESSION DATA STRUCTURE (JSON) DOCUMENTATION:
// req.session = {
//   clientId: number,
// };
// access or assign value by req.session.clientId

module.exports = session({
  secret: "supersecret",
  resave: false,
  store: sessionStore,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 1000 * 60 * 60 * 24, httpOnly: true }
});