const repo = require("./FrmTransAuthList.repo");

const getTransactionListService = async (body) => {
  const data = await repo.getTransactionList(body);

  return data; // directly return
};

const getUserListService = async (body) => {
  const { ulbId, deptId } = body;

  if (!ulbId || !deptId) {
    throw new Error("ulbId and deptId are required");
  }

  const data = await repo.getUserList(ulbId, deptId);

  return data; // same structure as your other APIs
};

const getTransactionDetailsService = async (body) => {
  const { refNo, trnsTypeId } = body;

  const result = await repo.getTransactionDetails(refNo, trnsTypeId);

  let finalRows = [];

  if (!result.rows.length) return result;

  let sum = 0;

  // RECEIPT
  if ([1, 2].includes(trnsTypeId)) {
    result.rows.forEach((r) => {
      finalRows.push({
        glCode: r.GLCODE,
        glName: r.GLNAME,
        accNo: r.ACCNO,
        accName: r.ACCNAME,
        credit: r.AMOUNT,
        debit: 0,
        narration: r.NARRATION,
        party: r.PARTY,
      });
      sum += r.AMOUNT;
    });

    finalRows.push({
      glCode: result.rows[0].CRDRGL,
      glName: result.rows[0].CRDRGLNAME,
      accNo: result.rows[0].CRDRACC,
      accName: result.rows[0].CRDRACCNAME,
      credit: 0,
      debit: sum,
    });
  }

  // PAYMENT
  else if ([3, 4].includes(trnsTypeId)) {
    result.rows.forEach((r) => {
      finalRows.push({
        glCode: r.GLCODE,
        credit: 0,
        debit: r.AMOUNT,
      });
      sum += r.AMOUNT;
    });

    finalRows.push({
      glCode: result.rows[0].CRDRGL,
      credit: sum,
      debit: 0,
    });
  }

  // TRANSFER
  else {
    result.rows.forEach((r) => {
      let credit = r.AMOUNT >= 0 ? r.AMOUNT : 0;
      let debit = r.AMOUNT < 0 ? Math.abs(r.AMOUNT) : 0;

      finalRows.push({
        glCode: r.GLCODE,
        credit,
        debit,
      });
    });
  }

  return {
    success: true,
    header: result.rows[0],
    rows: finalRows,
  };
};

const insertTransAuthService = async (payload) => {
  const { refNo, trnsSourceId, trnsStatus, str1, str2, userId } = payload;

  console.log("Service payload:", payload);

  if (!refNo || !trnsSourceId || !trnsStatus) {
    throw new AppError("refNo, trnsSourceId, trnsStatus are required", 400);
  }

  const result = await repo.insertTransAuth(refNo, trnsSourceId, trnsStatus, str1, str2, userId);

  console.log("Service Result :", result);

  return {
    success: result.errorCode === -100, 
    ...result,
  };
};

module.exports = { getTransactionListService, getUserListService, getTransactionDetailsService, insertTransAuthService };
