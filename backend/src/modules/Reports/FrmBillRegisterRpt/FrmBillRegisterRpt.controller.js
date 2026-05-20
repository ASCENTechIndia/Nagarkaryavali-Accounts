const asyncHandler = require("../../../libs/asyncHandler");
const { ok } = require("../../../libs/response");
const service = require("./FrmBillRegisterRpt.service");


const { BillRegisterPDFHelper } = require("../../../utils/pdfHelper/BillRegisterPDFHelper");
const path = require("path");
const { getCorporationService } = require("../../MenuAccess/MenuAccess.service");


exports.getBillRegisterReport = asyncHandler(async (req, res) => {
  const data = await service.getBillRegisterReportService(req.body);
  return ok(res, data, "Bill register report fetched successfully");
});


exports.getBillRegisterPDF = asyncHandler(async (req, res) => {
  const filters = req.body;

  console.log("filters", filters);

  const {ulbid} = filters;


  const result = await service.getBillRegisterReportService(filters);

  if (!result.rows.length) {
    return res.status(404).json({
      success: false,
      message: "No records found"
    });
  }

  const corpInfo = await getCorporationService({ ulbId: ulbid });

  const corporationName = corpInfo.ABC_MUNICIPAL_TEXT || "";
  const corporationLogo = corpInfo.ULBLOGO || "";

  const pdf = await BillRegisterPDFHelper({
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
});