const express = require("express");
const router = express.Router();
const auth = require("../../../middlewares/auth.middleware");

const controller = require("./FrmCityList.controller");

router.get("/statelist", auth(), controller.getStateList);

router.get("/districtlist", auth(), controller.getDistrictList);

router.get("/districtbystate", auth(), controller.getDistrictByState);

router.get("/citybydistrict", auth(), controller.getCityByDistrict);

router.get("/statebydistrict", auth(), controller.getStateByDistrict);

router.get("/citydetails", auth(), controller.getCityById);

router.post("/citymaster",auth(), controller.cityMaster);

module.exports = router;