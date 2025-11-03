// database services, accessbile by DbService methods.

const mysql = require('mysql');
const dotenv = require('dotenv');
const bcrypt = require('bcrypt');
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

app.post("/signup", (request, response) => {
  console.log("app: sign up request body:", request.body);

  const userData = request.body;
  const db = DbService.getDbServiceInstance();
  
  
  const result = async ()  => {
      const hashedPassword = await hashPassword(userData.password);

      try{
        // use await to call an asynchronous function
        const insertUser = await new Promise((resolve, reject) => 
        {
            const query = `INSERT INTO Users (username, password, firstname, lastname, account-type)
            VALUES (?, ?, ?, ?, ?);`;
            connection.query(query, [
              userData.username,
              hashedPassword,
              userData.firstName,
              userData.lastName,
              userData.account-type
            ], (err, result) => {
                if(err) reject(new Error(err.message));
                else resolve(result.insertId);
            });
        });
      } catch(error){
            console.log("app.js: ERROR:", error);
      }
   }

  result
    .then((data) => response.json({ data: data })) 
    .catch((err) => console.log("app: err: ", err));
});

app.listen(5050, () => {
  console.log("I am listening on the fixed port 5050.");
});