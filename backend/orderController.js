const connection = require("./connection");

//gets a list of the orders
async function listOrders(req, res) {
  const sql = `SELECT o.orderID, o.address, o.number_of_rooms, o.date, o.price, o.notes, TRIM(CONCAT(COALESCE(u.first_name,''),' ',COALESCE(u.last_name,''))) AS client_name
    FROM Orders o JOIN Quote q on q.quoteID = o.quoteID AND q.response_number = o.response_number
    JOIN Requests r ON r.requestID = q.requestID
    JOIN Users u ON u.client_id = r.client_id 
    ORDER BY o.orderID DESC 
    `;

  connection.query(sql, (err, rows) => {
    if (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
    return res.json({ success: true, orders: rows });
  });
}

//gets one order by id
async function getOrderById(req, res) {
  const orderID = parseInt(req.params.id, 10);
  if (Number.isNaN(orderID)) {
    return res.status(400).json({ success: false, error: "Invalid orderID" });
  }

  const sql = `SELECT o.orderID, o.address, o.number_of_rooms, o.date, o.price, o.notes, TRIM(CONCAT(COALESCE(u.first_name,''),' ',COALESCE(u.last_name,''))) AS client_name
  FROM Orders o JOIN Quote q on q.quoteID = o.quoteID AND q.response_number = o.response_number
  JOIN Requests r ON r.requestID = q.requestID
  JOIN Users u ON u.client_id = r.client_id
  WHERE o.orderID = ? 
  LIMIT 1
  `;
  connection.query(sql, [orderID], (err, rows) => {
    if (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
    if (!rows.length) {
      return res.status(404).json({ success: false, error: "Order not found" });
    }
    return res.json({ success: true, order: rows[0] });
  });
}

module.exports = {
  listOrders,
  getOrderById,
};
