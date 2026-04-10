const express = require("express");
const router = express.Router();
const auth = require("../../../middlewares/auth.middleware");
const controller = require("./frmVoucher.controller");

router.post("/pending-vouchers",auth(), controller.getPendingVouchers);
router.post("/deposit",auth(), controller.getDepositeDropdown);
router.get("/section", auth(), controller.getSectionDropdown);
router.post("/budget-head", auth(), controller.getBudgetHeadDropdown);
router.post("/bank-details", auth(), controller.getBankDetails);
router.post("/voucher-details", auth(), controller.getVoucherDetails);
router.post("/voucher-detail-lines", auth(), controller.getVoucherDetailLines);
router.post("/accountby-glcode", auth(),  controller.getAccountByGlAcc);
router.post("/secdeposit-code", auth(), controller.getSecDepositCode);
router.post("/account-by-function", auth(), controller.getAccountByFunctionObject);
router.post("/corporation-code", auth(), controller.getCorporationCode);
router.post("/contracts", auth(), controller.getContracts);
router.post("/contract-year", auth(), controller.getContractAccYear);
router.post("/party-bank", auth(), controller.getPartyBankDetails);
router.post("/party-tax", auth(), controller.getPartyTaxDetails);
router.post("/nidhi", auth(), controller.getNidhiConfig);
router.post("/govt-tax-acc", auth(), controller.getGovtTaxAcc);
router.post("/voucher-receipt-details", auth(), controller.getVoucherReceiptDetails);
router.post("/SaveVoucher", auth(), controller.saveVoucher);

module.exports = router;