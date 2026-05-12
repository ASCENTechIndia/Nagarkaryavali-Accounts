const express = require("express");
const router = express.Router();

const auth = require("../../../middlewares/auth.middleware");

const controller = require("./FrmConsolidatedReceipt.controller");

router.post("/receipt-data", auth(), controller.getConsolidatedReceiptData);
router.post("/receipt", auth(), controller.getConsolidatedReceiptPDF);
router.get("/payment-types", auth(), controller.getPaymentTypes);

module.exports = router;
