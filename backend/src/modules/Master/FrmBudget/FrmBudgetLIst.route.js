const express = require("express");
const router = express.Router();
const auth = require("../../../middlewares/auth.middleware");

const controller = require("./FrmBudgetLIst.controller");

router.get("/budgetlist", auth(), controller.getBudgetList);

router.get("/budgetgllist", auth(), controller.getGLList);

router.get("/budgetheadlist", auth(), controller.getBudgetHeadList);

router.get("/budget/:id", auth(), controller.getBudgetById);

router.get("/budgetsearchgl", auth(), controller.searchGL);

router.post("/budget-master", controller.budgetMaster);

module.exports = router;