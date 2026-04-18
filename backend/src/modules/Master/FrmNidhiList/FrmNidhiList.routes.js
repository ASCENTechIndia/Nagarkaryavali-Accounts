const express = require("express");
const router = express.Router();
const auth = require("../../../middlewares/auth.middleware");

const controller = require("./FrmNidhiList.controller");

router.get("/nidhi/list", auth(), controller.getNidhiList);
router.get("/nidhi/:id", auth(), controller.getNidhiById);
router.post("/nidhi-master", auth(), controller.nidhiMaster);

module.exports = router;