const express = require("express");
const router = express.Router();
const controller = require("./RptTransferRegister.controller");
const auth = require("../../../middlewares/auth.middleware");

router.post("/transfer-register", auth(), controller.getTransferRegister);

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