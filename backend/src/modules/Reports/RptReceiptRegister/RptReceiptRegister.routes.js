const express = require("express");
const router = express.Router();
const controller = require("./RptReceiptRegister.controller");
const auth = require("../../../middlewares/auth.middleware");

router.post("/receipt-register", controller.getReceiptRegister);

router.post(
  "/receipt-register-report-pdf", auth(),
  controller.generateReceiptRegPDF
);

router.post(
  "/receipt-register-user-wise", 
  controller.getReceiptRegisterUserWise
);

router.post(
  "/receipt-register-user-wise-pdf", 
  controller.generateReceiptRegUserWisePDF
);

module.exports = router;