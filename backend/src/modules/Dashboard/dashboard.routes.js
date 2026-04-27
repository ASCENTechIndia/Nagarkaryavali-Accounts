const express = require("express");
const router = express.Router();
const dashboardController = require("./dashboard.controller");
const auth = require("../../middlewares/auth.middleware");

router.post("/BindPayModeGrid", auth(),  dashboardController.BindPayModeGridCtrl);
router.post("/BindReceiptGrid", auth(), dashboardController.BindReceiptGridCtrl);
router.post("/BindGrantsGrid", auth(), dashboardController.BindGrantsGridCtrl);

module.exports = router;