const express = require("express");
const controller = require("./receipt.controller");
const auth = require("../../../middlewares/auth.middleware");
const router = express.Router();



router.post("/zones", auth(), controller.getZones);

router.post("/corporation", auth(),controller.getCorporation);

router.post("/departments", auth(), controller.getDepartments);

router.get("/narration", auth(), controller.getNarration);

router.get("/transType", auth(), controller.getTransType);

router.post("/party", auth(), controller.getParty);

router.get("/searchGL", auth(), controller.searchGL);

router.get("/searchGLALL", auth(), controller.searchGLALL);

router.post("/receiptList", auth(), controller.getReceiptList);

router.post("/receiptDetails", auth(), controller.getReceiptDetails);

router.post("/receiptInsertUpdate", auth(), controller.receiptInsertUpdate);

router.get("/budget-heads", auth(), controller.getBudgetHeads);

router.post("/receipt-pdf", controller.getReceiptPDF);

router.post(
  "/receiptdetailPdf",auth(),
  controller.getReceiptDetails
);

module.exports = router;