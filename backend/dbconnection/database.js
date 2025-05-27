const mongoose = require("mongoose");
const dotenv = require("dotenv");

// Load environment variables from .env file
dotenv.config();
const dbURI = process.env.MONGO_URI;

let cachedDB = null; // Cache the database connection

async function connectToDatabase() {
  console.log(dbURI);
  if (cachedDB) {
    console.log("Using cached database instance");
    return cachedDB;
  }

  try {
    console.log("Connecting to MongoDB...");
    const connection = await mongoose.connect(dbURI, {
      serverSelectionTimeoutMS: 5000, // Retry after 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds
    });

    cachedDB = connection; // Cache the connection
    console.log("MongoDB connected successfully");
    return connection;
  } catch (error) {
    console.error("Error connecting to MongoDB:", error.message);
    throw error;
  }
}

module.exports = connectToDatabase;
