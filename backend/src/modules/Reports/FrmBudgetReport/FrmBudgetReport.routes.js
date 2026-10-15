const express = require("express");
const router = express.Router();
const controller = require("./FrmBudgetReport.controller");
const auth = require("../../../middlewares/auth.middleware");

router.post("/budget-report-pdf", auth(), controller.getBudgetReportPDF);
router.post("/dcps-report",auth(),controller.getDcpsReportData);
router.post(
  "/dcps-interest-pdf",
auth(),
  controller.getDcpsInterestPDF
);



module.exports = router;