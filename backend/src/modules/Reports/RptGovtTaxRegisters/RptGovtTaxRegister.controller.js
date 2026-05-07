const asyncHandler = require("../../../libs/asyncHandler");
const service = require("./RptGovtTaxRegister.service");
const path = require("path");
const { getCorporationService } = require("../../MenuAccess/MenuAccess.service");
const { GovtTaxRegisterPDFHelper } = require("../../../utils/pdfHelper/GovtTaxRegisterPDFHelper");
const { GovtTaxRegisterSummaryPDFHelper } = require("../../../utils/pdfHelper/GovtTaxRegisterSummaryPDFHelper");
const { GovtTaxSummary2PDF } = require("../../../utils/pdfHelper/GovtTaxSummary2PDF");

const getGovtTaxRegisterPDF1 = asyncHandler(async (req, res) => {
  const filters = req.body;

  const result = await service.getGovtTaxRegisterService1(filters);

  if (!result.rows.length) {
    return res.status(404).json({
      success: false,
      message: "No records found",
    });
  }

  const corpInfo = await getCorporationService(filters);

  const pdf = await GovtTaxRegisterPDFHelper({
    reportData: result.rows,
    filters,
    corporationName: corpInfo.ABC_MUNICIPAL_TEXT || "",
    corporationLogo: corpInfo.ULBLOGO || "",
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

const getGovtTaxRegisterSummaryPDF = asyncHandler(async (req, res) => {
  const filters = req.body;

  const result = await service.getGovtTaxRegisterSummaryService(filters);

  if (!result.rows.length) {
    return res.status(404).json({
      success: false,
      message: "No records found",
    });
  }

  const corpInfo = await getCorporationService(filters);

  const pdf = await GovtTaxRegisterSummaryPDFHelper({
    reportData: result.rows,
    filters,
    corporationName: corpInfo.ABC_MUNICIPAL_TEXT || "",
    corporationLogo: corpInfo.ULBLOGO || "",
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


const getGovtTaxSummary2PDF = asyncHandler(async (req, res) => {
  const filters = req.body;
  
  const result = await service.getGovtTaxSummary2Service(filters);
  // console.log("result",result);

  if (!result.rows.length) {
    return res.status(404).json({
      success: false,
      message: "No records found",
    });
  }

  // ✅ SAME AS YOUR OLD WORKING CONTROLLER
  const corpInfo = await getCorporationService(filters);

  const pdf = await GovtTaxSummary2PDF({
    reportData: result.rows,
    filters,
    corporationName: corpInfo.ABC_MUNICIPAL_TEXT || "",
    corporationLogo: corpInfo.ULBLOGO || ""   // ✅ NO BASE64
  });

  const baseUrl = `${req.protocol}://${req.get("host")}`;

  res.json({
    success: true,
    message: "PDF Generated Successfully",
    fileName: pdf.fileName,
    pdfUrl: `${baseUrl}/pdf/${pdf.fileName}`
  });
});

module.exports = {
  getGovtTaxRegisterPDF1,
  getGovtTaxRegisterSummaryPDF,
  getGovtTaxSummary2PDF
};