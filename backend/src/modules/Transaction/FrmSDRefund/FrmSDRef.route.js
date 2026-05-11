const express = require("express");
const router = express.Router();
const auth = require("../../../middlewares/auth.middleware");
const controller = require("./frmSDRef.controller");

// Party Search
router.post("/party-search", auth(), controller.searchPartiesConcatenated);
router.post("/party-search-standard", auth(), controller.searchPartiesStandard);

router.post("/refund-list", auth(), controller.getSdRefundList);
router.post("/refund-pdf", auth(), controller.getSdRefundPDF);

router.get("/credit-gl-master", auth(), controller.getCreditGLMaster);
router.get("/debit-gl-master", auth(), controller.getDebitGLMaster);

router.post("/check-refund-status", auth(), controller.checkRefundStatus);
router.post("/voucher-by-sdid", auth(), controller.getVoucherBySDID);

router.post("/voucher-master", auth(), controller.getSDVoucherMaster);
router.post("/voucher-details", auth(), controller.getSDVoucherDetails);
router.post("/voucher-prep-master", auth(), controller.getVoucherPrepMaster);
router.post("/voucher-receipt-details", auth(), controller.getSDVoucherPrepReceiptDetails);

router.post("/party-bank-details", auth(), controller.getPartyBankDetails);
router.post("/general-bank-details", auth(), controller.getGeneralBankDetails);
router.post("/party-bank-list", auth(), controller.getPartyBankList);

router.post("/updated-details", auth(), controller.getSDUpdatedDetails);
router.post("/account-subtype", auth(), controller.getSDAccountSubtype);
router.post("/budget-balance", auth(), controller.getBudgetBalance);
router.post("/party-tax-details", auth(), controller.getPartyTaxDetails);
router.post("/reference-info", auth(), controller.getSDReferenceInfo);

router.post("/save", auth(), controller.saveSdRefundVoucher);

module.exports = router;