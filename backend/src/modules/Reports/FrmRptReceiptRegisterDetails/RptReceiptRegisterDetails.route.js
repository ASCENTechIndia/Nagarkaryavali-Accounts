const express = require("express");
const router = express.Router();
const auth = require("../../../middlewares/auth.middleware");

const controller = require("./RptReceiptRegisterDetails.controller");

// Transaction Report
router.post("/transaction-report", auth(), controller.getTransactionReport);

// Nidhi Config
router.get("/nidhi", auth(), controller.getNidhiConfig);

router.post("/dailyCashbookreport", auth(), controller.getDailyTransactionReport);

router.post("/openingbalance", auth(), controller.getOpeningBalance);

module.exports = router;