const express = require("express");
const router = express.Router();
const auth = require("../../../middlewares/auth.middleware");
const controller = require("./BudgetHeadConfig.controller");

router.post("/BudgetHeadConfig", auth(), controller.getBudgetHeadConfig);
router.get("/sub-head", auth(), controller.getSubHead);
router.post("/group", auth(), controller.getGroup);
router.get("/head", auth(), controller.getHead);
router.post("/BudgetByLevel", auth(), controller.getBudgetByLevel);
router.post("/SaveBudgetHead", auth(), controller.saveBudgetHead);

module.exports = router;