const express = require("express");
const router = express.Router();
const auth = require("../../../middlewares/auth.middleware");
const controller = require("./FrmBankBalRpt.controller");

router.post("/account-balance", auth(),controller.getAccountBalance);

router.post("/monthly-summary",auth(), controller.getMonthlySummary);

router.post("/daily-summary",auth(), controller.getDailySummary);

router.post("/transaction-details",auth(), controller.getTransactionDetails);

router.post("/single-balance",auth(), controller.getSingleAccountBalance);

module.exports = router;