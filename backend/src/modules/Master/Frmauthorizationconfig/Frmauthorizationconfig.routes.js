const express = require("express");
const router = express.Router();
const auth = require("../../../middlewares/auth.middleware");

const controller = require("./Frmauthorizationconfig.controller");

// List
router.get("/authconfig-list", auth(), controller.getAuthorizationConfigList);

// Details (with flag)
router.get("/authconfig-details", auth(), controller.getAuthorizationConfigDetails);

// 🔥 Procedure Route
router.post("/authconfig-master", auth(),  controller.authorizationConfigMaster);


module.exports = router;
