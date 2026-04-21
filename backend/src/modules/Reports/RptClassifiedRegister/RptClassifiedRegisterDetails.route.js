const express = require("express");
const router = express.Router();
const auth = require("../../../middlewares/auth.middleware");

const controller = require("./RptClassifiedRegisterDetails.controller");

// Nidhi Config
router.get("/monthlysummarynidhi", auth(), controller.getNidhiConfig);

// Monthly Summary Report
router.post("/monthlysummaryreport", auth(), controller.getMonthlySummaryReport);

router.post("/monthlysummaryreportpdf", auth(), controller.getMonthlySummaryPDF);

module.exports = router;