const { AppError } = require("../../../libs/errors");
const asyncHandler = require("../../../libs/asyncHandler");
const { ok } = require("../../../libs/response");
const service = require("./rptCashBankBalance.service");
const path = require("path");
const { CashbookPDFHelper } = require("../../../utils/pdfHelper/CashbookPDFHelper");

exports.getGrampanchayatList = asyncHandler(async (req, res) => {
  const { deptId } = req.body;

  if (!deptId) {
    throw new AppError("deptId is required", 400);
  }

  const data = await service.getGrampanchayatListService({ deptId });

  return ok(res, data, "Grampanchayat List fetched successfully");
});

exports.getCashBankBalanceReport = asyncHandler(async (req, res) => {
  console.log("📥 Request Body:", req.body);

  const { asOnDate, zoneId, ulbId } = req.body;

  if (!asOnDate) throw new AppError("asOnDate is required", 400);
  if (!zoneId) throw new AppError("zoneId is required", 400);
  if (!ulbId) throw new AppError("ulbId is required", 400);

  const payload = { asOnDate, zoneId, ulbId };

  const data = await service.getCashBankBalanceReportService(payload);

  return ok(res, data, "Cash Bank Balance Report fetched successfully");
});

exports.getDailyTransactionDetailedReport = asyncHandler(async (req, res) => {
  const filters = req.body;

  const data = await service.getDailyTransactionDetailedReportService(filters);

  return ok(res, data, "Daily transaction detailed report fetched");
});

exports.generateCashbookPDF = asyncHandler(async (req, res) => {
  const filters = req.body;

  const result = await service.getDailyTransactionDetailedReportService(filters);

  if (!result.list.length) {
    return res.status(404).json({
      success: false,
      message: "No records found"
    });
  }

  const pdf = await CashbookPDFHelper({
    reportData: result.list,
    filters
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