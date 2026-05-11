const express = require("express");
const router = express.Router();
const auth = require("../../../middlewares/auth.middleware");
const controller = require("./FrmCashDeposit.controller");

router.post("/zones-by-department", auth(), controller.getZonesByDepartment);
router.post("/transactions", auth(), controller.getCashDepositTransactions);
router.post("/denominations", auth(), controller.getCashDenominations);
router.post("/tapshil-receipts", auth(), controller.getTapshilReceipts);
router.post("/lekhashirsh", auth(), controller.getLekhashirshDetails);
router.post("/cash-deposit-by-ref", auth(), controller.getCashDepositByRefNo);

router.post("/save-bank-deposit", auth(), controller.saveBankDeposit);
router.post("/save-cash-denomination", auth(), controller.saveCashDenomination);

router.post("/generate-cash-deposit-pdf", auth(), controller.generateCashDepositPDF);

module.exports = router;