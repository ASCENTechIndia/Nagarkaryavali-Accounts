import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { Button } from "@/components/ui/button";
import "./App.css";
import FrmReceiptList from "./pages/Transaction/FrmReceiptList";
import FrmReceipt from "./pages/Transaction/FrmReceipt";
import FrmPaymentList from "./pages/Transaction/FrmPaymentList";
import FrmPayment from "./pages/Transaction/FrmPayment";
import FrmVoucherPreparationList from "./pages/Transaction/FrmVoucherPreparationList";
import FrmVoucherPreparation from "./pages/Transaction/FrmVoucherPreparation";
import Layout from "./layout/main-layout";
import Login from "./pages/Login";
import FrmGLMaster from "./pages/Master/FrmGLMaster";
import FrmGLMasterList from "./pages/Master/FrmGLMasterList";
import FrmPartyList from "./pages/Master/FrmPartyList";
import FrmPartyMaster from "./pages/Master/FrmPartyMaster";
import FrmBankList from "./pages/Master/FrmBanList";
import FrmInvestmentTypeList from "./pages/Master/FrmInvestmentTypeList";
import FrmBankBranchList from "./pages/Master/FrmBankBranchList";
import FrmBudgetList from "./pages/Master/FrmBudgetList";
import FrmBudgetMst from "./pages/Master/FrmBudgetMst";
import FrmBankBranchMst from "./pages/Master/FrmBankBranchMst";
import FrmInvestmentTypeMst from "./pages/Master/FrmInvestmentTypeMst";
import FrmBankMst from "./pages/Master/FrmBankMst";
import FrmZoneList from "./pages/Master/FrmzoneList";
import FrmZoneMst from "./pages/Master/FrmZoneMst";
import FrmDepositTypeList from "./pages/Master/FrmDepositTypeList";
import FrmDepositTypeMst from "./pages/Master/FrmDepositTypeMst";
import FrmChequeBookMst from "./pages/Master/FrmChequeBookMst";
import FrmBudgetHeadConfig from "./pages/Master/FrmBudgetHeadConfig";
import FrmBudgetHeadConfigList from "./pages/Master/FrmBudgetHeadConfigList";
import FrmContractEntry from "./pages/Master/FrmContractEntry";
import FrmContractList from "./pages/Master/FrmContractList";
import FrmDistrictList from "./pages/Master/FrmDistrictList";
import FrmDistrictMst from "./pages/Master/FrmDistrictMst";
import FrmCityList from "./pages/Master/FrmCityList";
import FrmCityMst from "./pages/Master/FrmCityMst";
import FrmBudgetPrepration from "./pages/Transaction/FrmBudgetPrepration";
import FrmBudgetAccountMap from "./pages/Transaction/FrmBudgetAccountMap";
import FrmTransAuthList from "./pages/Transaction/FrmTransAuthList";
import FrmTransAuthMst from "./pages/Transaction/FrmTransAuthMst";
import RptReceiptRegister from "./pages/Reports/RptReceiptRegister";
import FrmAccountMaster from "./pages/Master/FrmAccountMst";
import FrmAccountListMst from "./pages/Master/FrmAccountListMst";
import FrmGrampanchayatMst from "./pages/GenMaster/FrmGrampanchayatMst";
import FrmGrampanchayatList from "./pages/GenMaster/FrmGrampanchayatList";
import FrmStateList from "./pages/GenMaster/FrmStateList";
import FrmState from "./pages/GenMaster/FrmStateMst";
import FrmBalanceSheetGroupMst from "./pages/Master/FrmBalanceSheetGroupMst";
import FrmBalanceSheetGroupList from "./pages/Master/FrmBalanceSheetGroupList";
import FrmBalanceSheetSubGroupList from "./pages/Master/FrmBalanceSheetSubGroupList";
import FrmBalanceSheetSubGroupMst from "./pages/Master/FrmBalanceSheetSubGroupMst";
import Frmauthorizationconfig from "./pages/Master/Frmauthorizationconfig";
import FrmauthorizationconfigList from "./pages/Master/FrmauthorizationconfigList";
import FrmBankReconciliation from "./pages/Transaction/FrmBankReconciliation";
import FrmTransferList from "./pages/Transaction/FrmTransferList";
import FrmTransfer from "./pages/Transaction/FrmTransfer";
import RptClassifiedRegisterDetails from "./pages/Reports/RptClassifiedRegisterDetails";
import FrmSearchOption from "./pages/Transaction/FrmSearchOption";
import RptClassifiedAbstractSummary from "./pages/Reports/RptClassifiedAbstractSummary";
import FrmGovtTaxPayment from "./pages/Transaction/FrmGovtTaxPayment";
import RptReceiptRegisterDetails from "./pages/ReportsForm/RptReceiptRegisterDetails";
import RptTransferRegister from "./pages/ReportsForm/RptTransferRegister";
import RptCashBook from "./pages/ReportsForm/RptCashBook";
import RptCashBankBalance from "./pages/ReportsForm/RptCashBankBalance";
import RptLedgerReport from "./pages/Reports/RptLedgerReport";
import RptPaymentRegister from "./pages/ReportsForm/RptPaymentRegister";
import RptPaymentRegisterDetails from "./pages/ReportsForm/RptPaymentRegisterDetails";
import FrmVoucherGeneration from "./pages/Transaction/FrmVoucherGeneration";
import Frmconsolidatedreceipt from "./pages/Reports/Frmconsolidatedreceipt";
import FrmNidhiList from "./pages/Master/FrmNidhiList";
import FrmNidhiMaster from "./pages/Master/FrmNidhiMaster";
import FrmNidhiConfig from "./pages/Master/FrmNidhiConfig";
import FrmChecRegisterRpt from "./pages/Reports/FrmChecRegisterRpt";
import FrmBillRegisterRpt from "./pages/Reports/FrmBillRegisterRpt";
import FrmVoucherPreparreprint from "./pages/ReportsForm/FrmVoucherPreparreprint";
import FrmHomePage from "./pages/FrmHomePage";
import RptGovtTaxRegisters from "./pages/ReportsForm/RptGovtTaxRegisters";
import FrmChequeBook from "./pages/Reports/FrmChequeBook";
import FrmSecurityDeposit from "./pages/Reports/FrmSecurityDeposit";
import FrmAccIntDataRpt from "./pages/Reports/FrmAccIntDataRpt";
import FrmSdRefundRpt from "./pages/Reports/FrmSdRefundRpt";
import FrmOnlineDeposit from "./pages/Transaction/FrmOnlineDeposit";
import FrmTransferRegisterRpt from "./pages/Reports/FrmTransferRegisterRpt";
import FrmBankDeposit from "./pages/Transaction/FrmBankDeposit";
import RptChequeDishonour from "./pages/Reports/RptChequeDishonour";
import FrmChequeUpdatereport from "./pages/Reports/FrmChequeUpdatereport";
import FrmBulkReceipt from "./pages/Transaction/FrmBulkReceipt";
import FrmCheqCancelchanges from "./pages/Transaction/FrmCheqCancelchanges";
import FrmSDRefund from "./pages/Transaction/FrmSDRefund";
import FrmSDVchPrepMst from "./pages/Transaction/FrmSDVchPrepMst";
import FrmRevokeDeleteRegister from "./pages/Reports/FrmRevokeDeleteRegister";
import FrmTransactionUpdate from "./pages/Transaction/FrmTransactionUpdate";
import FrmCashDeposit from "./pages/Transaction/FrmCashDeposit";
import ChequeDeposit from "./pages/Transaction/ChequeDeposit";
import FrmContraRecReprint from "./pages/ReportsForm/FrmContraRecReprint";
import FrmPaymentReprint from "./pages/ReportsForm/FrmPaymentReprint";
import FrmVouchergenerationReprint from "./pages/Reports/FrmVouchergenerationReprint";
import FrmLedgerDetailRpt from "./pages/ReportsForm/FrmLedgerDetailRpt";
import FrmCashDepositReprint from "./pages/Reports/FrmCashDepositReprint";
import FrmReceiptPaymentRegisterRpt from "./pages/Reports/FrmReceiptPaymentRegisterRpt";
import RptGLAccStatement from "./pages/ReportsForm/RptGLAccStatement";
import FrmReceiptReprint from "./pages/Reports/FrmReceiptReprint";
import FrmReceiptJcmc from "./pages/Transaction/FrmReceiptJcmc";
import FrmReceiptNew from "./pages/Transaction/FrmReceiptNew";
import FrmReceiptListNew from "./pages/Transaction/FrmReceiptListNew";

