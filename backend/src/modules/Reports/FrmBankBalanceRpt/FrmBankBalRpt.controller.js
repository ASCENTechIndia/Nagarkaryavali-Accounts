const asyncHandler = require("../../../libs/asyncHandler");
const { ok } = require("../../../libs/response");
const service = require("./FrmBankBalRpt.service");
const path = require("path");



const {
  getCorporationService,
} = require("../../MenuAccess/MenuAccess.service");

const {
  BankBalancePDFHelper,
} = require("../../../utils/pdfHelper/BankBalancePDFHelper");




exports.getAccountBalance = asyncHandler(async (req, res) => {

  const data = await service.getAccountBalanceService(req.body);

  return ok(res, data, "Account balance fetched");
});


// 2
exports.getMonthlySummary = asyncHandler(async (req, res) => {

  const data = await service.getMonthlySummaryService(req.body);

  return ok(res, data, "Monthly summary fetched");
});


// 3
exports.getDailySummary = asyncHandler(async (req, res) => {

  const data = await service.getDailySummaryService(req.body);

  return ok(res, data, "Daily summary fetched");
});


// 4
exports.getTransactionDetails = asyncHandler(async (req, res) => {

  const data = await service.getTransactionDetailsService(req.body);

  return ok(res, data, "Transaction details fetched");
});


// 5
exports.getSingleAccountBalance = asyncHandler(async (req, res) => {

  const data = await service.getSingleAccountBalanceService(req.body);

  return ok(res, data, "Single account balance fetched");
});

exports.generateAccountBalancePDF =
  asyncHandler(async (req, res) => {

    try {

      const { ulbId, toDate } = req.body;

      if (!ulbId) {
        return res.status(400).json({
          success: false,
          message: "ULB ID is required",
        });
      }

      if (!toDate) {
        return res.status(400).json({
          success: false,
          message: "To Date is required",
        });
      }

      const result =
        await service.getAccountBalanceService(
          req.body
        );

      const rows = result.list || [];

      if (!rows.length) {
        return res.status(404).json({
          success: false,
          message: "No account balance found",
        });
      }

      const ulbInfo =
        await getCorporationService({
          ulbId,
        });

      const pdf =
        await BankBalancePDFHelper({
          rows,
          ulbInfo,
          toDate,
        });

      const baseUrl =
        `${req.protocol}://${req.get("host")}`;

      const pdfUrl =
        `${baseUrl}/pdf/${path.basename(
          pdf.filePath
        )}`;

      return res.json({
        success: true,
        message:
          "Account Balance PDF Generated Successfully",

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
  });