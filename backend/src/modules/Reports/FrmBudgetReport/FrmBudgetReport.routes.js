const express = require("express");
const router = express.Router();
const controller = require("./FrmBudgetReport.controller");

router.post("/budget-report-pdf", controller.getBudgetReportPDF);

module.exports = router;