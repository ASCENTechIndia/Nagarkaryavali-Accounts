const express = require("express");
const router = express.Router();
const auth = require("../../../middlewares/auth.middleware");

const controller = require("./FromBankbranch.controller");

router.get("/banklist", auth(), controller.getBankList);

router.get("/branchlist", auth(), controller.getBranchList);

router.get("/branch/:id", auth(), controller.getBranchById);

router.post("/branchmaster",auth(), controller.bankBranchMaster);

module.exports = router;