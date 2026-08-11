const express = require("express");
const router = express.Router();
const auth = require("../../../middlewares/auth.middleware");

const controller = require("./FrmUserDepartmentMapping.controller");

router.post("/user-zone-dept-master", auth(), controller.userZoneDeptMaster);

router.post("/deptconfigbyid", auth(), controller.getUserZoneDeptList);

module.exports = router;
