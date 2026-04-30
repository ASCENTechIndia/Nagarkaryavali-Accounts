const express = require("express");
const router = express.Router();
const auth = require("../../../middlewares/auth.middleware");

const controller = require("./FrmSecurityDeposit.controller");

router.post("/rbt-deposit/received", auth(), controller.getRbtDepReceived);
router.post("/rbt-deposit/payment", auth(), controller.getRbtDepoPayment);
router.post("/rbt-deposit/unpaid", auth(), controller.getRbtUnpaid);
router.post("/rdo-report/147", auth(), controller.getRdoReport147);
router.post("/security-deposit/pdf", auth(), controller.getSecurityDepositPDF);

module.exports = router;