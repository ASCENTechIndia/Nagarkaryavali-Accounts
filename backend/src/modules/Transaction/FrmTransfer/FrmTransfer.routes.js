const express = require("express");
const controller = require("./FrmTransfer.controller");

const router = express.Router();

router.get("/transaction-types", controller.getTransactionTypes);
router.get("/departments", controller.getDepartments);
router.get("/gl-codes", controller.getGLCodes);
router.get("/budget-heads", controller.getBudgetHeads);

router.post("/party-list", controller.getPartyList);
router.post("/contra-details", controller.getContraDetails);
router.post("/transfer-list", controller.getTransferList);
router.post("/transfer-save", controller.transferInsertUpdate);
router.post("/credit-leasure", controller.creditLeasure);

module.exports = router;