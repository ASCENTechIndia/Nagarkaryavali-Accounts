const asyncHandler = require("../../../libs/asyncHandler");
const service = require("./FrmBudgetReport.service");
const path = require("path");
const { AppError } = require("../../../libs/errors");

const { generateBudgetPDF } = require("../../../utils/pdfHelper/FrmBudgetReportPDF");

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
