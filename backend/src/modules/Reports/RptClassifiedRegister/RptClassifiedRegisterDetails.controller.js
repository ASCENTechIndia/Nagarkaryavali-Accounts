const asyncHandler = require("../../../libs/asyncHandler");
const { ok } = require("../../../libs/response");
const service = require("./RptClassifiedRegisterDetails.service");
const { MonthlySummaryPDFHelper } = require("../../../utils/pdfHelper/MonthlySummaryPDFHelper");
const path = require("path");
const { getCorporationService } = require("../../MenuAccess/MenuAccess.service");


// Nidhi Config
exports.getNidhiConfig = asyncHandler(async (req, res) => {
  const { budgetId, ulbId } = req.query;

  const data = await service.getNidhiConfigService(budgetId, ulbId);

  return ok(res, data, "Nidhi config fetched");
});

// Monthly Summary Report
exports.getMonthlySummaryReport = asyncHandler(async (req, res) => {
  const filters = req.body;

  const data = await service.getMonthlySummaryReportService(filters);

  return ok(res, data, "Monthly summary report fetched");
});





exports.getMonthlySummaryPDF = asyncHandler(async (req, res) => {

  const filters = req.body;

  let result;

  // 🔥 Dynamic Service Call
  if (filters.rptType === "EXP") {

    result = await service.getMonthlyExpenditureBudgetReportService(filters);

  } else {

    result = await service.getMonthlyBudgetReport(filters);

  }

  // 🔥 Corporation Info
  const ulbInfo = await getCorporationService({
    ulbId: filters.ulbId
  });

  if (!result.list || result.list.length === 0) {

    return res.status(404).json({
      success: false,
      message: "No records found"
    });
  }

  // 🔥 PDF Generation
  const pdf = await MonthlySummaryPDFHelper({
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

});



exports.getMonthlyBudget = asyncHandler(async (req, res) => {

  const data = await service.getMonthlyBudgetReport(req.body);

  return ok(res, data, "Monthly budget report fetched");
});

exports.getMonthlyExpenditureBudgetReport = asyncHandler(async (req, res) => {

  const data = await service.getMonthlyExpenditureBudgetReportService(req.body);

  return ok(res, data, "Monthly expenditure budget report fetched");
});