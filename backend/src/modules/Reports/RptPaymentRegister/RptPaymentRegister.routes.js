const express = require("express");
const router = express.Router();
const controller = require("./RptPaymentRegister.controller");

router.post("/payment-register", controller.getPaymentRegister);

router.post("/payment-register-report", controller.getPaymentRegisterReport);
router.post("/payment-register-report-pdf", controller.getPaymentRegisterPDF);

module.exports = router;

// {
//   "fromDate": "2021-04-01",
//   "toDate": "2026-04-10",
//   "ulbId": "770",
//   "rptType": "1",
//   "chkGramPanchayat": false,
//   "majorCode": "016",
//   "minorCode": "01621690001",
//   "zoneId": "-1",
//   "userId": "0",
//   "budgetId": "-1",
//   "nidhiId": "-1"
// }