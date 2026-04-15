const asyncHandler = require("../../../libs/asyncHandler");
const { ok } = require("../../../libs/response");
const service = require("./RptClassifiedRegisterDetails.service");
const { MonthlySummaryPDFHelper } = require("../../../utils/pdfHelper/MonthlySummaryPDFHelper");


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

  const result = await service.getMonthlySummaryReportService(filters);

  const pdf = await MonthlySummaryPDFHelper({
    reportData: result.list,
    filters
  });

  return ok(res, pdf, "PDF generated");
});