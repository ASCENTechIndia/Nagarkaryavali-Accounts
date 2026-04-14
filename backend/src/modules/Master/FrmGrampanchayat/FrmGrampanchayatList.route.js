const express = require("express");
const router = express.Router();
const auth = require("../../../middlewares/auth.middleware");

const controller = require("./FrmGrampanchayatList.controller");

router.get("/deptlist", auth(), controller.getDeptList);

router.get("/grampanchlist", auth(), controller.getGrampanchList);

router.get("/grampanch/:id", auth(), controller.getGrampanchById);

router.post("/grampanchmaster",auth(), controller.grampanchMaster);

module.exports = router;