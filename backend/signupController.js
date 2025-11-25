const connection = require('./connection');
const bcrypt = require('bcrypt');

async function hashPassword(plainPassword) {
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(plainPassword, salt);
  return hash;
}

async function signup(req, result) {
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
    return result.json({ success: true });
    
  } catch (error) {
    console.error("app: signup error:", error);
    result
      .status(500)
      .json({ success: false, error: "Server error during signup" });
  }
}

module.exports = { signup }