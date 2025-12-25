const { body, validationResult } = require("express-validator");

const Bill = require("../models/Bills");
const { subtotal, gstAmount } = require("../utils/calc");
const CUstomer = require("../models/CUstomer");


const customerValidators = [
  body("name").trim().notEmpty(),
  body("address").optional().isString(),
  body("phone").optional().isString(),
  body("gstNumber").optional().isString(),
];

async function createCustomer(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const customer = await CUstomer.create({ user: req.user._id, ...req.body });
    res.status(201).json(customer);
  } catch (e) {
    next(e);
  }
}

async function listCustomers(req, res, next) {
  try {
    const { q = "", page = 1, limit = 10 } = req.query;
    const filter = {
      user: req.user._id,
      ...(q ? { name: { $regex: String(q), $options: "i" } } : {}),
    };
    const skip = (Number(page) - 1) * Number(limit);

    const [items, total] = await Promise.all([
      CUstomer.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      CUstomer.countDocuments(filter),
    ]);

    res.json({
      items,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
    });
  } catch (e) {
    next(e);
  }
}

async function getCustomer(req, res, next) {
  try {
    const c = await CUstomer.findOne({ _id: req.params.id, user: req.user._id });
    if (!c) return res.status(404).json({ message: "Customer not found" });
    res.json(c);
  } catch (e) {
    next(e);
  }
}

async function updateCustomer(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const updated = await CUstomer.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      req.body,
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: "Customer not found" });
    res.json(updated);
  } catch (e) {
    next(e);
  }
}

async function deleteCustomer(req, res, next) {
  try {
    const deleted = await Customer.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!deleted) return res.status(404).json({ message: "Customer not found" });
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
}

async function customerStatement(req, res, next) {
  try {
    const customerId = req.params.id;
    const bills = await Bill.find({ user: req.user._id, customer: customerId }).sort({ date: -1 });

    const mapped = bills.map((b) => {
      const sub = subtotal(b.items);
      const gst = gstAmount(sub, b.gstRate);
      return {
        id: b._id,
        billNumber: b.billNumber,
        date: b.date,
        subtotal: sub,
        gst: gst,
        total: sub + gst,
        paymentStatus: b.paymentStatus,
      };
    });

    const outstanding = mapped
      .filter((b) => b.paymentStatus === "Pending")
      .reduce((s, b) => s + b.total, 0);

    res.json({ customerId, bills: mapped, outstanding });
  } catch (e) {
    next(e);
  }
}

module.exports = {
  customerValidators,
  createCustomer,
  listCustomers,
  getCustomer,
  updateCustomer,
  deleteCustomer,
  customerStatement,
};
