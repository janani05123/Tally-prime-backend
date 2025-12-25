const router = require("express").Router();
const auth = require("../middleware/auth");
const { monthlySummaries } = require("../controllers/statementController");

router.use(auth);
router.get("/monthly", monthlySummaries);

module.exports = router;
