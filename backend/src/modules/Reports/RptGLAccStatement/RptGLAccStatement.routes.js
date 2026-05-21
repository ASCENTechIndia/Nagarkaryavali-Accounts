const express = require("express");
const router = express.Router();
const auth = require("../../../middlewares/auth.middleware");

const controller = require("./RptGLAccStatement.controller");

// Summary PDF
router.post(
  "/transaction-summaryPdf",
  
  controller.getTransactionSummaryPDF
);

// Detail PDF
router.post(
  "/transaction-detailsPdf",
  
  controller.getTransactionDetailsPDF
);


// SUMMARY EXCEL
router.post(
  "/transaction-summaryExcel",
  
  controller.getTransactionSummaryExcel
);

// DETAILS EXCEL
router.post(
  "/transaction-detailsExcel",
  
  controller.getTransactionDetailsExcel
);


router.post(
  "/searchAccountHead",
  
  controller.searchAccountHead
);

module.exports = router;