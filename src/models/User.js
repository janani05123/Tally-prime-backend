const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    companyName: { type: String, required: true },
    gstin: { type: String, trim: true },
    email: { type: String, required: true, unique: true, index: true },
    password: { type: String, required: true },
    address: { type: String , required: true },
    pincode : { type: Number, required: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
