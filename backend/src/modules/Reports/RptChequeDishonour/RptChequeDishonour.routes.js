const express = require("express");
const router = express.Router();
const auth = require("../../../middlewares/auth.middleware");
const controller = require("./RptChequeDishonour.controller");

router.post("/zones-by-department", auth(), controller.getZonesByDepartment);
router.post("/collection-centers", auth(), controller.getCollectionCentersByZone);
router.post("/cheque-return-list", auth(), controller.getChequeReturnList);
router.post("/pdf", auth(), controller.getChequeDishonourPDF);

module.exports = router;