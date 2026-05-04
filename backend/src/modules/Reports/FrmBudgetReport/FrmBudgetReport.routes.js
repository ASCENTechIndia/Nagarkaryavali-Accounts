const express = require("express");
const router = express.Router();
const controller = require("./FrmBudgetReport.controller");
const auth = require("../../../middlewares/auth.middleware");

router.post("/budget-report-pdf", auth(), controller.getBudgetReportPDF);

module.exports = router;