import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { Button } from "@/components/ui/button"
import './App.css'
import FrmReceiptList from './pages/Transaction/FrmReceiptList';
import FrmReceipt from './pages/Transaction/FrmReceipt';
import FrmPaymentList from './pages/Transaction/FrmPaymentList';
import FrmPayment from './pages/Transaction/FrmPayment';
import FrmVoucherPreparationList from './pages/Transaction/FrmVoucherPreparationList';
import FrmVoucherPreparation from './pages/Transaction/FrmVoucherPreparation';
import Layout from './layout/main-layout';
import Login from './pages/Login';
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

import FrmBankReconciliation from "./pages/Transaction/FrmBankReconciliation";
import FrmTransferList from "./pages/Transaction/FrmTransferList";
import FrmTransfer from "./pages/Transaction/FrmTransfer";
import RptClassifiedRegisterDetails from "./pages/Reports/RptClassifiedRegisterDetails";
import FrmSearchOption from "./pages/Transaction/FrmSearchOption";
import RptClassifiedAbstractSummary from "./pages/Reports/RptClassifiedAbstractSummary";
import FrmGovtTaxPayment from "./pages/Transaction/FrmGovtTaxPayment";
import RptReceiptRegisterDetails from "./pages/ReportsForm/RptReceiptRegisterDetails";
import RptLedgerReport from "./pages/Reports/RptLedgerReport";
import Frmconsolidatedreceipt from "./pages/Reports/Frmconsolidatedreceipt";

const Home = () => <Button>Click me</Button>;
const About = () => <h1>About Page</h1>;

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
        path: "/Transactions/FrmReceiptList",
        element: <FrmReceiptList />,
      },
      {
        path: "/Transactions/FrmReceipt",
        element: <FrmReceipt />,
      },
      {
        path: "/Transactions/FrmPaymentList",
        element: <FrmPaymentList />,
      },
      {
        path: "/Transactions/FrmPayment",
        element: <FrmPayment />,
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
        element: <FrmBankReconciliation />
      },
      {
        path: "/Transactions/FrmTransferList",
        element: <FrmTransferList />
      },
      {
        path: "/Transactions/FrmTransfer",
        element: <FrmTransfer />
      },
      {
        path: "/Transactions/FrmGovtTaxPayment",
        element: <FrmGovtTaxPayment />
      },
      {
        path: "/Transactions/FrmContractList",
        element: <FrmContractList />
      },
      {
        path: "/Transactions/FrmContractEntry",
        element: <FrmContractEntry />
      },
      {
        path: "/Transactions/FrmBudgetAccountMap",
        element: <FrmBudgetAccountMap />
      },

      {
        path: "/Transactions/FrmTransAuthList",
        element: <FrmTransAuthList />
      },
      {
        path: "/Transactions/FrmTransAuthMst",
        element: <FrmTransAuthMst />
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
        element: <FrmGrampanchayatMst />
      },
      {
        path: "/Masters/FrmGrampanchayatList",
        element: <FrmGrampanchayatList />
      },
      {
        path: "/Masters/FrmStateList",
        element: <FrmStateList />
      }
      ,
      {
        path: "/Masters/FrmState",
        element: <FrmState />
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
        element: <FrmPartyList />
      },
      {
        path: "/Masters/FrmPartyMaster",
        element: <FrmPartyMaster />
      },
      {
        path: "/Masters/FrmInvestmentTypeList",
        element: <FrmInvestmentTypeList />
      },
      {
        path: "/Masters/FrmBankBranchList",
        element: <FrmBankBranchList />
      },
      {
        path: "/Masters/FrmBudgetList",
        element: <FrmBudgetList />
      },
      {
        path: "/Masters/FrmBudgetMst",
        element: <FrmBudgetMst />
      },
      {
        path: "/Masters/FrmBankBranchMst",
        element: <FrmBankBranchMst />
      },
      {
        path: "/Masters/FrmInvestmentTypeMst",
        element: <FrmInvestmentTypeMst />
      },
      {
        path: "/Masters/FrmBanList",
        element: <FrmBankList />
      },
      {
        path: "/Masters/FrmBankMst",
        element: <FrmBankMst />
      },
      {
        path: "/Masters/FrmzoneList",
        element: <FrmZoneList />
      },
      {
        path: "/Masters/FrmZoneMst",
        element: <FrmZoneMst />
      },
      {
        path: "/Masters/FrmDepositTypeList",
        element: <FrmDepositTypeList />
      },
      {
        path: "/Masters/FrmDepositTypeMst",
        element: <FrmDepositTypeMst />
      },

      {
        path: "/Masters/FrmBudgetHeadConfigList",
        element: <FrmBudgetHeadConfigList />
      },
      {
        path: "/Masters/FrmBudgetHeadConfig",
        element: <FrmBudgetHeadConfig />
      },
      {
        path: "/Masters/FrmChequeBookMst",
        element: <FrmChequeBookMst />
      },

      {
        path: "/Masters/FrmDistrictList",
        element: <FrmDistrictList />
      },
      {
        path: "/Masters/FrmDistrictMst",
        element: <FrmDistrictMst />
      },

      {
        path: "/Masters/FrmCityList",
        element: <FrmCityList />
      },
      {
        path: "/Masters/FrmCityMst",
        element: <FrmCityMst />
      },
      {
        path: "/Masters/FrmBudgetPrepration",
        element: <FrmBudgetPrepration />
      },
      {
        path: "/ReportsForm/RptClassifiedRegisterDetails",
        element: <RptClassifiedRegisterDetails />
      },
      {
        path: "/ReportsForm/RptClassifiedAbstractSummary",
        element: <RptClassifiedAbstractSummary />
      },
      {
        path: "/Transactions/FrmSearchOption",
        element: <FrmSearchOption />
      },

      {
        path: "/ReportsForm/RptReceiptRegister",
        element: <RptReceiptRegister />
      },
      {
        path: "/ReportsForm/RptReceiptRegisterDetails",
        element: <RptReceiptRegisterDetails />
      },

      {
        path: "/ReportsForm/RptLedgerReport",
        element: <RptLedgerReport />
      },
      {
        path: "/Reportsform/Frmconsolidatedreceipt",
        element: <Frmconsolidatedreceipt />
      },
      {
        path: "/about",
        element: <About />,
      },
    ]
  },


]);

function App() {
  return <RouterProvider router={router} />;
}

export default App
