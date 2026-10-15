const asyncHandler = require("../../../libs/asyncHandler");
const service = require("./FrmBudgetReport.service");
const path = require("path");
const { AppError } = require("../../../libs/errors");

const { generateBudgetPDF } = require("../../../utils/pdfHelper/FrmBudgetReportPDF");
const {generateDcpsInterestPDF,} = require("../../../utils/pdfHelper/FrmDcpsInterestPDF");

exports.getBudgetReportPDF = asyncHandler(async (req, res) => {
  const { ulbId } = req.body;

  if (!ulbId) {
    throw new AppError("ulbId is required", 400);
  }

  const data = await service.getBudgetReportService({ ulbId });

  const pdf = await generateBudgetPDF({ data });

  const baseUrl = `${req.protocol}://${req.get("host")}`;

  return res.json({
    success: true,
    fileName: pdf.fileName,
    pdfUrl: `${baseUrl}/pdf/${path.basename(pdf.filePath)}`,
  });
});
exports.getDcpsReportData = asyncHandler(async (req, res) => {
  const { ulbId, dcpsNo, yearId } = req.body;

  if (!ulbId) {
    throw new AppError("ulbId is required", 400);
  }

  if (!dcpsNo) {
    throw new AppError("dcpsNo is required", 400);
  }

  if (!yearId) {
    throw new AppError("yearId is required", 400);
  }

  const data = await service.getDcpsReportService({
    ulbId,
    dcpsNo,
    yearId,
  });

  return res.json({
    success: true,
    count: data.length,
    data,
  });
});
exports.getDcpsInterestPDF = asyncHandler(async (req, res) => {
  const { ulbId, dcpsNo, yearId } = req.body;

  if (!ulbId || !dcpsNo || !yearId) {
    throw new AppError("ulbId, dcpsNo and yearId are required", 400);
  }

  const data = await service.getDcpsReportService({
    ulbId,
    dcpsNo,
    yearId,
  });

  const pdf = await generateDcpsInterestPDF({ data });
  const baseUrl = `${req.protocol}://${req.get("host")}`;

  return res.json({
    success: true,
    fileName: pdf.fileName,
    pdfUrl: `${baseUrl}/pdf/${path.basename(pdf.filePath)}`,
  });
});


