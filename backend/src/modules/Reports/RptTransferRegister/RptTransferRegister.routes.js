const express = require("express");
const router = express.Router();
const controller = require("./RptTransferRegister.controller");

router.post("/transfer-register", controller.getTransferRegister);

module.exports = router;

// {
//   "fromDate": "2021-04-01",
//   "toDate": "2026-04-10",
//   "ulbId": "770",
//   "trnsType": "5",
//   "zoneId": "-1",
//   "budgetId": "-1",
//   "nidhiId": "-1",
//   "corpCode": "MBMC"
// }