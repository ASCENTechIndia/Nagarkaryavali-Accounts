const express = require("express");
const router = express.Router();
const auth = require("../../../middlewares/auth.middleware");
const controller = require("./frmPayment.controller");

router.post("/payment-list", auth(), controller.getFrmPayment);
router.get("/transtype-list", auth(), controller.getTransactionTypes);
router.post("/party-list", auth(), controller.getPartyMaster);
router.post("/account-details", auth(), controller.getAccountDetails);
router.post("/security-deposit", auth(), controller.getSecurityDeposit);
router.get("/payment-types", auth(), controller.getPaymentTypes);
router.get("/advance-payment-type", auth(), controller.getAdvancePaymentType);
router.post("/payment-details", auth(), controller.getPaymentDetails);
router.post("/account-search", auth(), controller.searchAccount);
router.post("/account-balance", auth(), controller.getAccountBalance);
router.post("/corporation-by-id", auth(), controller.getCorporationById);
router.post("/payment-details-view", auth(), controller.getPaymentDetailsView);
router.post("/save-payment", auth(), controller.savePayment);

module.exports = router;