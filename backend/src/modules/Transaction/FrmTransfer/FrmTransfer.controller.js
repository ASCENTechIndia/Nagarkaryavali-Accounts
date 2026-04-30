const { ok } = require("../../../libs/response");
const asyncHandler = require("../../../libs/asyncHandler");
const service = require("./FrmTransfer.service");
const { CounterVoucherPDFHelper } = require("../../../utils/pdfHelper/CounterVoucherPDFHelper");
const path = require("path");
const { getCorporationService } = require("../../MenuAccess/MenuAccess.service");

const getTransactionTypes = asyncHandler(async (req, res) => {
  const data = await service.getTransactionTypesService();
  return ok(res, data);
});

const getDepartments = asyncHandler(async (req, res) => {
  const data = await service.getDepartmentsService();
  return ok(res, data);
});

const getGLCodes = asyncHandler(async (req, res) => {
  const data = await service.getGLCodesService();
  return ok(res, data);
});

const getBudgetHeads = asyncHandler(async (req, res) => {
  const data = await service.getBudgetHeadsService();
  return ok(res, data);
});

const getPartyList = asyncHandler(async (req, res) => {
  const { corpId } = req.body;
  const data = await service.getPartyListService(corpId);
  return ok(res, data);
});

const getContraDetails = asyncHandler(async (req, res) => {
  const { tranRef } = req.body;
  const data = await service.getContraDetailsService(tranRef);
  return ok(res, data);
});

const getTransferList = asyncHandler(async (req, res) => {
  const { zoneId, ulbId } = req.body;
  const data = await service.getTransferListService(zoneId, ulbId);
  return ok(res, data);
});

const transferInsertUpdate = asyncHandler(async (req, res) => {
  const { userId, paramStr, paramStr2 } = req.body;

  const result = await service.transferInsertUpdateService({
    userId,
    paramStr,
    paramStr2
  });

  return ok(res, result);
});


const creditLeasure = asyncHandler(async (req, res) => {
  const { corp_id, glcode } = req.body;
  const data = await service.creditLeasureService(corp_id, glcode);
  return ok(res, data);
});



const getCounterVoucherPDF = asyncHandler(async (req, res) => {
  const filters = req.body;

  const result = await service.getCounterVoucherService(filters);

  if (!result.rows.length) {
    return res.status(404).json({
      success: false,
      message: "No records found",
    });
  }

  // ✅ GET CORPORATION INFO (same as GovtTax)
  const corpInfo = await getCorporationService(filters);

  const pdf = await CounterVoucherPDFHelper({
    reportData: result.rows,
    corporationName: corpInfo.ABC_MUNICIPAL_TEXT || "",
    corporationLogo: corpInfo.ULBLOGO || "", // ✅ ADD THIS
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

module.exports = {
  getTransactionTypes,
  getDepartments,
  getGLCodes,
  getBudgetHeads,
  getPartyList,
  getContraDetails,
  getTransferList,
  transferInsertUpdate,
  creditLeasure,
  getCounterVoucherPDF
};