const express = require("express");
const router = express.Router();
const controller = require("./RptReceiptRegister.controller");
const auth = require("../../../middlewares/auth.middleware");

router.post("/receipt-register", auth(), controller.getReceiptRegister);

router.post(
  "/receipt-register-report-pdf",  auth(),
  controller.generateReceiptRegPDF
);

module.exports = router;