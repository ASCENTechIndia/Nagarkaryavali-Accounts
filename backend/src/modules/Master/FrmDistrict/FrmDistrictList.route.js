const express = require("express");
const router = express.Router();
const auth = require("../../../middlewares/auth.middleware");

const controller = require("./FrmDistrictList.controller");

router.get("/districtbystate", auth(), controller.getDistrictListByState);

router.get("/district/:id", auth(), controller.getDistrictById);

router.post("/districtmaster",auth(), controller.districtMaster);

router.get("/state/:id", auth(), controller.getStateById);

router.post("/statemaster", controller.stateMaster);

module.exports = router;