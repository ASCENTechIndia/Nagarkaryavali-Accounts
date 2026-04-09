const express = require("express");
const router = express.Router();
const auth = require("../../../middlewares/auth.middleware");
const controller = require("./frmzoneList.controller");

router.post("/corporation", auth(), controller.getCorporation);
router.post("/save-zone", auth(), controller.saveZone);
router.post("/ZoneById", auth(), controller.getZoneById);
module.exports = router;