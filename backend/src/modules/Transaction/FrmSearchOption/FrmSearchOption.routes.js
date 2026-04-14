const express = require("express");
const router = express.Router();
const controller = require("./FrmSearchOption.controller");
const auth = require("../../../middlewares/auth.middleware");


router.post("/receipt-search", auth(), controller.getReceiptSearch);

module.exports = router;