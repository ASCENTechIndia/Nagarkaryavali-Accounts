const express = require("express");
const controller = require("./receipt.controller");
const auth = require("../../middlewares/auth.middleware");

const router = express.Router();

// ================= RECEIPT =================

router.post("/receipt-list", auth(), controller.getReceiptList);
router.post("/receipt-details", auth(), controller.getReceiptDetails);
router.post("/receipt-save", auth(), controller.receiptInsertUpdate);

// ================= MASTER DATA =================

router.post("/zones", auth(),controller.getZones);
router.post("/corporation", auth(), controller.getCorporation);
router.post("/departments",auth(), controller.getDepartments);

router.get("/budget-heads", auth(), controller.getBudgetHeads);
router.get("/narration", auth(), controller.getNarration);
router.get("/trans-type", auth(), controller.getTransType);
router.get("/dept-master", auth(), controller.getDeptMaster);

// ================= LOOKUPS =================

router.post("/grampanch",auth(), controller.getGrampanch);
router.post("/party", auth(), controller.getParty);
router.post("/account-name", auth(), controller.getAccountName);

module.exports = router;