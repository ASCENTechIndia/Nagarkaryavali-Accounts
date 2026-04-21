const express = require("express");
const router = express.Router();
const auth = require("../../../middlewares/auth.middleware");

const controller = require("./FrmNidhiConfig.controller");

// ✅ Routes
router.post("/nidhi-config-list", auth(), controller.getNidhiListConfig);

router.post("/nidhi-master-config", auth(),  controller.getNidhiMstConfig);

router.post("/nidhi-config-insert", auth(),  controller.insertNidhiConfig);

module.exports = router;