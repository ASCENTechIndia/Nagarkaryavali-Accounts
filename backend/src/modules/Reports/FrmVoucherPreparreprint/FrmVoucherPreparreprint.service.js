const repo = require("./FrmVoucherPreparreprint.repo");
const { AppError } = require("../../../libs/errors");

const {VoucherPreparreprint} = require("../../../utils/pdfHelper/VoucherPreparreprint");
const { getCorporationService } = require("../../MenuAccess/MenuAccess.service");
const getVoucherListService = async ({ fromDate, toDate, corp_id, partyId }) => {
  if (!fromDate || !toDate) {
    throw new AppError("FromDate and ToDate required", 400);
  }

  const data = await repo.getVoucherPrepareReprintList({
    fromDate,
    toDate,
    corp_id,
    partyId,
  });

  if (!data.length) {
    throw new AppError("No records found", 404);
  }

  return {
    success: true,
    list: data,
  };
};

const getVoucherDetailsService = async ({ refNo, corp_id }) => {
  if (!refNo) {
    throw new AppError("RefNo required", 400);
  }

  const ulbInfo = await getCorporationService({ulbId: corp_id});

  const data = await repo.getVoucherPrepareReprintDetails({
    refNo,
    corp_id,
  });

  console.log("Service Data: ", data);

  if (!data.length) {
    throw new AppError("No record found", 404);
  }

  const pdf = await VoucherPreparreprint({ data, ulbInfo });

   return {
    fileName: pdf.fileName,
    filePath: pdf.filePath,
  };
};

module.exports = {
  getVoucherListService,
  getVoucherDetailsService,
};