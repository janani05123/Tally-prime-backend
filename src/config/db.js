const mongoose = require("mongoose");
const dotenv = require("dotenv")
dotenv.config();


async function connectDB() {
  const uri = process.env.MONGO_URI || "mongodb+srv://Sudharsan:jQFhVYGPpwvTp2Ij@sudharsan.oihbkeq.mongodb.net"
  if (!uri) throw new Error("MONGO_URI not set");
  mongoose.set("strictQuery", true);
  await mongoose.connect(uri);
  console.log("MongoDB connected");
}

module.exports = { connectDB };