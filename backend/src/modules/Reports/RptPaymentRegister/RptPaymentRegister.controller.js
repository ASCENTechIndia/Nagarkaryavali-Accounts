const service = require("./RptPaymentRegister.service");
const asyncHandler = require("../../../libs/asyncHandler");
const { PaymentRegisterPDFHelper } = require("../../../utils/pdfHelper/PaymentRegisterPDFHelper");
const path = require("path");
const { getCorporationService } = require("../../MenuAccess/MenuAccess.service");
const { ok } = require("../../../libs/response");
const { generatePaymentRegisterPDF } = require("../../../utils/pdfHelper/generatePaymentRegisterPDF");


const getPaymentRegister = asyncHandler(async (req, res) => {
  const result = await service.getPaymentRegisterService(req.body);

  if (!result.rows || result.rows.length === 0) {
    return res.json({
      success: false,
      message: "No Payment Records Found",
      data: result
    });
  }

  res.json({
    success: true,
    message: "Payment Register fetched successfully",
    data: result
  });
});

const getPaymentRegisterPDF = asyncHandler(async (req, res) => {
  const filters = req.body;

  const result = await service.getPaymentRegisterService(filters);
  console.log("result",result)

  if (!result.rows || result.rowCount === 0) {
  return res.status(404).json({
    success: false,
    message: "No data found",
  });
}

  const corpInfo = await getCorporationService(filters);

 const pdf = await generatePaymentRegisterPDF({
  rows: result.rows,   // ✅ FIXED
  fromDate: filters.fromDate,
  toDate: filters.toDate,
  corporationName: corpInfo.ABC_MUNICIPAL_TEXT || "",
  logo: corpInfo.ULBLOGO || "",   // ✅ FIXED
  zone: filters.zone || "",
});

  const baseUrl = `${req.protocol}://${req.get("host")}`;
  const pdfUrl = `${baseUrl}/pdf/${path.basename(pdf.filePath)}`;

  return res.json({
    success: true,
    message: "PDF Generated Successfully",
    fileName: pdf.fileName,
    pdfUrl,
  });
});

const getPaymentRegisterReport = asyncHandler(async (req, res) => {
  const data = await service.getPaymentRegisterReportService(req.body);
  return ok(res, data, "Payment register fetched successfully");
});

// PDF
const getPaymentRegisterDetailPDF = asyncHandler(async (req, res) => {
  const filters = req.body;
  const { ulbid } = filters;

  const result = await service.getPaymentRegisterReportService(filters);

  if (!result.rows.length) {
    return res.status(404).json({
      success: false,
      message: "No records found",
    });
  }

  const corpInfo = await getCorporationService({ ulbId:ulbid });

  const pdf = await PaymentRegisterPDFHelper({
    reportData: result.rows,
    filters,
    corporationName: corpInfo.ABC_MUNICIPAL_TEXT || "",
    corporationLogo: corpInfo.ULBLOGO || "",
  });

  const baseUrl = `${req.protocol}://${req.get("host")}`;
  const pdfUrl = `${baseUrl}/pdf/${path.basename(pdf.filePath)}`;

  return res.json({
    success: true,
    message: "PDF Generated Successfully",
    fileName: pdf.fileName,
    pdfUrl,
  });
});

module.exports = { getPaymentRegister, getPaymentRegisterReport, getPaymentRegisterPDF,getPaymentRegisterDetailPDF  };