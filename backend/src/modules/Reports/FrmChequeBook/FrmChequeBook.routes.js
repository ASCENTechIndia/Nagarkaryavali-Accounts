const express = require("express");
const router = express.Router();
const auth = require("../../../middlewares/auth.middleware");

const controller = require("./FrmChequeBook.controller");

router.post("/cheque-book-pdf", auth(), controller.getChequeBookPDF);

module.exports = router;
