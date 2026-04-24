const asyncHandler = require("../../../libs/asyncHandler");
const { ok } = require("../../../libs/response");
const service = require("./RptTrialBalance.service");
const { TrialBalancePDFHelper } = require("../../../utils/pdfHelper/TrialBalancePDFHelper");
const path = require("path");

exports.getTrialBalance = asyncHandler(async (req, res) => {
  const { fromDate, toDate } = req.body;
  const corp_id = req.user?.corp_id || req.body.corp_id;

  const data = await service.getTrialBalanceService({
    fromDate,
    toDate,
    corp_id,
  });

  return ok(res, data, "Trial balance fetched");
});

exports.getTrialBalancePDF = asyncHandler(async (req, res) => {
  const { fromDate, toDate } = req.body;
  const corp_id = req.user?.corp_id || req.body.corp_id;

  const result = await service.getTrialBalanceService({
    fromDate,
    toDate,
    corp_id,
  });

  const pdf = await TrialBalancePDFHelper({
    reportData: result.list,
    filters: { fromDate, toDate },
  });

  const baseUrl = `${req.protocol}://${req.get("host")}`;

  return res.json({
    success: true,
    fileName: pdf.fileName,
    pdfUrl: `${baseUrl}/pdf/${path.basename(pdf.filePath)}`,
  });
});