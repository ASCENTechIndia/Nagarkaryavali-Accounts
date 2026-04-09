const express = require("express");
const router = express.Router();
const auth = require("../../../middlewares/auth.middleware");

const controller = require("./FrmParty.controller");

router.get("/corporation/list", auth(), controller.getCorporationList);

router.get("/party/search", controller.searchParty);
router.get("/party/:id", auth(), controller.getPartyById);

router.get("/bank/:id", auth(), controller.getPartyBankDetails);

router.get("/pincode", auth(), controller.getPincodeList);
router.get("/ifsc", auth(), controller.getIFSCList);

router.get("/state", auth(), controller.getStateList);
router.get("/district/:stateId", auth(), controller.getDistrictByState);
router.get("/city/:districtId", auth(), controller.getCityByDistrict);

router.get("/bank", auth(), controller.getBankList);
router.get("/branch/:bankId", auth(), controller.getBranchByBank);
router.get("/ifsc/:branchId", auth(), controller.getIFSCByBranch);

router.post("/party-master", controller.partyMaster);

module.exports = router;