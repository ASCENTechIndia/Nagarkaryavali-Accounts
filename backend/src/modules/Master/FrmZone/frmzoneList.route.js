const express = require("express");
const router = express.Router();
const auth = require("../../../middlewares/auth.middleware");
const controller = require("./frmzoneList.controller");

router.post("/corporation", auth(), controller.getCorporation);
router.post("/save-zone", auth(), controller.saveZone);
module.exports = router;