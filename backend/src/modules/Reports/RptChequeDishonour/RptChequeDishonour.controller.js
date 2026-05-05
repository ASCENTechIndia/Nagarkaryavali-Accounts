const asyncHandler = require("../../../libs/asyncHandler");
const { ok } = require("../../../libs/response");
const { RptChequeDishonourPDFHelper } = require("../../../utils/pdfHelper/RptChequeDishonour");
const { getCorporationService } = require("../../MenuAccess/MenuAccess.service");
const service = require("./RptChequeDishonour.service");
const path = require("path");

exports.getZonesByDepartment = asyncHandler(async (req, res) => {
  const { deptId, ulbId } = req.body;

  const data = await service.getZonesByDepartmentService(deptId, ulbId);

  return ok(res, data, data.message);
});

exports.getCollectionCentersByZone = asyncHandler(async (req, res) => {
  const { zoneId } = req.body;

  const data = await service.getCollectionCentersByZoneService(zoneId);

  return ok(res, data, data.message);
});

exports.getChequeReturnList = asyncHandler(async (req, res) => {
  const { deptId, ulbId, zoneId, collCenterId, fromDate, toDate } = req.body;

  const data = await service.getChequeReturnListService(deptId, ulbId, zoneId, collCenterId, fromDate, toDate);

  return ok(res, data, data.message);
});

exports.getChequeDishonourPDF = asyncHandler(async (req, res) => {

  const { deptId, ulbId, zoneId, collCenterId, fromDate, toDate } = req.body;

  const data = await service.getChequeReturnListService(
    deptId,
    ulbId,
    zoneId,
    collCenterId,
    fromDate,
    toDate
  );

  if (!data.list.length) {
    return res.status(404).json({
      success: false,
      message: "No data found"
    });
  }

  const corp = await getCorporationService({ ulbId });

  const pdf = await RptChequeDishonourPDFHelper({
    data: data.list,
    deptId,
    fromDate,
    toDate,
    corp
  });

  const baseUrl = `${req.protocol}://${req.get("host")}`;

  return res.json({
    success: true,
    pdfUrl: `${baseUrl}/pdf/${path.basename(pdf.filePath)}`
  });
});