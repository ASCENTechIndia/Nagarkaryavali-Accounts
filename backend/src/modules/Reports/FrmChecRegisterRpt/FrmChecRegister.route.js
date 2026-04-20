const express = require("express");
const router = express.Router();
const auth = require("../../../middlewares/auth.middleware");

const controller = require("./FrmChecRegister.controller");


router.post("/chequeregisterreport", auth(), controller.getChequeRegisterReport);

router.get("/searchaccounts", auth(), controller.searchAccounts);

router.get("/searchglheads", auth(), controller.searchGLHeads);

router.post("/chequeregreportpdf", auth(), controller.generateChequeRegisterPDF);


module.exports = router;