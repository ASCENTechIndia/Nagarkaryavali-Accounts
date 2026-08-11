const express = require("express");
const router = express.Router();
const auth = require("../../../middlewares/auth.middleware");
const controller = require("./FrmUserDepartmentMapping.controller");

router.post("/user-dept-master", auth(), controller.userDeptMaster);

router.post("/deptconfigbyid", auth(), controller.getUserDeptList);

router.post("/user-zone-master", auth(), controller.userZoneMaster);

router.post("/zoneconfigbyid", auth(), controller.getUserZoneList);

module.exports = router;