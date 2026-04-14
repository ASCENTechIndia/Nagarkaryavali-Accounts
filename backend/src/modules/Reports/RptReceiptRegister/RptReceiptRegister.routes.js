const express = require("express");
const router = express.Router();
const controller = require("./RptReceiptRegister.controller");

router.post("/receipt-register", controller.getReceiptRegister);

router.post(
  "/receipt-register-report-pdf",
  controller.generateReceiptRegPDF
);

module.exports = router;