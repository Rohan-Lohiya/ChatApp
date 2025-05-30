const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const connectToDatabase = require("./dbconnection/database");
const dotenv = require("dotenv");
const setupSocket = require("./socket/index");
const { router: apiroute } = require("./controller/apiroute");
const { router: grouproute } = require("./controller/grouproute"); // ✅ Include setIo
const { router: chatroute } = require("./controller/chatroute");
const { setIo } = require("./socket/io");

const app = express();
const frontendURI = process.env.FRONTEND_URL;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  cors({
    origin: frontendURI,
    methods: ["GET", "POST"],
    credentials: true,
  })
);

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: frontendURI,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// ✅ Pass io to route
setIo(io); // <-- CRUCIAL LINE

app.use("/api", apiroute);
app.use("/group", grouproute);
app.use("/chat", chatroute);

connectToDatabase()
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((error) => {
    console.error("Error connecting to MongoDB:", error.message);
  });

setupSocket(io);

httpServer.listen(5000, () => {
  console.log("Server running on port 5000");
});
