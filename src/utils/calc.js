function subtotal(items = []) {
  return items.reduce((s, i) => s + Number(i.rate) * Number(i.quantity), 0);
}

function gstAmount(sub, gstRate) {
  return (sub * Number(gstRate || 0)) / 100;
}

function grandTotal(items, gstRate) {
  const sub = subtotal(items);
  return {
    subtotal: sub,
    gst: gstAmount(sub, gstRate),
    total: sub + gstAmount(sub, gstRate)
  };
}

module.exports = { subtotal, gstAmount, grandTotal };