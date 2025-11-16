const connection = require("./connection");

// helper to get next response_number for a given quoteID
function getNextRN(quoteID, cb) {
  const sql = `
    SELECT COALESCE(MAX(response_number), 0) + 1 AS nextRN
    FROM Quote
    WHERE quoteID = ?
  `;
  connection.query(sql, [quoteID], (err, rows) => {
    if (err) return cb(err);
    cb(null, rows[0].nextRN);
  });
}

//creates a quote for a request
async function sendQuote(req, res) {
  const requestID = parseInt(req.params.id, 10);

  //custome inputs
  const priceInput = req.body?.price;
  const scheduledAt = req.body?.scheduledAt;
  const note = req.body?.note ?? null;

  //looks up the request to know status and budget
  const getReqSql =
    "SELECT budget, status FROM Requests WHERE requestID = ? LIMIT 1";
  connection.query(getReqSql, [requestID], (err, reqRows) => {
    if (err)
      return res.status(500).json({ success: false, error: err.message });
    if (!reqRows.length) {
      return res
        .status(404)
        .json({ success: false, error: "Request not found" });
    }

    //if admin doesnt update a price, use the price from the request
    const budget = Number(reqRows[0].budget);
    const finalPrice =
      priceInput == null || priceInput === "" ? budget : Number(priceInput);

    const response_numSql =
      "SELECT COALESCE(MAX(response_number), 0) + 1 AS nextNo FROM Quote WHERE requestID = ?";
    connection.query(response_numSql, [requestID], (err2, r2) => {
      if (err2)
        return res.status(500).json({ success: false, error: err2.message });

      //if no updated date, takes the date from the request
      const response_number = r2[0].nextNo;
      const quoteDate =
        scheduledAt && scheduledAt.trim() ? new Date(scheduledAt) : new Date();

      //Insert the quote
      const insertSql = `
        INSERT INTO Quote (requestID, response_number, status, price, date, notes)
        VALUES (?, ?, 'awaiting client', ?, ?, ?)
      `;
      connection.query(
        insertSql,
        [requestID, response_number, finalPrice, quoteDate, note],
        (err3, result) => {
          if (err3) {
            return res
              .status(500)
              .json({ success: false, error: err3.message });
          }

          const quoteID = result.insertId;

          //Update the Request status to 'quoted'
          const updSql =
            "UPDATE Requests SET status = 'quoted' WHERE requestID = ? LIMIT 1";
          connection.query(updSql, [requestID], (err4) => {
            if (err4) {
              return res
                .status(500)
                .json({ success: false, error: err4.message });
            }
            return res.json({
              success: true,
              quoteID,
              requestID,
              response_number,
              price: finalPrice,
              date: quoteDate,
              note,
            });
          });
        }
      );
    });
  });
}

//gets a list of the quotes
async function listQuotes(req, res) {
  const sql = `
  SELECT 
  q.quoteID,
  q.requestID,
  q.response_number,
  q.status,
  q.price,
  q.date,
  q.notes,
  TRIM(CONCAT(COALESCE(u.first_name,''),' ',COALESCE(u.last_name,''))) AS client_name,
  r.address
FROM Quote q
INNER JOIN (
  SELECT quoteID, MAX(response_number) AS max_rn
  FROM Quote
  GROUP BY quoteID
) latest
  ON latest.quoteID = q.quoteID
 AND latest.max_rn  = q.response_number
INNER JOIN Requests r ON r.requestID = q.requestID
INNER JOIN Users    u ON u.client_id = r.client_id
ORDER BY q.quoteID ASC;
  `;
  connection.query(sql, (err, rows) => {
    if (err)
      return res.status(500).json({ success: false, error: err.message });
    return res.json(rows);
  });
}

//gets one quote by id
function getQuoteById(req, res) {
  const quoteID = Number.parseInt(req.params.id, 10);
  if (Number.isNaN(quoteID)) {
    return res.status(400).json({ success: false, error: "Invalid quoteID" });
  }

  const sql = `
    SELECT
      q.quoteID,
      q.requestID,
      q.response_number,
      q.status AS quote_status,
      q.price,
      q.date,
      q.notes,
      TRIM(CONCAT(COALESCE(u.first_name,''),' ',COALESCE(u.last_name,''))) AS client_name,
      r.address
    FROM Quote q
    INNER JOIN Requests r ON r.requestID = q.requestID
    INNER JOIN Users   u  ON u.client_id = r.client_id
    WHERE q.quoteID = ?
    ORDER BY q.response_number DESC  
    LIMIT 1
  `;

  connection.query(sql, [quoteID], (err, rows) => {
    if (err)
      return res.status(500).json({ success: false, error: err.message });
    if (!rows.length)
      return res.status(404).json({ success: false, error: "Quote not found" });

    return res.json({ success: true, quote: rows[0] });
  });
}

