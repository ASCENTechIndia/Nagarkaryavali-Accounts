const express = require("express");
const router = express.Router();
const auth = require("../../../middlewares/auth.middleware");

const controller = require("./FrmBalanceSheetGroupList.controller");

router.get("/balgrouplist", auth(), controller.getBalGroupList);

router.get("/balgroup/:id", auth(), controller.getBalGroupById);

router.post("/balgroupmaster",auth(), controller.balGroupMaster);

module.exports = router;