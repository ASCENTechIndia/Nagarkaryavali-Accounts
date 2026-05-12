const express = require("express");

const router = express.Router();

const auth = require("../../../middlewares/auth.middleware");

const controller = require("./FrmVouchergenerationReprint.controller");

router.post("/reprint", auth(), controller.getVoucherGenerationReprint);
router.post("/voucher-generation-print", auth(), controller.getVoucherGenerationPrint);

module.exports = router;
