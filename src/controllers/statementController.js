const Bill = require("../models/Bills");
const dayjs = require("dayjs");
const { subtotal, gstAmount } = require("../utils/calc");

async function monthlySummaries(req, res, next) {
  try {
    const userId = req.user._id;
    const bills = await Bill.find({ user: userId }).select("date items gstRate");

    const map = new Map();
    bills.forEach((b) => {
      const key = dayjs(b.date).format("YYYY-MM");
      const sub = subtotal(b.items);
      const gst = gstAmount(sub, b.gstRate);
      const total = sub + gst;
      const prev = map.get(key) || { revenue: 0, count: 0, tax: 0 };
      map.set(key, {
        revenue: prev.revenue + total,
        count: prev.count + 1,
        tax: prev.tax + gst,
      });
    });

    const data = Array.from(map.entries())
      .sort(([a], [b]) => (a > b ? 1 : -1))
      .map(([month, v]) => ({
        month,
        revenue: Math.round(v.revenue),
        count: v.count,
        tax: Math.round(v.tax),
      }));

    res.json({ data });
  } catch (e) {
    next(e);
  }
}

module.exports = { monthlySummaries };
