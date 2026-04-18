const express = require("express");
const router = express.Router();
const auth = require("../../../middlewares/auth.middleware");
const controller = require("./rptLedgerReport.controller");

router.post("/ledger/transaction-details", auth(), controller.getTransactionDetails);
router.post("/ledger/balance", auth(), controller.getBalance);
router.post("/ledger/transactions", auth(), controller.getLedgerTransactions);
router.post(
  "/ledger/pdf",
  auth(),
  controller.generateLedgerPDF
);

module.exports = router;