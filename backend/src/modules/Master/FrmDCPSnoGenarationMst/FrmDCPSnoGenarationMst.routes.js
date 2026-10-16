const express = require("express");
const router = express.Router();
const auth = require("../../../middlewares/auth.middleware");
const controller = require("./FrmDCPSnoGenarationMst.controller");

router.post("/getEmployeeByNo", auth(), controller.getEmployeeByNo);

router.post("/SaveDCPS", auth(), controller.saveDCPS);

router.post("/DCPSList", auth(), controller.getDCPSList);

module.exports = router;
