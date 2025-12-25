const router = require("express").Router();
const auth = require("../middleware/auth");
const {
  customerValidators,
  createCustomer,
  listCustomers,
  getCustomer,
  updateCustomer,
  deleteCustomer,
  customerStatement,
} = require("../controllers/customerController");

router.use(auth);
router.get("/", listCustomers);
router.post("/", customerValidators, createCustomer);
router.get("/:id(\\d+)", getCustomer);
router.put("/:id", customerValidators, updateCustomer);
router.delete("/:id", deleteCustomer);
router.get("/:id/statement", customerStatement);

module.exports = router;
