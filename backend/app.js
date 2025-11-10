const express = require("express");
const cors = require("cors");

//for image uploading
const multer = require("multer");
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 5 },
});

//all imported controller functions
const {
  cleaningRequest,
  listRequests,
  getRequestById,
  getRequestImage,
} = require("./requestController");
const { signin } = require("./signinController");
const { signup } = require("./signupController");
const { getFrequentClients, getUncommittedClients } = require('./dashboardController');

const app = express();
const session = require("./session");

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(session);

console.log("HOST: " + process.env.HOST);
console.log("DB USER: " + process.env.DB_USER);
console.log("PASSWORD: " + process.env.PASSWORD);
console.log("DATABASE: " + process.env.DATABASE);
console.log("DB PORT: " + process.env.DB_PORT);

app.post("/signin", signin);
app.post("/signup", signup);
app.post("/request", upload.array("images", 5), cleaningRequest);
app.get("/requests", listRequests);
app.get("/requests/:id", getRequestById);
app.get("/requests/:id/image/:n", getRequestImage);
app.get("/frequentClients", getFrequentClients);
app.get("/uncommittedClients", getUncommittedClients);

app.listen(5050, () => {
  console.log("I am listening on the fixed port 5050.");
});
