const repo = require("./FrmReceiptPaymentRegisterRpt.repo");

async function getReceiptPaymentRegisterService(payload) {
  const rows = await repo.getReceiptPaymentRegisterRepo(payload);

  const summary = await repo.getPreviousSummaryRepo(payload);

  const openingData = await repo.getOpeningClosingRepo(payload);

  const targetNames = [
    "Contra Entry",
    "Transfer/Contra-B2B",
    "JV",
  ];

  const grouped = {};

  rows.forEach((row) => {
    if (
      targetNames.includes((row.ADATA_ACCNAME || "").trim())
    ) {
      if (!grouped[row.TRANSNO]) {
        grouped[row.TRANSNO] = [];
      }

      grouped[row.TRANSNO].push(row);
    }
  });

  Object.values(grouped).forEach((grp) => {
    const paymentRow = grp.find(
      (x) => (x.FLAG || "").trim().toUpperCase() === "P"
    );

    const receiptRow = grp.find(
      (x) => (x.FLAG || "").trim().toUpperCase() === "R"
    );

    if (paymentRow && receiptRow) {
      const paymentAmount = Number(paymentRow.PAYMENTAMT || 0);

      const receiptAmount = Number(receiptRow.RECEIPTAMT || 0);

      paymentRow.PAYMENTAMT = 0;
      receiptRow.RECEIPTAMT = 0;

      paymentRow.RECEIPTAMT = paymentAmount;
      receiptRow.PAYMENTAMT = receiptAmount;
    }
  });

  const openingBal =
    Number(openingData[0]?.BALANCE || 0) +
    Number(summary[0]?.RECEIPTAMT || 0) -
    Number(summary[0]?.PAYMENTAMT || 0);

  const receiptTotal = rows.reduce(
    (a, b) => a + Number(b.RECEIPTAMT || 0),
    0
  );

  const paymentTotal = rows.reduce(
    (a, b) => a + Number(b.PAYMENTAMT || 0),
    0
  );

  const closingBal =
    openingBal + receiptTotal - paymentTotal;

  return {
    rows,
    openingBal,
    receiptTotal,
    paymentTotal,
    closingBal,
    fromDate: payload.fromDate,
    toDate: payload.toDate,
  };
}

module.exports = {
  getReceiptPaymentRegisterService,
};