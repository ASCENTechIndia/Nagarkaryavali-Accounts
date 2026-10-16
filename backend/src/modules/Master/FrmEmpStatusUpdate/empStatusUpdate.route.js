const express = require("express");
const router = express.Router();
const controller = require("./empStatusUpdate.controller");
const auth = require("../../../middlewares/auth.middleware");

// Insert / Update / Delete Employee Status
router.post("/SaveEmpStatusUpdate", auth(), controller.saveEmpStatusUpdate);

module.exports = router;
