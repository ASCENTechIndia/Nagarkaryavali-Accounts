const express = require("express");
const router = express.Router();
const auth = require("../../../middlewares/auth.middleware");

const controller = require("./RptGLAccStatement.controller");

// Summary PDF
router.post(
  "/transaction-summaryPdf",
  auth(),
  controller.getTransactionSummaryPDF
);

// Detail PDF
router.post(
  "/transaction-detailsPdf",
  auth(),
  controller.getTransactionDetailsPDF
);


router.post(
  "/searchAccountHead",
  auth(),
  controller.searchAccountHead
);

module.exports = router;