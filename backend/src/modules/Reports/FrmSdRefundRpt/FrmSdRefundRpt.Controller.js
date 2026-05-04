const asyncHandler = require("../../../libs/asyncHandler");
const { ok } = require("../../../libs/response");
const service = require("../FrmSdRefundRpt/FrmSdRefundRpt.Service");
const { generateSDRefundPDF } = require("../../../utils/pdfHelper/FrmSdRefundRpt");
const { getCorporationService } = require("../../MenuAccess/MenuAccess.service");
const path = require("path");

exports.getPartySearch1 = asyncHandler(async (req, res) => {
  const data = await service.getPartySearch1Service(req.body);
  return ok(res, data, "Party search (query 1) fetched successfully");
});

exports.getPartySearch2 = asyncHandler(async (req, res) => {
  const data = await service.getPartySearch2Service(req.body);
  return ok(res, data, "Party search (query 2) fetched successfully");
});

exports.getSDReceivedPaid = asyncHandler(async (req, res) => {
  const data = await service.getSDReceivedPaidService(req.body);
  const message = data.rowCount > 0 
    ? "SD Received/Paid fetched successfully" 
    : "No data found";
  return ok(res, data, message);
});

exports.getSDReceivedPaidPDF = asyncHandler(async (req, res) => {
  const payload = req.body;

  const result = await service.getSDReceivedPaidService(payload);

  // ✅ FIX HERE
  const rows = result?.rows || [];

  if (!rows.length) {
    return res.status(404).json({
      success: false,
      message: "No records found",
    });
  }

  const corpInfo = await getCorporationService({
    ulbId: payload.ulbid, 
  });

  const pdf = await generateSDRefundPDF({
    data: rows, // ✅ pass rows only
    filters: payload,
    corporationName: corpInfo?.ABC_MUNICIPAL_TEXT || "",
    corporationLogo: corpInfo?.ULBLOGO || "",
  });

  const baseUrl = `${req.protocol}://${req.get("host")}`;

  return res.json({
    success: true,
    fileName: pdf.fileName,
    pdfUrl: `${baseUrl}/pdf/${path.basename(pdf.filePath)}`,
  });
});
