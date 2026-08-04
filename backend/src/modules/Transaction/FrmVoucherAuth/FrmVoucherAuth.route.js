const express = require("express");
const router = express.Router();
const auth = require("../../../middlewares/auth.middleware");
const controller = require("./FrmVoucherAuth.controller");

router.post("/voucher-auth-list",  controller.getVoucherAuthList);

router.post("/voucher-auth-by-id",  controller.getVoucherAuthById);
router.post("/voucher-approval",  controller.saveVoucherApproval);

module.exports = router;