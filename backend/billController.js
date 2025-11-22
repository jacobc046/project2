const connection = require("./connection");

// helper: get next bill_number for a given order
function getNextBillNumber(orderID, cb) {
  const sql = `
    SELECT COALESCE(MAX(bill_number), 0) + 1 AS nextNum
    FROM Bill
    WHERE orderID = ?
  `;
  connection.query(sql, [orderID], (err, rows) => {
    if (err) return cb(err);
    cb(null, rows[0].nextNum);
  });
}

async function createBill(req, res) {
  const orderID = parseInt(req.params.id, 10);
  if (Number.isNaN(orderID)) {
    return res.status(400).json({ success: false, error: "Invalid orderID" });
  }

  const orderSql = `
    SELECT orderID, price, date, notes
    FROM Orders
    WHERE orderID = ?
    LIMIT 1
  `;

  // 1) Get the order
  connection.query(orderSql, [orderID], (err, orderRows) => {
    if (err)
      return res.status(500).json({ success: false, error: err.message });

    if (!orderRows.length)
      return res.status(404).json({ success: false, error: "Order not found" });

    const order = orderRows[0];

    getNextBillNumber(orderID, (err2, nextNo) => {
      if (err2)
        return res.status(500).json({ success: false, error: err2.message });

      const insertSql = `
        INSERT INTO Bill (bill_number, orderID, price, status, date_issued, notes)
        VALUES (?, ?, ?, 'awaiting client', NOW(), NULL)
      `;

      connection.query(
        insertSql,
        [nextNo, orderID, order.price],
        (err3, result) => {
          if (err3)
            return res
              .status(500)
              .json({ success: false, error: err3.message });

          return res.json({
            success: true,
            bill: {
              billID: result.insertId,
              bill_number: nextNo,
              orderID,
              price: order.price,
              status: "awaiting client",
              date_issued: new Date(),
              notes: null,
            },
          });
        }
      );
    });
  });
}

async function getLastestBill(req, res) {
  const orderID = parseInt(req.params.id, 10);
  if (Number.isNaN(orderID)) {
    return res.status(400).json({ success: false, error: "Invalid orderID" });
  }

  const sql = `
    SELECT billID, bill_number, orderID, price, status, date_issued, notes
    FROM Bill
    WHERE orderID = ?
    ORDER BY bill_number DESC
    LIMIT 1
  `;

  connection.query(sql, [orderID], (err, rows) => {
    if (err)
      return res.status(500).json({ success: false, error: err.message });

    if (!rows.length) {
      return res
        .status(404)
        .json({ success: false, error: "No bill for this order yet" });
    }

    return res.json({ success: true, bill: rows[0] });
  });
}

async function getBillHistory(req, res) {
  const orderID = parseInt(req.params.id, 10);
  if (Number.isNaN(orderID)) {
    return res.status(400).json({ success: false, error: "Invalid orderID" });
  }

  const sql = `
      SELECT billID, bill_number, orderID, price, status, date_issued, notes
      FROM Bill
      WHERE orderID = ?
      ORDER BY bill_number ASC
    `;

  connection.query(sql, [orderID], (err, rows) => {
    if (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
    return res.json({ success: true, history: rows });
  });
}

async function reviseBill(req, res) {
  const orderID = parseInt(req.params.id, 10);
  if (Number.isNaN(orderID)) {
    return res.status(400).json({ success: false, error: "Invalid orderID" });
  }

  const { price, notes } = req.body || {};

  if (price == null || price === "") {
    return res.status(400).json({ success: false, error: "Price is required" });
  }

  // Get latest bill_number for this order
  const getLatestSql = `
      SELECT bill_number, status, billID
      FROM Bill
      WHERE orderID = ?
      ORDER BY bill_number DESC
      LIMIT 1
    `;

  connection.query(getLatestSql, [orderID], (err, rows) => {
    if (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
    if (!rows.length) {
      return res
        .status(404)
        .json({ success: false, error: "No bill exists for this order yet" });
    }    

    const nextNo = rows[0].bill_number + 1;
    const billID = rows[0].billID;
    const status = rows[0].status == 'awaiting client' ? 'awaiting admin' : 'awaiting client';

    const insertSql = `
        INSERT INTO Bill (billID, bill_number, orderID, price, status, date_issued, notes)
        VALUES (?, ?, ?, ?, ?, NOW(), ?)
      `;

    connection.query(
      insertSql,
      [billID, nextNo, orderID, Number(price), status, notes ?? null],
      (err2, result) => {
        if (err2) {
          return res.status(500).json({ success: false, error: err2.message });
        }

        return res.json({
          success: true,
          bill: {
            billID: result.insertId,
            bill_number: nextNo,
            orderID,
            price: Number(price),
            status: "awaiting client",
            date_issued: new Date(),
            notes: notes ?? null,
          },
        });
      }
    );
  });
}

module.exports = {
  createBill,
  getLastestBill,
  getBillHistory,
  reviseBill,
};
