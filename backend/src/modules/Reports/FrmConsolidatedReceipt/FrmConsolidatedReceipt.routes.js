const express = require("express");
const router = express.Router();

const auth = require("../../../middlewares/auth.middleware");

const controller = require("./FrmConsolidatedReceipt.controller");

router.post("/receipt",auth() ,controller.getConsolidatedReceiptPDF);

module.exports = router;
