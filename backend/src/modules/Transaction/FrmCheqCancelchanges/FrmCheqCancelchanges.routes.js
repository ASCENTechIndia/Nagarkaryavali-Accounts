const express = require("express");
const router = express.Router();
const auth = require("../../../middlewares/auth.middleware");
const controller = require("./FrmCheqCancelchanges.controller");

router.post("/cheque-cancel-details", auth(), controller.getChequeCancelDetails);
router.post("/cheque-cancel-details-Autofill", auth(), controller.getChequeCancelDetailsAuto);
router.post("/cheque-cancel-insert", auth(), controller.insertCheqCancel);

module.exports = router;
