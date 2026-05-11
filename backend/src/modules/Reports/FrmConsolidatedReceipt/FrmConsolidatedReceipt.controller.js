const asyncHandler = require("../../../libs/asyncHandler");
const service = require("./FrmConsolidatedReceipt.service");
const path = require("path");
const { ok } = require("../../../libs/response");


const { AppError } = require("../../../libs/errors");

const { generateConsolidatedReceiptPDF } = require("../../../utils/pdfHelper/FrmConsolidatedReceiptPDF");

exports.getConsolidatedReceiptPDF = asyncHandler(async (req, res) => {
  const { fromDate, toDate, paymentTypeId, zoneId, deptId, collectionCenterId, reportType } = req.body;

  const ulbId = req.user?.corp_id ?? req.body?.ulbId;

  if (!fromDate) {
    throw new AppError("fromDate is required", 400);
  }

  if (!toDate) {
    throw new AppError("toDate is required", 400);
  }

  if (!ulbId) {
    throw new AppError("ulbId is required", 400);
  }

  const data = await service.getConsolidatedReceiptService({
    fromDate,
    toDate,
    ulbId,
    paymentTypeId,
    zoneId,
    deptId,
    collectionCenterId,
    reportType,
  });

  if (!data.data.length) {
    throw new AppError("No records found", 404);
  }

  const pdf = await generateConsolidatedReceiptPDF({
    data: data.data,
    fromDate,
    toDate,
    reportType,
  });

  const baseUrl = `${req.protocol}://${req.get("host")}`;

  return res.json({
    success: true,
    fileName: pdf.fileName,
    pdfUrl: `${baseUrl}/pdf/${path.basename(pdf.filePath)}`,
  });
});


exports.getPaymentTypes = asyncHandler(
  async (req, res) => {
    const data =
      await service.getPaymentTypesService();

    return ok(
      res,
      data,
      "Payment types fetched successfully"
    );
  }
);