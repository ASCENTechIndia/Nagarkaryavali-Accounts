const service = require("./FrmReceiptKarjat.service");
const asyncHandler = require("../../../libs/asyncHandler");

const getReceiptTypes = asyncHandler(async (req, res) => {
  const { ulbId } = req.body;
  
  if (!ulbId) {
    return res.status(400).json({ success: false, message: "ulbId is required" });
  }

  const response = await service.getReceiptTypesService(ulbId);
  res.json(response);
});

const getReceiptAccounts = asyncHandler(async (req, res) => {
  const { recTypeId } = req.body;

  if (!recTypeId) {
    return res.status(400).json({ success: false, message: "recTypeId is required" });
  }

  const response = await service.getReceiptAccountsService(recTypeId);
  res.json(response);
});

const getBankAccounts = asyncHandler(async (req, res) => {
  const { bankId } = req.body;

  if (!bankId) {
    return res.status(400).json({ success: false, message: "bankId is required" });
  }

  const response = await service.getBankAccountsService(bankId);
  res.json(response);
});

const getPayModes = asyncHandler(async (req, res) => {
  const response = await service.getPayModesService();
  res.json(response);
});

const getPayModeAccounts = asyncHandler(async (req, res) => {
  const { payModeId } = req.body;
  if (!payModeId) {
    return res.status(400).json({ success: false, message: "payModeId is required" });
  }
  const response = await service.getPayModeAccountsService(payModeId);
  res.json(response);
});

const getAccountDetailsByAccNo = asyncHandler(async (req, res) => {
  const { accno } = req.body;
  
  if (!accno) {
    return res.status(400).json({ success: false, message: "accno is required" });
  }

  const response = await service.getAccountDetailsByAccNoService(accno);
  res.json(response);
});

const getBankBranchByIfsc = asyncHandler(async (req, res) => {
  const { ifsc } = req.body;
  
  if (!ifsc) {
    return res.status(400).json({ success: false, message: "ifsc is required" });
  }

  const response = await service.getBankBranchByIfscService(ifsc);
  res.json(response);
})


const getReceiptListKarjat = asyncHandler(async (req, res) => {
  const data = await service.getReceiptListKarjatService(req.body);
  res.json(data);
});

module.exports = {
  getReceiptTypes,
  getReceiptAccounts,
  getBankAccounts,
  getPayModes,
  getPayModeAccounts,
  getAccountDetailsByAccNo,
  getBankBranchByIfsc,
  getReceiptListKarjat
};