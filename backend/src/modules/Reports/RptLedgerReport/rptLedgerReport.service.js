const repo = require("./rptLedgerReport.repo");
const { AppError } = require("../../../libs/errors");

async function getTransactionDetailsService(transNo) {
  console.log("📥 Service → TransNo:", transNo);

  if (!transNo) {
    throw new AppError("Transaction number is required", 400);
  }

  const result = await repo.getTransactionDetails(transNo);

  if (!result) {
    throw new AppError("No transaction found", 404);
  }

  return {
    success: true,
    trnstypeid: result.trnstypeid,
    count: result.data.length,
    list: result.data,
  };
}

async function getAccountBalanceService(payload) {
  const { glcode, accno, ulbid, fromDate, toDate } = payload;

  if (!glcode || !accno || !ulbid) {
    throw new AppError("glcode, accno and ulbid are required", 400);
  }

  if (!fromDate || !toDate) {
    throw new AppError("fromDate and toDate are required", 400);
  }

  const data = await repo.getAccountBalance(payload);

  return {
    success: true,
    balance: data.BALANCE,
  };
}


async function getLedgerTransactionsService(payload) {
  console.log("📥 Service → Ledger Payload:", payload);

  const { glcode, accno, ulbid, fromDate, toDate } = payload;

  // ✅ Validations
  if (!glcode) throw new AppError("glcode is required", 400);
  if (!accno) throw new AppError("accno is required", 400);
  if (!ulbid) throw new AppError("ulbid is required", 400);
  if (!fromDate || !toDate) {
    throw new AppError("fromDate and toDate are required", 400);
  }

  let data;

  if(ulbid == 930) {
    console.log("JCMC Repo Called")
    data = await repo.getLedgerJCMCTransactions(payload);
  }else {
    console.log("Legder Repo Called")
    data = await repo.getLedgerTransactions(payload);
  }

  

  return {
    success: true,
    count: data.length,
    list: data,
  };
}

module.exports = {
  getTransactionDetailsService,
  getAccountBalanceService,
  getLedgerTransactionsService
};