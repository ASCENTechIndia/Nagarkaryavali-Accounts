const express = require("express");
const router = express.Router();
const auth = require("../../../middlewares/auth.middleware");
const controller = require("./FrmTranUpdate.controller");

router.get("/getvchgentransview",auth(),controller.getVchGenTransView);


router.get("/gettransview",auth(),controller.getTransView);


router.post("/deletetransaction",auth(),controller.deleteTransaction);

router.get("/getrevokelist",auth(),controller.getRevokeList);

router.post(
  "/getrevokelistpdf",
  auth(),
  controller.getRevokeListPDF
);

module.exports = router;