const mongoose = require("mongoose");

async function connectDB() {
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is not set. Copy .env.example to .env and fill it in.");
  }
  mongoose.connection.on("connected", () => console.log("MongoDB connected"));
  mongoose.connection.on("error", (err) => console.error("MongoDB error:", err.message));
 await mongoose.connect(process.env.MONGODB_URI, { dbName: "ezer_supermarket" });
}

module.exports = connectDB;
