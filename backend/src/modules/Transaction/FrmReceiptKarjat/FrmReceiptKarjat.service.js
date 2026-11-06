const repo = require("./FrmReceiptKarjat.repo");

const getReceiptTypesService = async (ulbId) => {
  const data = await repo.getReceiptTypes(ulbId);

  return {
    success: true,
    message: "Receipt types fetched successfully",
    data: data,
  };
};

const getReceiptAccountsService = async (recTypeId) => {
  const data = await repo.getReceiptAccounts(recTypeId);

  return {
    success: true,
    message: "Receipt accounts fetched successfully",
    data: data,
  };
};

const getBankAccountsService = async (bankId) => {
  const data = await repo.getBankAccounts(bankId);

  return {
    success: true,
    message: "Bank accounts fetched successfully",
    data: data,
  };
};

const getPayModesService = async () => {
  const data = await repo.getPayModes();
  return { success: true, data: data };
};

const getPayModeAccountsService = async (payModeId) => {
  const data = await repo.getPayModeAccounts(payModeId);
  return { success: true, data: data };
};

const getAccountDetailsByAccNoService = async (accno) => {
  const data = await repo.getAccountDetailsByAccNo(accno);
  return { 
    success: true, 
    message: "Account details fetched successfully", 
    data: data 
  };
};

const getBankBranchByIfscService = async (ifsc) => {
  const data = await repo.getBankBranchByIfsc(ifsc);
  return { 
    success: true, 
    message: "Bank and Branch details fetched successfully", 
    data: data 
  };
};

module.exports = {
  getReceiptTypesService,
  getReceiptAccountsService,
  getBankAccountsService,
  getPayModesService,
  getPayModeAccountsService,
  getAccountDetailsByAccNoService,
  getBankBranchByIfscService
};