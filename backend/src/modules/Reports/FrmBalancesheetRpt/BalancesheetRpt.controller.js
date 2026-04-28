const asyncHandler = require("../../../libs/asyncHandler");
const service = require("./BalancesheetRpt.service");
const path = require("path");
const { AppError } = require("../../../libs/errors");

exports.getBalanceSheetPDF = asyncHandler(async (req, res) => {
  const { fromDate, type } = req.body;

  const corp_id = req.user?.corp_id ?? req.body?.corp_id;

  if (!corp_id) {
    throw new AppError("corp_id is required", 400);
  }

  const pdf = await service.getBalanceSheetPDF({
    fromDate,
    corp_id,
    type, 
  });

  const baseUrl = `${req.protocol}://${req.get("host")}`;

  return res.json({
    success: true,
    fileName: pdf.fileName,
    pdfUrl: `${baseUrl}/pdf/${path.basename(pdf.filePath)}`,
  });
});
