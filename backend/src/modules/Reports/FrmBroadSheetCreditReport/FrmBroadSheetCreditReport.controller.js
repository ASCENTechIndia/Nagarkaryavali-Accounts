const asyncHandler = require("../../../libs/asyncHandler");
const service = require("./FrmBroadSheetCreditReport.service");
const path = require("path");
const { AppError } = require("../../../libs/errors");

const {
  generateBroadSheetCreditPDF,
} = require("../../../utils/pdfHelper/FrmBroadSheetCreditReportPDF");

exports.getBroadSheetCreditPDF = asyncHandler(async (req, res) => {
  const { ulbId, yearId } = req.body;

  if (!ulbId || !yearId) {
    throw new AppError("ulbId and yearId are required", 400);
  }

  const data = await service.getBroadSheetCreditReportService({
    ulbId,
    yearId,
  });

  const pdf = await generateBroadSheetCreditPDF({ data, yearId });

  const baseUrl = `${req.protocol}://${req.get("host")}`;

  return res.json({
    success: true,
    fileName: pdf.fileName,
    pdfUrl: `${baseUrl}/pdf/${path.basename(pdf.filePath)}`,
  });
});