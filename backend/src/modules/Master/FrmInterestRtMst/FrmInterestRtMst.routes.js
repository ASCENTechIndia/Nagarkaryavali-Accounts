const express = require("express");
const router = express.Router();
const auth = require("../../../middlewares/auth.middleware");
const controller = require("./FrmInterestRtMst.controller");

// GET Interest List
router.get("/interestlist", auth(), controller.getInterestList);

// GET Interest By ID
router.post("/interestbyid", auth(), controller.getInterestById);

// SAVE Interest
router.post("/saveinterest", auth(), controller.saveInterest);

module.exports = router;