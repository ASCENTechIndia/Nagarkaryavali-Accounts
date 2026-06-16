const express = require("express");
const controller = require("./FrmUserTax.controller");
const auth = require("../../../middlewares/auth.middleware");
const router = express.Router();

router.post("/list", auth(), controller.getAccUserMapList);

router.post("/edit", auth(), controller.getAccUserMapById);

router.post("/saveUserMap", auth(), controller.saveAccUserMap);

module.exports = router;
