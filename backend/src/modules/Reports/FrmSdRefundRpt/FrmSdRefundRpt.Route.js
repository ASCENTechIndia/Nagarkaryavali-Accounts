const express = require("express");
const router = express.Router();
const auth = require("../../../middlewares/auth.middleware");
const controller = require("../FrmSdRefundRpt/FrmSdRefundRpt.Controller");

router.post("/GetPartyDetails", auth(), controller.getPartySearch1);
router.post("/GetContrctNameDetails", auth(), controller.getPartySearch2);
router.post("/sd-received-paid", auth(), controller.getSDReceivedPaid);
router.post("/sd-received-paid-pdf", auth(), controller.getSDReceivedPaidPDF);

module.exports = router;
