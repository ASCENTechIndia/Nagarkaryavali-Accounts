const express = require("express");
const router = express.Router();

const auth = require("../../../middlewares/auth.middleware");
const controller = require("./ChequeDeposit.controller");


router.post( "/chequedepositsummary",auth(), controller.getBankDepositSummary);


router.post( "/chequedepositdetails",auth(),controller.getBankDepositDetails);

router.post("/chequedetails",auth(),controller.getChequeDepositDetails);

router.get("/zonelist/:zoneId",auth(),controller.getZoneList);


router.get("/collectioncenter/:prabhagId",auth(),controller.getCollectionCenterList);

router.post("/savecashierreceipt",auth(),controller.saveCashierReceipt);
router.post("/generatechequedepositpdf",auth(),controller.generateChequeDepositPDF);

module.exports = router;