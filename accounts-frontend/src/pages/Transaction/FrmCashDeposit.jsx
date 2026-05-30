import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/context/AuthContext";
import axios from "axios";
import { Form, Formik } from "formik";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { FrmCashDepositValidationSchema } from "../validations/global.validation";
import SearchableSelect from "@/components/SearchableSelect";

const container = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { staggerChildren: 0.08 } },
};

const FrmCashDeposit = () => {
  const { user } = useAuth();
  const token = user?.token;
  const ulbId = user?.ulbId;

  const [vibhagOptions, setVibhagOptions] = useState([]);
  const [prabhagOptions, setPrabhagOptions] = useState([]);
  const [collCenOptions, setCollCenOptions] = useState([]);
  const [transactionData, setTransactionData] = useState([]);
  const [selectedTransactions, setSelectedTransactions] = useState(new Set());
  const [totalAmount, setTotalAmount] = useState(0);
  const [denominations, setDenominations] = useState([]);
  const [totalDenominationAmount, setTotalDenominationAmount] = useState(0);
  const [isTapshilModalOpen, setIsTapshilModalOpen] = useState(false);
  const [isLekhashirshModalOpen, setIsLekhashirshModalOpen] = useState(false);
  const [tapshilReceipts, setTapshilReceipts] = useState([]);
  const [lekhashirshDetails, setLekhashirshDetails] = useState([]);
  const [selectedTapshil, setSelectedTapshil] = useState(new Set());
  const [selectedLekhashirsh, setSelectedLekhashirsh] = useState(new Set());
  const [selectedRecNos, setSelectedRecNos] = useState([]);
  const [selectedAccNos, setSelectedAccNos] = useState([]);
  const [selectedChallanNos, setSelectedChallanNos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showTables, setShowTables] = useState(false);
  const [depositDate, setDepositDate] = useState(new Date());
  const [deptCode, setDeptCode] = useState("");
  const [ledger, setLedger] = useState("");
  const [glCodes, setGlCodes] = useState([]);
  const [ledgerOptions, setLedgerOptions] = useState([]);
  const [tableLoading, setTableLoading] = useState(false);

  const [formValues, setFormValues] = useState({
    vibhag: "-1",
    prabhag: "-1",
    colCen: "-1",
    fromDate: new Date(),
    toDate: new Date(),
  });

  const BASE_URL = import.meta.env.VITE_BASE_URL;

  const formatDateForAPI = (date) => {
    if (!date) return null;
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, "0");
    const month = d.toLocaleString('en', { month: 'short' }).toUpperCase();
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const formatDateForDisplay = (date) => {
    if (!date) return "";
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const fetchVibhag = async () => {
    try {
      if (!ulbId) return;
      
      const res = await axios.post(
        `${BASE_URL}/api/Receipt/departments`,
        { ulbid: Number(ulbId) },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (res?.data?.ok) {
        const formatted = res.data.data.map((l) => ({
          label: l.DEPTNAME,
          value: String(l.DEPTID),
        }));
        const allFormatted = [{ value: "-1", label: "-- ALL --" }, ...formatted];
        setVibhagOptions(allFormatted);
      }
    } catch (err) {
      console.error("Error fetching vibhag:", err);
    }
  };

  const fetchPrabhag = async (deptId) => {
    try {
      if (!ulbId || !deptId || deptId === "-1") {
        setPrabhagOptions([{ value: "-1", label: "-- ALL --" }]);
        return;
      }
      
      const res = await axios.post(
        `${BASE_URL}/api/FrmCashDeposit/zones-by-department`,
        { deptId: deptId, ulbId: Number(ulbId) },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (res?.data?.ok && res?.data?.data?.success) {
        const formatted = res.data.data.list.map((l) => ({
          label: l.NAME,
          value: String(l.ID),
        }));
        const allFormatted = [{ value: "-1", label: "-- ALL --" }, ...formatted];
        setPrabhagOptions(allFormatted);
      }
    } catch (err) {
      console.error("Error fetching prabhag:", err);
    }
  };

  const fetchCollCenter = async (zoneId) => {
    try {
      if (!zoneId || zoneId === "-1") {
        setCollCenOptions([{ value: "-1", label: "-- ALL --" }]);
        return;
      }
      
      const res = await axios.post(
        `${BASE_URL}/api/RptChequeDishonour/collection-centers`,
        { zoneId: zoneId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (res?.data?.ok && res?.data?.data?.success) {
        const formatted = res.data.data.list.map((l) => ({
          label: l.NAME,
          value: String(l.ID),
        }));
        const allFormatted = [{ value: "-1", label: "-- ALL --" }, ...formatted];
        setCollCenOptions(allFormatted);
      }
    } catch (err) {
      console.error("Error fetching collection center:", err);
    }
  };

  const fetchDenominations = async () => {
    try {
      setTableLoading(true);
    
      const res = await axios.post(
        `${BASE_URL}/api/FrmCashDeposit/denominations`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (res?.data?.data?.success) {
        const formatted = res.data.data.list.map((d) => ({
          ID: d.ID,    
          NAME: d.NAME,
          count: 0,
          total: 0,
        }));
        console.log("Formatted Denominations: ", formatted);
        setDenominations(formatted);
      } else if (res?.data?.data?.list) {
        const formatted = res.data.data.list.map((d) => ({
          ID: d.ID,
          NAME: d.NAME,
          count: 0,
          total: 0,
        }));
        setDenominations(formatted);
      }
    } catch (err) {
      console.error("Error fetching denominations:", err);
    } finally {
      setTableLoading(false);
    }
  };

  const fetchTransactions = async (values, recNos = [], accNos = [], challanNos = []) => {
    try {
      setLoading(true);
      setTableLoading(true);
      
      const payload = {
        ulbId: Number(ulbId),
        deptId: values.vibhag === "-1" ? null : values.vibhag,
        zoneId: values.prabhag === "-1" ? null : values.prabhag,
        collId: values.colCen === "-1" ? null : values.colCen,
        fromDate: formatDateForAPI(values.fromDate),
        toDate: formatDateForAPI(values.toDate),
        recNos: recNos.length > 0 ? recNos : null,
        accNos: accNos.length > 0 ? accNos : null,
        challanNos: challanNos.length > 0 ? challanNos : null,
      };
      
      const res = await axios.post(
        `${BASE_URL}/api/FrmCashDeposit/transactions`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (res?.data?.data?.success) {
        setTransactionData(res.data.data.list);
        setSelectedTransactions(new Set());
        setTotalAmount(0);
      } else {
        setTransactionData([]);
        if (res.data.message !== "No transactions found") {
          Swal.fire({
            text: res.data.message || "कोणतीही माहिती उपलब्ध नाही",
            confirmButtonColor: '#1e3a8a'
          });
        }
      }
    } catch (err) {
      console.error("Fetch Error:", err);
      Swal.fire({ 
        text: err.response?.data?.message || "सर्व्हर त्रुटी निर्माण झाली आहे", 
        confirmButtonColor: '#1e3a8a' 
      });
    } finally {
      setTableLoading(false);
      setLoading(false);
    }
  };

  const fetchTapshilReceipts = async (values) => {
    try {
      setLoading(true);
      
      const payload = {
        ulbId: Number(ulbId),
        deptId: values.vibhag === "-1" ? null : values.vibhag,
        zoneId: values.prabhag === "-1" ? null : values.prabhag,
        collId: values.colCen === "-1" ? null : values.colCen,
        fromDate: formatDateForAPI(values.fromDate),
        toDate: formatDateForAPI(values.toDate),
      };
      
      const res = await axios.post(
        `${BASE_URL}/api/FrmCashDeposit/tapshil-receipts`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (res?.data?.data?.success) {
        setTapshilReceipts(res.data.data.list);
        setSelectedTapshil(new Set());
      } else {
        setTapshilReceipts([]);
        Swal.fire({
          text: res.data.message || "कोणतीही माहिती उपलब्ध नाही",
          confirmButtonColor: '#1e3a8a'
        });
      }
    } catch (err) {
      console.error("Fetch Error:", err);
      Swal.fire({ 
        text: err.response?.data?.message || "सर्व्हर त्रुटी निर्माण झाली आहे", 
        confirmButtonColor: '#1e3a8a' 
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchLekhashirshDetails = async (values) => {
    try {
      setLoading(true);
      
      const payload = {
        ulbId: Number(ulbId),
        deptId: values.vibhag === "-1" ? null : values.vibhag,
        zoneId: values.prabhag === "-1" ? null : values.prabhag,
        collId: values.colCen === "-1" ? null : values.colCen,
        fromDate: formatDateForAPI(values.fromDate),
        toDate: formatDateForAPI(values.toDate),
      };
      
      const res = await axios.post(
        `${BASE_URL}/api/FrmCashDeposit/lekhashirsh`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (res?.data?.data?.success) {
        setLekhashirshDetails(res.data.data.list);
        setSelectedLekhashirsh(new Set());
      } else {
        setLekhashirshDetails([]);
        Swal.fire({
          text: res.data.message || "कोणतीही माहिती उपलब्ध नाही",
          confirmButtonColor: '#1e3a8a'
        });
      }
    } catch (err) {
      console.error("Fetch Error:", err);
      Swal.fire({ 
        text: err.response?.data?.message || "सर्व्हर त्रुटी निर्माण झाली आहे", 
        confirmButtonColor: '#1e3a8a' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAllTransactions = () => {
    if (selectedTransactions.size === transactionData.length) {
      setSelectedTransactions(new Set());
      setTotalAmount(0);
    } else {
      const newSelected = new Set();
      let sum = 0;
      transactionData.forEach((_, index) => {
        newSelected.add(index);
        sum += transactionData[index].AMOUNT;
      });
      setSelectedTransactions(newSelected);
      setTotalAmount(sum);
    }
  };

  const handleTransactionSelect = (index) => {
    const newSelected = new Set(selectedTransactions);
    if (newSelected.has(index)) {
      newSelected.delete(index);
      setTotalAmount(prev => prev - transactionData[index].AMOUNT);
    } else {
      newSelected.add(index);
      setTotalAmount(prev => prev + transactionData[index].AMOUNT);
    }
    setSelectedTransactions(newSelected);
  };

  const handleDenominationCountChange = (index, value) => {
    const count = parseInt(value) || 0;
    const updated = [...denominations];
    const denominationValue = parseInt(updated[index].NAME) || 0;
    updated[index].count = count;
    updated[index].total = count * denominationValue;
    setDenominations(updated);
    const sum = updated.reduce((acc, curr) => acc + curr.total, 0);
    setTotalDenominationAmount(sum);
  };

  const handleSelectAllTapshil = () => {
    if (selectedTapshil.size === tapshilReceipts.length) {
      setSelectedTapshil(new Set());
    } else {
      const newSelected = new Set();
      tapshilReceipts.forEach((_, index) => {
        newSelected.add(index);
      });
      setSelectedTapshil(newSelected);
    }
  };

  const handleTapshilSelect = (index) => {
    const newSelected = new Set(selectedTapshil);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedTapshil(newSelected);
  };

  const handleTapshilOk = (values) => {
    const selectedRecNumbers = [];
    tapshilReceipts.forEach((receipt, index) => {
      if (selectedTapshil.has(index)) {
        selectedRecNumbers.push(receipt.RECNO);
      }
    });
    setSelectedRecNos(selectedRecNumbers);
    setIsTapshilModalOpen(false);
    fetchTransactions(values, selectedRecNumbers, selectedAccNos, selectedChallanNos);
  };

  const handleSelectAllLekhashirsh = () => {
    if (selectedLekhashirsh.size === lekhashirshDetails.length) {
      setSelectedLekhashirsh(new Set());
    } else {
      const newSelected = new Set();
      lekhashirshDetails.forEach((_, index) => {
        newSelected.add(index);
      });
      setSelectedLekhashirsh(newSelected);
    }
  };

  const handleLekhashirshSelect = (index) => {
    const newSelected = new Set(selectedLekhashirsh);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedLekhashirsh(newSelected);
  };

  const handleLekhashirshOk = (values) => {
    const selectedAccNumbers = [];
    const selectedChallanNumbers = [];
    lekhashirshDetails.forEach((detail, index) => {
      if (selectedLekhashirsh.has(index)) {
        selectedAccNumbers.push(detail.ACCNO);
        if (detail.challano) {
          selectedChallanNumbers.push(detail.CHALLANO);
        }
      }
    });
    setSelectedAccNos(selectedAccNumbers);
    setSelectedChallanNos(selectedChallanNumbers);
    setIsLekhashirshModalOpen(false);
    fetchTransactions(values, selectedRecNos, selectedAccNumbers, selectedChallanNumbers);
  };

  const handleFormSubmit = async (values, { setSubmitting }) => {
    try {
      if (values.vibhag === "7" && values.prabhag !== "-1") {
        if (values.colCen === "-1" || values.colCen === "0" || values.colCen === "") {
          Swal.fire({
            text: "कृपया कलेक्शन सेंटर निवडा",
            confirmButtonColor: '#1e3a8a'
          });
          setSubmitting(false);
          return;
        }
      }
      
      const validationResult = FrmCashDepositValidationSchema.safeParse(values);
      if (!validationResult.success) {
        const firstError = validationResult.error.issues[0];
        Swal.fire({
          text: firstError.message,
          confirmButtonColor: '#1e3a8a'
        });
        setSubmitting(false);
        return;
      }
      
      setSelectedRecNos([]);
      setSelectedAccNos([]);
      setSelectedChallanNos([]);
      
      setShowTables(true);
      
      await Promise.all([
        fetchTransactions(values),
        fetchDenominations(),
        fetchGLCodes()
      ]);
      
    } catch (err) {
      console.error("Submit Error:", err);
    } finally {
      setSubmitting(false);
    }
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
        setFormValues({
          vibhag: "-1",
          prabhag: "-1",
          colCen: "-1",
          fromDate: new Date(),
          toDate: new Date(),
        });
        setTransactionData([]);
        setSelectedTransactions(new Set());
        setTotalAmount(0);
        setDenominations([]);
        setTotalDenominationAmount(0);
        setSelectedRecNos([]);
        setSelectedAccNos([]);
        setSelectedChallanNos([]);
        setDepositDate(new Date());
        setShowTables(false);
        Swal.fire({
          text: "फॉर्म रीसेट झाला",
          confirmButtonColor: '#1e3a8a',
          timer: 1500
        });
      }
    });
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

  const handlePrintPDF = async (selectedGL, selectedLedger, refNo, transNo, hasDenomination = true) => {
    try {
      const loader = Swal.fire({
        title: "Generating PDF...",
        allowOutsideClick: false,
        showConfirmButton: false,
        didOpen: () => Swal.showLoading(),
      });

      const res = await axios.post(
        `${BASE_URL}/api/FrmCashDeposit/generate-cash-deposit-pdf`,
        {
          ulbId: Number(ulbId),
          refNo: Number(refNo),
          glName: selectedGL?.label,
          ledgerName: selectedLedger?.label,
          transNo: transNo,
          hasDenomination
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      loader.close();

      if (res?.data?.success && res?.data?.pdfUrl) {
        window.open(res.data.pdfUrl, "_blank");
      } else {
        throw new Error("PDF generation failed");
      }
    } catch (error) {
      console.error("PDF Error:", error);
      Swal.fire({
        text: error.response?.data?.message || "PDF तयार करताना त्रुटी आली.",
        confirmButtonColor: "#1e3a8a",
      });
    }
  };

  const handleSave = async (values, resetForm) => {
    try {
      if (values.vibhag === "7" && values.prabhag !== "-1") {
        if (values.colCen === "-1" || values.colCen === "0" || values.colCen === "") {
          Swal.fire({
            text: "कृपया कलेक्शन सेंटर निवडा",
            confirmButtonColor: '#1e3a8a'
          });
          return;
        }
      }

      if (selectedTransactions.size === 0) {
        Swal.fire({
          text: "कृपया किमान एक रेकॉर्ड निवडा",
          confirmButtonColor: '#1e3a8a'
        });
        return;
      }

      const hasAnyDenomination = denominations.some(d => d.count > 0);
      // if (!hasAnyDenomination) {
      //   Swal.fire({
      //     text: "कृपया किमान एक Denomination तपशील भरा",
      //     confirmButtonColor: '#1e3a8a'
      //   });
      //   return;
      // }

      const hasInvalidCount = denominations.some(d => d.count < 0);
      if (hasInvalidCount) {
        Swal.fire({
          text: "Denomination मध्ये ऋण (negative) रक्कम असू शकत नाही",
          confirmButtonColor: '#1e3a8a'
        });
        return;
      }

      if (hasAnyDenomination) {
        const totalDenomAmt = totalDenominationAmount;
        const totalAmt = totalAmount;

        if (totalAmt !== totalDenomAmt) {
          Swal.fire({
            text: `Denomination Amount (${totalDenomAmt.toLocaleString(
              "en-IN"
            )}) आणि Total Amount (${totalAmt.toLocaleString(
              "en-IN"
            )}) जुळत नाही`,
            confirmButtonColor: "#1e3a8a",
          });
          return;
        }
      }

      if (!depositDate) {
        Swal.fire({
          text: "डेपोसिट तारीख रिक्त असू शकत नाही",
          confirmButtonColor: '#1e3a8a'
        });
        return;
      }

      if (!deptCode) {
        Swal.fire({
          text: "डेबिट जी.एल. रिक्त असू शकत नाही",
          confirmButtonColor: '#1e3a8a'
        });
        return;
      }

      if (!ledger) {
        Swal.fire({
          text: "डेबिट खाते रिक्त असू शकत नाही",
          confirmButtonColor: '#1e3a8a'
        });
        return;
      }

      setLoading(true);

      const transDate = formatDateForAPI(depositDate);
      const voucherNo = "111";
      const transType = "2";
      const debitGL = deptCode;
      const debitAcc = ledger;
      const collId = (values.colCen === "-1" || values.colCen === "0" || values.colCen === "") ? "" : values.colCen;
      
      const receiptMst = [
        transDate,
        voucherNo,
        transType,
        "0",
        "0",
        String(debitGL),
        String(debitAcc),
        "5",
        "0",
        "",
        "",
        "0",
        collId || ""
      ].join("~");

      let receiptDtl = "";
      let selectedRows = [];

      transactionData.forEach((row, index) => {
        if (selectedTransactions.has(index)) {
          selectedRows.push(row);
          const recNo = "";
          const recDate = "";
          // const recNo = row.RECNO ?? "";      
          // const recDate = row.RECDATE ? formatDateForAPI(new Date(row.RECDATE)) : "";
          const mode = "1";
          const department = String(row.DEPTID ?? "");
          const amount = String(row.AMOUNT ?? "0");
          const zoneId = String(
            values.prabhag !== "-1"
              ? values.prabhag
              : "-1"
          );
          const cashierType = "Cash";
          const cheqNo = "";
          const cheqDt = "";
          const bankName = "";
          const glcode = row.GLCODE ?? "";
          const accno = row.ACCNO ?? "";
          const glcodeS = String(row.GLCODEG ?? "");
          const accnoS = String(row.ACCNOG ?? "");
          
          receiptDtl += [
            String(recNo ?? ""),
            String(recDate ?? ""),
            String(mode ?? ""),
            String(department ?? ""),
            String(amount ?? ""),
            String(zoneId ?? ""),
            String(cashierType ?? ""),
            String(cheqNo ?? ""),
            String(cheqDt ?? ""),
            String(bankName ?? ""),
            String(glcode ?? ""),
            String(accno ?? ""),
            String(glcodeS ?? ""),
            String(accnoS ?? "")
          ].join("#") + "$";
        }
      });
      
      receiptDtl = receiptDtl.replace(/\$$/, "");
      
      if (!receiptDtl) {
        Swal.fire({
          text: "कृपया किमान एक रेकॉर्ड निवडा",
          confirmButtonColor: '#1e3a8a'
        });
        setLoading(false);
        return;
      }

      if (!receiptDtl || receiptDtl.trim() === "") {
        console.log("INVALID receiptDtl");
        return;
      }

      let recnos = "";
      if (selectedRecNos.length > 0) {
        recnos = selectedRecNos
          .map(x => `'${String(x)}'`)
          .join(",");
      }

      const selectedGL = glCodes.find(
        (g) => g.value === deptCode 
      );

      const selectedLedger = ledgerOptions.find(
        (l) => l.value === ledger
      );

      console.log("receiptMst:", receiptMst);
      console.log("receiptDtl:", receiptDtl);
      console.log("receiptDtl split:", receiptDtl.split("$"));

      const bankDepositPayload = {
        ulbId: Number(ulbId),
        userId: String(user?.userId), 
        paramStr: receiptMst,
        paramStr1: receiptDtl,
        paramStr2: recnos,
        fromDate: formatDateForAPI(values.fromDate),
        toDate: formatDateForAPI(values.toDate),
        deptId: values.vibhag === "-1" ? null : values.vibhag,
        zoneId: values.prabhag === "-1" ? null : values.prabhag,
        collId: values.colCen === "-1" ? null : values.colCen,
      };

      console.log("bankDepositPayload: ", bankDepositPayload)

      const bankRes = await axios.post(
        `${BASE_URL}/api/FrmCashDeposit/save-bank-deposit`,
        bankDepositPayload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log("bankRes: ", bankRes.data);

      if (bankRes?.data?.data?.errorCode === -100) {
        const errorMsg = bankRes.data.data.errorMsg || "";
        const returnStr = bankRes.data.data.returnStr || "";
        
        console.log("Bank Success - ErrorMsg:", errorMsg);
        console.log("Bank Success - ReturnStr:", returnStr);
        
        let receiptNo = "";
        let transNo = "";
        
        const numbers = errorMsg.match(/\d+/g);
        if (numbers && numbers.length >= 2) {
          receiptNo = numbers[0];
          transNo = numbers[1];
        } else if (numbers && numbers.length >= 1) {
          receiptNo = numbers[0];
          transNo = returnStr || receiptNo;
        }
        
        if (!receiptNo && returnStr) {
          receiptNo = returnStr;
        }
        
        console.log("Extracted - ReceiptNo:", receiptNo, "TransNo:", transNo);

        const hasDenomination = denominations.some(d => d.count > 0);

        if (!hasDenomination) {
          Swal.fire({
            text: bankRes.data.data.errorMsg,
            // icon: "success",
            confirmButtonColor: "#1e3a8a",
          }).then(async (result) => {
            if (result.isConfirmed) {

              await handlePrintPDF(
                selectedGL,
                selectedLedger,
                receiptNo,
                transNo,
                false
              );

              resetForm();
              setFormValues({
                  vibhag: "-1",
                  prabhag: "-1",
                  colCen: "-1",
                  fromDate: new Date(),
                  toDate: new Date(),
                });
                setTransactionData([]);
                setSelectedTransactions(new Set());
                setTotalAmount(0);
                setDenominations([]);
                setTotalDenominationAmount(0);
                setSelectedRecNos([]);
                setSelectedAccNos([]);
                setSelectedChallanNos([]);
                setDepositDate(new Date());
                setShowTables(false);
                setDeptCode("");
                setLedger("");
                setLedgerOptions([]);
            }
          });

          return;
        }
        
        if (receiptNo) {
          let denomStr = "";
          denominations.forEach((denom) => {
            if (denom.count > 0) {
              denomStr += `${denom.ID}#${denom.count}#${denom.total}$`;
            }
          });
          denomStr = denomStr.replace(/\$$/, "");
          
          const denomPayload = {
            ulbId: Number(ulbId),
            userId: user?.userId || user?.id || "AMCDTU",
            deptId: values.vibhag === "-1" ? "-1" : values.vibhag,
            challanNo: "",
            denomDate: formatDateForAPI(depositDate),
            denomStr: denomStr,
            transNo: transNo,
            receiptNo: receiptNo,
            mode: 1,
          };

          console.log("denomPayload: ", denomPayload)
          
          const denomRes = await axios.post(
            `${BASE_URL}/api/FrmCashDeposit/save-cash-denomination`,
            denomPayload,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          
          console.log("denomRes: ", denomRes.data);

          if (denomRes?.data?.data?.errorCode === -100) {
            Swal.fire({
              text: bankRes.data.data.errorMsg,
              // icon: "success",
              confirmButtonColor: '#1e3a8a'
            })
            .then(async (result) => {
              if (result.isConfirmed) {
                if (receiptNo) {
                  await handlePrintPDF(selectedGL, selectedLedger, receiptNo, transNo, true);
                }
                resetForm();
                setFormValues({
                  vibhag: "-1",
                  prabhag: "-1",
                  colCen: "-1",
                  fromDate: new Date(),
                  toDate: new Date(),
                });
                setTransactionData([]);
                setSelectedTransactions(new Set());
                setTotalAmount(0);
                setDenominations([]);
                setTotalDenominationAmount(0);
                setSelectedRecNos([]);
                setSelectedAccNos([]);
                setSelectedChallanNos([]);
                setDepositDate(new Date());
                setShowTables(false);
                setDeptCode("");
                setLedger("");
                setLedgerOptions([]);
              }
            });
          } else {
            Swal.fire({
              text: denomRes.data.data?.errorMsg || "Denomination save failed",
              confirmButtonColor: '#1e3a8a'
            });
          }
        } else {
          Swal.fire({
            text: errorMsg || "Bank deposit saved but couldn't extract receipt/transaction details",
            confirmButtonColor: '#1e3a8a'
          });
        }
      } else {
        Swal.fire({
          text: bankRes.data.data?.errorMsg || bankRes.data?.message || "Bank deposit save failed",
          confirmButtonColor: '#1e3a8a'
        });
      }
      
    } catch (err) {
      console.error("Save Error:", err);
      Swal.fire({
        text: err.response?.data?.message || err.message || "सर्व्हर त्रुटी निर्माण झाली आहे",
        confirmButtonColor: '#1e3a8a'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (ulbId) {
      fetchVibhag();
    }
  }, [ulbId]);

  useEffect(() => {
    fetchPrabhag(formValues.vibhag);
  }, [formValues.vibhag]);

  useEffect(() => {
    fetchCollCenter(formValues.prabhag);
  }, [formValues.prabhag]);

  return (
    <Formik
      initialValues={formValues}
      enableReinitialize={true}
      onSubmit={handleFormSubmit}
    >
      {({ values, setFieldValue, isSubmitting, handleSubmit, resetForm }) => {

        useEffect(() => {
          setFormValues(values);
        }, [values]);
        
        return (
          <Form onSubmit={handleSubmit}>
            <motion.div variants={container} initial="hidden" animate="show">
              <Card className="shadow-sm border">
                <CardHeader className="border-b flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                  <CardTitle className="text-lg font-semibold">
                    Cash Deposit Slip
                  </CardTitle>
                </CardHeader>

                <CardContent className="p-4 space-y-6">
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                      <div className="sm:w-28 shrink-0 flex justify-start sm:justify-between items-center">
                        <Label text="विभाग संकेतांक" />
                        <span>:</span>
                      </div>
                      <Select
                        value={values.vibhag}
                        onValueChange={(v) => setFieldValue("vibhag", v)}
                      >
                        <SelectTrigger className="w-full h-9">
                          <SelectValue placeholder="-- विकल्प निवडा --" />
                        </SelectTrigger>
                        <SelectContent>
                          {vibhagOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                      <div className="sm:w-28 shrink-0 flex justify-start sm:justify-between items-center">
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
                      <div className="sm:w-28 shrink-0 flex justify-start sm:justify-between items-center">
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
                      <div className="sm:w-28 shrink-0 flex justify-start sm:justify-between items-center">
                        <Label text="दिनांका पर्यंत" />
                        <span>:</span>
                      </div>
                      <DatePicker
                        value={values.toDate}
                        onChange={(d) => setFieldValue("toDate", d)}
                        className="w-full h-9"
                      />
                    </div>

                    {values.vibhag === "7" && values.prabhag !== "-1" && (
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                        <div className="sm:w-28 shrink-0 flex justify-start sm:justify-between items-center">
                          <Label text="Collection" />
                          <span>:</span>
                        </div>
                        <Select
                          value={values.colCen}
                          onValueChange={(v) => setFieldValue("colCen", v)}
                        >
                          <SelectTrigger className="w-full h-9">
                            <SelectValue placeholder="-- विकल्प निवडा --" />
                          </SelectTrigger>
                          <SelectContent>
                            {collCenOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap justify-center gap-4">
                    <Button type="submit" disabled={isSubmitting || loading}>
                      {loading ? "लोड करत आहे..." : "प्रक्रिया"}
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={() => handleResetForm(resetForm)}
                      disabled={loading}
                    >
                      हटवा
                    </Button>
                    <Button type="button" variant="outline" path="/HomePage/FrmHomePage">
                      बाहेर
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={async () => {
                        await fetchTapshilReceipts(values);
                        setIsTapshilModalOpen(true);
                      }}
                      disabled={loading}
                    >
                      पावती तपशील
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={async () => {
                        await fetchLekhashirshDetails(values);
                        setIsLekhashirshModalOpen(true);
                      }}
                      disabled={loading}
                    >
                      लेखाशीर्ष तपशील
                    </Button>
                  </div>

                  {showTables && (
                    <>
                      {tableLoading ? (
                        <div className="flex justify-center items-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-900"></div>
                          <span className="ml-2">लोड करत आहे...</span>
                        </div>
                      ) : (
                        <>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                              <div className="sm:w-28 shrink-0 flex justify-start sm:justify-between items-center">
                                <Label text="Deposit Date" />
                                <span>:</span>
                              </div>
                              <DatePicker
                                value={depositDate}
                                onChange={(d) => setDepositDate(d)}
                                className="w-full h-9"
                              />
                            </div>

                            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                              <div className="sm:w-36 shrink-0 flex justify-start sm:justify-between items-center">
                                <Label text="विभाग संकेतांक." />
                                <span>:</span>
                              </div>
                              <SearchableSelect
                                options={glCodes}
                                value={deptCode}
                                onChange={(option) => {
                                  console.log("DeptCode onChange - selected option:", option);
                                  const val = option?.value || "";
                                  setDeptCode(val)
                                  setLedger("")
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
                                value={ledger}
                                onChange={(option) => {
                                  console.log("Ledger onChange - selected option:", option);
                                  setLedger(option?.value || "")
                                }}
                                placeholder="लेखाशीर्ष निवडा"
                                disabled={!deptCode}
                                className="w-full h-9"
                              />
                            </div>
                          </div>

                          <div className="border rounded-lg overflow-hidden mt-4">
                            <div className="overflow-x-auto">
                              <Table className="w-full max-md:min-w-380 [&_thead_tr:hover]:bg-[#083c76]">
                                <TableHeader>
                                  <TableRow className="bg-blue-900">
                                    <TableHead className="text-white text-center font-semibold p-3 whitespace-nowrap w-12">
                                      <Checkbox
                                        checked={transactionData.length > 0 && selectedTransactions.size === transactionData.length}
                                        onCheckedChange={handleSelectAllTransactions}
                                        className="border-white data-[state=checked]:bg-white data-[state=checked]:text-blue-900"
                                      />
                                    </TableHead>
                                    <TableHead className="text-white text-center font-semibold p-3 whitespace-nowrap">
                                      Department
                                    </TableHead>
                                    <TableHead className="text-white text-center font-semibold p-3 whitespace-nowrap">
                                      Account Code
                                    </TableHead>
                                    <TableHead className="text-white text-center font-semibold p-3 whitespace-nowrap">
                                      Account Head
                                    </TableHead>
                                    <TableHead className="text-white text-center font-semibold p-3 whitespace-nowrap">
                                      Amount
                                    </TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {transactionData.map((row, index) => (
                                    <TableRow key={index} className="hover:bg-gray-50">
                                      <TableCell className="p-2 text-center">
                                        <Checkbox
                                          checked={selectedTransactions.has(index)}
                                          onCheckedChange={() => handleTransactionSelect(index)}
                                          // className="border border-black"
                                        />
                                      </TableCell>
                                      <TableCell className="p-2 text-center">
                                        {row.DEPARTMENT}
                                      </TableCell>
                                      <TableCell className="p-2 text-center">
                                        {row.ACCNO}
                                      </TableCell>
                                      <TableCell className="p-2 text-center">
                                        {row.ACCOUNTNAME}
                                      </TableCell>
                                      <TableCell className="p-2 text-center font-medium">
                                        {row.AMOUNT?.toLocaleString('en-IN')}
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                  {transactionData.length === 0 && (
                                    <TableRow>
                                      <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                                        कोणतीही माहिती उपलब्ध नाही
                                      </TableCell>
                                    </TableRow>
                                  )}
                                </TableBody>
                              </Table>
                            </div>
                          </div>

                          <div className="flex justify-start items-center gap-4">
                            <div className="sm:w-28 shrink-0 flex justify-start sm:justify-between items-center">
                              <Label text="Total Amount" className="font-semibold" />
                              <span>:</span>
                            </div>
                            <Input
                              type="text"
                              value={totalAmount.toLocaleString('en-IN')}
                              className="w-48 h-9 text-right font-bold bg-gray-100"
                              readOnly
                              disabled
                            />
                          </div>

                          <div className="border rounded-lg overflow-hidden mt-6">
                            <div className="overflow-x-auto">
                              <Table className="w-full max-md:min-w-380 [&_thead_tr:hover]:bg-[#083c76]">
                                <TableHeader>
                                  <TableRow className="bg-blue-900">
                                    <TableHead className="text-white text-center font-semibold p-3 whitespace-nowrap">
                                      Denomination
                                    </TableHead>
                                    <TableHead className="text-white text-center font-semibold p-3 whitespace-nowrap">
                                      x
                                    </TableHead>
                                    <TableHead className="text-white text-center font-semibold p-3 whitespace-nowrap">
                                      Count
                                    </TableHead>
                                    <TableHead className="text-white text-center font-semibold p-3 whitespace-nowrap">
                                      =
                                    </TableHead>
                                    <TableHead className="text-white text-center font-semibold p-3 whitespace-nowrap">
                                      Total
                                    </TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {denominations.map((denom, index) => (
                                    <TableRow key={denom.ID} className="hover:bg-gray-50">
                                      <TableCell className="p-2 text-center font-medium">
                                        {denom.NAME}
                                      </TableCell>
                                      <TableCell className="p-2 text-center">×</TableCell>
                                      <TableCell className="p-2 flex items-center justify-center">
                                        <Input
                                          type="number"
                                          value={denom.count || ""}
                                          onChange={(e) => handleDenominationCountChange(index, e.target.value)}
                                          className="w-[50%] h-9 text-center"
                                        />
                                      </TableCell>
                                      <TableCell className="p-2 text-center">=</TableCell>
                                      <TableCell className="p-2 text-center font-medium">
                                        {denom.total.toLocaleString('en-IN')}
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                  {denominations.length === 0 && (
                                    <TableRow>
                                      <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                                        कोणतीही माहिती उपलब्ध नाही
                                      </TableCell>
                                    </TableRow>
                                  )}
                                </TableBody>
                              </Table>
                            </div>
                          </div>

                          <div className="flex justify-start items-center gap-4 mt-2 w-full">
                            <div className="sm:w-28 shrink-0 flex justify-start sm:justify-between items-center">
                              <Label text="Total Amount After Denomination" className="font-semibold" />
                              <span>:</span>
                            </div>
                            <span className="text-md font-medium">
                              {totalDenominationAmount.toLocaleString('en-IN')}
                            </span>
                          </div>

                           <div className="flex flex-wrap justify-center gap-4">
                            <Button
                              type="button"
                              className="bg-blue-900"
                              onClick={() => handleSave(values, resetForm)}
                              disabled={loading}
                            >
                              {loading ? "सेव्ह करत आहे..." : "Save"}
                            </Button>
                          </div>
                        </>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {isTapshilModalOpen && (
              <div
                className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
                onClick={() => setIsTapshilModalOpen(false)}
              >
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  onClick={(e) => e.stopPropagation()}
                  className="bg-white p-4 sm:p-6 rounded-lg w-[95%] sm:w-4/5 max-h-[90vh] shadow-lg flex flex-col"
                >
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-center text-lg font-semibold flex-1">
                      पावती तपशील
                    </h2>
                    <button
                      onClick={() => setIsTapshilModalOpen(false)}
                      className="text-gray-500 hover:text-gray-700 text-xl"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="overflow-x-auto flex-1 overflow-y-auto">
                    <Table className="w-full max-md:min-w-380 [&_thead_tr:hover]:bg-[#083c76]">
                      <TableHeader>
                        <TableRow className="bg-blue-900">
                          <TableHead className="text-white text-center font-semibold p-3 whitespace-nowrap w-12">
                            <Checkbox
                              checked={tapshilReceipts.length > 0 && selectedTapshil.size === tapshilReceipts.length}
                              onCheckedChange={handleSelectAllTapshil}
                              className="border-white"
                            />
                          </TableHead>
                          <TableHead className="text-white text-center font-semibold p-3 whitespace-nowrap">
                            Receipt no
                          </TableHead>
                          <TableHead className="text-white text-center font-semibold p-3 whitespace-nowrap">
                            Challan no
                          </TableHead>
                          <TableHead className="text-white text-center font-semibold p-3 whitespace-nowrap">
                            Date
                          </TableHead>
                          <TableHead className="text-white text-center font-semibold p-3 whitespace-nowrap">
                            Paymode
                          </TableHead>
                          <TableHead className="text-white text-center font-semibold p-3 whitespace-nowrap">
                            Amount
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {tapshilReceipts.map((receipt, index) => (
                          <TableRow key={index} className="hover:bg-gray-50">
                            <TableCell className="p-2 text-center">
                              <Checkbox
                                checked={selectedTapshil.has(index)}
                                onCheckedChange={() => handleTapshilSelect(index)}
                              />
                            </TableCell>
                            <TableCell className="p-2 text-center">{receipt.RECNO}</TableCell>
                            <TableCell className="p-2 text-center">{receipt.CHALLANO}</TableCell>
                            <TableCell className="p-2 text-center">
                              {formatDateForDisplay(receipt.RECDATE)}
                            </TableCell>
                            <TableCell className="p-2 text-center">{receipt.RECMODNAME}</TableCell>
                            <TableCell className="p-2 text-right">
                              {receipt.AMOUNT?.toLocaleString('en-IN')}
                            </TableCell>
                          </TableRow>
                        ))}
                        {tapshilReceipts.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                              कोणतीही माहिती उपलब्ध नाही
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>

                  <div className="sticky bottom-0 bg-white pt-4 flex justify-center gap-4 border-t">
                    <Button onClick={() => handleTapshilOk(values)}>
                      Ok
                    </Button>
                    <Button variant="destructive" onClick={() => setIsTapshilModalOpen(false)}>
                      Close
                    </Button>
                  </div>
                </motion.div>
              </div>
            )}

            {isLekhashirshModalOpen && (
              <div
                className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
                onClick={() => setIsLekhashirshModalOpen(false)}
              >
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  onClick={(e) => e.stopPropagation()}
                  className="bg-white p-4 sm:p-6 rounded-lg w-[95%] sm:w-4/5 max-h-[90vh] shadow-lg flex flex-col"
                >
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-center text-lg font-semibold flex-1">
                      लेखाशीर्ष तपशील
                    </h2>
                    <button
                      onClick={() => setIsLekhashirshModalOpen(false)}
                      className="text-gray-500 hover:text-gray-700 text-xl"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="overflow-x-auto flex-1 overflow-y-auto">
                    <Table className="w-full max-md:min-w-380 [&_thead_tr:hover]:bg-[#083c76]">
                      <TableHeader>
                        <TableRow className="bg-blue-900">
                          <TableHead className="text-white text-center font-semibold p-3 whitespace-nowrap w-12">
                            <Checkbox
                              checked={lekhashirshDetails.length > 0 && selectedLekhashirsh.size === lekhashirshDetails.length}
                              onCheckedChange={handleSelectAllLekhashirsh}
                              className="border-white"
                            />
                          </TableHead>
                          <TableHead className="text-white text-center font-semibold p-3 whitespace-nowrap">
                            Account Code
                          </TableHead>
                          <TableHead className="text-white text-center font-semibold p-3 whitespace-nowrap">
                            Gl Name
                          </TableHead>
                          <TableHead className="text-white text-center font-semibold p-3 whitespace-nowrap">
                            Account Name
                          </TableHead>
                          <TableHead className="text-white text-center font-semibold p-3 whitespace-nowrap">
                            Challan no
                          </TableHead>
                          <TableHead className="text-white text-center font-semibold p-3 whitespace-nowrap">
                            Date
                          </TableHead>
                          <TableHead className="text-white text-center font-semibold p-3 whitespace-nowrap">
                            Paymode
                          </TableHead>
                          <TableHead className="text-white text-center font-semibold p-3 whitespace-nowrap">
                            Amount
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {lekhashirshDetails.map((detail, index) => (
                          <TableRow key={index} className="hover:bg-gray-50">
                            <TableCell className="p-2 text-center">
                              <Checkbox
                                checked={selectedLekhashirsh.has(index)}
                                onCheckedChange={() => handleLekhashirshSelect(index)}
                              />
                            </TableCell>
                            <TableCell className="p-2 text-center">{detail.ACCNO}</TableCell>
                            <TableCell className="p-2 text-left">{detail.GLNAME}</TableCell>
                            <TableCell className="p-2 text-left">{detail.ACCOUNTNAME}</TableCell>
                            <TableCell className="p-2 text-center">{detail.CHALLANO}</TableCell>
                            <TableCell className="p-2 text-center">
                              {formatDateForDisplay(detail.RECDATE)}
                            </TableCell>
                            <TableCell className="p-2 text-center">{detail.RECMODNAME}</TableCell>
                            <TableCell className="p-2 text-right">
                              {detail.AMOUNT?.toLocaleString('en-IN')}
                            </TableCell>
                          </TableRow>
                        ))}
                        {lekhashirshDetails.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                              कोणतीही माहिती उपलब्ध नाही
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>

                  <div className="sticky bottom-0 bg-white pt-4 flex justify-center gap-4 border-t">
                    <Button onClick={() => handleLekhashirshOk(values)}>
                      Ok
                    </Button>
                    <Button variant="destructive" onClick={() => setIsLekhashirshModalOpen(false)}>
                      Close
                    </Button>
                  </div>
                </motion.div>
              </div>
            )}
          </Form>
        );
      }}
    </Formik>
  );
};

export default FrmCashDeposit;