const express = require("express");
const router = express.Router();
const auth = require("../../../middlewares/auth.middleware");
const controller = require("./rptCashBankBalance.controller");

router.post("/grampanchayat-list", auth(), controller.getGrampanchayatList);
router.post("/cash-bank-balance", auth(), controller.getCashBankBalanceReport);

router.post("/detailcashbook", auth(),controller.getDailyTransactionDetailedReport);
router.post("/detailcashbookpdf",auth(),controller.generateCashbookPDF);
router.post("/opening-balance", auth(), controller.getOpeningBalance);
router.post("/transaction-details", auth(), controller.getTransactionDetails);

module.exports = router;