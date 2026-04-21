const asyncHandler = require("../../../libs/asyncHandler");
const { ok } = require("../../../libs/response");
const service = require("./RptReceiptRegisterDetails.service");
const { RptReceiptRegisterDetailsPDFHelper } = require("../../../utils/pdfHelper/RptReceiptRegisterDetails");
const path = require("path");
const { getCorporationService } = require("../../MenuAccess/MenuAccess.service");


// 1. Transaction Report
exports.getTransactionReport = asyncHandler(async (req, res) => {
  const filters = req.body;

  const data = await service.getTransactionReportService(filters);

  return ok(res, data, "Transaction report fetched");
});

// 2. Nidhi Config
exports.getNidhiConfig = asyncHandler(async (req, res) => {
  const { budgetId, ulbId } = req.query;

  const data = await service.getNidhiConfigService(budgetId, ulbId);

  return ok(res, data, "Nidhi config fetched");
});

exports.generateTransactionPDF = asyncHandler(async (req, res) => {
  try {
    const filters = req.body;

    const result = await service.getTransactionReportService(filters);

    const ulbInfo = await getCorporationService(filters);

    if (!result.list.length) {
      return res.status(404).json({
        success: false,
        message: "No records found"
      });
    }

    const pdf = await RptReceiptRegisterDetailsPDFHelper({
      reportData: result.list,
      filters,
      ulbInfo
    });

    const baseUrl = `${req.protocol}://${req.get("host")}`;
    const pdfUrl = `${baseUrl}/pdf/${path.basename(pdf.filePath)}`;

    return res.json({
      success: true,
      message: "PDF Generated Successfully",
      fileName: pdf.fileName,
      pdfUrl
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "PDF generation failed",
      error: error.message
    });
  }
});

exports.getDailyTransactionReport = asyncHandler(async (req, res) => {
  const filters = req.body;

  const data = await service.getDailyTransactionReportService(filters);

  return ok(res, data, "Daily transaction report fetched");
});

exports.getOpeningBalance = asyncHandler(async (req, res) => {
  const filters = req.body;

  const data = await service.getOpeningBalanceService(filters);

  return ok(res, data, "Opening balance calculated");
});