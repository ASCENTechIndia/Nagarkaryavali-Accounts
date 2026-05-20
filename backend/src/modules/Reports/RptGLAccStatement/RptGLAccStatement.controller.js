const asyncHandler = require("../../../libs/asyncHandler");
const service = require("./RptGLAccStatement.service");
const path = require("path");
const { getCorporationService } = require("../../MenuAccess/MenuAccess.service");

const {
  generateTransactionPDF,
} = require("../../../utils/pdfHelper/RptGLAccStatementPDFHelper");

// ================= SUMMARY PDF =================
exports.getTransactionSummaryPDF = asyncHandler(async (req, res) => {
  const filters = req.body;

  // 1. Fetch report data
  const data = await service.getTransactionSummary(filters);

  // 2. Get ULB ID from token/body
  const ulbId =
    req.user?.corp_id ||
    filters.ulbId ||
    filters.corp_id ||
    filters.ulbid;

  if (!ulbId) {
    return res.status(400).json({
      success: false,
      message: "ULB ID is required",
    });
  }

  // 3. Fetch corporation info (logo + name)
  const ulbInfo = await getCorporationService({ ulbId });

  // 4. Generate PDF
  const pdf = await generateTransactionPDF({
    data,
    type: "summary",
    filters,
    ulbInfo,
  });

  // 5. Build URL
  const baseUrl = `${req.protocol}://${req.get("host")}`;

  return res.json({
    success: true,
    message: "Transaction Summary PDF generated successfully",
    fileName: pdf.fileName,
    pdfUrl: `${baseUrl}/pdf/${path.basename(pdf.filePath)}`,
  });
});

// ================= DETAILS PDF =================
exports.getTransactionDetailsPDF = asyncHandler(async (req, res) => {
  const filters = req.body;

  // 1. Fetch report data
  const data = await service.getTransactionDetails(filters);

  // 2. Get ULB ID from token/body
  const ulbId =
    req.user?.corp_id ||
    filters.ulbId ||
    filters.corp_id ||
    filters.ulbid;

  if (!ulbId) {
    return res.status(400).json({
      success: false,
      message: "ULB ID is required",
    });
  }

  // 3. Fetch corporation info (logo + name)
  const ulbInfo = await getCorporationService({ ulbId });

  // 4. Generate PDF
  const pdf = await generateTransactionPDF({
    data,
    type: "details",
    filters,
    ulbInfo,
  });

  // 5. Build URL
  const baseUrl = `${req.protocol}://${req.get("host")}`;

  return res.json({
    success: true,
    message: "Transaction Details PDF generated successfully",
    fileName: pdf.fileName,
    pdfUrl: `${baseUrl}/pdf/${path.basename(pdf.filePath)}`,
  });
});

// ================= SEARCH ACCOUNT HEAD API =================
exports.searchAccountHead = asyncHandler(async (req, res) => {
  const { ulbId, functionCode, prefix } = req.body;

  // Validation
  if (!ulbId || !functionCode || !prefix?.trim()) {
    return res.status(400).json({
      success: false,
      message: "ulbId, functionCode and prefix are required.",
    });
  }

  // Call service
  const data = await service.searchAccountHead({
    ulbId,
    functionCode,
    prefix,
  });

  return res.status(200).json({
    success: true,
    message: "Account heads fetched successfully.",
    data: {
      data,
    },
  });
});


exports.searchAccountHead = asyncHandler(async (req, res) => {
  const { ulbId, functionCode, prefix } = req.body;

  const data = await service.searchAccountHead({
    ulbId,
    functionCode,
    prefix,
  });

  return res.status(200).json({
    success: true,
    message: "Account heads fetched successfully.",
    data: {
      data,
    },
  });
});