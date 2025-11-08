const connection = require("./connection");

async function cleaningRequest(req, res) {
  const userData = req.body;
  const files = req.files;

  const imageBuffers = [];
  for (let i = 0; i < 5; i++) {
    imageBuffers[i] = files && files[i] ? files[i].buffer : null;
  }

  const query = `INSERT INTO 
      Requests(client_id, address, number_of_rooms, date, budget, notes, cleaning_type, image1, image2, image3, image4, image5) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`;

  connection.query(
    query,
    [
      req.session.clientId,
      userData.address,
      userData.rooms,
      userData.serviceDate,
      userData.budget,
      userData.notes || null,
      userData.cleaningType,
      imageBuffers[0],
      imageBuffers[1],
      imageBuffers[2],
      imageBuffers[3],
      imageBuffers[4],
    ],
    (err, result) => {
      if (err) {
        console.error("DB error", err);
        return res.status(500).json({ success: false });
      }
      res.json({ success: true, id: result.insertId });
    }
  );
}

//gets the list of request for admin side
function listRequests(req, res) {
  const sql = `
    SELECT r.requestID,
           CONCAT(u.first_name, ' ', u.last_name) AS client_name
    FROM Requests r
    JOIN Users u ON u.client_id = r.client_id
    ORDER BY r.date DESC
  `;
  connection.query(sql, (err, rows) => {
    if (err)
      return res.status(500).json({ success: false, error: err.message });
    res.json(rows);
  });
}

//get the requests information by id for admin side
function getRequestById(req, res) {
  const sql = `
    SELECT r.requestID,
           CONCAT(u.first_name, ' ', u.last_name) AS client_name,
           r.address,
           r.number_of_rooms,
           r.date,
           r.budget,
           r.cleaning_type,
           r.notes
    FROM Requests r
    JOIN Users u ON u.client_id = r.client_id
    WHERE r.requestID = ?
    LIMIT 1
  `;
  connection.query(sql, [req.params.id], (err, rows) => {
    if (err)
      return res.status(500).json({ success: false, error: err.message });
    if (!rows.length)
      return res.status(404).json({ success: false, error: "Not found" });
    res.json(rows[0]);
  });
}

//image information for admin side
function getRequestImage(req, res) {
  const n = parseInt(req.params.n, 10);
  if (isNaN(n) || n < 1) {
    return res
      .status(400)
      .json({ success: false, error: "Invalid image number" });
  }
  const sql = `SELECT image${n} AS img FROM Requests WHERE requestID = ? LIMIT 1`;
  connection.query(sql, [req.params.id], (err, rows) => {
    if (err) return res.status(500).end();
    if (!rows.length || !rows[0].img) return res.status(404).end();

    const buf = rows[0].img;
    const isPng = buf[0] === 0x89 && buf[1] === 0x50;
    const isJpg = buf[0] === 0xff && buf[1] === 0xd8;
    res.setHeader(
      "Content-Type",
      isPng ? "image/png" : isJpg ? "image/jpeg" : "application/octet-stream"
    );
    res.setHeader("Content-Disposition", "inline");
    res.end(buf);
  });
}

module.exports = {
  cleaningRequest,
  listRequests,
  getRequestById,
  getRequestImage,
};
