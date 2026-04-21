const express = require("express");
const controller = require("./FrmTransfer.controller");
const auth = require("../../../middlewares/auth.middleware");
const router = express.Router();

router.get("/transaction-types",  auth(), controller.getTransactionTypes);
router.get("/departments",  auth(), controller.getDepartments);
router.get("/gl-codes",  auth(), controller.getGLCodes);
router.get("/budget-heads",  auth(), controller.getBudgetHeads);

router.post("/party-list",  auth(), controller.getPartyList);
router.post("/contra-details",  auth(), controller.getContraDetails);
router.post("/transfer-list",  auth(), controller.getTransferList);
router.post("/transfer-save",  auth(), controller.transferInsertUpdate);
router.post("/credit-leasure",  auth(), controller.creditLeasure);

module.exports = router;