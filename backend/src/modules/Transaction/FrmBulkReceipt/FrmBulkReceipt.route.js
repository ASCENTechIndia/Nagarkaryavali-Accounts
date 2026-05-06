const express = require("express");
const router = express.Router();

const auth = require("../../../middlewares/auth.middleware");
const controller = require("./FrmBulkReceipt.controller");

router.post( "/bulk-receipt-list", auth(), controller.getFrmBulkReceipt );

router.post( "/bulk-receipt-account-search", auth(), controller.searchBulkReceiptAccount );

module.exports = router;