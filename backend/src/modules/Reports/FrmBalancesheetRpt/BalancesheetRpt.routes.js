const express = require("express");
const router = express.Router();
const controller = require("./BalancesheetRpt.controller");

const auth = require("../../../middlewares/auth.middleware");


router.post("/balance-sheet-pdf", controller.getBalanceSheetPDF);

module.exports = router;