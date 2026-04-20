const asyncHandler = require("../../../libs/asyncHandler");
const { ok } = require("../../../libs/response");
const service = require("./FrmChecRegister.service");
const { ChequeRegisterPDFHelper } = require("../../../utils/pdfHelper/ChequeRegisterPDFHelper");
const path = require("path");

// 1. Cheque Register Report
exports.getChequeRegisterReport = asyncHandler(async (req, res) => {
  const filters = req.body;

  const data = await service.getChequeRegisterReportService(filters);

  return ok(res, data, "Cheque register report fetched");
});

// 2. Search Accounts (Autocomplete)
exports.searchAccounts = asyncHandler(async (req, res) => {
  const filters = req.query;

  const data = await service.searchAccountsService(filters);

  return ok(res, data, "Accounts fetched");
});

// 3. Search GL Heads (Autocomplete)
exports.searchGLHeads = asyncHandler(async (req, res) => {
  const filters = req.query;

  const data = await service.searchGLHeadsService(filters);

  return ok(res, data, "GL heads fetched");
});

exports.generateChequeRegisterPDF = asyncHandler(async (req, res) => {
  const filters = req.body;

  const result = await service.getChequeRegisterReportService(filters);

  if (!result.list.length) {
    return res.status(404).json({
      success: false,
      message: "No records found"
    });
  }

  const pdf = await ChequeRegisterPDFHelper({
    reportData: result.list,
    filters
  });

  const baseUrl = `${req.protocol}://${req.get("host")}`;
  const pdfUrl = `${baseUrl}/pdf/${path.basename(pdf.filePath)}`;

  return res.json({
    success: true,
    message: "PDF Generated Successfully",
    fileName: pdf.fileName,
    pdfUrl
  });
});