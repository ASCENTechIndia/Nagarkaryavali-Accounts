const asyncHandler = require("../../../libs/asyncHandler");
const { ok } = require("../../../libs/response");
const service = require("./FrmVoucherPreparreprint.service");
const path = require("path");

// ================= LIST =================
exports.getVoucherList = asyncHandler(async (req, res) => {
  const { fromDate, toDate, partyId } = req.body;
  const corp_id = req.user?.corp_id || req.body.corp_id;

  const data = await service.getVoucherListService({
    fromDate,
    toDate,
    corp_id,
    partyId,
  });

  return ok(res, data, "Voucher list fetched");
});

// ================= DETAILS =================
exports.getVoucherDetails = asyncHandler(async (req, res) => {
  const { refNo } = req.body;
  const corp_id = req.user?.corp_id || req.body.corp_id;

  const data = await service.getVoucherDetailsService({
    refNo,
    corp_id,
  });

  return ok(res, data, "Voucher details fetched");
});


exports.getVoucherPDF = asyncHandler(async (req, res) => {
  const { refNo, corp_id } = req.body;

  const pdf = await service.getVoucherDetailsService({
    refNo,
    corp_id,
  });

  const baseUrl = `${req.protocol}://${req.get("host")}`;

  return res.json({
    success: true,
    fileName: pdf.fileName,
    pdfUrl: `${baseUrl}/pdf/${path.basename(pdf.filePath)}`,
  });
});