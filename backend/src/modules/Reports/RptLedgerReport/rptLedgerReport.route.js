const express = require("express");
const router = express.Router();

const controller = require("./rptLedgerReport.controller");

router.post("/ledger/transaction-details", controller.getTransactionDetails);
router.post("/ledger/balance", controller.getBalance);
router.post("/ledger/transactions", controller.getLedgerTransactions);

module.exports = router;