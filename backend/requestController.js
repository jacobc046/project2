const connection = require('./connection');

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

  connection.query(query, [
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
    imageBuffers[4]
  ], (err, result) => {
    if (err) {
      console.error("DB error", err);
      return res.status(500).json({ success: false });
    }
    res.json({ success: true, id: result.insertId });
  });
}

module.exports = { cleaningRequest } 