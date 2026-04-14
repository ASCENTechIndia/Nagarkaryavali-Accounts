const express = require("express");
const controller = require("./admin.controller");
const auth = require("../../middlewares/auth.middleware");

const router = express.Router();

/**
 * ADMIN-ONLY dynamic query runner
 */
router.post("/query", auth(["ADMIN"]), controller.runQuery);
router.post(
  "/procedure",
  auth(["ADMIN"]),
  controller.executeProcedure
);
module.exports = router;
