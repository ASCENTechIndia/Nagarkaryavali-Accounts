const asyncHandler = require("../../../libs/asyncHandler");
const service = require("./BalancesheetRpt.service");
const path = require("path");
const { AppError } = require("../../../libs/errors");

const { generateSummaryPDF } = require("../../../utils/pdfHelper/BalancesheetSummaryPDF");
const { generateDetailPDF } = require("../../../utils/pdfHelper/BalancesheetDetailPDF");

exports.getBalanceSheetPDF = asyncHandler(async (req, res) => {
  const { fromDate, type } = req.body;

  const corp_id = req.user?.corp_id ?? req.body?.corp_id;

  if (!corp_id) {
    throw new AppError("corp_id is required", 400);
  }

  // ✅ STEP 1: GET DATA
  const data = await service.getBalanceSheetPDF({
    fromDate,
    corp_id,
    type,
  });

  // ✅ STEP 2: GENERATE PDF
  const pdf = type === "0" ? await generateSummaryPDF({ data }) : await generateDetailPDF({ data });

  // ✅ STEP 3: RESPONSE
  const baseUrl = `${req.protocol}://${req.get("host")}`;

  return res.json({
    success: true,
    fileName: pdf.fileName,
    pdfUrl: `${baseUrl}/pdf/${path.basename(pdf.filePath)}`,
  });
});
