const asyncHandler = require("../../../libs/asyncHandler");
const { ok } = require("../../../libs/response");
const service = require("./ChequeDeposit.service");

const { getCorporationService } = require("../../MenuAccess/MenuAccess.service");

const {
  FrmChequeDepositPDFHelper,
} = require("../../../utils/pdfHelper/FrmChequeDepositPDFHelper");
const path = require("path");
exports.getBankDepositSummary = asyncHandler(async (req, res) => {
  const result = await service.getBankDepositSummary(req.body);

  return ok(res, result);
});


exports.getBankDepositDetails = asyncHandler(async (req, res) => {
  const result = await service.getBankDepositDetails(req.body);

  return ok(res, result);
});


exports.getChequeDepositDetails = asyncHandler(async (req, res) => {
  const result = await service.getChequeDepositDetails(req.body);

  return ok(res, result);
});


exports.getZoneList = asyncHandler(async (req, res) => {
  const result = await service.getZoneList(req.params.zoneId);

  return ok(res, result);
});


exports.getCollectionCenterList = asyncHandler(async (req, res) => {
  const result = await service.getCollectionCenterList(
    req.params.prabhagId
  );

  return ok(res, result);
});

exports.saveCashierReceipt = asyncHandler(async (req, res) => {
  const result = await service.saveCashierReceipt(req.body);

  return ok(res, result);
});


exports.generateChequeDepositPDF = asyncHandler(
  async (req, res) => {
    try {

      const { refNo, ulbId, transactionNo } = req.body;

      if (!refNo) {
        return res.status(400).json({
          success: false,
          message: "Reference number is required",
        });
      }

      if (!ulbId) {
        return res.status(400).json({
          success: false,
          message: "ULB ID is required",
        });
      }

      const result =
        await service.getChequeDepositDetails(req.body);

      const rows = result.rows || [];

      if (!rows.length) {
        return res.status(404).json({
          success: false,
          message: "No cheque deposit details found",
        });
      }

      const ulbInfo =
        await getCorporationService({
          ulbId,
        });
        console.log("rows",rows)
      const pdf =
        await FrmChequeDepositPDFHelper({
          rows,
          ulbInfo,
          transactionNo
        });

      const baseUrl =
        `${req.protocol}://${req.get("host")}`;

      const pdfUrl =
        `${baseUrl}/pdf/${path.basename(pdf.filePath)}`;

      return res.json({
        success: true,
        message:
          "Cheque Deposit PDF Generated Successfully",

        fileName: pdf.fileName,

        pdfUrl,
      });

    } catch (error) {

      console.error(error);

      return res.status(500).json({
        success: false,
        message: "PDF generation failed",
        error: error.message,
      });
    }
  }
);