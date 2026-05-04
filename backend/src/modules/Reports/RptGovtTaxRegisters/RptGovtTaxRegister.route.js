const express = require("express");
const router = express.Router();
const controller = require("./RptGovtTaxRegister.controller");
const auth = require("../../../middlewares/auth.middleware");

router.post("/govt-tax-register-pdf1", auth(), controller.getGovtTaxRegisterPDF1);
router.post("/govt-tax-register-summary-pdf", auth(), controller.getGovtTaxRegisterSummaryPDF);
router.post("/govt-tax-summary2-pdf", auth(), controller.getGovtTaxSummary2PDF);

module.exports = router;