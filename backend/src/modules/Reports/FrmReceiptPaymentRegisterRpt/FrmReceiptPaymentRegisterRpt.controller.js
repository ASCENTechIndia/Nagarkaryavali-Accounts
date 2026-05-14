const asyncHandler = require("../../../libs/asyncHandler");

const service = require("./FrmReceiptPaymentRegisterRpt.service");

const { ok } = require("../../../libs/response");

const { AppError } = require("../../../libs/errors");

const path = require("path");

const { generateReceiptPaymentRegisterPDF } = require("../../../utils/pdfHelper/ReceiptPaymentRegisterPDF");

const { getCorporationService } = require("../../MenuAccess/MenuAccess.service");

exports.generateReceiptPaymentRegister = asyncHandler(async (req, res) => {
  console.log("📥 Request Body:", req.body);

  const { fromDate, toDate, ulbId } = req.body;

  // VALIDATION

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

  // SERVICE DATA

  const reportData = await service.getReceiptPaymentRegisterService(payload);

  // NO DATA

  if (!reportData.rows.length) {
    throw new AppError("No records found", 404);
  }

  // CORPORATION INFO

  const corpInfo = await getCorporationService({
    ulbId,
  });

  // PDF GENERATE

  const pdf = await generateReceiptPaymentRegisterPDF({
    reportData,

    corporationName: corpInfo.ABC_MUNICIPAL_TEXT || "",

    corporationLogo: corpInfo.ULBLOGO || "",
  });

  const baseUrl = `${req.protocol}://${req.get("host")}`;

  return res.status(200).json({
    success: true,

    message: "Receipt Payment Register PDF Generated Successfully",

    fileName: pdf.fileName,

    pdfUrl: `${baseUrl}/pdf/${path.basename(pdf.filePath)}`
  });
});
