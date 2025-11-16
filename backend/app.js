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
  rejectRequest,
} = require("./requestController");
const { signin } = require("./signinController");
const { signup } = require("./signupController");
const {
  sendQuote,
  adminListQuotes,
  getQuoteById,
  negotiateQuote,
  getQuoteHistory,
  cancelQuote,
  acceptQuote,
  listQuotes,
  submitQuote,
} = require("./quoteController");

const { listOrders, getOrderById } = require("./orderController");
const {
  getFrequentClients,
  getUncommittedClients,
  getAcceptedQuotes,
  getProspectiveClients,
  getLargestClients,
  getBadClients,
  getGoodClients,
  getOverdueBills,
} = require("./dashboardController");

const app = express();
const session = require("./session");
//const { listQuotes, submitQuote } = require("./quoteController");

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

//requests
app.post("/request", upload.array("images", 5), cleaningRequest);
app.get("/requests", listRequests);
app.get("/requests/:id", getRequestById);
app.get("/requests/:id/image/:n", getRequestImage);
app.patch("/requests/:id/reject", rejectRequest);

//quotes
app.post("/requests/:id/quote", sendQuote);
app.get("/quotes", adminListQuotes);
app.get("/quotes/:id", getQuoteById);
app.post("/quotes/:id/negotiate", negotiateQuote);
app.get("/quotes/:id/history", getQuoteHistory);
app.post("/quotes/:id/cancel", cancelQuote);
app.post("/quotes/:id/accept", acceptQuote);

//orders
app.get("/orders", listOrders);
app.get("/orders/:id", getOrderById);

app.get("/frequentClients", getFrequentClients);
app.get("/uncommittedClients", getUncommittedClients);
app.get("/acceptedQuotes", getAcceptedQuotes);
app.get("/prospectiveClients", getProspectiveClients);
app.get("/largestClients", getLargestClients);
app.get("/badClients", getBadClients);
app.get("/goodClients", getGoodClients);
app.get("/overdueBills", getOverdueBills);
app.get("/listQuotes", listQuotes);
app.post("/submitQuote", submitQuote);

app.listen(5050, () => {
  console.log("I am listening on the fixed port 5050.");
});
