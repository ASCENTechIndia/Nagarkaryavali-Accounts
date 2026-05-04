const asyncHandler = require("../../../libs/asyncHandler");
const { ok } = require("../../../libs/response");
const { generateSecurityDepositPDF } = require("../../../utils/pdfHelper/FrmSecurityDeposit");
const { getCorporationService } = require("../../MenuAccess/MenuAccess.service");
const { LedgerPDFHelper } = require("../../../utils/pdfHelper/BankDepositRpt");
const service = require("./FrmSecurityDeposit.service");
const path = require("path");

exports.getRbtDepReceived = asyncHandler(async (req, res) => {
  const { corpId, zoneId, fromDate, toDate } = req.body;

  const data = await service.getRbtDepReceivedService(corpId, zoneId, fromDate, toDate);

  return ok(res, data, "RBT Deposit Received list fetched successfully");
});

exports.getRbtDepoPayment = asyncHandler(async (req, res) => {
  const { corpId, zoneId, fromDate, toDate } = req.body;

  const data = await service.getRbtDepoPaymentService(corpId, zoneId, fromDate, toDate);

  return ok(res, data, "RBT Deposit Payment list fetched successfully");
});

exports.getRbtUnpaid = asyncHandler(async (req, res) => {
  const { corpId, zoneId, fromDate, toDate } = req.body;

  const data = await service.getRbtUnpaidService(corpId, zoneId, fromDate, toDate);

  return ok(res, data, "RBT Unpaid list fetched successfully");
});

exports.getRdoReport147 = asyncHandler(async (req, res) => {
  const { corpId, zoneId, fromDate, toDate } = req.body;

  const data = await service.getRdoReport147Service(corpId, zoneId, fromDate, toDate);

  return ok(res, data, "RDO Report 147 fetched successfully");
});

exports.getSecurityDepositPDF = asyncHandler(async (req, res) => {
  const { corpId, zoneId, fromDate, toDate, reportType, zoneName } = req.body;
  
  const validReportTypes = ['depReceived', 'depoPayment', 'unpaid', 'report147'];
  if (!reportType || !validReportTypes.includes(reportType)) {
    return res.status(400).json({
      success: false,
      message: "Invalid reportType. Must be one of: depReceived, depoPayment, unpaid, report147"
    });
  }

  let data;
  
  switch(reportType) {
    case 'depReceived':
      data = await service.getRbtDepReceivedService(corpId, zoneId, fromDate, toDate);
      break;
    case 'depoPayment':
      data = await service.getRbtDepoPaymentService(corpId, zoneId, fromDate, toDate);
      break;
    case 'unpaid':
      data = await service.getRbtUnpaidService(corpId, zoneId, fromDate, toDate);
      break;
    case 'report147':
      data = await service.getRdoReport147Service(corpId, zoneId, fromDate, toDate);
      break;
    default:
      return res.status(400).json({
        success: false,
        message: "Invalid report type"
      });
  }

  if (!data.list || data.list.length === 0) {
    return res.status(404).json({
      success: false,
      message: "No records found for the selected criteria"
    });
  }

  const corpInfo = await getCorporationService({ ulbId: corpId });

  const pdf = await generateSecurityDepositPDF({
    data: data.list,
    filters: {
      fromDate,
      toDate,
      zoneId,
      zoneName: zoneName || zoneId
    },
    reportType,
    corporationName: corpInfo?.ABC_MUNICIPAL_TEXT || "अहिल्यानगर महानगरपालिका",
    corporationLogo: corpInfo?.ULBLOGO || "",
  });

  const baseUrl = `${req.protocol}://${req.get("host")}`;

  return res.json({
    success: true,
    message: "PDF generated successfully",
    fileName: pdf.fileName,
    pdfUrl: `${baseUrl}/pdf/${path.basename(pdf.filePath)}`,
    totalRecords: data.list.length
  });
});

exports.getTransactionLedger = asyncHandler(async (req, res) => {
  const filters = req.body;

  const data = await service.getTransactionLedgerService(filters);

  return ok(res, data, "Transaction ledger fetched");
});

exports.getTransactionTypes = asyncHandler(async (req, res) => {
  const data = await service.getTransactionTypesService();

  return ok(res, data, "Transaction types fetched");
});

exports.getLedgerPDF = asyncHandler(async (req, res) => {
  const filters = req.body;

  const { ulbId, fromDate, toDate, trnsType, zoneId, zoneName } = filters;

  // 🔹 Fetch Ledger Data
  const report = await service.getTransactionLedgerService(filters);

  if (!report.list || report.list.length === 0) {
    return res.status(404).json({
      success: false,
      message: "No records found"
    });
  }

  // 🔹 Header Logic
  let header = "ट्रान्सफर रजिस्टर";
  if (trnsType === "8") {
    header = "कॉन्ट्रा एन्ट्री";
  }

  const subHeader = `अहवालाचा कालावधी दिनांक : ${fromDate} पासून ${toDate} पर्यंत.`;

  // 🔥 Get Corporation Info (LOGO + NAME)
  const corpInfo = await getCorporationService({ ulbId });

  // 🔹 Generate PDF
  const pdf = await LedgerPDFHelper({
    reportData: report.list,
    filters: {
      fromDate,
      toDate,
      zoneId,
      zoneName: zoneName || zoneId
    },
    header,
    subHeader,
    corporationName: corpInfo?.ABC_MUNICIPAL_TEXT || "अहिल्यानगर महानगरपालिका",
    logo: corpInfo?.ULBLOGO || ""
  });

  const baseUrl = `${req.protocol}://${req.get("host")}`;

  return res.json({
    success: true,
    message: "PDF generated successfully",
    fileName: pdf.fileName,
    pdfUrl: `${baseUrl}/pdf/${path.basename(pdf.filePath)}`,
    totalRecords: report.list.length
  });
});