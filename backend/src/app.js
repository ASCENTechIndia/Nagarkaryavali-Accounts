// src/app.js
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const { NODE_ENV } = require("./config/env");
const errorMiddleware = require("./middlewares/error.middleware");
const { rateLimitMiddleware } = require("./middlewares/rateLimit.middleware");
const requestLogger = require("./middlewares/requestLogger.middleware");

const authRoutes = require("./modules/auth/auth.routes");
const tasksRoutes = require("./modules/tasks/tasks.routes");
const adminRoutes = require("./modules/admin/admin.routes");
const healthRoutes = require("./routes/health.routes");
const path = require("path");

const app = express();

// trust proxy (important for rate-limit & IP)
app.set("trust proxy", 1);

// security & parsing
app.use(cors({ origin: NODE_ENV === "production" ? ["https://yourdomain.com"] : "*", credentials: true }));

app.use(express.json({ limit: "1mb" }));
app.use(requestLogger);

app.use(helmet({ contentSecurityPolicy: false }));

// logging
if (NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

app.use("/pdf", express.static(path.join(__dirname, "../public/pdf")));

// health first (no rate limit)
app.use("/api", healthRoutes);

// global limiter
app.use(rateLimitMiddleware());

// root
app.get("/", (req, res) => res.send("API Running ✅"));

// routes

app.use("/api/auth", authRoutes);
app.use("/api/tasks", tasksRoutes);
app.use("/api/admin", adminRoutes);

app.use("/api/menu-access", require("./modules/MenuAccess/MenuAccess.routes"));

// Dashboard
app.use("/api/dashboard",require("./modules/Dashboard/dashboard.routes"))

//MASTER
app.use("/api/BudgetHeadConfig", require("./modules/Master/FrmBudgetHeadConfig/BudgetHeadConfig.route"));
app.use("/api/FrmAccount", require("./modules/Master/FrmAccount/frmAccount.route"));
app.use("/api/FrmParty", require("./modules/Master/FrmParty/FrmParty.routes"));
app.use("/api/master", require("./modules/Master/GLMaster/glmaster.route"));
app.use("/api/FrmChequeBook", require("./modules/Master/FrmChequeBook/chequeBookMst.route"));
app.use("/api/FrmBanList", require("./modules/Master/FrmBanList/frmBanList.route"));
app.use("/api/frmzoneList", require("./modules/Master/FrmZone/frmzoneList.route"));
app.use("/api/frmDepositType", require("./modules/Master/FrmDepositType/frmDepositType.route"));
app.use("/api/SubGroup", require("./modules/Master/FrmBalanceSheetSubGroupList/BalanceSheetSubGroupList.routes"));
app.use("/api/Investment", require("./modules/Master/FrrmInvestement/FrmInvestement.route"));
app.use("/api/Bankbranch", require("./modules/Master/FromBankBranch/FromBankbranch.route"));
app.use("/api/Budgetlist", require("./modules/Master/FrmBudget/FrmBudgetLIst.route"));
app.use("/api/Balancesheet", require("./modules/Master/FrmBalanceSheetGroupList/FrmBalanceSheetGroupList.route"));
app.use("/api/CityList", require("./modules/Master/FrmCity/FrmCityList.route"));
app.use("/api/District", require("./modules/Master/FrmDistrict/FrmDistrictList.route"));
app.use("/api/Grampanchayat", require("./modules/Master/FrmGrampanchayat/FrmGrampanchayatList.route"));
app.use("/api/FrmContract", require("./modules/Master/FrmContract/FrmContract.routes"));
app.use("/api/Frmauthorizationconfig", require("./modules/Master/Frmauthorizationconfig/Frmauthorizationconfig.routes"));
app.use("/api/FrmNidhiConfig", require("./modules/Master/FrmNidhiConfig/FrmNidhiConfig.routes"));
app.use("/api/NidhiList",require("./modules/Master/FrmNidhiList/FrmNidhiList.routes"))

//Transaction
app.use("/api/FrmTransfer", require("./modules/Transaction/FrmTransfer/FrmTransfer.routes"));
app.use("/api/Receipt", require("./modules/Transaction/FrmReceipt/receipt.routes"));
app.use("/api/FrmVoucher", require("./modules/Transaction/FrmVoucherPreparation/frmVoucher.route"));
app.use("/api/BudgetPrepration", require("./modules/Transaction/FrmBudgetPrepration/FrmBudgetPreprationList.route"));
app.use("/api/FrmSearchOption", require("./modules/Transaction/FrmSearchOption/FrmSearchOption.routes"));
app.use("/api/FrmGovtTaxPayment", require("./modules/Transaction/FrmGovtTaxPayment/FrmGovtTaxPayment.routes"));
app.use("/api/FrmTransAuthList", require("./modules/Transaction/FrmTransAuthList/FrmTransAuthList.routes"));
app.use("/api/frmPayment", require("./modules/Transaction/FrmPayment/frmPayment.route"));
app.use("/api/BudgetAccMap", require("./modules/Transaction/FrmBudgetAccountMap/FrmBudgetAccountMap.routes"));
app.use("/api/FrmVoucherGeneration", require("./modules/Transaction/FrmVoucherGeneration/FrmVoucherGeneration.routes"));
app.use("/api/Bankdeposit", require("./modules/Transaction/FrmBankDeposit/BankDepositReports.route"))
app.use("/api/FrmBulkReceipt", require("./modules/Transaction/FrmBulkReceipt/FrmBulkReceipt.route"))
app.use("/api/FrmCheqCancelchanges", require("./modules/Transaction/FrmCheqCancelchanges/FrmCheqCancelchanges.routes"))
app.use("/api/Tranrevoke", require("./modules/Transaction/FrmTransactionUpdate/FrmTranUpdate.route"))
app.use("/api/FrmCashDeposit", require("./modules/Transaction/FrmCashDeposit/FrmCashDeposit.routes"))
app.use("/api/frmSDRef" , require("./modules/Transaction/FrmSDRefund/FrmSDRef.route"))
app.use("/api/ChequeDepo", require("./modules/Transaction/FrmChequeDeposit/ChequeDeposit.route"))

//Reports
app.use("/api/RptTransferRegister", require("./modules/Reports/RptTransferRegister/transferRegister.route"))
app.use("/api/RptCashBankBalance", require("./modules/Reports/RptCashBankBalance/rptCashBankBalance.route"))
app.use("/api/Classified", require ("./modules/Reports/RptClassifiedRegister/RptClassifiedRegisterDetails.route"))
app.use("/api/Abstract", require("./modules/Reports/RptClassifiedAbstractSummary/RptClassifiedAbstract.route"))
app.use("/api/RptLedgerReport", require("./modules/Reports/RptLedgerReport/rptLedgerReport.route"))
app.use("/api/RptPaymentRegister", require("./modules/Reports/RptPaymentRegister/RptPaymentRegister.routes"));
// app.use("/api/RptTransferRegister", require("./modules/Reports/RptTransferRegister/transferRegister.route"))
app.use("/api/RptCashBankBalance", require("./modules/Reports/RptCashBankBalance/rptCashBankBalance.route"))
app.use("/api/Classified", require ("./modules/Reports/RptClassifiedRegister/RptClassifiedRegisterDetails.route"))
app.use("/api/Abstract", require("./modules/Reports/RptClassifiedAbstractSummary/RptClassifiedAbstract.route"))
app.use("/api/RptLedgerReport", require("./modules/Reports/RptLedgerReport/rptLedgerReport.route"))
app.use("/api/RptPaymentRegister", require("./modules/Reports/RptPaymentRegister/RptPaymentRegister.routes"));
app.use("/api/RptRegister", require("./modules/Reports/FrmRptReceiptRegisterDetails/RptReceiptRegisterDetails.route"));
app.use("/api/RptReceiptRegister", require("./modules/Reports/RptReceiptRegister/RptReceiptRegister.routes"));
app.use("/api/ChecRegister",require("./modules/Reports/FrmChecRegisterRpt/FrmChecRegister.route"))
app.use("/api/FrmBillRegisterRpt", require("./modules/Reports/FrmBillRegisterRpt/FrmBillRegisterRpt.routes"));
app.use("/api/RptPaymentRegister", require("./modules/Reports/RptPaymentRegister/RptPaymentRegister.routes"));
app.use("/api/RptTrialBalance", require("./modules/Reports/RptTrialBalance/RptTrialBalance.routes"))
app.use("/api/FrmVoucherPreparreprint", require("./modules/Reports/FrmVoucherPreparreprint/FrmVoucherPreparreprint.routes"));
app.use("/api/FrmBalanceSheet",require("./modules/Reports/FrmBalancesheetRpt/BalancesheetRpt.routes"))
app.use("/api/FrmBudgetReportPDF",require("./modules/Reports/FrmBudgetReport/FrmBudgetReport.routes"));
app.use("/api/FrmChequeBook",require("./modules/Reports/FrmChequeBook/FrmChequeBook.routes"))
app.use("/api/FrmSecurityDeposit",require("./modules/Reports/FrmSecurityDeposit/FrmSecurityDeposit.routes"))
app.use("/api/FrmAccIntDataRpt",require("./modules/Reports/FrmAccIntDataRpt/FrmAccIntDataRpt.Routes"))
app.use("/api/RptGovtTaxRegisters", require("./modules/Reports/RptGovtTaxRegisters/RptGovtTaxRegister.route"))
app.use("/api/FrmSdRefundRpt",require("./modules/Reports/FrmSdRefundRpt/FrmSdRefundRpt.Route"))
app.use("/api/TranRpt", require("./modules/Reports/FrmTransferRegisterRpt/TransferRegisterRpt.route"))
app.use("/api/RptChequeDishonour", require("./modules/Reports/RptChequeDishonour/RptChequeDishonour.routes"))
app.use("/api/FrmChequeUpdateRpt", require("./modules/Reports/FrmChequeUpdateReport/FrmChequeUpdateRpt.route"))
app.use("/api/BankBalRpt", require("./modules/Reports/FrmBankBalanceRpt/FrmBankBalRpt.route"))
app.use("/api/FrmConsolidatedReceipt", require("./modules/Reports/FrmConsolidatedReceipt/FrmConsolidatedReceipt.routes"))
app.use("/api/FrmVouchergenerationReprint",require("./modules/Reports/FrmVouchergenerationReprint/FrmVouchergenerationReprint.routes"))
app.use("/api/FrmContraRecReprint",require("./modules/Reports/frmContraRecReprint/frmContraRecReprint.route"))
app.use("/api/FrmCashDepositReprint",require("./modules/Reports/FrmCashDepositReprint/FrmCashDepositReprint.route"))
app.use(errorMiddleware);

module.exports = app;
