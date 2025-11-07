const connection = require('./connection');

async function getFrequentClients(req, res) {
  const query = `
    SELECT u.client_id, u.email, u.first_name, u.last_name, COUNT(o.client_id) AS frequency
    FROM Users u, Orders o 
    WHERE o.client_id = u.client_id 
    GROUP BY u.client_id 
    HAVING COUNT(o.client_id) = (
      SELECT MAX(order_count) FROM (  
        SELECT COUNT(*) AS order_count
        FROM Orders
        GROUP BY client_id
      ) AS counts);`

  connection.query(query, [], (err, result) => {
    if (err) {
      console.error("DB error", err);
      return res.status(500).json({ success: false });
    }
    res.json({ rows: result });
  })
}

module.exports = { getFrequentClients, }