const express = require("express");
const router = express.Router();
const controller = require("./FrmBroadSheetCreditReport.controller");
const auth = require("../../../middlewares/auth.middleware");

router.post(
  "/broad-sheet-credit-pdf",
  auth(),
  controller.getBroadSheetCreditPDF
);

module.exports = router;