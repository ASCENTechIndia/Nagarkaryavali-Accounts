const express = require("express");
const router = express.Router();
const auth = require("../../../middlewares/auth.middleware");
const controller = require("./frmDepositType.controller");

router.post("/deposit-types", auth(), controller.getDepositTypes);
router.post("/DepositTypeById", auth(), controller.getDepositTypeById);

module.exports = router;