const express = require("express");
const router = express.Router();
const auth = require("../../../middlewares/auth.middleware");

const controller = require("./FrmBudgetPreprationList.controller");

router.get("/budgetpre", auth(), controller.getAccountBySubType);

router.post("/budgetsave",auth(), controller.budgetPreparation);

router.get("/budgetsubtypelist", auth(), controller.getAccSubTypeList);

module.exports = router;