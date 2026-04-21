const asyncHandler = require("../../../libs/asyncHandler");
const { ok } = require("../../../libs/response");
const service = require("./RptClassifiedAbstract.service");
const { BudgetExpenditurePDFHelper } = require("../../../utils/pdfHelper/BudgetAbstractExpenditurePDFHelper");
const path = require("path");
const { getCorporationService } = require("../../MenuAccess/MenuAccess.service");

// Budget Expenditure Report
exports.getBudgetExpenditureReport = asyncHandler(async (req, res) => {
  const filters = req.body;

  const data = await service.getBudgetExpenditureReportService(filters);

  return ok(res, data, "Budget expenditure report fetched");
});

exports.getBudgetExpenditurePDF = asyncHandler(async (req, res) => {
  const filters = req.body;

  const result = await service.getBudgetExpenditureReportService(filters);

  const ulbInfo = await getCorporationService(filters);

  const pdf = await BudgetExpenditurePDFHelper({
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

exports.getTransactionLedgerReport = asyncHandler(async (req, res) => {
  const filters = req.body;

  const result = await service.getTransactionLedgerReportService(filters);

  if (!result.list || result.list.length === 0) {
    return res.json({
      success: false,
      message: "No records found",
      data: result
    });
  }

  return res.json({
    success: true,
    message: "Transaction ledger fetched successfully",
    data: result
  });
});