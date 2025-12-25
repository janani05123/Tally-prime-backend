const { body, validationResult } = require("express-validator");
const Bill = require("../models/Bills");
const { grandTotal } = require("../utils/calc");
const { buildInvoicePDF } = require("../utils/pdf");
const CUstomer = require("../models/CUstomer");

const billValidators = [
  body("billNumber").trim().notEmpty().withMessage("Bill number is required"),
  body("customerId").trim().notEmpty().withMessage("Customer is required"),
  body("date").optional().isISO8601().withMessage("Invalid date format"),
  body("items").isArray({ min: 1 }).withMessage("At least one item is required"),
  body("items.*.description").trim().notEmpty().withMessage("Item description is required"),
  body("items.*.rate").isFloat({ min: 0 }).withMessage("Rate must be a positive number"),
  body("items.*.quantity").isFloat({ min: 1 }).withMessage("Quantity must be at least 1"),
  body("gstRate").isFloat({ min: 0 }).withMessage("GST rate must be a positive number"),
  body("paymentStatus").optional().isIn(["Paid", "Pending"]).withMessage("Invalid payment status"),
  body("paymentMethod").optional().isString(),
  body("notes").optional().isString(),
];

async function createBill(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: "Validation failed",
        errors: errors.array().map(err => ({
          field: err.path,
          message: err.msg
        }))
      });
    }

    const customer = await CUstomer.findOne({ _id: req.body.customerId });
    if (!customer) {
      return res.status(400).json({ 
        message: "Invalid customer",
        errors: [{ field: "customerId", message: "Customer not found" }]
      });
    }

    const exists = await Bill.findOne({ 
      user: req.user.id, 
      billNumber: req.body.billNumber 
    });
    if (exists) {
      return res.status(400).json({ 
        message: "Duplicate bill number",
        errors: [{ field: "billNumber", message: "This bill number already exists" }]
      });
    }

    const bill = await Bill.create({
      user: req.user.id,
      billNumber: req.body.billNumber,
      customer: customer._id,
      date: req.body.date || new Date(),
      items: req.body.items.map(item => ({
        description: item.description,
        rate: item.rate,
        quantity: item.quantity,
        amount: item.rate * item.quantity
      })),
      gstRate: req.body.gstRate,
      paymentStatus: req.body.paymentStatus || "Pending",
      paymentMethod: req.body.paymentMethod || "",
      notes: req.body.notes || "",
    });

    const totals = grandTotal(bill.items, bill.gstRate);
    
    res.status(201).json({ 
      success: true,
      message: "Bill created successfully",
      data: {
        bill,
        totals
      }
    });
  } catch (e) {
    next(e);
  }
}


async function listBills(req, res, next) {
  try {
    const { q = "", page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const filter = { user: req.user._id };

    if (q) {
      // Search by billNumber or customer name
      const customers = await CUstomer.find({
        user: req.user._id,
        name: { $regex: String(q), $options: "i" }
      }).select("_id");
      filter.$or = [
        { billNumber: { $regex: String(q), $options: "i" } },
        { customer: { $in: customers.map((c) => c._id) } },
      ];
    }

    const [items, total] = await Promise.all([
      Bill.find(filter).populate("customer").sort({ date: -1 }).skip(skip).limit(Number(limit)),
      Bill.countDocuments(filter),
    ]);

    res.json({
      items: items.map((b) => ({ ...b.toObject(), totals: grandTotal(b.items, b.gstRate) })),
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
    });
  } catch (e) {
    next(e);
  }
}

async function getBill(req, res, next) {
  try {
    const bill = await Bill.findOne({ _id: req.params.id, user: req.user._id }).populate("customer").populate("user")
    if (!bill) return res.status(404).json({ message: "Bill not found" });
    res.json({ ...bill.toObject(), totals: grandTotal(bill.items, bill.gstRate) });
  } catch (e) {
    next(e);
  }
}

async function updateBill(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    if (req.body.customerId) {
      const c = await Customer.findOne({ _id: req.body.customerId, user: req.user._id });
      if (!c) return res.status(400).json({ message: "Invalid customer" });
      req.body.customer = c._id;
      delete req.body.customerId;
    }

    if (req.body.billNumber) {
      const exists = await Bill.findOne({
        user: req.user._id,
        billNumber: req.body.billNumber,
        _id: { $ne: req.params.id },
      });
      if (exists) return res.status(400).json({ message: "Bill number already exists" });
    }

    const updated = await Bill.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      req.body,
      { new: true }
    ).populate("customer");
    if (!updated) return res.status(404).json({ message: "Bill not found" });
    res.json({ ...updated.toObject(), totals: grandTotal(updated.items, updated.gstRate) });
  } catch (e) {
    next(e);
  }
}

async function deleteBill(req, res, next) {
  try {
    const deleted = await Bill.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!deleted) return res.status(404).json({ message: "Bill not found" });
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
}

async function setPaymentStatus(req, res, next) {
  try {
    const { status, method } = req.body;
    if (!["Paid", "Pending"].includes(status))
      return res.status(400).json({ message: "Invalid status" });

    const updated = await Bill.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { paymentStatus: status, ...(method ? { paymentMethod: method } : {}) },
      { new: true }
    ).populate("customer");
    if (!updated) return res.status(404).json({ message: "Bill not found" });
    res.json({ ...updated.toObject(), totals: grandTotal(updated.items, updated.gstRate) });
  } catch (e) {
    next(e);
  }
}

async function downloadPdf(req, res, next) {
  try {
    const bill = await Bill.findOne({ _id: req.params.id, user: req.user._id }).populate("customer");
    if (!bill) return res.status(404).json({ message: "Bill not found" });
    await buildInvoicePDF({ res, user: req.user, bill, customer: bill.customer });
  } catch (e) {
    next(e);
  }
}

module.exports = {
  billValidators,
  createBill,
  listBills,
  getBill,
  updateBill,
  deleteBill,
  setPaymentStatus,
  downloadPdf,
};
