const express = require("express");
const router = express.Router();
const auth = require("../../../middlewares/auth.middleware");
const controller = require("./RptPaymentRegister.controller");

router.post("/payment-register", auth(), controller.getPaymentRegister);

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