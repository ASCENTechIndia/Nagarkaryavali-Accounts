const service = require("./FrmVoucherGeneration.service");
const { getCorporationService } = require("../../MenuAccess/MenuAccess.service");
const { CounterVoucherGeneration } = require("../../../utils/pdfHelper/CounterVoucherGeneration");
const asyncHandler = require("../../../libs/asyncHandler");
const path = require("path");
const { ok } = require("../../../libs/response");


exports.getGLList = asyncHandler(async (req, res) => {
  res.json(await service.getGLListService());
});

exports.getPartyList = asyncHandler(async (req, res) => {
  res.json(await service.getPartyListService(req.body));
});

exports.getBalanceVoucher = asyncHandler(async (req, res) => {
  res.json(await service.getBalanceVoucherService(req.body));
});

exports.getVoucherPrep = asyncHandler(async (req, res) => {
  res.json(await service.getVoucherPrepService(req.body));
});

exports.getChequeBook = asyncHandler(async (req, res) => {
  res.json(await service.getChequeBookService(req.body));
});

exports.getVoucherDetails = asyncHandler(async (req, res) => {
  res.json(await service.getVoucherDetailsService(req.body));
});

exports.getVoucherTableDetails = asyncHandler(async (req, res) => {
  const result = await service.getVoucherTableDetailsService(req.body);

  res.json({
    success: true,
    message: "Voucher table details fetched successfully",
    data: result,
  });
});

// ✅ Voucher Generation Controller
exports.voucherGeneration = asyncHandler(async (req, res) => {
  const data = await service.voucherGenerationService(req.body);
  return ok(res, data, data.errorMsg);
});

exports.getVoucherTax = asyncHandler(async (req, res) => {
  res.json(await service.getVoucherTaxService(req.body));
});

exports.voucherGeneration = asyncHandler(async (req, res) => {
  const data = await service.voucherGenerationService(req.body);
  return res.json(data);
});


exports.getCounterVoucherPDF = asyncHandler(async (req, res) => {
  const filters = req.body;

  const result = await service.getCounterVoucherService(filters);
  const corpInfo = await getCorporationService(filters);

  console.log(result);

  // ✅ FIX: header is OBJECT, not array
  if (!result || !result.header) {
    return res.status(404).json({
      success: false,
      message: "No data found",
    });
  }

  const headerRes = result.headerRes;
  const header = result.header;
  const details = result.details || [];

  const pdf = await CounterVoucherGeneration({
    headerRes,
    header,
    details,
    corporationName: corpInfo?.ABC_MUNICIPAL_TEXT || "",
    corporationLogo: corpInfo?.ULBLOGO || "",
  });



  const baseUrl = `${req.protocol}://${req.get("host")}`;
  const pdfUrl = `${baseUrl}/pdf/${path.basename(pdf.filePath)}`;

  res.json({
    success: true,
    message: "PDF Generated Successfully",
    fileName: pdf.fileName,
    pdfUrl,
  });
});