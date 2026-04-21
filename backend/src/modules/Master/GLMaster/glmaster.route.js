const express = require("express");
const router = express.Router();
const auth = require("../../../middlewares/auth.middleware");
const controller = require("./glmaster.controller");

router.post("/glmaster", auth(), controller.glMaster);
router.get("/glmaster/list", auth(), controller.getGLMasterList);
router.get("/glmaster/:id", auth(), controller.getGLMasterById);

module.exports = router;