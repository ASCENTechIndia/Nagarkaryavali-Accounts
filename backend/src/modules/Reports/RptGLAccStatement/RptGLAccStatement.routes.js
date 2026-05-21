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


// SUMMARY EXCEL
router.post(
  "/transaction-summaryExcel",
  auth(),
  controller.getTransactionSummaryExcel
);

// DETAILS EXCEL
router.post(
  "/transaction-detailsExcel",
  auth(),
  controller.getTransactionDetailsExcel
);


router.post(
  "/searchAccountHead",
  
  controller.searchAccountHead
);

module.exports = router;