const connection = require("./connection");

//get the quotes information by id for client side
async function listQuotes(req, res) {
  const sql = `
    SELECT DISTINCT r.requestID,
        CONCAT(u.first_name, ' ', u.last_name) AS client_name,
        r.address,
        r.number_of_rooms,
        q.date,
        q.price,
        r.cleaning_type,
        q.notes,
        q.requestID,
        q.quoteID,
        q.response_number,
        r.image1,
        r.image2,
        r.image3,
        r.image4,
        r.image5
    FROM Requests r, Quote q
    JOIN Users u ON u.client_id = q.client_id
    WHERE q.requestID = r.requestID
    AND q.status = 'awaiting client'
    AND q.client_id = ${req.session.clientId}
    AND q.response_number = (
        SELECT MAX(q2.response_number)
        FROM Quote q2
        WHERE q2.quoteID = q.quoteID
        GROUP BY q2.quoteID
    )
  `;
  connection.query(sql, [], (err, rows) => {
    if (err)
      return res.status(500).json({ success: false, error: err.message });
    if (!rows.length)
      return res.json({ success: true, empty: true });
    res.json(rows);
  });
}

async function submitQuote(req, res) {
    const userData = req.body;

    const sql = `
        INSERT INTO Quote (quoteID, requestID, response_number, status, price, date, notes, client_id) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    connection.query(sql, [
        userData.quoteID,
        userData.requestID,
        userData.response_number,
        userData.status,
        userData.budget,
        userData.date,
        userData.notes,
        req.session.clientId
    ], (err, result) => {
    if (err) {
        console.log(err);
        return res.json({ success: false, error: err.message });
    }
    res.json({ success: true });
  });
}

module.exports = { 
    listQuotes,
    submitQuote
 }