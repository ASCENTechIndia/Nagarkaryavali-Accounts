const express = require("express");

const auth = require("../../../middlewares/auth.middleware");
const controller = require("./BankDepositReports.controller");

const router = express.Router();

router.get("/department",auth(), controller.getDepartments);

router.post("/summary-bankDeposit",auth(), controller.getSummary);

router.post("/account-wise",auth(), controller.getAccountWise);
router.post("/challan",auth(), controller.getChallan);
router.post("/dropdown",auth(), controller.getZoneDropdown);

router.get("/search-gl",auth(), controller.searchGL);

router.post("/insert-cashier-receipt",auth(), controller.insertCashierReceipt);

module.exports = router;