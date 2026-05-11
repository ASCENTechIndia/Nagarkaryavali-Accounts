const asyncHandler = require("../../../libs/asyncHandler");
const { ok } = require("../../../libs/response");
const service = require("./FrmCashDeposit.service");
const { getCorporationService } = require("../../MenuAccess/MenuAccess.service");
const path = require("path");
const { FrmCashDepositPDFHelper } = require("../../../utils/pdfHelper/FrmCashDeposit");

exports.getCashDepositTransactions = asyncHandler(async (req, res) => {
  const filters = req.body;

  const data = await service.getCashDepositTransactionsService(filters);

  return ok(res, data, data.message);
});

exports.getCashDenominations = asyncHandler(async (req, res) => {
  const data = await service.getCashDenominationsService();

  return ok(res, data, data.message);
});

exports.getTapshilReceipts = asyncHandler(async (req, res) => {
  const filters = req.body;

  const data = await service.getTapshilReceiptsService(filters);

  return ok(res, data, data.message);
});

exports.getLekhashirshDetails = asyncHandler(async (req, res) => {
  const filters = req.body;

  const data = await service.getLekhashirshDetailsService(filters);

  return ok(res, data, data.message);
});

exports.getCashDepositByRefNo = asyncHandler(async (req, res) => {
  const { refNo, ulbId, hasDenomination = true } = req.body;

  const data = await service.getCashDepositByRefNoService(
    refNo,
    ulbId,
    hasDenomination
  );

  return ok(res, data, data.message);
});

exports.saveBankDeposit = asyncHandler(async (req, res) => {
  const depositData = req.body;

  const data = await service.saveBankDepositService(depositData);

  return ok(res, data, data.message);
});

exports.saveCashDenomination = asyncHandler(async (req, res) => {
  const denomData = req.body;

  const data = await service.saveCashDenominationService(denomData);

  return ok(res, data, data.message);
});

exports.generateCashDepositPDF = asyncHandler(
  async (req, res) => {
    try {
      const { refNo, ulbId, hasDenomination = true } = req.body;

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

      const result = await service.getCashDepositByRefNoService(refNo, ulbId, hasDenomination);

      const rows = result.list || [];

      if (!rows.length) {
        return res.status(404).json({
          success: false,
          message: "No cash deposit details found",
        });
      }

      const ulbInfo = await getCorporationService({ulbId,});

      const pdf = await FrmCashDepositPDFHelper({rows, ulbInfo,});

      const baseUrl = `${req.protocol}://${req.get("host")}`;

      const pdfUrl = `${baseUrl}/pdf/${path.basename(pdf.filePath)}`;

      return res.json({
        success: true,
        message:
          "Cash Deposit PDF Generated Successfully",

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