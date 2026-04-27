const express = require("express");
const router = express.Router();
const controller = require("./RptGovtTaxRegister.controller");

router.post("/govt-tax-register-pdf1", controller.getGovtTaxRegisterPDF1);
router.post("/govt-tax-register-summary-pdf", controller.getGovtTaxRegisterSummaryPDF);
router.post("/govt-tax-summary2-pdf", controller.getGovtTaxSummary2PDF);

module.exports = router;