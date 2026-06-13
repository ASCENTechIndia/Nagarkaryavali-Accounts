const service = require("./RptReceiptRegister.service");
const asyncHandler = require("../../../libs/asyncHandler");
const { ok } = require("../../../libs/response");
const path = require("path");

const { RptReceiptRegisterPDFHelper } = require("../../../utils/pdfHelper/RptReceiptRegister");
const { RptReceiptRegisterJcmcPDFHelper } = require("../../../utils/pdfHelper/RptReceiptRegisterJcmc");
const { getCorporationService } = require("../../MenuAccess/MenuAccess.service");const { RptReceiptPropertyPDFHelper } = require("../../../utils/pdfHelper/RptReceiptProperty");
;

const getReceiptRegister = asyncHandler(async (req, res) => {
  const result = await service.getReceiptRegisterService(req.body);

  if (!result.rows || result.rows.length === 0) {
    return res.json({
      success: false,
      message: "No records found",
      data: result
    });
  }

  res.json({
    success: true,
    message: "Receipt register fetched successfully",
    data: result
  });
});

const generateReceiptRegPDF = asyncHandler(async (req, res) => {
  try {
    const filters = req.body;

    const result = await service.getReceiptRegisterService(filters);
    if (!result.rows.length) {
      return res.status(404).json({
        success: false,
        message: "No records found"
      });
    }

    // ✅ NEW SERVICE CALL
    const corpInfo = await getCorporationService({ ulbId: filters.ulbId });

    const corporationName = corpInfo.ABC_MUNICIPAL_TEXT || "";
    const corporationLogo = corpInfo.ULBLOGO || "";

    const pdf = await RptReceiptRegisterPDFHelper({
      reportData: result.rows,
      filters,
      corporationName,
      corporationLogo
    });

    const baseUrl = `${req.protocol}://${req.get("host")}`;
    const pdfUrl = `${baseUrl}/pdf/${path.basename(pdf.filePath)}`;

    return res.json({
      success: true,
      message: "PDF Generated Successfully",
      fileName: pdf.fileName,
      pdfUrl
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "PDF generation failed",
      error: error.message
    });
  }
});

const getReceiptRegisterUserWise = asyncHandler(async (req, res) => {
  const result = await service.getReceiptRegisterUserWiseService(req.body);

  if (!result.rows || result.rows.length === 0) {
    return res.json({
      success: false,
      message: "No records found",
      data: result
    });
  }

  res.json({
    success: true,
    message: "Receipt register user-wise fetched successfully",
    data: result
  });
});

const generateReceiptRegUserWisePDF = asyncHandler(async (req, res) => {
  try {
    const filters = req.body;
    const result = await service.getReceiptRegisterUserWiseService(filters);

    if (!result.rows.length) {
      return res.status(404).json({ success: false, message: "No records found" });
    }

    const corpInfo = await getCorporationService({ ulbId: filters.ulbId });
    const corporationName = corpInfo.ABC_MUNICIPAL_TEXT || "";
    const corporationLogo = corpInfo.ULBLOGO || "";

    let pdf;

    if(req.body.department == 7) {
      pdf = await RptReceiptPropertyPDFHelper({
        reportData: result.rows,
        filters,
        corporationName,
        corporationLogo
      });
    }else {
      pdf = await RptReceiptRegisterJcmcPDFHelper({
        reportData: result.rows,
        filters,
        corporationName,
        corporationLogo
      });
    }

    const baseUrl = `${req.protocol}://${req.get("host")}`;
    const pdfUrl = `${baseUrl}/pdf/${path.basename(pdf.filePath)}`;

    return res.json({ success: true, message: "User-wise PDF Generated Successfully", fileName: pdf.fileName, pdfUrl });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "User-wise PDF generation failed", error: error.message });
  }
});
module.exports = {
  getReceiptRegister,
  generateReceiptRegPDF,
  getReceiptRegisterUserWise,
  generateReceiptRegUserWisePDF
};