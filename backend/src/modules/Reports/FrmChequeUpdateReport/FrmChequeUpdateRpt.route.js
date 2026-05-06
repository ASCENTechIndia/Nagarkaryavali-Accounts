const express = require("express");
const router = express.Router();
const auth = require("../../../middlewares/auth.middleware");
const controller = require("./FrmChequeUpdateRpt.controller");

router.post("/cheque-update-report", controller.getChequeUpdateReport);

module.exports = router;
