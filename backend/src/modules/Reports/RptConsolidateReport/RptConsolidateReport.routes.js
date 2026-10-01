const express = require("express");
const router = express.Router();
const auth = require("../../../middlewares/auth.middleware");
const controller = require("./RptConsolidateReport.controller");

router.post(
  "/consolidate-challan-pdf",
  auth(),
  controller.generateConsolidateChallanPDF
);

module.exports = router;