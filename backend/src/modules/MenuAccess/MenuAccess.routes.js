// const express = require("express");
// const controller = require("./MenuAccess.controller");
// const auth = require("../../middlewares/auth.middleware");
// const validate = require("../../middlewares/validate.middleware");
// const { usageTypeInsertSchema } = require("./MenuAccess.validation");

// const router = express.Router();



// router.get("/getMenuAccess/:id", auth(), controller.getMenuAccess);

// module.exports = router;


const express = require("express");
const router = express.Router();
const auth = require("../../middlewares/auth.middleware");
const controller = require("./MenuAccess.controller");

router.post("/AccountMenus", auth(), controller.getMenus);

router.post("/CorporationInfo", auth(), controller.getCorporation);

module.exports = router;