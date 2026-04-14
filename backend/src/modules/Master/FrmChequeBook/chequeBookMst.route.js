const express = require("express");
const router = express.Router();
const auth = require("../../../middlewares/auth.middleware");
const controller = require("./chequeBookMst.controller");

router.post("/GetUserDetails", auth(), controller.getUserDetails);
router.post("/NextChequeBookNo", auth(), controller.getNextChequeBookNo);
router.post("/SaveChequeBook", auth(), controller.saveChequeBook);
module.exports = router;