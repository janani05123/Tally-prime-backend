const mongoose = require("mongoose");

const billItemSchema = new mongoose.Schema(
  {
    description: { type: String, required: true },
    rate: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

const billSchema = new mongoose.Schema(
  {
    user: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      index: true, 
      required: true 
    },
    billNumber: { type: String, required: true },
    customer: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Customer", 
      required: true 
    },
    date: { type: Date, required: true, default: Date.now },
    items: { type: [billItemSchema], default: [] },
    gstRate: { type: Number, required: true, min: 0 },
    paymentStatus: { 
      type: String, 
      enum: ["Paid", "Pending"], 
      default: "Pending" 
    },
    paymentMethod: { type: String, default: "" },
    notes: { type: String, default: "" },
  },
  { timestamps: true }
);

billSchema.index({ user: 1, billNumber: 1 }, { unique: true });

module.exports = mongoose.model("Bill", billSchema);
