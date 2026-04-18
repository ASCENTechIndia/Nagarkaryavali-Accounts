const express = require("express");
const router = express.Router();
const auth = require("../../../middlewares/auth.middleware");

const controller = require("./FrmNidhiConfig.controller");

// ✅ Routes
router.post("/nidhi-config-list", controller.getNidhiListConfig);

router.post("/nidhi-master-config",  controller.getNidhiMstConfig);

router.post("/nidhi-config-insert",  controller.insertNidhiConfig);

module.exports = router;