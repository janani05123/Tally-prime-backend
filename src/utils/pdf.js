const PDFDocument = require("pdfkit");
const dayjs = require("dayjs");
const { subtotal, gstAmount } = require("./calc");

function drawLine(doc, y) {
  doc.moveTo(50, y).lineTo(562, y).strokeColor("#cccccc").stroke();
}

async function buildInvoicePDF({ res, user, bill, customer }) {
  const doc = new PDFDocument({ size: "A4", margin: 50 });
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `inline; filename="${bill.billNumber}.pdf"`);
  doc.pipe(res);

  // Header
  doc.fontSize(20).text(user.companyName || "Company", 50, 50);
  if (user.gstin) doc.fontSize(10).fillColor("#555").text(`GSTIN: ${user.gstin}`, 50, 78);
  doc.fillColor("#000").fontSize(10).text(`Bill No: ${bill.billNumber}`, 400, 50, { align: "right" });
  doc.text(`Bill Date: ${dayjs(bill.date).format("DD MMM YYYY")}`, 400, 65, { align: "right" });
  drawLine(doc, 95);

  // Customer
  doc.fontSize(12).text("Bill To:", 50, 110).fontSize(11);
  doc.text(customer.name);
  if (customer.address) doc.text(customer.address);
  if (customer.phone) doc.text(`Phone: ${customer.phone}`);
  if (customer.gstNumber) doc.text(`GST: ${customer.gstNumber}`);

  // Items table header
  const tableTop = 180;
  doc.fontSize(11).text("Description", 50, tableTop);
  doc.text("Rate", 320, tableTop, { width: 70, align: "right" });
  doc.text("Qty", 400, tableTop, { width: 50, align: "right" });
  doc.text("Amount", 470, tableTop, { width: 90, align: "right" });
  drawLine(doc, tableTop + 15);

  // Items
  let position = tableTop + 25;
  bill.items.forEach((item) => {
    doc.fontSize(10).text(item.description, 50, position, { width: 250 });
    doc.text(item.rate.toFixed(2), 320, position, { width: 70, align: "right" });
    doc.text(item.quantity, 400, position, { width: 50, align: "right" });
    doc.text((item.rate * item.quantity).toFixed(2), 470, position, { width: 90, align: "right" });
    position += 18;
  });

  drawLine(doc, position + 8);

  // Totals
  const sub = subtotal(bill.items);
  const gst = gstAmount(sub, bill.gstRate);
  doc.fontSize(10);
  doc.text("Subtotal", 400, position + 20, { width: 90, align: "right" });
  doc.text(sub.toFixed(2), 500, position + 20, { width: 60, align: "right" });
  doc.text(`GST (${bill.gstRate}%)`, 400, position + 38, { width: 90, align: "right" });
  doc.text(gst.toFixed(2), 500, position + 38, { width: 60, align: "right" });
  doc.fontSize(12).text("Grand Total", 400, position + 60, { width: 90, align: "right" });
  doc.fontSize(12).text((sub + gst).toFixed(2), 500, position + 60, { width: 60, align: "right" });

  // Payment and notes
  const footY = position + 100;
  doc.fontSize(10).text(`Payment Status: ${bill.paymentStatus || "Pending"}`, 50, footY);
  if (bill.paymentMethod) doc.text(`Payment Method: ${bill.paymentMethod}`, 50, footY + 16);
  if (bill.notes) {
    doc.text("Notes:", 50, footY + 36).fontSize(9).fillColor("#333").text(bill.notes, { width: 300 });
    doc.fillColor("#000").fontSize(10);
  }

  // Footer
  drawLine(doc, 760);
  doc.fontSize(9).fillColor("#666").text("Thank you for your business!", 50, 770, { align: "center", width: 512 });

  doc.end();
}

module.exports = { buildInvoicePDF };
