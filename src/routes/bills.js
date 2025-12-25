const router = require("express").Router();
const auth = require("../middleware/auth");
const {
  billValidators,
  createBill,
  listBills,
  getBill,
  updateBill,
  deleteBill,
  setPaymentStatus,
  downloadPdf,
} = require("../controllers/billController");

router.use(auth);
router.get("/", listBills);
router.post("/", billValidators, createBill);
router.get("/:id", getBill);
router.put("/:id", billValidators, updateBill);
router.delete("/:id", deleteBill);
router.patch("/:id/payment", setPaymentStatus);
// In bills.js
router.get("/:id(\\d+)/pdf", downloadPdf); // Ensure ID is numeric


module.exports = router;

