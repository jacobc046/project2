const connection = require("./connection");

//gets a list of the orders
async function listUnpaidBills(req, res) {
  const sql = `SELECT b.billID, b.bill_number, r.cleaning_type, r.image1, r.image2, r.image3, r.image4, r.image5,  o.orderID, o.address, o.number_of_rooms, o.date, b.price, b.notes, TRIM(CONCAT(COALESCE(u.first_name,''),' ',COALESCE(u.last_name,''))) AS client_name
    FROM Orders o
    JOIN Quote q ON q.quoteID = o.quoteID AND q.response_number = o.response_number
    JOIN Requests r ON r.requestID = q.requestID
    JOIN Users u ON u.client_id = r.client_id 
    JOIN Bill b ON b.orderID = o.orderID
    WHERE u.client_id = ${req.session.clientId}
    AND b.billID NOT IN (
        SELECT billID FROM Payment
    ) AND b.bill_number = (
        SELECT MAX(b2.bill_number)
        FROM Bill b2
        WHERE b2.billID = b.billID
        GROUP BY b2.billID
    )
    ORDER BY o.orderID ASC 
    `;

  connection.query(sql, (err, rows) => {
    if (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
    return res.json({ success: true, unpaidBills: rows });
  });
}

async function payBill(req, res) {
    const data = req.body;
    console.log(data);
    

    const sql = `
        INSERT INTO Payment (billID, bill_number, price, status, card_number, cvv, ex_date)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    connection.query(sql, [
        data.billID,
        data.bill_number,
        data.price,
        data.status,
        data.card_number,
        data.cvv,
        data.ex_date
    ], (err, result) => {
        if (err) return res.status(500).json({ success: false, error: err.message });
        return res.json({ 
            success: true, 
            payment: {
                billID: data.billID,
                bill_number: data.bill_number,
                price: data.price,
                status: data.status,
                card_number: data.cardNumber,
                cvv: data.cvv,
                ex_date: data.exDate
        }});
    });
}

module.exports = {
  listUnpaidBills,
  payBill
};