import useDynamicFavicon from "./utils/useDynamicFavicon";
import FrmReceiptJcmcSC from "./pages/Transaction/FrmReceiptJcmcSC";

const Home = () => <Button>Click me</Button>;

export const router = createBrowserRouter([
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/",
    element: <Layout />,
    children: [
      {
        path: "/HomePage/FrmHomePage",
        element: <FrmHomePage />,
      },
      {
        path: "/Transactions/FrmReceiptList",
        element: <FrmReceiptList />,
      },
      {
        path: "/Transactions/FrmReceipt",
        element: <FrmReceipt />,
      },
      {
        path: "Transactions/FrmVoucherGeneration",
        element: <FrmVoucherGeneration />,
      },
      {
        path: "/Transactions/FrmPaymentList",
        element: <FrmPaymentList />,
      },
      {
        path: "Transactions/FrmBankDeposit",
        element: <FrmBankDeposit />
      },
      {
        path: "/Transactions/FrmPayment",
        element: <FrmPayment />,
      },
      {
        path: "Transactions/FrmCheqCancelchanges",
        element: <FrmCheqCancelchanges />,
      },
      {
        path: "/Transactions/FrmVoucherPreparationList",
        element: <FrmVoucherPreparationList />,
      },
      {
        path: "/Transactions/FrmVoucherPreparation",
        element: <FrmVoucherPreparation />,
      },
      {
        path: "/Transactions/FrmBankReconciliation",
        element: <FrmBankReconciliation />,
      },
      {
        path: "/Transactions/FrmTransferList",
        element: <FrmTransferList />,
      },
      {
        path: "/Transactions/FrmTransfer",
        element: <FrmTransfer />,
      },
      {
        path: "/Transactions/FrmGovtTaxPayment",
        element: <FrmGovtTaxPayment />,
      },
      {
        path: "/Transactions/FrmContractList",
        element: <FrmContractList />,
      },
      {
        path: "/Transactions/FrmContractEntry",
        element: <FrmContractEntry />,
      },
      {
        path: "/Transactions/FrmChequeDeposit",
        element: <ChequeDeposit />,
      },
      {
        path: "/Transactions/FrmBudgetAccountMap",
        element: <FrmBudgetAccountMap />,
      },

      {
        path: "/Transactions/FrmTransAuthList",
        element: <FrmTransAuthList />,
      },
      {
        path: "/Transactions/FrmTransAuthMst",
        element: <FrmTransAuthMst />,
      },
      {
        path: "/Transactions/FrmSearchOption",
        element: <FrmSearchOption />,
      },
      {
        path: "/Transactions/FrmBulkReceipt",
        element: <FrmBulkReceipt />,
      },
      {
        path: "Transactions/FrmSDRefund",
        element: <FrmSDRefund />,
      },
      {
        path: "Transactions/FrmSDVchPrepMst",
        element: <FrmSDVchPrepMst />,
      },
      {
        path: "Transactions/FrmOnlineDeposit",
        element: <FrmOnlineDeposit />,
      },
      {
        path: "Transactions/FrmTransactionUpdate",
        element: <FrmTransactionUpdate />,
      },
      {
        path: "Transactions/FrmCashDeposit",
        element: <FrmCashDeposit />,
      },
      {
        path: "/Masters/FrmAccountListMst",
        element: <FrmAccountListMst />,
      },
      {
        path: "/Masters/FrmAccountMst",
        element: <FrmAccountMaster />,
      },
      {
        path: "Masters/FrmNidhiConfig",
        element: <FrmNidhiConfig />,
      },
      {
        path: "/Masters/FrmauthorizationconfigList",
        element: <FrmauthorizationconfigList />
      },
      {
        path: "/Masters/Frmauthorizationconfig",
        element: <Frmauthorizationconfig />
      },
      {
        path: "/Masters/FrmBalanceSheetGroupList",
        element: <FrmBalanceSheetGroupList />,
      },
      {
        path: "/Masters/FrmBalanceSheetGroupMst",
        element: <FrmBalanceSheetGroupMst />,
      },
      {
        path: "/Masters/FrmBalanceSheetSubGroupList",
        element: <FrmBalanceSheetSubGroupList />,
      },
      {
        path: "/Masters/FrmBalanceSheetSubGroupMst",
        element: <FrmBalanceSheetSubGroupMst />,
      },
      {
        path: "/Masters/FrmGramPanchayat",
        element: <FrmGrampanchayatMst />,
      },
      {
        path: "/Masters/FrmGrampanchayatList",
        element: <FrmGrampanchayatList />,
      },
      {
        path: "/Masters/FrmStateList",
        element: <FrmStateList />,
      },
      {
        path: "/Masters/FrmState",
        element: <FrmState />,
      },
      {
        path: "/Masters/FrmGLMaster",
        element: <FrmGLMaster />,
      },

      {
        path: "/Masters/FrmGLMasterList",
        element: <FrmGLMasterList />,
      },
      {
        path: "/Masters/FrmPartyList",
        element: <FrmPartyList />,
      },
      {
        path: "/Masters/FrmPartyMaster",
        element: <FrmPartyMaster />,
      },
      {
        path: "/Masters/FrmInvestmentTypeList",
        element: <FrmInvestmentTypeList />,
      },
      {
        path: "/Masters/FrmBankBranchList",
        element: <FrmBankBranchList />,
      },
      {
        path: "/Masters/FrmBudgetList",
        element: <FrmBudgetList />,
      },
      {
        path: "/Masters/FrmBudgetMst",
        element: <FrmBudgetMst />,
      },
      {
        path: "/Masters/FrmBankBranchMst",
        element: <FrmBankBranchMst />,
      },
      {
        path: "/Masters/FrmInvestmentTypeMst",
        element: <FrmInvestmentTypeMst />,
      },
      {
        path: "/Masters/FrmBanList",
        element: <FrmBankList />,
      },
      {
        path: "/Masters/FrmBankMst",
        element: <FrmBankMst />,
      },
      {
        path: "/Masters/FrmzoneList",
        element: <FrmZoneList />,
      },
      {
        path: "/Masters/FrmZoneMst",
        element: <FrmZoneMst />,
      },
      {
        path: "/Masters/FrmDepositTypeList",
        element: <FrmDepositTypeList />,
      },
      {
        path: "/Masters/FrmDepositTypeMst",
        element: <FrmDepositTypeMst />,
      },

      {
        path: "/Masters/FrmBudgetHeadConfigList",
        element: <FrmBudgetHeadConfigList />,
      },
      {
        path: "/Masters/FrmBudgetHeadConfig",
        element: <FrmBudgetHeadConfig />,
      },
      {
        path: "/Masters/FrmChequeBookMst",
        element: <FrmChequeBookMst />,
      },

      {
        path: "/Masters/FrmDistrictList",
        element: <FrmDistrictList />,
      },
      {
        path: "/Masters/FrmDistrictMst",
        element: <FrmDistrictMst />,
      },
      {
        path: "/Masters/FrmCityList",
        element: <FrmCityList />,
      },
      {
        path: "/Masters/FrmCityMst",
        element: <FrmCityMst />,
      },
      {
        path: "/Masters/FrmBudgetPrepration",
        element: <FrmBudgetPrepration />,
      },
      {
        path: "/Masters/FrmNidhiList",
        element: <FrmNidhiList />,
      },
      {
        path: "/Masters/FrmNidhiMaster",
        element: <FrmNidhiMaster />,
      },
      {
        path: "/ReportsForm/RptClassifiedRegisterDetails",
        element: <RptClassifiedRegisterDetails />,
      },
      {
        path: "/ReportsForm/RptClassifiedAbstractSummary",
        element: <RptClassifiedAbstractSummary />,
      },

      {
        path: "/ReportsForm/RptReceiptRegister",
        element: <RptReceiptRegister />,
      },
      {
        path: "/ReportsForm/RptReceiptRegisterDetails",
        element: <RptReceiptRegisterDetails />,
      },
      {
        path: "/ReportsForm/RptLedgerReport",
        element: <RptLedgerReport />,
      },
      {
        path: "/Reportsform/Frmconsolidatedreceipt",
        element: <Frmconsolidatedreceipt />,
      },
      {
        path: "/ReportsForm/RptPaymentRegister",
        element: <RptPaymentRegister />,
      },
      {
        path: "ReportsForm/FrmPaymentReprint",
        element: <FrmPaymentReprint />,
      },
      {
        path: "/ReportsForm/RptCashBook",
        element: <RptCashBook />
      },
      {
        path: "ReportsForm/RptCashBook",
        element: <RptCashBook />,
      },
      {
        path: "ReportsForm/RptTransferRegister",
        element: <RptTransferRegister />,
      },
      {
        path: "ReportsForm/RptCashBankBalance",
        element: <RptCashBankBalance />,
      },
      {
        path: "ReportsForm/RptClassifiedRegisterDetails",
        element: <RptClassifiedRegisterDetails />,
      },
      {
        path: "ReportsForm/RptPaymentRegisterDetails",
        element: <RptPaymentRegisterDetails />,
      },
      {
        path: "ReportsForm/FrmBillRegisterRpt",
        element: <FrmBillRegisterRpt />,
      },
      {
        path: "ReportsForm/FrmChecRegisterRpt",
        element: <FrmChecRegisterRpt />,
      },
      {
        path: "ReportsForm/FrmVoucherPreparreprint",
        element: <FrmVoucherPreparreprint />,
      },
      {
        path: "ReportsForm/FrmLedgerDetailRpt",
        element: <FrmLedgerDetailRpt />,
      },
      {
        path: "ReportsForm/RptGovtTaxRegisters",
        element: <RptGovtTaxRegisters />,
      },
      {
        path: "ReportsForm/FrmChequeBook",
        element: <FrmChequeBook />,
      },
      {
        path: "ReportsForm/FrmSecurityDeposit",
        element: <FrmSecurityDeposit />,
      },
      {
        path: "ReportsForm/FrmContraRecReprint",
        element: <FrmContraRecReprint />,
      },
      {
        path: "ReportsForm/FrmAccIntDataRpt",
        element: <FrmAccIntDataRpt />,
      },
      {
        path: "ReportsForm/FrmSdRefundRpt",
        element: <FrmSdRefundRpt />,
      },
      {
        path: "ReportsForm/FrmTransferRegisterRpt",
        element: <FrmTransferRegisterRpt />,
      },
      {
        path: "ReportsForm/RptChequeDishonour",
        element: <RptChequeDishonour />,
      },
      {
        path: "ReportsForm/FrmChequeUpdatereport",
        element: <FrmChequeUpdatereport />,
      },
      {
        path: "ReportsForm/FrmRevokeDeleteRegister",
        element: <FrmRevokeDeleteRegister />,
      },
      {
        path: "ReportsForm/FrmVouchergenerationReprint",
        element: <FrmVouchergenerationReprint />,
      },
       {
        path: "ReportsForm/FrmCashDepositReprint",
        element: <FrmCashDepositReprint />,
      },
       {
        path: "ReportsForm/FrmReceiptPaymentRegisterRpt",
        element: <FrmReceiptPaymentRegisterRpt />,
      },

      {
        path: "ReportsForm/RptGLAccStatement",
        element: <RptGLAccStatement />,
      },
      {
        path: "ReportsForm/FrmReceiptReprint",
        element: <FrmReceiptReprint />,
      },
      {
        path: "/Transactions/FrmReceiptJcmc",
        element: <FrmReceiptJcmc />,
      },
      {
        path: "/Transactions/FrmReceiptNew",
        element: <FrmReceiptNew />,
      },
      {
        path: "/Transactions/FrmReceiptListNew",
        element: <FrmReceiptListNew />,
      },
      {
        path: "/Transactions/FrmReceiptJcmcSC",
        element: <FrmReceiptJcmcSC />,
      },
    ],
  },
]);

function App() {
  useDynamicFavicon();
  return <RouterProvider router={router} />;
}

export default App;
