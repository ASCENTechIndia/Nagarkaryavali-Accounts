import React, { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import axios from "axios";
import { DatePicker } from "@/components/ui/calendar";
import Swal from "sweetalert2";
import SearchableSelect from "@/components/SearchableSelect";
import * as XLSX from "xlsx";
import ShadCNTable, {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Formik, Form } from "formik";
import { ledgerReportValidationSchema } from "../validations/global.validation";

const container = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { staggerChildren: 0.08 } },
};

const RptLedgerReport = () => {
  const { user } = useAuth();
  const token = user?.token;
  const ulbId = user?.ulbId;
  const navigate = useNavigate();

  const [transactions, setTransactions] = useState([]);
  const [openingBalance, setOpeningBalance] = useState(0);
  const [closingBalance, setClosingBalance] = useState(0);
  const [loading, setLoading] = useState(false);
  const [zones, setZones] = useState([]);
  const [glCodes, setGlCodes] = useState([]);
  const [ledgerOptions, setLedgerOptions] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [exportFormat, setExportFormat] = useState("pdf");
  const [selectedFormValues, setSelectedFormValues] = useState(null);
  
  const isInitialLoadRef = useRef(true);

  const BASE_URL = import.meta.env.VITE_BASE_URL;

  const initialFormValues = {
    prabhag: "-1",
    deptCode: "",
    ledger: "",
    fromDate: new Date(),
    toDate: new Date(),
  };

  const fetchZones = async () => {
    try {
      const res = await axios.post(
        `${BASE_URL}/api/Receipt/zones`,
        { corp_id: ulbId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res?.data) setZones(res.data.data);
    } catch (err) {
      console.error("Error fetching zones:", err);
    }
  };

  const fetchGLCodes = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/Receipt/searchGLALL`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res?.data?.data) {
        const formatted = res.data.data.map((g) => ({
          label: g.GLSEARCHNAME,
          value: String(g.GLFUNCTION),
        }));
        setGlCodes(formatted);
      }
    } catch (err) {
      console.error("Error fetching GL codes:", err);
    }
  };

  const fetchLedger = async (glcode) => {
    try {
      if (!glcode || !ulbId) return;
      console.log("Fetching ledger for GL code:", glcode);
      
      const res = await axios.post(
        `${BASE_URL}/api/FrmTransfer/credit-leasure`,
        { corp_id: Number(ulbId), glcode: Number(glcode) },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (res?.data?.data?.success) {
        const formatted = res.data.data.rows.map((l) => ({
          label: l.ACCNAME,
          value: String(l.OBJECTCODE),
        }));
        setLedgerOptions(formatted);
      }
    } catch (err) {
      console.error("Error fetching ledger:", err);
    }
  };

  const fetchOpeningBalance = async (glcode, accno, ulbid, fromDate, toDate, zoneid) => {
    try {
      const response = await axios.post(
        `${BASE_URL}/api/RptLedgerReport/ledger/balance`,
        {
          glcode: Number(glcode),
          accno: Number(accno),
          ulbid: Number(ulbid),
          fromDate: fromDate,
          toDate: toDate,
          zoneid: zoneid,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response?.data?.ok && response?.data?.data) {
        // return response.data.data.balance ?? 0;
        const balance = response.data.data.balance ?? 0;
        return Math.abs(balance);
      }
      return 0;
    } catch (error) {
      console.error("Error fetching opening balance:", error);
      return 0;
    }
  };

  const fetchLedgerTransactions = async (glcode, accno, ulbid, fromDate, toDate, zoneid) => {
    try {
      const response = await axios.post(
        `${BASE_URL}/api/RptLedgerReport/ledger/transactions`,
        {
          glcode: Number(glcode),
          accno: Number(accno),
          ulbid: Number(ulbid),
          fromDate: fromDate,
          toDate: toDate,
          zoneid: zoneid,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response?.data?.ok && response?.data?.data) {
        const transactionsList = response.data.data.list || [];
        
        const transformedTransactions = transactionsList.map(transaction => {
          const amount = parseFloat(transaction.AMOUNT) || 0;
          
          if (amount > 0) {
            return {
              ...transaction,
              isCredit: true,
              isDebit: false,
              creditAmount: amount,
              debitAmount: 0,
              crDate: transaction.TRNSDATE,
              crAcCode: transaction.ACCNO,
              crAcName: transaction.ACCNAME,
              crParticulars: transaction.NARRATION,
              crChequeNo: transaction.CHQNO,
              crPanCard: transaction.PANCARD,
              drDate: "",
              drAcCode: "",
              drAcName: "",
              drParticulars: "",
              drChequeNo: "",
              drPanCard: "",
            };
          } else {
            const absAmount = Math.abs(amount);
            return {
              ...transaction,
              isCredit: false,
              isDebit: true,
              debitAmount: absAmount,
              creditAmount: 0,
              drDate: transaction.TRNSDATE,
              drAcCode: transaction.ACCNO,
              drAcName: transaction.ACCNAME,
              drParticulars: transaction.NARRATION,
              drChequeNo: transaction.CHQNO,
              drPanCard: transaction.PANCARD,
              crDate: "",
              crAcCode: "",
              crAcName: "",
              crParticulars: "",
              crChequeNo: "",
              crPanCard: "",
            };
          }
        });
        
        return transformedTransactions;
      }
      return [];
    } catch (error) {
      console.error("Error fetching transactions:", error);
      return [];
    }
  };

  const fetchTransactionDetails = async (transNo) => {
    try {
      const response = await axios.post(
        `${BASE_URL}/api/RptLedgerReport/ledger/transaction-details`,
        { transno: Number(transNo) },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response?.data?.ok && response?.data?.data) {
        return {
          trnstypeid: response.data.data.trnstypeid,
          list: response.data.data.list || [],
        };
      }
      return null;
    } catch (error) {
      console.error("Error fetching transaction details:", error);
      return null;
    }
  };

  const handleSelectTransaction = async (transNo) => {
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

      const result = await fetchTransactionDetails(transNo);

      loaderSwal.close();

      if (!result || !result.list || result.list.length === 0) {
        await Swal.fire({
          text: "व्यवहार तपशील आढळला नाही",
          confirmButtonColor: '#1e3a8a'
        });
        return;
      }

      const transaction = result.list[0];
      const trnstypeid = result.trnstypeid;
      const refNo = transaction.REFNO;

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
      await Swal.fire({
        text: "व्यवहार तपशील मिळवताना त्रुटी",
        confirmButtonColor: '#1e3a8a'
      });
    } finally {
      setLoading(false);
    }
  };

  const validateAndFetchReport = async (values) => {
    console.log("Validating values:", values);
    
    if (!values.deptCode || values.deptCode === "") {
      await Swal.fire({
        text: "विभाग संकेतांक निवडा",
        confirmButtonColor: '#1e3a8a'
      });
      return false;
    }
    if (!values.ledger || values.ledger === "") {
      await Swal.fire({
        text: "लेखाशीर्ष निवडा",
        confirmButtonColor: '#1e3a8a'
      });
      return false;
    }
    if (!values.fromDate) {
      await Swal.fire({
        text: "तारखे पासून रिक्त असू शकत नाही",
        confirmButtonColor: '#1e3a8a'
      });
      return false;
    }
    if (!values.toDate) {
      await Swal.fire({
        text: "तारीख पर्यंत रिक्त असू शकत नाही",
        confirmButtonColor: '#1e3a8a'
      });
      return false;
    }
    if (values.fromDate > values.toDate) {
      await Swal.fire({
        text: "तारीख पर्यंत पेक्षा तारखे पासून मोठे असू शकत नाही",
        confirmButtonColor: '#1e3a8a'
      });
      return false;
    }
    return true;
  };

  const fetchLedgerReport = async (formValues) => {
    try {
      if (!ulbId) return;
      setLoading(true);
      setHasSearched(true);
      setSelectedFormValues(formValues);

      const fromDateFormatted = formatDateForAPI(formValues.fromDate);
      const toDateFormatted = formatDateForAPI(formValues.toDate);
      const zoneid = formValues.prabhag === "-1" ? "-1" : formValues.prabhag;

      const glcode = parseInt(formValues.deptCode);
      const accno = parseInt(formValues.ledger);

      const openingBal = await fetchOpeningBalance(
        glcode,
        accno,
        Number(ulbId),
        fromDateFormatted,
        toDateFormatted,
        zoneid
      );
      setOpeningBalance(openingBal);

      // Fetch transactions
      const transactionsData = await fetchLedgerTransactions(
        glcode,
        accno,
        Number(ulbId),
        fromDateFormatted,
        toDateFormatted,
        zoneid
      );
      setTransactions(transactionsData);

      if (transactionsData.length === 0) {
        await Swal.fire({
          text: "व्यवहार सापडले नाही",
          confirmButtonColor: '#1e3a8a'
        });
      }
    } catch (error) {
      console.error("Error fetching ledger report", error);
      setTransactions([]);
      await Swal.fire({
        text: error.response?.data?.message || "डेटा लोड करताना त्रुटी",
        confirmButtonColor: '#1e3a8a'
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDateForAPI = (date) => {
    if (!date) return null;
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, "0");
    const month = d.toLocaleString('en', { month: 'short' }).toUpperCase();
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const handleFormSubmit = async (values, { setSubmitting }) => {
    const validationResult = ledgerReportValidationSchema.safeParse(values);
    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0];
      console.log("Validation error:", firstError);
      await Swal.fire({
        text: firstError.message,
        confirmButtonColor: '#1e3a8a'
      });
      setSubmitting(false);
      return;
    }
    const isValid = await validateAndFetchReport(values);
    if (!isValid) {
      setSubmitting(false);
      return;
    }
    await fetchLedgerReport(values);
    setSubmitting(false);
  };

  const handleResetForm = (resetForm) => {
    Swal.fire({
      title: 'निश्चिती?',
      text: "सर्व माहिती हटवायची आहे का?",
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'होय, हटवा',
      cancelButtonText: 'रद्द करा'
    }).then((result) => {
      if (result.isConfirmed) {
        resetForm();
        setTransactions([]);
        setOpeningBalance(0);
        setClosingBalance(0);
        setHasSearched(false);
        setLedgerOptions([]);
        setSelectedFormValues(null);
        setLoading(false);
        Swal.fire({
          text: "फॉर्म रीसेट झाला",
          confirmButtonColor: '#1e3a8a',
          timer: 1500
        });
      }
    });
  };

  useEffect(() => {
    if (ulbId) {
      fetchZones();
      fetchGLCodes();
    }
  }, [ulbId]);

  useEffect(() => {
    const totalDrAmount = transactions.reduce(
      (sum, row) => sum + (Math.abs(parseFloat(row.debitAmount)) || 0),
      0
    );
    const totalCrAmount = transactions.reduce(
      (sum, row) => sum + (Math.abs(parseFloat(row.creditAmount)) || 0),
      0
    );
    console.log("totalDrAmount:", totalDrAmount);
    console.log("totalCrAmount:", totalCrAmount);
    console.log("openingBalance:", openingBalance);
    
    const calculatedClosingBalance = openingBalance + totalDrAmount - totalCrAmount;
    console.log("calculatedClosingBalance:", calculatedClosingBalance);
    setClosingBalance(calculatedClosingBalance);
  }, [openingBalance, transactions]);

  const prabhagOptions = [
    { value: "-1", label: "-- ALL --" },
    ...(zones.map((z) => ({
      value: z.ZONEID?.toString(),
      label: z.ZONEENAME,
    })) || []),
  ];

  const totalDrAmount = transactions.reduce(
    (sum, row) => sum + (parseFloat(row.debitAmount) || 0),
    0
  );

  const totalCrAmount = transactions.reduce(
    (sum, row) => sum + (parseFloat(row.creditAmount) || 0),
    0
  );

  const formatDateForDisplay = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const formatNumber = (num) => {
    if (num === null || num === undefined) return "0";
    return Number(num).toLocaleString("en-IN");
  };

  const exportToExcel = () => {

    const excelData = [];

    excelData.push({
      DrTrnsDate: "",
      DrTransNo: "",
      DrDocNo: "",
      DrAccNo: "",
      DrAccName: "",
      pancard: "",
      DrNarration: "",
      DrAmount: "",
      DrChqNo: "",
      CrTrnsDate: "",
      CrTransNo: "",
      CrDocNo: "",
      CrAccNo: "",
      CrAccName: "",
      CrNarration: "",
      CrAmount: "",
      CrChqNo: "",
      Balance: formatNumber(openingBalance),
      DrCr: "",
      Drfunctioncode: "",
      Drobjectcode: "",
      Crfunctioncode: "",
      Crobjectcode: "",
      OpeningBalance: formatNumber(openingBalance),
    });
    
    let runningBalance = openingBalance;
    transactions.forEach((row) => {
      if (row.isCredit) {
        runningBalance = runningBalance - row.creditAmount;
        excelData.push({
          DrTrnsDate: "",
          DrTransNo: "",
          DrDocNo: "",
          DrAccNo: "",
          DrAccName: "",
          pancard: "",
          DrNarration: "",
          DrAmount: "",
          DrChqNo: "",
          CrTrnsDate: formatDateForDisplay(row.crDate),
          CrTransNo: row.TRANSNO || "",
          CrDocNo: row.DOCNO || "",
          CrAccNo: row.crAcCode || "",
          CrAccName: row.crAcName || "",
          CrNarration: row.crParticulars || "",
          CrAmount: formatNumber(row.creditAmount),
          CrChqNo: row.crChequeNo || "",
          Balance: formatNumber(runningBalance),
          DrCr: "Cr.",
          Drfunctioncode: "",
          Drobjectcode: "",
          Crfunctioncode: row.FUNCTIONCODE || "",
          Crobjectcode: row.OBJECTCODE || "",
          OpeningBalance: formatNumber(openingBalance),
        });
      } else if (row.isDebit) {
        runningBalance = runningBalance + row.debitAmount;
        excelData.push({
          DrTrnsDate: formatDateForDisplay(row.drDate),
          DrTransNo: row.TRANSNO || "",
          DrDocNo: row.DOCNO || "",
          DrAccNo: row.drAcCode || "",
          DrAccName: row.drAcName || "",
          pancard: row.drPanCard || "",
          DrNarration: row.drParticulars || "",
          DrAmount: formatNumber(row.debitAmount),
          DrChqNo: row.drChequeNo || "",
          CrTrnsDate: "",
          CrTransNo: "",
          CrDocNo: "",
          CrAccNo: "",
          CrAccName: "",
          CrNarration: "",
          CrAmount: "",
          CrChqNo: "",
          Balance: formatNumber(runningBalance),
          DrCr: "Dr.",
          Drfunctioncode: row.FUNCTIONCODE || "",
          Drobjectcode: row.OBJECTCODE || "",
          Crfunctioncode: "",
          Crobjectcode: "",
          OpeningBalance: formatNumber(openingBalance),
        });
      }
    });
    
    excelData.push({
      DrTrnsDate: "",
      DrTransNo: "",
      DrDocNo: "",
      DrAccNo: "",
      DrAccName: "",
      pancard: "",
      DrNarration: "",
      DrAmount: "",
      DrChqNo: "",
      CrTrnsDate: "",
      CrTransNo: "",
      CrDocNo: "",
      CrAccNo: "",
      CrAccName: "",
      CrNarration: "",
      CrAmount: "",
      CrChqNo: "",
      Balance: formatNumber(closingBalance),
      DrCr: "",
      Drfunctioncode: "",
      Drobjectcode: "",
      Crfunctioncode: "",
      Crobjectcode: "",
      OpeningBalance: formatNumber(openingBalance),
    });
    
    const ws = XLSX.utils.json_to_sheet(excelData);
    
    ws['!cols'] = [
      { wch: 12 }, // DrTrnsDate
      { wch: 12 }, // DrTransNo
      { wch: 10 }, // DrDocNo
      { wch: 15 }, // DrAccNo
      { wch: 40 }, // DrAccName
      { wch: 15 }, // pancard
      { wch: 50 }, // DrNarration
      { wch: 15 }, // DrAmount
      { wch: 12 }, // DrChqNo
      { wch: 12 }, // CrTrnsDate
      { wch: 12 }, // CrTransNo
      { wch: 10 }, // CrDocNo
      { wch: 15 }, // CrAccNo
      { wch: 40 }, // CrAccName
      { wch: 50 }, // CrNarration
      { wch: 15 }, // CrAmount
      { wch: 12 }, // CrChqNo
      { wch: 15 }, // Balance
      { wch: 8 },  // DrCr
      { wch: 15 }, // Drfunctioncode
      { wch: 15 }, // Drobjectcode
      { wch: 15 }, // Crfunctioncode
      { wch: 15 }, // Crobjectcode
      { wch: 15 }, // OpeningBalance
    ];
    
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Ledger_Report");
    XLSX.writeFile(wb, `ledger_report_${formatDateForExport(new Date())}.xlsx`);
  };

  const handlePDFExport = async () => {
    let loaderSwal;
    try {
      if (!selectedFormValues) {
        Swal.fire({
          text: "कृपया प्रथम अहवाल तयार करा",
          confirmButtonColor: "#1e3a8a",
        });
        return;
      }

      const selectedGL = glCodes.find(
        (g) => g.value === selectedFormValues.deptCode
      );

      const selectedLedger = ledgerOptions.find(
        (l) => l.value === selectedFormValues.ledger
      );

      loaderSwal = Swal.fire({
          title: "Generating...",
          text: "Please wait for ledger pdf generation",
          allowOutsideClick: false,
          showConfirmButton: false,
          didOpen: () => {
              Swal.showLoading();
          },
      });

      const payload = {
        glcode: Number(selectedFormValues.deptCode),
        accno: Number(selectedFormValues.ledger),
        ulbid: Number(ulbId),

        fromDate: formatDateForAPI(selectedFormValues.fromDate),
        toDate: formatDateForAPI(selectedFormValues.toDate),

        zoneid:
          selectedFormValues.prabhag === "-1"
            ? "-1"
            : selectedFormValues.prabhag,

        accountHead: selectedGL?.label || "",
        accountCode: selectedLedger?.label || "",
      };

      setLoading(true);

      const res = await axios.post(
        `${BASE_URL}/api/RptLedgerReport/ledger/pdf`,
        payload,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      loaderSwal.close();

      if (res?.data?.success) {
        window.open(res.data.pdfUrl, "_blank");
      } else {
        throw new Error("PDF generation failed");
      }
    } catch (error) {
      console.error("PDF Export Error:", error);
      Swal.fire({
        text: error.response?.data?.message || "PDF तयार करताना त्रुटी",
        confirmButtonColor: "#1e3a8a",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDateForExport = (date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const handleExport = () => {
    if (transactions.length === 0 && openingBalance === 0) {
      Swal.fire({
        text: "कोणतीही माहिती उपलब्ध नाही",
        confirmButtonColor: '#1e3a8a'
      });
      return;
    }

    if (exportFormat === "pdf") {
      handlePDFExport();
    } else {
      exportToExcel();
    }
  };

  const headers = [
    "Select",
    "Date",
    "A/c Code",
    "A/c Name",
    "Particulars",
    "Cheque No",
    "Dr Amount",
    "Cr Date",
    "Cr A/c Code",
    "Cr A/c Name",
    "Pan Card",
    "Cr Particulars",
    "Cr Cheque No",
    "Cr Amount",
  ];

  const keyMapping = {
    Select: "select",
    Date: "date",
    "A/c Code": "acCode",
    "A/c Name": "acName",
    Particulars: "particulars",
    "Cheque No": "chequeNo",
    "Dr Amount": "amount",
    "Cr Date": "dateCr",
    "Cr A/c Code": "acCodeCr",
    "Cr A/c Name": "acNameCr",
    "Pan Card": "panCardNo",
    "Cr Particulars": "particularsCr",
    "Cr Cheque No": "chequeNoCr",
    "Cr Amount": "amountCr",
  };

  const tableRows = [
    {
      select: <span className="font-semibold text-blue-700">Opening Balance:</span>,
      date: "",
      acCode: "",
      acName: "",
      particulars: "",
      chequeNo: "",
      amount: "0",
      dateCr: "",
      acCodeCr: "",
      acNameCr: "",
      panCardNo: "",
      particularsCr: "",
      chequeNoCr: "",
      amountCr: formatNumber(openingBalance),
    },
    ...transactions.map((row) => ({
      select: (
        <Button
          variant="link"
          size="sm"
          className="text-blue-700 px-0"
          onClick={() => handleSelectTransaction(row.TRANSNO)}
          disabled={loading}
        >
          Select
        </Button>
      ),
      // Debit side fields (for negative amounts)
      date: row.drDate ? formatDateForDisplay(row.drDate) : "",
      acCode: row.drAcCode || "",
      acName: row.drAcName || "",
      // particulars: row.drParticulars || "",
      particulars: row.drAcCode && row.drAcName && row.drParticulars 
      ? `${row.drAcCode} - ${row.drAcName} - ${row.drParticulars}`
      : row.drParticulars || "",
      chequeNo: row.drChequeNo || "",
      amount: row.debitAmount ? formatNumber(Math.abs(row.debitAmount)) : "0",
      // Credit side fields (for positive amounts)
      dateCr: row.crDate ? formatDateForDisplay(row.crDate) : "",
      acCodeCr: row.crAcCode || "",
      acNameCr: row.crAcName || "",
      panCardNo: row.crPanCard || row.drPanCard || "",
      // particularsCr: row.crParticulars || "",
      particularsCr: row.crAcCode && row.crAcName && row.crParticulars
      ? `${row.crAcCode} - ${row.crAcName} - ${row.crParticulars}`
      : row.crParticulars || "",
      chequeNoCr: row.crChequeNo || "",
      amountCr: row.creditAmount ? formatNumber(Math.abs(row.creditAmount)) : "0",
    })),
    {
      select: <span className="font-semibold text-blue-700">Closing Balance:</span>,
      date: "",
      acCode: "",
      acName: "",
      particulars: "",
      chequeNo: "",
      amount: "0",
      dateCr: "",
      acCodeCr: "",
      acNameCr: "",
      panCardNo: "",
      particularsCr: "",
      chequeNoCr: "",
      amountCr: formatNumber(closingBalance),
    },
  ];

  useEffect(() => {
    console.log("closingBalance: ", closingBalance)
  }, [closingBalance])

  return (
    <Formik
      initialValues={initialFormValues}
      enableReinitialize={false}
      onSubmit={handleFormSubmit}
    >
      {({ values, setFieldValue, isSubmitting, handleSubmit, resetForm }) => {
        return (
          <Form onSubmit={handleSubmit}>
            <motion.div variants={container} initial="hidden" animate="show">
              <Card className="shadow-sm border">
                <CardHeader className="border-b flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                  <CardTitle className="text-lg font-semibold">
                    खातेवही अहवाल
                  </CardTitle>
                </CardHeader>

                <CardContent className="p-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                      <div className="sm:w-36 shrink-0 flex justify-start sm:justify-between items-center">
                        <Label text="प्रभाग" />
                        <span>:</span>
                      </div>
                      <Select
                        value={values.prabhag}
                        onValueChange={(v) => setFieldValue("prabhag", v)}
                      >
                        <SelectTrigger className="w-full h-9">
                          <SelectValue placeholder="-- विकल्प निवडा --" />
                        </SelectTrigger>
                        <SelectContent>
                          {prabhagOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <div className="sm:w-36 shrink-0 flex justify-start sm:justify-between items-center">
                        <Label text="विभाग संकेतांक." />
                        <span>:</span>
                      </div>
                      <SearchableSelect
                        options={glCodes}
                        value={values.deptCode}
                        onChange={(option) => {
                          console.log("DeptCode onChange - selected option:", option);
                          const val = option?.value || "";
                          setFieldValue("deptCode", val);
                          setFieldValue("ledger", "");
                          setLedgerOptions([]);
                          if (val) {
                            fetchLedger(val);
                          }
                        }}
                        placeholder="विभाग संकेतांक निवडा"
                        className="w-full h-9"
                      />
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <div className="sm:w-36 shrink-0 flex justify-start sm:justify-between items-center">
                        <Label text="लेखाशीर्ष" />
                        <span>:</span>
                      </div>
                      <SearchableSelect
                        options={ledgerOptions}
                        value={values.ledger}
                        onChange={(option) => {
                          console.log("Ledger onChange - selected option:", option);
                          setFieldValue("ledger", option?.value || "");
                        }}
                        placeholder="लेखाशीर्ष निवडा"
                        disabled={!values.deptCode}
                        className="w-full h-9"
                      />
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <div className="sm:w-36 shrink-0 flex justify-start sm:justify-between items-center">
                        <Label text="दिनांका पासुन" />
                        <span>:</span>
                      </div>
                      <DatePicker
                        value={values.fromDate}
                        onChange={(d) => setFieldValue("fromDate", d)}
                        className="w-full h-9"
                      />
                    </div>
                    
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <div className="sm:w-36 shrink-0 flex justify-start sm:justify-between items-center">
                        <Label text="दिनांका पर्यंत" />
                        <span>:</span>
                      </div>
                      <DatePicker
                        value={values.toDate}
                        onChange={(d) => setFieldValue("toDate", d)}
                        className="w-full h-9"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <div className="flex items-center gap-2">
                      <div className="sm:w-36 shrink-0 flex justify-start sm:justify-between items-center">
                        <Label text="Export To" />
                        <span>:</span>
                      </div>
                      <div className="flex items-center gap-4 ml-2">
                        <div className="flex items-center gap-2">
                          <Input
                            type="radio"
                            id="exportPdf"
                            name="exportFormat"
                            value="pdf"
                            checked={exportFormat === "pdf"}
                            onChange={(e) => setExportFormat(e.target.value)}
                            className="h-4 w-4"
                          />
                          <Label htmlFor="exportPdf" className="font-medium text-gray-700 cursor-pointer">
                            PDF
                          </Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <Input
                            type="radio"
                            id="exportExcel"
                            name="exportFormat"
                            value="excel"
                            checked={exportFormat === "excel"}
                            onChange={(e) => setExportFormat(e.target.value)}
                            className="h-4 w-4"
                          />
                          <Label htmlFor="exportExcel" className="font-medium text-gray-700 cursor-pointer">
                            Excel
                          </Label>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-center gap-4">
                    <Button type="submit" disabled={isSubmitting || loading}>
                      {loading ? "लोड करत आहे..." : "प्रक्रिया"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleResetForm(resetForm)}
                      disabled={loading}
                    >
                      हटवा
                    </Button>
                    <Button type="button" variant="outline" onClick={() => navigate(-1)}>
                      बाहेर
                    </Button>
                  </div>

                  <div className="border rounded-lg bg-white">
                    {loading && (
                      <div className="py-10 text-center text-sm text-muted-foreground">
                        माहिती लोड होत आहे...
                      </div>
                    )}

                    {!loading && hasSearched && transactions.length === 0 && openingBalance === 0 && (
                      <div className="py-10 text-center text-sm text-muted-foreground">
                        कोणतीही माहिती उपलब्ध नाही
                      </div>
                    )}

                    {!loading && (transactions.length > 0 || openingBalance !== 0) && (
                      <>
                        <div className="flex justify-end items-center mb-4">
                            <Button 
                              type="button"  
                              onClick={handleExport} className="bg-blue-900 hover:bg-blue-800 text-white px-8">
                              Export
                            </Button>
                        </div>

                        <ShadCNTable
                          headers={headers}
                          data={tableRows}
                          keyMapping={keyMapping}
                          className="max-sm:min-w-95"
                        />

                        <div className="flex justify-center items-center gap-4 p-4 border-t bg-gray-50">
                          <Label className="font-semibold">एकूण :</Label>
                          <Input
                            value={formatNumber(totalDrAmount)}
                            readOnly
                            className="w-32 text-right h-9"
                          />
                          <Input
                            value={formatNumber(totalCrAmount)}
                            readOnly
                            className="w-32 text-right h-9"
                          />
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </Form>
        );
      }}
    </Formik>
  );
};

export default RptLedgerReport;