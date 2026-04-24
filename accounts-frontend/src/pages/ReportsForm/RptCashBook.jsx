import { useAuth } from "@/context/AuthContext";
import axios from "axios";
import { Form, Formik } from "formik";
import { useEffect, useState } from "react";
import Swal from "sweetalert2";

import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import ShadCNTable from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";

const getInitialValues = () => {
  return {
    zone: "-1",
    date: new Date(),
    budgetId: "0",
    nidhiId: "0",
  };
};

const RptCashBook = () => {
  const { user } = useAuth();
  const token = user?.token;
  const ulbId = user?.ulbId;
  const corpCode = user?.corpCode;
  const BASE_URL = import.meta.env.VITE_BASE_URL;
  const navigate = useNavigate();

  const [zones, setZones] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [nidhis, setNidhis] = useState([]);
  const [tableData, setTableData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showTable, setShowTable] = useState(false);
  const [openingBalance, setOpeningBalance] = useState(0);
  const [totals, setTotals] = useState({
    totalRCash: 0,
    totalRBank: 0,
    totalPCash: 0,
    totalPBank: 0,
  });

  useEffect(() => {
    if (!ulbId) return;
    axios
      .post(
        `${BASE_URL}/api/Receipt/zones`,
        { corp_id: ulbId },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      .then((res) => setZones(res.data?.data || []))
      .catch(console.error);
  }, [ulbId, token, BASE_URL]);

  const formatDateForAPI = (date) => {
    if (!date) return null;
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, "0");
    const month = d.toLocaleString("en", { month: "short" }).toUpperCase();
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const formatDateForDisplay = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const fetchTransactionDetails = async (transNo, transType) => {
    const response = await axios.post(
      `${BASE_URL}/api/RptCashBankBalance/transaction-details`,
      {
        transno: Number(transNo),
        transType: transType,
        ulbId: Number(ulbId)
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data?.data;
  };

  const handleSelectTransaction = async (transNo, transType) => {
    if (!transNo) {
      await Swal.fire({
        text: "व्यवहार क्रमांक आढळला नाही",
        confirmButtonColor: '#1e3a8a'
      });
      return;
    }

    setLoading(true);
    let loaderSwal;

    try {
      loaderSwal = Swal.fire({
        title: "Redirecting...",
        text: "Please wait for redirection",
        allowOutsideClick: false,
        showConfirmButton: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      const result = await fetchTransactionDetails(transNo, transType);

      loaderSwal.close();

      if (!result || !result.data) {
        await Swal.fire({
          text: "व्यवहार तपशील आढळला नाही",
          confirmButtonColor: '#1e3a8a'
        });
        return;
      }

      const transaction = result.data;
      const trnstypeid = transaction.trnstypeid;
      const refNo = transaction.refNo;

      const navState = {
        mode: 3,
        receiptNo: refNo,
        transTypeId: trnstypeid,
      };

      if (trnstypeid === 1 || trnstypeid === 2) {
        navigate("/Transactions/FrmReceipt", { state: navState });
      } 
      else if (trnstypeid === 3 || trnstypeid === 4) {
        navigate("/Transactions/FrmPayment", { state: navState });
      } 
      else if (trnstypeid === 5) {
        navigate("/Transactions/FrmTransfer", { state: navState });
      } 
      else {
        await Swal.fire({
          text: "अज्ञात व्यवहार प्रकार",
          confirmButtonColor: '#1e3a8a'
        });
      }

    } catch (error) {
      console.error("Error in handleSelectTransaction:", error);
      if (loaderSwal) loaderSwal.close();
      await Swal.fire({
        text: error.response?.data?.message || "व्यवहार तपशील मिळवताना त्रुटी",
        confirmButtonColor: '#1e3a8a'
      });
    } finally {
      setLoading(false);
    }
  };

  const getOpeningBalance = async (date, zone, ulbId) => {
    try {
      const response = await axios.post(
        `${BASE_URL}/api/RptCashBankBalance/opening-balance`, 
        {
          ulbId: Number(ulbId),
          date: date, 
          zone: zone
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      console.log("Opening Balance Response:", response.data);
      
      if (response.data?.ok && response.data?.data) {
        return {
          balance: response.data.data.balance,
          drCr: response.data.data.drCr
        };
      }
      return { balance: 0, drCr: "Cr." };
    } catch (error) {
      console.error("Error fetching opening balance:", error);
      return { balance: 0, drCr: "Cr." };
    }
  };

  // const handleSearch = async (values) => {
  //   try {
  //     setLoading(true);

  //     const formattedDate = formatDateForAPI(values.date);
  //     const zoneValue = values.zone === "-1" ? "" : values.zone;

  //     const payload = {
  //       ulbId: Number(ulbId),
  //       date: formattedDate,
  //       zone: zoneValue,
  //     };

  //     const prevDate = new Date(values.date);
  //     prevDate.setDate(prevDate.getDate() - 1);
  //     const openingBal = await getOpeningBalance(prevDate, zoneValue, ulbId);
  //     setOpeningBalance(Math.abs(openingBal));

  //     const res = await axios.post(
  //       `${BASE_URL}/api/RptCashBankBalance/detailcashbook`,
  //       payload,
  //       {
  //         headers: { Authorization: `Bearer ${token}` },
  //       }
  //     );

  //     if (res.data?.data?.success && res.data?.data?.list) {
  //       const list = res.data.data.list;
        
  //       if (list.length === 0) {
  //         Swal.fire("No Data", "No records found", "warning");
  //         setTableData([]);
  //         setShowTable(false);
  //       } else {
  //         const openingRow = {
  //           RSrNo: "",
  //           RTrnsDate: formatDateForDisplay(values.date),
  //           RDocNo: "",
  //           RAccNo: "",
  //           RNarration: "ओपनिंग रोख आणि बँक शिल्लक",
  //           RCashAmount: "",
  //           RBankAmount: "",
  //           PSrNo: "",
  //           PTrnsDate: "",
  //           PDocNo: "",
  //           PAccNo: "",
  //           PNarration: "",
  //           PCashAmount: "",
  //           PBankAmount: "",
  //           Balance: Math.abs(openingBal),
  //           DrCr: openingBal >= 0 ? "Cr." : "Dr.",
  //           RTransNo: "",
  //           PTransNo: "",
  //           isOpeningRow: true,
  //         };
          
  //         const transformedData = [openingRow, ...list];
  //         setTableData(transformedData);
          
  //         if (res.data.data.totals) {
  //           setTotals(res.data.data.totals);
  //         } else {
  //           calculateTotals(transformedData);
  //         }
          
  //         setShowTable(true);
  //       }
  //     } else {
  //       Swal.fire("No Data", "No records found", "warning");
  //       setTableData([]);
  //       setShowTable(false);
  //     }
  //   } catch (err) {
  //     console.error("Error:", err);
  //     Swal.fire("Error", err.response?.data?.message || "Something went wrong", "error");
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const handleSearch = async (values) => {
    debugger;
    try {
      setLoading(true);

      const formattedDate = formatDateForAPI(values.date);
      const zoneValue = values.zone === "-1" ? "-1" : values.zone;

      const prevDate = new Date(values.date);
      prevDate.setDate(prevDate.getDate() - 1);
      const prevDateFormatted = formatDateForAPI(prevDate);
      
      console.log("Fetching opening balance for:", prevDateFormatted);
      
      const openingBalData = await getOpeningBalance(prevDateFormatted, zoneValue, ulbId);
      const openingBalanceValue = openingBalData.balance;
      const openingDrCr = openingBalData.drCr;
      
      console.log("Opening Balance:", openingBalanceValue, openingDrCr);

      const payload = {
        ulbId: Number(ulbId),
        date: formattedDate,
        zone: zoneValue,
      };

      console.log("Fetching transactions for:", formattedDate);
      
      const res = await axios.post(
        `${BASE_URL}/api/RptCashBankBalance/detailcashbook`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data?.data?.success) {
        let list = res.data.data.list || [];
        
        const openingRow = {
          RSrNo: "",
          RTrnsDate: formatDateForDisplay(values.date),
          RDocNo: "",
          RAccNo: "",
          RNarration: "ओपनिंग रोख आणि बँक शिल्लक",
          RCashAmount: "",
          RBankAmount: "",
          PSrNo: "",
          PTrnsDate: "",
          PDocNo: "",
          PAccNo: "",
          PNarration: "",
          PCashAmount: "",
          PBankAmount: "",
          Balance: openingBalanceValue,
          DrCr: openingDrCr,
          RTransNo: "",
          PTransNo: "",
          isOpeningRow: true,
        };
        
        if (list.length === 0) {
          setTableData([openingRow]);
          setTotals({ totalRCash: 0, totalRBank: 0, totalPCash: 0, totalPBank: 0 });
          setShowTable(true);
          
          if (list.length === 0 && openingBalanceValue === 0) {
            Swal.fire("No Data", "No records found", "warning");
          }
        } else {
          let runningBalance = openingBalanceValue;
          const processedList = [];
          
          for (let i = 0; i < list.length; i++) {
            const row = list[i];
            
            const change = 
                (row.RCashAmount || 0) + 
                (row.RBankAmount || 0) + 
                (row.RTransferAmount || 0) - 
                (row.PCashAmount || 0) - 
                (row.PBankAmount || 0) - 
                (row.PTransferAmount || 0);

            runningBalance = runningBalance + change;
            
            processedList.push({
              ...row,
              Balance: Math.abs(runningBalance),
              DrCr: runningBalance >= 0 ? "Cr." : "Dr.",
            });
          }
          
          const transformedData = [openingRow, ...processedList];
          setTableData(transformedData);
          
          const totals = list.reduce((acc, row) => ({
            totalRCash: acc.totalRCash + (Number(row.RCashAmount) || 0),
            totalRBank: acc.totalRBank + (Number(row.RBankAmount) || 0),
            totalPCash: acc.totalPCash + (Number(row.PCashAmount) || 0),
            totalPBank: acc.totalPBank + (Number(row.PBankAmount) || 0)
          }), { totalRCash: 0, totalRBank: 0, totalPCash: 0, totalPBank: 0 });
          
          setTotals(totals);
          setShowTable(true);
        }
      } else {
        Swal.fire("No Data", "No records found", "warning");
        setTableData([]);
        setShowTable(false);
      }
    } catch (err) {
      console.error("Error:", err);
      Swal.fire("Error", err.response?.data?.message || "Something went wrong", "error");
    } finally {
      setLoading(false);
    }
  };
  
  const calculateTotals = (data) => {
    const transactionRows = data.filter(row => !row.isOpeningRow);
    
    const totals = transactionRows.reduce(
      (acc, row) => {
        acc.totalRCash += Number(row.RCashAmount) || 0;
        acc.totalRBank += Number(row.RBankAmount) || 0;
        acc.totalPCash += Number(row.PCashAmount) || 0;
        acc.totalPBank += Number(row.PBankAmount) || 0;
        return acc;
      },
      { totalRCash: 0, totalRBank: 0, totalPCash: 0, totalPBank: 0 }
    );
    setTotals(totals);
  };

  const headers = [
    "निवडा",
    "अनुक्रमांक",
    "दिनांक",
    "प्रमाणक क्र.",
    "खाते कोड",
    "कथन (Receipt)",   
    "रोख रक्कम",
    "बँकेची रक्कम",

    "अनुक्रमांक (Payment)", 
    "दिनांक (Payment)",
    "प्रमाणक क्र. (Payment)",
    "खाते संकेतांक",
    "कथन (Payment)",    
    "रोख रक्कम (Payment)",
    "बँकेची रक्कम (Payment)",

    "शिलक",
    "Dr/Cr",
  ];

  const keyMapping = {
    निवडा: "select",
    अनुक्रमांक: "RSrNo",
    दिनांक: "RTrnsDate",
    "प्रमाणक क्र.": "RDocNo",
    "खाते कोड": "RAccNo",
    "कथन (Receipt)": "RNarration",
    "रोख रक्कम": "RCashAmount",
    "बँकेची रक्कम": "RBankAmount",
    "अनुक्रमांक (Payment)": "PSrNo",
    "दिनांक (Payment)": "PTrnsDate",
    "प्रमाणक क्र. (Payment)": "PDocNo",
    "खाते संकेतांक": "PAccNo",
    "कथन (Payment)": "PNarration",
    "रोख रक्कम (Payment)": "PCashAmount",
    "बँकेची रक्कम (Payment)": "PBankAmount",
    शिलक: "Balance",
    "Dr/Cr": "DrCr",
  };

  const tableRows = tableData.map((row, index) => {
    const isOpeningRow = row.isOpeningRow === true;
    
    if (isOpeningRow) {
      return {
        select: (
          <Button
            variant="link"
            size="sm"
            className="text-blue-700 px-1"
            disabled={true}
          >
            निवडा
          </Button>
        ),
        RSrNo: "",
        RTrnsDate: row.RTrnsDate,
        RDocNo: "",
        RAccNo: "",
        RNarration: row.RNarration,
        RCashAmount: "",
        RBankAmount: "",
        PSrNo: "",
        PTrnsDate: "",
        PDocNo: "",
        PAccNo: "",
        PNarration: "",
        PCashAmount: "",
        PBankAmount: "",
        Balance: row.Balance ? Number(row.Balance).toLocaleString("en-IN") : "",
        DrCr: row.DrCr,
      };
    }
    
    const hasReceipt = row.RTransNo !== null && row.RTransNo !== undefined && row.RTransNo !== "";
    const hasPayment = row.PTransNo !== null && row.PTransNo !== undefined && row.PTransNo !== "";

    console.log("Rows: ", row);
    
    return {
      select: (
        <Button
          variant="link"
          size="sm"
          className="text-blue-700 px-1"
          onClick={() => {
            if (hasReceipt && row.RTransNo) {
              handleSelectTransaction(row.RTransNo, "R");
            } else if (hasPayment && row.PTransNo) {
              handleSelectTransaction(row.PTransNo, "P");
            }
          }}
          disabled={loading || (!hasReceipt && !hasPayment)}
        >
          निवडा
        </Button>
      ),

      RSrNo: hasReceipt ? row.RSrNo : "",
      RTrnsDate: hasReceipt && row.RTrnsDate ? formatDateForDisplay(row.RTrnsDate) : "",
      RDocNo: hasReceipt ? row.RDocNo : "",
      RAccNo: hasReceipt ? row.RAccNo : "",
      RNarration: hasReceipt ? row.RNarration : "",
      RCashAmount: hasReceipt && row.RCashAmount ? Number(row.RCashAmount).toLocaleString("en-IN") : "",
      RBankAmount: hasReceipt && row.RBankAmount ? Number(row.RBankAmount).toLocaleString("en-IN") : "",
      
      PSrNo: hasPayment ? row.PSrNo : "",
      PTrnsDate: hasPayment && row.PTrnsDate ? formatDateForDisplay(row.PTrnsDate) : "",
      PDocNo: hasPayment ? row.PDocNo : "",
      PAccNo: hasPayment ? row.PAccNo : "",
      PNarration: hasPayment ? row.PNarration : "",
      PCashAmount: hasPayment && row.PCashAmount ? Number(row.PCashAmount).toLocaleString("en-IN") : "",
      PBankAmount: hasPayment && row.PBankAmount ? Number(row.PBankAmount).toLocaleString("en-IN") : "",
      
      Balance: row.Balance ? Number(row.Balance).toLocaleString("en-IN") : "",
      DrCr: row.DrCr,
    };
  });

  const lastRow = tableData[tableData.length - 1];
  const closingBalance = lastRow?.Balance || 0;
  const closingDrCr = lastRow?.DrCr || "Cr.";

  const handleExportPDF = async (values) => {
    let loaderSwal;
    try {
      setLoading(true);
      
      const formattedDate = formatDateForAPI(values.date);
      const zoneValue = values.zone === "-1" ? "-1" : values.zone;

      loaderSwal = Swal.fire({
          title: "Generating...",
          text: "Please wait for cashbook pdf generation",
          allowOutsideClick: false,
          showConfirmButton: false,
          didOpen: () => {
              Swal.showLoading();
          },
      });
      
      
      const payload = {
        ulbId: Number(ulbId),
        date: formattedDate,
        zone: zoneValue,
      };
      
      const response = await axios.post(
        `${BASE_URL}/api/RptCashBankBalance/detailcashbookpdf`,
        payload,
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: 'json'
        }
      );

      loaderSwal.close();
      
      if (response.data?.success && response.data?.pdfUrl) {
        window.open(response.data.pdfUrl, '_blank');
        
        Swal.fire({
          text: "PDF generated successfully!",
          confirmButtonColor: "#1e3a8a",
          timer: 2000
        });
      } else {
        Swal.fire({
          text: "Failed to generate PDF",
          confirmButtonColor: "#1e3a8a"
        });
      }
    } catch (error) {
      console.error("PDF Export Error:", error);
      Swal.fire({
        text: error.response?.data?.message || "Error generating PDF",
        confirmButtonColor: "#1e3a8a"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = async (values) => {
    try {
      const excelData = [];
      
      excelData.push([
        "RSrNo", "RTransNo", "RTrnsDate", "RDocNo", "RGLCode", "RAccNo", 
        "RAccNoWith0", "RNarration", "RCashAmount", "RBankAmount", "RChqNo", 
        "RTransferAmount", "RZone", "RDepartment", "RAccname", "ReceiptTotal", 
        "PSrNo", "PTransNo", "PTrnsDate", "PDocNo", "PGLCode", "PAccNo", 
        "PAccNowith0", "PNarration", "PCashAmount", "PBankAmount", "PChqNo", 
        "PTransferAmount", "PAccname", "PartyName", "Balance", "DrCr", "PaymentTotal"
      ]);
      
      tableData.forEach((row) => {
        const isOpeningRow = row.isOpeningRow === true;
        
        if (isOpeningRow) {
          excelData.push([
            "", "", "", "", "", "", "",
            row.RNarration || "ओपनिंग रोख आणि बँक शिल्लक",
            "", "", "", "",
            "", "",
            "", "",
            "", "", "", "", "", "", "", "",
            "", "", "", "", "", "",
            row.Balance || 0,
            row.DrCr || "Cr.",
            ""
          ]);
        } else {
          const hasReceipt = row.RTransNo !== null && row.RTransNo !== undefined && row.RTransNo !== "";
          const hasPayment = row.PTransNo !== null && row.PTransNo !== undefined && row.PTransNo !== "";
          
          excelData.push([
            hasReceipt ? row.RSrNo : "",
            hasReceipt ? row.RTransNo : "",
            hasReceipt && row.RTrnsDate ? new Date(row.RTrnsDate).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }) : "",
            hasReceipt ? row.RDocNo : "",
            hasReceipt ? row.RGLCode : "",
            hasReceipt ? row.RAccNo : "",
            hasReceipt ? row.RAccNoWith0 : "",
            hasReceipt ? row.RNarration : "",
            hasReceipt ? (row.RCashAmount || 0) : "",
            hasReceipt ? (row.RBankAmount || 0) : "",
            hasReceipt ? row.RChqNo : "",
            hasReceipt ? (row.RTransferAmount || 0) : "",
            hasReceipt ? row.RZone : "",
            hasReceipt ? row.RDepartment : "",
            hasReceipt ? row.RAccname : "",
            hasReceipt ? (row.ReceiptTotal || 0) : "",
            
            hasPayment ? row.PSrNo : "",
            hasPayment ? row.PTransNo : "",
            hasPayment && row.PTrnsDate ? new Date(row.PTrnsDate).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }) : "",
            hasPayment ? row.PDocNo : "",
            hasPayment ? row.PGLCode : "",
            hasPayment ? row.PAccNo : "",
            hasPayment ? row.PAccNowith0 : "",
            hasPayment ? row.PNarration : "",
            hasPayment ? (row.PCashAmount || 0) : "",
            hasPayment ? (row.PBankAmount || 0) : "",
            hasPayment ? row.PChqNo : "",
            hasPayment ? (row.PTransferAmount || 0) : "",
            hasPayment ? row.PAccname : "",
            hasPayment ? row.PartyName : "",
            
            row.Balance || 0,
            row.DrCr || "",
            hasPayment ? (row.PaymentTotal || 0) : ""
          ]);
        }
      });
      
      const ws = XLSX.utils.aoa_to_sheet(excelData);
      
      const colWidths = [
        { wch: 8 },   // RSrNo
        { wch: 10 },  // RTransNo
        { wch: 12 },  // RTrnsDate
        { wch: 12 },  // RDocNo
        { wch: 8 },   // RGLCode
        { wch: 12 },  // RAccNo
        { wch: 15 },  // RAccNoWith0
        { wch: 40 },  // RNarration
        { wch: 12 },  // RCashAmount
        { wch: 12 },  // RBankAmount
        { wch: 10 },  // RChqNo
        { wch: 12 },  // RTransferAmount
        { wch: 10 },  // RZone
        { wch: 15 },  // RDepartment
        { wch: 30 },  // RAccname
        { wch: 12 },  // ReceiptTotal
        { wch: 8 },   // PSrNo
        { wch: 10 },  // PTransNo
        { wch: 12 },  // PTrnsDate
        { wch: 12 },  // PDocNo
        { wch: 8 },   // PGLCode
        { wch: 12 },  // PAccNo
        { wch: 15 },  // PAccNowith0
        { wch: 40 },  // PNarration
        { wch: 12 },  // PCashAmount
        { wch: 12 },  // PBankAmount
        { wch: 10 },  // PChqNo
        { wch: 12 },  // PTransferAmount
        { wch: 30 },  // PAccname
        { wch: 20 },  // PartyName
        { wch: 12 },  // Balance
        { wch: 8 },   // DrCr
        { wch: 12 }   // PaymentTotal
      ];
      ws['!cols'] = colWidths;
      
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Sheet1");

      const formattedDate = formatDateForAPI(values.date);

      
      const fileName = `CashBook${formattedDate}.xls`;
      
      XLSX.writeFile(wb, fileName);
      
      Swal.fire({
        text: "Excel exported successfully!",
        confirmButtonColor: "#1e3a8a",
        timer: 2000
      });
    } catch (error) {
      console.error("Excel Export Error:", error);
      Swal.fire({
        text: "Error exporting Excel",
        confirmButtonColor: "#1e3a8a"
      });
    }
  };

  return (
    <Formik initialValues={getInitialValues()} onSubmit={handleSearch}>
      {({ values, setFieldValue, resetForm }) => (
        <Form>
          <Card className="shadow-sm border rounded-lg">
            <CardHeader className="border-b">
              <CardTitle className="text-lg font-semibold">कॅश बुक</CardTitle>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                  <div className="sm:w-36 shrink-0 flex justify-start sm:justify-between items-center">
                    <Label>झोन</Label>
                    <span>:</span>
                  </div>
                  <Select
                    value={values.zone}
                    onValueChange={(v) => setFieldValue("zone", v)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="-- ALL --" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="-1">-- ALL --</SelectItem>
                      {zones.map((z) => (
                        <SelectItem key={z.ZONEID} value={String(z.ZONEID)}>
                          {z.ZONEENAME}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <div className="sm:w-36 shrink-0 flex justify-start sm:justify-between items-center">
                    <Label>दिनांक</Label>
                    <span>:</span>
                  </div>
                  <DatePicker
                    value={values.date}
                    onChange={(d) => setFieldValue("date", d)}
                  />
                </div>
              </div>

              {showTable && tableData.length > 0 && (
                <div className="border rounded-md overflow-x-auto">
                  <div className="flex justify-end items-center mb-4 gap-4">
                      <Button 
                        type="button"  
                        onClick={() => handleExportPDF(values)} 
                        className="bg-blue-900 hover:bg-blue-800 text-white px-8"
                      >
                        PDF
                      </Button>
                      <Button 
                        type="button"  
                        onClick={() => handleExportExcel(values)} 
                        className="bg-blue-900 hover:bg-blue-800 text-white px-8"
                      >
                        Excel
                      </Button>
                  </div>

                  <ShadCNTable
                    headers={headers}
                    data={tableRows}
                    keyMapping={keyMapping}
                    className="min-w-350"
                    pagination
                    rowsPerPage={10}
                  />

                  <div className="flex justify-end items-center gap-4 p-4 border-t">
                    <Label className="font-semibold">एकूण :</Label>
                    <Input
                      value={totals.totalRCash.toLocaleString("en-IN")}
                      readOnly
                      className="w-32 text-right"
                    />
                    <Input
                      value={totals.totalRBank.toLocaleString("en-IN")}
                      readOnly
                      className="w-32 text-right"
                    />
                    <Input
                      value={totals.totalPCash.toLocaleString("en-IN")}
                      readOnly
                      className="w-32 text-right"
                    />
                    <Input
                      value={totals.totalPBank.toLocaleString("en-IN")}
                      readOnly
                      className="w-32 text-right"
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-3 justify-center">
                <Button type="submit" disabled={loading}>
                  {loading ? "Loading..." : "प्रक्रिया"}
                </Button>

                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => {
                    resetForm();
                    setTableData([]);
                    setShowTable(false);
                    setOpeningBalance(0);
                    setTotals({ totalRCash: 0, totalRBank: 0, totalPCash: 0, totalPBank: 0 });
                  }}
                >
                  हटवा
                </Button>

                <Button type="button" variant="outline" path="/">
                  बाहेर जा
                </Button>
              </div>
            </CardContent>
          </Card>
        </Form>
      )}
    </Formik>
  );
};

export default RptCashBook;