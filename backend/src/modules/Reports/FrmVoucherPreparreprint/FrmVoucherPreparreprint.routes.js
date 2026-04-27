const express = require("express");
const router = express.Router();
const auth = require("../../../middlewares/auth.middleware");

const controller = require("./FrmVoucherPreparreprint.controller");

router.post("/voucher-list", auth(), controller.getVoucherList);

router.post("/voucher-details-pdf", auth(), controller.getVoucherPDF);

module.exports = router;