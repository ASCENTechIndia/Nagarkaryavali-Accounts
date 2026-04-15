const express = require("express");
const router = express.Router();
const auth = require("../../../middlewares/auth.middleware");

const controller = require("./FrmInvestement.controller");

router.get("/investmentlist", auth(), controller.getInvestmentList);

router.get("/investment/:id", auth(), controller.getInvestmentById);

router.post("/investmentmaster",auth(), controller.investmentMaster);

module.exports = router;