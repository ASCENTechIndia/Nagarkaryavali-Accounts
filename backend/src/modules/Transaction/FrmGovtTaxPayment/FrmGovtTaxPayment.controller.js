const service = require("./FrmGovtTaxPayment.service");
const asyncHandler = require("../../../libs/asyncHandler");

const getGovtTaxPayment = asyncHandler(async (req, res) => {
    const response = await service.getGovtTaxPaymentService(req.body);
    res.json(response);
});


const govtTaxInsert = asyncHandler(async (req, res) => {
  const response = await service.govtTaxInsertService(req.body);
  res.json(response);
});


module.exports = {
    getGovtTaxPayment, govtTaxInsert
};