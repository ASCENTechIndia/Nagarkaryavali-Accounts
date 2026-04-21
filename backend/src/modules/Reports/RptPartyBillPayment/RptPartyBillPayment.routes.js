const express = require("express");
const router = express.Router();
const controller = require("./RptPartyBillPayment.controller");
const auth = require("../../../middlewares/auth.middleware");

router.post("/party-bill-payment", auth(), controller.getPartyBillPayment);

router.post("/form64", auth(), controller.getForm64Report);
router.post("/form63", auth(), controller.getForm63Report);

module.exports = router;
// {
//   "fromDate": "2021-04-01",
//   "toDate": "2026-04-10",
//   "ulbId": "770",
//   "partyId": "123"
// }



// {
//   "refNo": "12345",
//   "ulbId": "770"
// }