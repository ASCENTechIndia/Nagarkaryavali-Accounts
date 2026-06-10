const repo = require("./rptCashBankBalance.repo");

async function getGrampanchayatListService(payload) {
  console.log("📥 Service: Fetch Grampanchayat List", payload);

  const data = await repo.getGrampanchayatListRepo(payload.deptId);

  return {
    success: true,
    count: data.length,
    data,
  };
}

async function getCashBankBalanceReportService(payload) {
  console.log("📥 Service: Fetch Cash Bank Balance Report", payload);

  const data = await repo.getCashBankBalanceReportRepo(payload);

  return {
    success: true,
    count: data.length,
    data,
  };
}

async function getDailyTransactionDetailedReportService(filters) {
  if (!filters.ulbId) {
    throw new AppError("ULBId is required", 400);
  }

  if (!filters.date) {
    throw new AppError("Date is required", 400);
  }

  const rawData = await repo.getDailyTransactionDetailedReport(filters);
  
  if (!rawData || rawData.length === 0) {
    return {
      success: true,
      count: 0,
      list: [],
      totals: {
        totalRCash: 0,
        totalRBank: 0,
        totalPCash: 0,
        totalPBank: 0
      }
    };
  }

  const receiptTotalMap = new Map();
  const paymentTotalMap = new Map();
  
  for (let i = 0; i < rawData.length; i++) {
    const row = rawData[i];
    if (row.RTransNo) {
      const transNo = row.RTransNo;
      if (!receiptTotalMap.has(transNo)) {
        receiptTotalMap.set(transNo, []);
      }
      receiptTotalMap.get(transNo).push(i);
    }
  }
  
  for (let [transNo, indices] of receiptTotalMap) {
    let total = 0;
    for (let idx of indices) {
      total += (rawData[idx].RCashAmount || 0) + 
               (rawData[idx].RBankAmount || 0) + 
               (rawData[idx].RTransferAmount || 0);
    }
    const lastIndex = indices[indices.length - 1];
    rawData[lastIndex].ReceiptTotal = total;
  }
  
  for (let i = 0; i < rawData.length; i++) {
    const row = rawData[i];
    if (row.PTransNo) {
      const transNo = row.PTransNo;
      if (!paymentTotalMap.has(transNo)) {
        paymentTotalMap.set(transNo, []);
      }
      paymentTotalMap.get(transNo).push(i);
    }
  }
  
  for (let [transNo, indices] of paymentTotalMap) {
    let total = 0;
    for (let idx of indices) {
      total += (rawData[idx].PCashAmount || 0) + 
               (rawData[idx].PBankAmount || 0) + 
               (rawData[idx].PTransferAmount || 0);
    }
    const lastIndex = indices[indices.length - 1];
    rawData[lastIndex].PaymentTotal = total;
  }

  const totals = rawData.reduce((acc, row) => ({
    totalRCash: acc.totalRCash + (row.RCashAmount || 0),
    totalRBank: acc.totalRBank + (row.RBankAmount || 0),
    totalPCash: acc.totalPCash + (row.PCashAmount || 0),
    totalPBank: acc.totalPBank + (row.PBankAmount || 0)
  }), { totalRCash: 0, totalRBank: 0, totalPCash: 0, totalPBank: 0 });

  return {
    success: true,
    count: rawData.length,
    list: rawData,
    totals: totals
  };
}

async function getOpeningBalanceService(filters) {
  console.log("📥 Service: Get Opening Balance", filters);

  if (!filters.ulbId) {
    throw new Error("ULBId is required");
  }

  if (!filters.date) {
    throw new Error("Date is required");
  }

  const dateRegex = /^\d{2}-[A-Z]{3}-\d{4}$/;
  if (!dateRegex.test(filters.date)) {
    throw new Error("Date must be in format: DD-MON-YYYY (e.g., 31-MAR-2026)");
  }

  const balance = await repo.getOpeningBalance(filters);

  return {
    success: true,
    balance: Math.abs(balance),
    drCr: balance >= 0 ? "Cr." : "Dr.",
    openingBalance: balance
  };
}

async function getTransactionDetailsService(transNo, transType, ulbId) {
  console.log("📥 Service: Get Transaction Details", { transNo, transType, ulbId });
  
  if (!transNo) {
    throw new AppError("Transaction number is required", 400);
  }
  
  if (!transType) {
    throw new AppError("Transaction type is required", 400);
  }
  
  if (!ulbId) {
    throw new AppError("ULB ID is required", 400);
  }
  
  let transactionData = null;
  
  if (transType === 'R') {
    transactionData = await repo.getReceiptTransactionDetails(transNo, ulbId);
  } else if (transType === 'P') {
    transactionData = await repo.getPaymentTransactionDetails(transNo, ulbId);
  } else if (transType === 'T') {
    transactionData = await repo.getTransferTransactionDetails(transNo, ulbId);
  }
  
  if (!transactionData) {
    throw new AppError("Transaction not found", 404);
  }
  
  return {
    success: true,
    data: {
      refNo: transactionData.REFNO,
      trnstypeid: transactionData.TRNSTYPE,
      transType: transType
    }
  };
}

module.exports = {
  getGrampanchayatListService,
  getCashBankBalanceReportService,
  getDailyTransactionDetailedReportService,
  getOpeningBalanceService,
  getTransactionDetailsService
};