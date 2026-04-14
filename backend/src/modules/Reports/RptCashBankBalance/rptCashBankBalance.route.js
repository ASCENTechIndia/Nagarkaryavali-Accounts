const express = require("express");
const router = express.Router();
const auth = require("../../../middlewares/auth.middleware");
const controller = require("./rptCashBankBalance.controller");

router.post("/grampanchayat-list", auth(), controller.getGrampanchayatList);
router.post("/cash-bank-balance", auth(), controller.getCashBankBalanceReport);

module.exports = router;