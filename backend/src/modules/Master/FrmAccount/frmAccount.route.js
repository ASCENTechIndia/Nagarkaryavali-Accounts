const express = require("express");
const router = express.Router();
const auth = require("../../../middlewares/auth.middleware");
const controller = require("./frmAccount.controller");

router.post("/account-details", auth(), controller.getAccountDetails);
router.post("/search-account", auth(), controller.searchAccount); // optional functionCode
router.post("/searchGL", auth(), controller.searchGL);
router.get("/gl-master", auth(), controller.getGLMasterList);
router.get("/account-types", auth(), controller.getAccountTypes);
router.get("/account-subTypes", auth(), controller.getAccountSubTypes);
router.post("/report-heads", auth(), controller.getReportHeads);
router.get("/bank-master", auth(), controller.getBankMaster);
router.get("/nidhi-master", auth(), controller.getNidhiMaster);
router.post("/account-fullDetails", auth(), controller.getAccountFullDetails);
router.post("/account-zone-details", auth(), controller.getAccountZoneDetails);
router.post("/account-mapping-details", auth(), controller.getAccountMappingDetails);
router.post("/next-accountNo", auth(), controller.getNextAccountNo);
router.post("/zone-list", auth(), controller.getZoneList);
router.post("/save-account", auth(), controller.saveAccountMaster);
router.post("/filtered-acc-subType", auth(), controller.getFilteredAccSubType);
module.exports = router;