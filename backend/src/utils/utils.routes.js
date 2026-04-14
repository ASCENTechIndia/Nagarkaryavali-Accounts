const express = require("express");
const controller = require("./utils.controller");
const auth = require("../middlewares/auth.middleware");
const validate = require("../middlewares/validate.middleware");
const { usageTypeInsertSchema } = require("./utils.validation");

const router = express.Router();

// router.post("/", auth(), validate(usageTypeInsertSchema), controller.insertUsageType);
router.get("/userTypeList", auth(), controller.getUserTypeList);
router.get("/collCenterList", auth(), controller.getCollCenterList);

router.get("/prabhag", auth(), controller.getPrabhagList);
router.get("/prabhag/:prabhagId", auth(), controller.getPrabhagById);
router.get("/receipt-modes", auth(), controller.getReceiptModeList);
router.get("/bank-receipts", auth(), controller.getBankReceiptList);
router.get("/receipt-types", auth(), controller.getReceiptTypes);
router.get("/zones/:prabhagId", auth(), controller.getZonesByPrabhag);
router.get("/wards/:zoneId", auth(), controller.getWardsByZone);
router.get("/wards/:prabhagId", auth(), controller.getWardsByPrabhag);
router.get("/years",auth(), controller.getYears);
router.get("/users",auth(), controller.getAllUsers);

router.get("/prabhag-config/:userId", auth(), controller.getPrabhagByUser);

router.get("/zones-config", auth(), controller.getZonesByPrabhagAndUser);

router.get("/wards-config/:zoneId/:userId", auth(), controller.getWardsByZoneAndUser);

router.get("/subwards", auth(), controller.getSubwardList);


module.exports = router;
