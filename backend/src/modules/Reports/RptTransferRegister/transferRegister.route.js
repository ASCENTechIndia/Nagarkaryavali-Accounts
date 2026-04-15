const express = require("express");
const router = express.Router();
const auth = require("../../../middlewares/auth.middleware");
const controller = require("./transferRegister.controller");

router.get("/transfer-type", auth(), controller.getTransTypeService);
router.post("/transfer-register", auth(), controller.getTransactionRegisterReport);

module.exports = router;