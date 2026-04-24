const express = require("express");
const router = express.Router();
const auth = require("../../../middlewares/auth.middleware");

const controller = require("./FrmVoucherPreparreprint.controller");

router.post("/voucher-list", controller.getVoucherList);

router.post("/voucher-details-pdf", controller.getVoucherPDF);

module.exports = router;