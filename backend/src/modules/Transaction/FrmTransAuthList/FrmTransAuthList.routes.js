const express = require("express");
const router = express.Router();
const controller = require("./FrmTransAuthList.controller");
const auth = require("../../../middlewares/auth.middleware");

router.post("/transaction-list", auth(), controller.getTransactionList);
router.post("/user-list", auth(), controller.getUserList);
router.post("/transaction-details", auth(), controller.getTransactionDetails);
router.post("/trans-auth-save", auth(),  controller.insertTransAuth);

module.exports = router;
