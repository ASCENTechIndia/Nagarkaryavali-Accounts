const asyncHandler = require("../../../libs/asyncHandler");
const { ok } = require("../../../libs/response");
const service = require("./TransferRegisterRpt.service");
const { TransferRegisterRpt } = require("../../../utils/pdfHelper/TransferRegisterRpt");
const { getCorporationService } = require("../../MenuAccess/MenuAccess.service");
const path = require("path");
// 🔹 DETAILS API
exports.getCashbookDetails = asyncHandler(async (req, res) => {
  const data = await service.getCashbookDetailsService(req.body);
  return ok(res, data, "Cashbook details fetched");
});


// 🔹 SUMMARY API
exports.getCashbookSummary = asyncHandler(async (req, res) => {
  const data = await service.getCashbookSummaryService(req.body);
  return ok(res, data, "Cashbook summary fetched");
});


exports.getCashbookPDF = asyncHandler(async (req, res) => {
  const filters = req.body;
  const { ulbId, fromDate, toDate } = filters;

  // 🔹 Fetch Data
  const details = await service.getCashbookDetailsService(filters);
  const summaryRes = await service.getCashbookSummaryService(filters);

  if (!details.list.length) {
    return res.status(404).json({
      success: false,
      message: "No records found"
    });
  }

  const summary = summaryRes.summary;

  // 🔥 Corporation Info (LOGO + NAME)
  const corpInfo = await getCorporationService({ ulbId });

  // 🔹 Generate PDF
  const pdf = await TransferRegisterRpt({
    reportData: details.list,
    summary,
    filters,
    corporationName: corpInfo?.ABC_MUNICIPAL_TEXT || "अहिल्यानगर महानगरपालिका",
    logo: corpInfo?.ULBLOGO || ""
  });

  const baseUrl = `${req.protocol}://${req.get("host")}`;

  return res.json({
    success: true,
    message: "PDF Generated Successfully",
    fileName: pdf.fileName,
    pdfUrl: `${baseUrl}/pdf/${path.basename(pdf.filePath)}`,
    totalRecords: details.list.length
  });
});