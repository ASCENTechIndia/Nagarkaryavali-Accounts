const express = require("express");
const router = express.Router();
const auth = require("../../../middlewares/auth.middleware");
const controller = require("./frmContraRecReprint.controller");

router.post("/list", auth(), controller.getContraReceiptList);

module.exports = router;