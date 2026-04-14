const express = require("express");
const router = express.Router();
const auth = require("../../../middlewares/auth.middleware");
const controller = require("./frmBanList.controller");

router.get("/BankList", auth(), controller.getBankList);
router.post("/BankById", auth(), controller.getBankById);
router.post("/SaveBank", auth(), controller.saveBank);

module.exports = router;