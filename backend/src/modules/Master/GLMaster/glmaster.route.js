const express = require("express");
const router = express.Router();

const controller = require("./glmaster.controller");

router.post("/glmaster", controller.glMaster);
router.get("/glmaster/list", controller.getGLMasterList);
router.get("/glmaster/:id", controller.getGLMasterById);

module.exports = router;