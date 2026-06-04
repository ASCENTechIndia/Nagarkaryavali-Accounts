const asyncHandler = require("../../../libs/asyncHandler");
const { ok } = require("../../../libs/response");
const service = require("./receipt.service");
const path = require("path");


const { generateReceiptPDF } = require("../../../utils/pdfHelper/ReceiptPDF");
const { getCorporationService } = require("../../MenuAccess/MenuAccess.service");


// ================= 1. Receipt List =================
exports.getReceiptList = asyncHandler(async (req, res) => {
  const data = await service.getReceiptList(req.body);
  return ok(res, data);
});

// ================= 2. Zones =================
exports.getZones = asyncHandler(async (req, res) => {
  const data = await service.getZones(req.body);
  return ok(res, data);
});

// ================= 3. Corporation =================
exports.getCorporation = asyncHandler(async (req, res) => {
  const data = await service.getCorporation(req.body);
  return ok(res, data);
});

// ================= 4. Departments =================
exports.getDepartments = asyncHandler(async (req, res) => {
  const data = await service.getDepartments(req.body);
  return ok(res, data);
});

// ================= 5. Narration =================
exports.getNarration = asyncHandler(async (req, res) => {
  const data = await service.getNarration();
  return ok(res, data);
});

// ================= 6. Transaction Type =================
exports.getTransType = asyncHandler(async (req, res) => {
  const data = await service.getTransType();
  return ok(res, data);
});

// ================= 7. Receipt Details =================
exports.getReceiptDetails = asyncHandler(async (req, res) => {
  const data = await service.getReceiptDetails(req.body);
  return ok(res, data);
});

// ================= 8. Party =================
exports.getParty = asyncHandler(async (req, res) => {
  const data = await service.getParty(req.body);
  return ok(res, data);
});

// ================= 9. Search GL =================
exports.searchGL = asyncHandler(async (req, res) => {
  const data = await service.searchGL();
  return ok(res, data);
});

exports.searchGLALL = asyncHandler(async (req, res) => {
  const data = await service.searchGLALL();
  return ok(res, data);
});

// ================= 10. Insert / Update Receipt =================
exports.receiptInsertUpdate = asyncHandler(async (req, res) => {
  const data = await service.receiptInsertUpdate(req.body);
  return ok(res, data);
});

exports.getBudgetHeads = asyncHandler(async (req, res) => {
  const data = await service.getBudgetHeads();
  return ok(res, data);
});


exports.getReceiptPDF = asyncHandler(async (req, res) => {
  const payload = req.body;

  const data = await service.getReceiptPdfData(payload);

  const corpInfo = await getCorporationService({
    ulbId: payload.ulbid,
  });

  const pdf = await generateReceiptPDF({
    data,
    corporationName: corpInfo.ABC_MUNICIPAL_TEXT || "",
    corporationLogo: corpInfo.ULBLOGO || "",
  });

  const baseUrl = `${req.protocol}://${req.get("host")}`;

  return res.json({
    success: true,
    fileName: pdf.fileName,
    pdfUrl: `${baseUrl}/pdf/${path.basename(pdf.filePath)}`,
    data :data
  });
});

exports.getReceiptDetailsReprint = asyncHandler(async (req, res) => {
  console.log("📥 Request Body:", req.body);

  const payload = {
    ulbid: req.body.ulbid,
    fromDate: req.body.fromDate,  
    toDate: req.body.toDate       
  };

  const data = await service.getReceiptDetailsService(payload);

  return ok(res, data, "Receipt details fetched successfully");
});

exports.getUserMapHeader = asyncHandler(async (req, res) => {

  const data =
    await service.getUserMapHeaderService(req.body);

  return ok(
    res,
    data,
    "User map header fetched successfully"
  );
});

exports.getUserMapDetails = asyncHandler(async (req, res) => {

  const data =
    await service.getUserMapDetailsService(req.body);

  return ok(
    res,
    data,
    "User map details fetched successfully"
  );
});

exports.getAccountMappingDetail = asyncHandler(async (req, res) => {

  const data =
    await service.getAccountMappingDetailService(req.body);

  return ok(
    res,
    data,
    "Account mapping details fetched successfully"
  );
});

