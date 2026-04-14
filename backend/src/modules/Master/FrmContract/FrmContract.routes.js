const express = require("express");
const router = express.Router();
const auth = require("../../../middlewares/auth.middleware");

const controller = require("./FrmContract.controller");

router.get("/zones", auth(), controller.getZones);
router.get("/contract/list", auth(), controller.getContractList);
router.get("/contract/:id", auth(), controller.getContractById);
router.get("/contract-details/:contractId", auth(), controller.getContractDetails);

router.get("/search-gl", auth(), controller.searchGL);
router.get("/search-contractor", auth(), controller.searchContractor);

router.post("/contract-master", auth(), controller.contractMaster);

module.exports = router;