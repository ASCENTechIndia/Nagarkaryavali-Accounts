const express = require("express");
const router = express.Router();
const auth = require("../../../middlewares/auth.middleware");
const controller = require("./FrmAccIntDataRpt.Controller");

router.post("/department-transactions",  controller.getDepartmentTransactions);
router.post("/corporation-info",  controller.getCorporation);

module.exports = router;
