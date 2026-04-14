const express = require("express");
const router = express.Router();
const auth = require("../../../middlewares/auth.middleware");

const controller = require("./BalanceSheetSubGroupList.controller");

router.get("/balgrouplist", auth(), controller.getBalGroupList);


router.get("/balsubgrouplist", auth(), controller.getBalSubGroupList);


router.post("/balsubgroupmaster",auth(), controller.balSubGroupMaster);

router.get("/balsubgroup/:id", auth(), controller.getBalSubGroupById);

module.exports = router;