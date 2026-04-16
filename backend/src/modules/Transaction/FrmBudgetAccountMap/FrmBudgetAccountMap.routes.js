const express = require("express");
const router = express.Router();
const controller = require("./FrmBudgetAccountMap.controller");
const auth = require("../../../middlewares/auth.middleware");


router.post("/budget-account-map", auth(),  controller.getBudgetAccountMap);
router.post("/subhead-list", auth(), controller.getSubHeadList);
router.post("/group-list", auth(), controller.getGroupList);
router.post("/subgroup-list", auth(), controller.getSubGroupList);
router.post("/budget-accmap-insert", auth(), controller.insertBudgetAccountMap);

module.exports = router;