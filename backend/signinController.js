const connection = require('./connection');
const bcrypt = require('bcrypt');

async function signin(req, res) {
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
}

module.exports = { signin }