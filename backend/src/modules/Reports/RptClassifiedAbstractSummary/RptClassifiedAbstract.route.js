const express = require("express");
const router = express.Router();
const auth = require("../../../middlewares/auth.middleware");

const controller = require("./RptClassifiedAbstract.controller");

// Budget Expenditure Report
router.post("/budgetexpenditurereport", auth(), controller.getBudgetExpenditureReport);
router.post("/budgetreportpdf", auth(), controller.getBudgetExpenditurePDF);
router.post("/transactionledgerreport", auth(), controller.getTransactionLedgerReport);

module.exports = router;