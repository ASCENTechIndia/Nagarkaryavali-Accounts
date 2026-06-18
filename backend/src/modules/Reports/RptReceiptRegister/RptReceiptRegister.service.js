const repo = require("./RptReceiptRegister.repo");

const getReceiptRegisterService = async (body) => {
  return await repo.getReceiptRegister(body);
};

const getReceiptRegisterUserWiseService = async (body) => {
  if(body.rptType == "3" && (body.department == "7"  ||  body.department == "1482") ) {
    const res =  await repo.getReceiptRegisterProperty(body)
    console.log("Service Res: ", res);
    return res;
  }
  return await repo.getReceiptRegisterUserWise(body);
};

module.exports = {
  getReceiptRegisterService,
  getReceiptRegisterUserWiseService
};