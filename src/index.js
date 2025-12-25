const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const dotenv = require("dotenv");
const { connectDB } = require("./config/db");
const errorHandler = require("./middleware/error");

dotenv.config();
const app = express();

// ✅ CORS (allow everything since no cookies/sessions)
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));
app.options("*", cors());

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

// Connect DB
connectDB();

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

// Routes
app.get("/", (_req, res) => {
  res.send("🚀 EasyBill API backend is live!");
});
app.use("/api/auth", require("./routes/auth"));
app.use("/api/customers", require("./routes/customers"));
app.use("/api/bills", require("./routes/bills"));
app.use("/api/statements", require("./routes/statements"));

// Error handler
app.use(errorHandler);

// ✅ Start server locally
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
