const express = require("express");
const router = express.Router();

const { getPaymentRegister } = require("./RptPaymentRegister.controller");

router.post("/payment-register", getPaymentRegister);

module.exports = router;