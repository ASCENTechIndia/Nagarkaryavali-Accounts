const express = require("express");
const router = express.Router();
const controller = require("./FrmVoucherGeneration.controller");
const auth = require("../../../middlewares/auth.middleware");

router.get("/gl-list", auth(), controller.getGLList);
router.post("/party-list", auth(), controller.getPartyList);
router.post("/balance-voucher", auth(), controller.getBalanceVoucher);
router.post("/voucher-prep", auth(), controller.getVoucherPrep);
router.post("/cheque-book", auth(), controller.getChequeBook);
router.post("/voucher-details", auth(), controller.getVoucherDetails);
router.post("/voucher-table", auth(), controller.getVoucherTableDetails);
router.post("/voucher-tax", auth(), controller.getVoucherTax);

module.exports = router;
