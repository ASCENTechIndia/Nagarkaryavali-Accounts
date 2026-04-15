const express = require("express");
const router = express.Router();
const controller = require("./FrmGovtTaxPayment.controller");
const auth = require("../../../middlewares/auth.middleware");


router.post("/govt-tax-payment", auth(), controller.getGovtTaxPayment);
router.post("/govt-tax-insert", auth(), controller.govtTaxInsert);

module.exports = router;
