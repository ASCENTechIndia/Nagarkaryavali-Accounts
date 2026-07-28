const express = require("express");
const router = express.Router();

const controller = require("./FrmTransactionEntryStatusRpt.controller");

// Dropdown
router.post("/username-list", controller.getUserList);

// Report
router.post("/report", controller.getTransactionEntryStatusReport);

// PDF
router.post(
  "/generate-transaction-entry-status-pdf",
  controller.generateTransactionEntryStatusPDF
);

module.exports = router;