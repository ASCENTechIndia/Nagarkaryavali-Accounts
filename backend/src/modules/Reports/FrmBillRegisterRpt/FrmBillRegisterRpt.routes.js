const express = require("express");
const router = express.Router();
const auth = require("../../../middlewares/auth.middleware");

const controller = require("./FrmBillRegisterRpt.controller");

router.post("/bill-register-report", auth(), controller.getBillRegisterReport);
router.post("/bill-register-report-pdf", auth(), controller.getBillRegisterPDF);

module.exports = router;
