const express = require("express");
const router = express.Router();
const auth = require("../../../middlewares/auth.middleware");
const controller = require("../FrmSdRefundRpt/FrmSdRefundRpt.Controller");

router.post("/GetPartyDetails", controller.getPartySearch1);
router.post("/GetContrctNameDetails", controller.getPartySearch2);
router.post("/sd-received-paid", controller.getSDReceivedPaid);
router.post("/sd-received-paid-pdf", controller.getSDReceivedPaidPDF);

module.exports = router;
