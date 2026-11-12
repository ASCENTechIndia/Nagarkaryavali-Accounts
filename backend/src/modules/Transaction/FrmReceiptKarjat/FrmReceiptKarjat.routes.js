const express = require("express");
const router = express.Router();
const controller = require("./FrmReceiptKarjat.controller");
const auth = require("../../../middlewares/auth.middleware");

router.post("/receipt-types", auth(), controller.getReceiptTypes); 
router.post("/receipt-accounts", auth(), controller.getReceiptAccounts);
router.post("/bank-accounts", auth(), controller.getBankAccounts);
router.get("/paymodes", auth(), controller.getPayModes);
router.post("/paymode-accounts", auth(), controller.getPayModeAccounts);
router.post("/account-details", auth(), controller.getAccountDetailsByAccNo);
router.post("/bank-branch-by-ifsc", auth(), controller.getBankBranchByIfsc);
router.post("/receipt-Karjat-list",  controller.getReceiptListKarjat);
router.post("/receipt-header", auth(), controller.getReceiptHeaderByRefNo);
router.post("/receipt-details", auth(), controller.getReceiptDetailsByRefNo);

module.exports = router;