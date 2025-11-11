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

async function getUncommittedClients(req, res) {
  const query = `
    SELECT r.client_id, u.first_name, u.last_name, u.email
    FROM Requests r, Users u
    GROUP BY client_id
    HAVING COUNT(*) >= 3;
  `;

  connection.query(query, [], (err, result) => {
    if (err) {
      console.error("DB error", err);
      return res.status(500).json({ success: false });
    }    

    res.json({ rows: result });
  });
}

async function getAcceptedQuotes(req, res) {
  const query = `
    SELECT u.first_name, u.last_name, u.email, q.*, r.requestId
    FROM Quote q, Users u, Requests r
    WHERE q.status = 'accepted'
    AND q.requestId = r.requestId
    AND r.client_id = u.client_id
    AND MONTH(q.date) = MONTH(NOW());
  `;

  connection.query(query, [], (err, result) => {
    if (err) {
      console.error("DB error", err);
      return res.status(500).json({ success: false });
    }    

    res.json({ rows: result });
  });
}

async function getProspectiveClients(req, res) {
  const query = `
  SELECT u.email, u.first_name, u.last_name, u.client_id
  FROM Users u
  WHERE u.client_id 
  NOT IN (
    SELECT client_id FROM Requests
  ) 
  AND u.account_type <> 'admin';
  `;

  connection.query(query, [], (err, result) => {
    if (err) {
      console.error("DB error", err);
      return res.status(500).json({ success: false });
    }    

    res.json({ rows: result });
  });
}

async function getLargestClients(req, res) {
  const query = `
  SELECT r.*, u.email, u.first_name, u.last_name
  FROM Requests r, Users u
  WHERE r.number_of_rooms = (
    SELECT MAX(number_of_rooms) FROM Requests
  )
  AND r.client_id = u.client_id;
  `;
  
  connection.query(query, [], (err, result) => {
    if (err) {
      console.error("DB error", err);
      return res.status(500).json({ success: false });
    }    

    res.json({ rows: result });
  });
}

async function getOverdueBills(req, res) {
  const query = `
  SELECT DISTINCT b.client_id, b.billID, b.date_issued, b.orderID, u.email, u.first_name, u.last_name, u.client_id, o.address, o.number_of_rooms, o.price, o.orderID
  FROM Bill b, Users u, Orders o
  WHERE b.billID NOT IN (
    SELECT billID FROM Payment
  ) 
  AND b.client_id = u.client_id
  AND b.orderID = o.orderID
  AND b.date_issued <= DATE_SUB(CURDATE(), INTERVAL 7 DAY);
  `;
  
  connection.query(query, [], (err, result) => {
    if (err) {
      console.error("DB error", err);
      return res.status(500).json({ success: false });
    }    

    res.json({ rows: result });
  });
}

async function getBadClients(req, res) {
  const query = `
  SELECT DISTINCT b.client_id, b.billID, u.email, u.first_name, u.last_name, u.client_id
  FROM Bill b, Users u
  WHERE b.billID NOT IN (
    SELECT billID FROM Payment
  ) 
  AND b.client_id = u.client_id;
  `;
  
  connection.query(query, [], (err, result) => {
    if (err) {
      console.error("DB error", err);
      return res.status(500).json({ success: false });
    }    

    res.json({ rows: result });
  });
}

async function getGoodClients(req, res) {
  const query = `
  SELECT DISTINCT u.first_name, u.last_name, u.client_id, u.email, b.billID, b.date_issued, p.billID, p.date_paid, p.status
  FROM Users u, Bills b, Payment p
  WHERE b.client_id = u.client_id
  AND p.billID = b.billID
  AND p.status = 'paid'
  AND p.date_paid >= b.date_issued - INTERVAL 24 HOUR
  `;
  
  connection.query(query, [], (err, result) => {
    if (err) {
      console.error("DB error", err);
      return res.status(500).json({ success: false });
    }    

    res.json({ rows: result });
  });
}

module.exports = { 
  getFrequentClients, 
  getUncommittedClients, 
  getAcceptedQuotes,
  getProspectiveClients,
  getLargestClients,
  getBadClients,
  getOverdueBills,
  getGoodClients
}