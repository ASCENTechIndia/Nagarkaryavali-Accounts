const asyncHandler = require("../../../libs/asyncHandler");

const { ok } = require("../../../libs/response");

const { AppError } = require("../../../libs/errors");

const service = require("./FrmVouchergenerationReprint.service");

const path = require("path");

const { getCorporationService } = require("../../MenuAccess/MenuAccess.service");

const { generateVoucherGenerationPrintPDF } = require("../../../utils/pdfHelper/VoucherGenerationPrintPDF");

exports.getVoucherGenerationReprint = asyncHandler(async (req, res) => {
  console.log("📥 Request Body:", req.body);

  const { fromDate, toDate, ulbId } = req.body;

  if (!fromDate) {
    throw new AppError("fromDate is required", 400);
  }

  if (!toDate) {
    throw new AppError("toDate is required", 400);
  }

  if (!ulbId) {
    throw new AppError("ulbId is required", 400);
  }

  const payload = {
    fromDate,
    toDate,
    ulbId,
  };

  const data = await service.getVoucherGenerationReprintService(payload);

  return ok(res, data, "Voucher Generation Reprint fetched successfully");
});

exports.getVoucherGenerationPrint = asyncHandler(async (req, res) => {
  console.log("📥 Request Body:", req.body);

  const { refNo, ulbId } = req.body;

  if (!refNo) {
    throw new AppError("refNo is required", 400);
  }

  if (!ulbId) {
    throw new AppError("ulbId is required", 400);
  }

  const payload = {
    refNo,
    ulbId,
  };

  const result = await service.getVoucherGenerationPrintService(payload);

  if (!result.data.mainData.length) {
    throw new AppError("No records found", 404);
  }

  const corpInfo = await getCorporationService({
    ulbId: payload.ulbId,
  });

  // PDF GENERATE
  const pdf = await generateVoucherGenerationPrintPDF({
    mainData: result.data.mainData,
    taxDetails: result.data.taxDetails,
    corporationName: corpInfo.ABC_MUNICIPAL_TEXT || "",
    corporationLogo: corpInfo.ULBLOGO || "",
  });

  const baseUrl = `${req.protocol}://${req.get("host")}`;

  return res.json({
    success: true,

    fileName: pdf.fileName,

    pdfUrl: `${baseUrl}/pdf/${path.basename(pdf.filePath)}`,

    data: result.data,
  });
});
