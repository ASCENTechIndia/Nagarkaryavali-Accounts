const express = require("express");
const controller = require("./tasks.controller");
const validate = require("../../middlewares/validate.middleware");
const { createTaskSchema } = require("./tasks.validation");

const router = express.Router();

router.get("/", controller.getAll);
router.post("/", validate(createTaskSchema), controller.create);
router.put("/:id/toggle", controller.toggle);
router.delete("/:id", controller.remove);

module.exports = router;
