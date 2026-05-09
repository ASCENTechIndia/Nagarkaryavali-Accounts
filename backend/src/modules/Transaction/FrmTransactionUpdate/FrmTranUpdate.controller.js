const asyncHandler = require("../../../libs/asyncHandler");
const { ok } = require("../../../libs/response");
const { AppError } = require("../../../libs/errors");
const service = require("./FrmTranUpdate.service");
const path = require("path")

const {
  RevokeReportGeneration,
} = require("../../../utils/pdfHelper/RevokeReportGeneration");

const { getCorporationService } = require("../../MenuAccess/MenuAccess.service");


exports.getVchGenTransView = asyncHandler(async (req, res) => {
  const result = await service.getVchGenTransView(req.query);

  return ok(res, result, "Data fetched successfully");
});


exports.getTransView = asyncHandler(async (req, res) => {
  const result = await service.getTransView(req.query);

  return ok(res, result, "Data fetched successfully");
});


exports.deleteTransaction = asyncHandler(async (req, res) => {
  const result = await service.deleteTransaction(req.body);

  return ok(res, result, result.errorMsg);
});

exports.getRevokeList = asyncHandler(async (req, res) => {
  const result = await service.getRevokeList(req.query);

  return ok(res, result, "Data fetched successfully");
});

exports.getRevokeListPDF = asyncHandler(async (req, res) => {
  const filters = req.body;

  // DATA
  const result = await service.getRevokeList(filters);

  // IMPORTANT
  const rows = result.rows || [];

  // CORPORATION INFO
  const corpInfo = await getCorporationService({
    ulbId: filters.ulbid,
  });

  if (!rows.length) {
    return res.status(404).json({
      success: false,
      message: "No data found",
    });
  }

  // PDF
  const pdf = await RevokeReportGeneration({
   reportData: rows,

    filters,

    corporationName:
      corpInfo?.ABC_MUNICIPAL_TEXT || "",

    corporationLogo:
      corpInfo?.ULBLOGO || "",
  });

  const baseUrl =
    `${req.protocol}://${req.get("host")}`;

  const pdfUrl =
    `${baseUrl}/pdf/${path.basename(pdf.filePath)}`;

  res.json({
    success: true,
    message: "PDF Generated Successfully",
    fileName: pdf.fileName,
    pdfUrl,
  });
});