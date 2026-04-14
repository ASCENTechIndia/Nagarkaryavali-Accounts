const express = require("express");
const router = express.Router();
const auth = require("../../../middlewares/auth.middleware");

const controller = require("./RptReceiptRegisterDetails.controller");

// Transaction Report
router.post("/transaction-report", auth(), controller.getTransactionReport);

// Nidhi Config
router.get("/Vouchernidhi", auth(), controller.getNidhiConfig);   /// '/nidhi' also present in frmAccount

router.post(
  "/transaction-report-pdf",
  auth(),
  controller.generateTransactionPDF
);

module.exports = router;