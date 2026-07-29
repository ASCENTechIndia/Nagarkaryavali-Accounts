const express = require("express");
const router = express.Router();
const auth = require("../../../middlewares/auth.middleware");
const controller = require("./FrmTransactionEntryStatusRpt.controller");


router.post("/username-list", auth(), controller.getUserList);

router.post("/report", auth(),  controller.getTransactionEntryStatusReport);

router.post(
  "/generate-transaction-entry-status-pdf", auth(),
  controller.generateTransactionEntryStatusPDF
);

module.exports = router;