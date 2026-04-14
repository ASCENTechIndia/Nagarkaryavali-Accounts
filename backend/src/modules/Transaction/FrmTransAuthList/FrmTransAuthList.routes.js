const express = require("express");
const router = express.Router();
const controller = require("./FrmTransAuthList.controller");
const auth = require("../../../middlewares/auth.middleware");


router.post("/transaction-list", auth(), controller.getTransactionList);

module.exports = router;