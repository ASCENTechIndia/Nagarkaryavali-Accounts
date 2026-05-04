const express = require("express");
const router = express.Router();
const auth = require("../../../middlewares/auth.middleware");

const controller = require("./RptTrialBalance.controller");

router.post("/trial-balance", auth(), controller.getTrialBalance);

router.post("/trial-balance-pdf", auth(), controller.getTrialBalancePDF);

module.exports = router;