//negotiate quote
async function negotiateQuote(req, res) {
  const quoteID = parseInt(req.params.id, 10);
  const { price, scheduledAt, note } = req.body || {};
  if (Number.isNaN(quoteID)) {
    return res.status(400).json({ success: false, error: "Invalid quoteID" });
  }

  //gets original request
  const getReq = `
    SELECT q.requestID, r.budget, r.date
    FROM Quote q
    JOIN Requests r ON r.requestID = q.requestID
    WHERE q.quoteID = ?
    ORDER BY q.response_number ASC
    LIMIT 1
  `;
  connection.query(getReq, [quoteID], (err, rs) => {
    if (err)
      return res.status(500).json({ success: false, error: err.message });
    if (!rs.length)
      return res.status(404).json({ success: false, error: "Quote not found" });

    //if price and date arent provided
    const fallbackPrice = Number(rs[0].budget);
    const fallbackDate = new Date(rs[0].date);
    const finalPrice =
      price === "" || price == null ? fallbackPrice : Number(price);
    const finalDate = scheduledAt ? new Date(scheduledAt) : new Date(); // use "now" by default

    getNextRN(quoteID, (err2, nextRN) => {
      if (err2)
        return res.status(500).json({ success: false, error: err2.message });

      const newQuote = `
        INSERT INTO Quote (quoteID, requestID, response_number, status, price, date, notes)
        SELECT ?, requestID, ?, 'awaiting client', ?, ?, ?
        FROM Quote WHERE quoteID = ? LIMIT 1
      `;
      connection.query(
        newQuote,
        [quoteID, nextRN, finalPrice, finalDate, note ?? null, quoteID],
        (err3) => {
          if (err3)
            return res
              .status(500)
              .json({ success: false, error: err3.message });
          return res.json({
            success: true,
            quoteID,
            response_number: nextRN,
            price: finalPrice,
            date: finalDate,
            notes: note ?? null,
          });
        }
      );
    });
  });
}

//gets all the quotes for quote history
async function getQuoteHistory(req, res) {
  const quoteID = Number.parseInt(req.params.id, 10);
  if (Number.isNaN(quoteID)) {
    return res.status(400).json({ success: false, error: "Invalid quoteID" });
  }

  const sql = `
    SELECT
      q.quoteID,
      q.requestID,
      q.response_number,
      q.status AS quote_status,
      q.price,
      q.date,
      q.notes
    FROM Quote q
    WHERE q.quoteID = ?
    ORDER BY q.response_number ASC
  `;

  connection.query(sql, [quoteID], (err, rows) => {
    if (err)
      return res.status(500).json({ success: false, error: err.message });

    return res.json({ success: true, history: rows });
  });
}

//cancels the latest quote
async function cancelQuote(req, res) {
  const quoteID = parseInt(req.params.id, 10);
  if (Number.isNaN(quoteID)) {
    return res.status(400).json({ success: false, error: "Invalid QuoteID" });
  }

  //Find the latest version for this quote (max response_number)
  const latestSql = `
    SELECT requestID, response_number
    FROM Quote
    WHERE quoteID = ?
    ORDER BY response_number DESC
    LIMIT 1
  `;

  connection.query(latestSql, [quoteID], (err, rows) => {
    if (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
    if (!rows.length) {
      return res.status(404).json({ success: false, error: "Quote not found" });
    }

    const { requestID, response_number } = rows[0];

    //updates only latest quote status
    const updateQuote = `
      UPDATE Quote
      SET status = 'canceled'
      WHERE quoteID = ? AND response_number = ?
      LIMIT 1
    `;
    connection.query(updateQuote, [quoteID, response_number], (err2) => {
      if (err2) {
        return res.status(500).json({ success: false, error: err2.message });
      }
    });
  });
}

//accept quote and create an order
async function acceptQuote(req, res) {
  const quoteID = parseInt(req.params.id, 10);
  if (Number.isNaN(quoteID)) {
    return res.status(400).json({ success: false, error: "Invalid quoteID" });
  }

  // Get the latest quote version + request info
  const latestSql = `
    SELECT
      q.quoteID,
      q.response_number,
      q.status       AS quote_status,
      q.price,
      q.date,
      q.notes,
      r.address,
      r.number_of_rooms
    FROM Quote q
    JOIN Requests r ON r.requestID = q.requestID
    WHERE q.quoteID = ?
    ORDER BY q.response_number DESC
    LIMIT 1
  `;

  connection.query(latestSql, [quoteID], (err, rows) => {
    if (err)
      return res.status(500).json({ success: false, error: err.message });
    if (!rows.length)
      return res.status(404).json({ success: false, error: "Quote not found" });

    const latest = rows[0];

    //blocks already canceled quotes
    if (latest.quote_status === "canceled") {
      return res.status(400).json({
        success: false,
        error: "Cannot accept a canceled quote.",
      });
    }

    //updates quote status to accepted
    const updateSql = `
      UPDATE Quote
      SET status = 'accepted'
      WHERE quoteID = ? AND response_number = ?
      LIMIT 1
    `;

    connection.query(updateSql, [quoteID, latest.response_number], (err2) => {
      if (err2)
        return res.status(500).json({ success: false, error: err2.message });

      //create order
      const orderSql = `
          INSERT INTO Orders
            (quoteID, response_number, address, number_of_rooms, date, price, notes)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `;

      connection.query(
        orderSql,
        [
          latest.quoteID,
          latest.response_number,
          latest.address,
          latest.number_of_rooms,
          latest.date,
          latest.price,
          latest.notes,
        ],
        (err3, result) => {
          if (err3)
            return res
              .status(500)
              .json({ success: false, error: err3.message });

          return res.json({
            success: true,
            quoteID: latest.quoteID,
            response_number: latest.response_number,
            orderID: result.insertId,
          });
        }
      );
    });
  });
}

module.exports = {
  sendQuote,
  listQuotes,
  getQuoteById,
  negotiateQuote,
  getQuoteHistory,
  cancelQuote,
  acceptQuote,
};
