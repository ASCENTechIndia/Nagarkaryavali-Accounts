const express = require("express");
const router = express.Router();
const controller = require("./TransferRegisterRpt.controller");

router.post("/details", controller.getCashbookDetails);
router.post("/summary", controller.getCashbookSummary);
router.post("/pdf", controller.getCashbookPDF);

module.exports = router;