const express = require("express");

const router = express.Router();

const controller = require("./FrmReceiptPaymentRegisterRpt.controller");

const auth = require("../../../middlewares/auth.middleware");

router.post("/generate-receipt", auth(), controller.generateReceiptPaymentRegister);

module.exports = router;
