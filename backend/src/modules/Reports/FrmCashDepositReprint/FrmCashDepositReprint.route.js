const express = require("express");
const router = express.Router();

const auth = require("../../../middlewares/auth.middleware");
const controller = require("./FrmCashDepositReprint.controller");

router.post("/receipt-report", auth(), controller.getReceiptReport);
router.get("/paymodes", auth(), controller.getPayModes);

module.exports = router;
