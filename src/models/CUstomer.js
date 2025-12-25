const mongoose = require("mongoose");

const customerSchema = new mongoose.Schema(
  {
    user: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      index: true, 
      required: true 
    },
    name: { type: String, required: true },
    address: { type: String, default: "" },
    phone: { type: String, default: "" },
    gstNumber: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Customer", customerSchema);