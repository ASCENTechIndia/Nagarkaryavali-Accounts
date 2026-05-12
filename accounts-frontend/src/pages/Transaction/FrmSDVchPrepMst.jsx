// import { motion } from "framer-motion";
// import { useNavigate } from "react-router-dom";
// import axios from "axios";
// import { useAuth } from "@/context/AuthContext";
// import { Button } from "@/components/ui/button";
// import {
//     Select,
//     SelectContent,
//     SelectItem,
//     SelectTrigger,
//     SelectValue,
// } from "@/components/ui/select";
// import {
//     Card,
//     CardContent,
//     CardHeader,
//     CardTitle,
// } from "@/components/ui/card";
// import Swal from "sweetalert2";
// import { Formik, Form } from "formik";
// import { useState, useEffect } from "react";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import SearchableSelect from "@/components/SearchableSelect";
// import { DatePicker } from "@/components/ui/calendar";
// import { useLocation } from "react-router-dom";
// import { CornerDownLeft } from "lucide-react";

// const FrmSDVchPrepMst = () => {
//     const navigate = useNavigate();
//     const { user } = useAuth();
//     const token = user?.token;
//     const ulbId = user?.ulbId;
//     const location = useLocation();

//     const receiptNo = location.state?.receiptNo;
//     const partyId = location.state?.partyId;
//     const sdid = location.state?.sdid;

//     const BASE_URL = import.meta.env.VITE_BASE_URL;

//     const [glList, setGlList] = useState([]);
//     const [entryHeadList, setEntryHeadList] = useState([]);
//     const [zoneList, setZoneList] = useState([]);
//     const [departmentList, setDepartmentList] = useState([]);
//     const [budgetList, setBudgetList] = useState([]);
//     const [nidhiList, setNidhiList] = useState([]);
//     const [showBankModal, setShowBankModal] = useState(false);
//     const [partyBankList, setPartyBankList] = useState([]);
//     const [loadingBanks, setLoadingBanks] = useState(false);
//     const [voucherDetails, setVoucherDetails] = useState([]);
//     const [certificateNo, setCertificateNo] = useState("");
//     const [partyName, setPartyName] = useState("");
//     const [selectedPartyBankId, setSelectedPartyBankId] = useState(0);

//     const formatDate = (date) => {
//         if (!date) return "";
//         const d = new Date(date);
//         const day = String(d.getDate()).padStart(2, "0");
//         const month = String(d.getMonth() + 1).padStart(2, "0");
//         const year = d.getFullYear();
//         return `${day}-${month}-${year}`;
//     };

//     useEffect(() => {
//         const fetchGLList = async () => {
//             try {
//                 const res = await axios.get(
//                     `${BASE_URL}/api/Receipt/searchGLALL`,
//                     { headers: { Authorization: `Bearer ${token}` } }
//                 );
//                 const data = res.data?.data || [];
//                 const formatted = data.map((item) => ({
//                     label: item.GLSEARCHNAME || "",
//                     value: item.GLFUNCTION?.toString() || "",
//                 }));
//                 setGlList(formatted);
//             } catch (err) {
//                 console.error("GL List API Error:", err);
//             }
//         };
//         if (token) fetchGLList();
//     }, [token, BASE_URL]);

//     const fetchCreditLeasure = async (glcode) => {
//         if (!glcode) return;
//         try {
//             const res = await axios.post(
//                 `${BASE_URL}/api/FrmTransfer/credit-leasure`,
//                 { corp_id: ulbId, glcode: glcode },
//                 { headers: { Authorization: `Bearer ${token}` } }
//             );
//             const data = res.data?.data?.rows || [];
//             const formatted = data.map((item) => ({
//                 label: item.ACCNAME || "",
//                 value: item.OBJECTCODE?.toString() || "",
//             }));
//             setEntryHeadList(formatted);
//         } catch (err) {
//             console.error("Credit Leasure API Error:", err);
//         }
//     };

//     useEffect(() => {
//         const fetchZoneList = async () => {
//             try {
//                 const res = await axios.post(
//                     `${BASE_URL}/api/Receipt/zones`,
//                     { corp_id: ulbId },
//                     { headers: { Authorization: `Bearer ${token}` } }
//                 );
//                 const data = res.data?.data || [];
//                 const formatted = data.map((item) => ({
//                     label: item.ZONEENAME,
//                     value: item.ZONEID?.toString(),
//                 }));
//                 setZoneList(formatted);
//             } catch (err) {
//                 console.error("Zone API Error:", err);
//             }
//         };

//         const fetchDepartmentList = async () => {
//             try {
//                 const res = await axios.get(
//                     `${BASE_URL}/api/Bankdeposit/department?ulbId=${ulbId}`,
//                     { headers: { Authorization: `Bearer ${token}` } }
//                 );
//                 const data = res.data?.data?.list || [];
//                 const formatted = data.map((item) => ({
//                     label: item.DEPTNAME,
//                     value: item.DEPTID?.toString(),
//                 }));
//                 setDepartmentList(formatted);
//             } catch (err) {
//                 console.error("Department API Error:", err);
//             }
//         };

//         if (token && ulbId) {
//             fetchZoneList();
//             fetchDepartmentList();
//         }
//     }, [token, ulbId, BASE_URL]);

//     useEffect(() => {
//         const fetchBudgetList = async () => {
//             try {
//                 const res = await axios.get(
//                     `${BASE_URL}/api/FrmTransfer/budget-heads`,
//                     { headers: { Authorization: `Bearer ${token}` } }
//                 );
//                 const data = res.data?.data?.rows || [];
//                 const formatted = data.map((item) => ({
//                     label: item.VAR_BUDGETCONFIG_BUDGETNAME,
//                     value: item.NUM_BUDGETCONFIG_HEADID?.toString(),
//                 }));
//                 setBudgetList(formatted);
//             } catch (err) {
//                 console.error("Budget API Error:", err);
//             }
//         };
//         if (token) fetchBudgetList();
//     }, [token, BASE_URL]);

//     const fetchNextCertificateNo = async ({ setFieldValue }) => {
//         try {
//             const res = await axios.get(
//                 `${BASE_URL}/api/frmSDRef/next-certificate-no/2`,
//                 {
//                     headers: { Authorization: `Bearer ${token}` },
//                 }
//             );

//             const certNo = res.data?.data?.maxcertino;

//             if (certNo) {
//                 setFieldValue("refundVoucherNo", certNo.toString());
//                 setCertificateNo(certNo.toString());
//             }
//         } catch (err) {
//             console.error("Next Certificate No API Error:", err);
//         }
//     };

//     const fetchVoucherDetails = async ({ refNo, partyId, sdid, setFieldValue }) => {
//         try {
//             const res = await axios.post(
//                 `${BASE_URL}/api/frmSDRef/voucher-details`,
//                 { refNo: Number(refNo), partyId: Number(partyId), sdid: Number(sdid), ulbId: ulbId },
//                 { headers: { Authorization: `Bearer ${token}` } }
//             );
//             const data = res.data?.data?.data || [];
//             if (data.length > 0) {
//                 const firstDetail = data[0];
//                 setFieldValue("objectCode", firstDetail.ACCNO?.toString() || "");
//                 if (firstDetail.NARRATN) {
//                     setFieldValue("details", firstDetail.NARRATN);
//                 }
//                 setVoucherDetails(data);
//             }
//         } catch (err) {
//             console.error("Voucher Details API Error:", err);
//         }
//     };

//     const fetchReceiptDetails = async ({ setFieldValue, transactionNo }) => {
//         try {
//             if (!transactionNo) return;
//             const res = await axios.post(
//                 `${BASE_URL}/api/frmSDRef/voucher-receipt-details`,
//                 { voucherNo: transactionNo, ulbId: ulbId },
//                 { headers: { Authorization: `Bearer ${token}` } }
//             );
//             const data = res.data?.data?.data || [];
//             if (data.length > 0) {
//                 const receipt = data[0];
//                 if (receipt.PANCARD) setFieldValue("panNo", receipt.PANCARD);
//                 if (receipt.GSTNO || receipt.GST_NUMBER) setFieldValue("gstNo", receipt.GSTNO || receipt.GST_NUMBER);
//             }
//         } catch (err) {
//             console.error("Receipt Details API Error:", err);
//         }
//     };

//     const fetchVoucherPrepMaster = async ({ refNo, setFieldValue }) => {
//         try {
//             const res = await axios.post(
//                 `${BASE_URL}/api/frmSDRef/voucher-prep-master`,
//                 { refNo: Number(refNo), ulbId: ulbId },
//                 { headers: { Authorization: `Bearer ${token}` } }
//             );
//             const data = res.data?.data?.data?.[0];
//             if (data) {
//                 if (data.CERTINO && data.CERTINO !== 0 && data.CERTINO !== null) {
//                     setFieldValue("refundVoucherNo", data.CERTINO.toString());
//                     setCertificateNo(data.CERTINO.toString());
//                 } else {
//                     await fetchNextCertificateNo({ setFieldValue });
//                 }
//                 if (data.PAYAMT && data.PAYAMT > 0) {
//                     setFieldValue("totalAmount", data.PAYAMT);
//                 }
//             }
//         } catch (err) {
//             if (err.response?.status !== 404) {
//                 console.error("Voucher Prep Master API Error:", err);
//             }

//             await fetchNextCertificateNo({ setFieldValue });
//         }
//     };

//     const fetchNidhiList = async (budgetId) => {
//         if (!budgetId) return;
//         try {
//             const res = await axios.post(
//                 `${BASE_URL}/api/FrmVoucher/nidhi`,
//                 { budgetid: Number(budgetId), nidhiFlag: "Y", ulbid: ulbId },
//                 { headers: { Authorization: `Bearer ${token}` } }
//             );
//             const data = res.data?.data?.data || [];
//             const formatted = data.map((item) => ({
//                 label: item.NIDHINAME,
//                 value: item.NIDHIID?.toString(),
//             }));
//             setNidhiList(formatted);
//         } catch (err) {
//             console.error("Nidhi API Error:", err);
//         }
//     };

//     const fetchPartyBankDetails = async ({ partyBankId, setFieldValue }) => {
//         if (!partyBankId) return;
//         try {
//             const res = await axios.post(
//                 `${BASE_URL}/api/frmSDRef/party-bank-details`,
//                 { partyBankId: Number(partyBankId), ulbId: ulbId },
//                 { headers: { Authorization: `Bearer ${token}` } }
//             );
//             const data = res.data?.data?.data?.[0];
//             if (!data) return;
//             setFieldValue("bankName", data.VAR_BANKMST_BANKNAME || "");
//             setFieldValue("branch", data.VAR_BRANCHMST_BRANCHNAME || "");
//             setFieldValue("ifsc", data.VAR_PARTYBANK_IFSC || "");
//             setFieldValue("accountNo", data.VAR_PARTYBANK_ACCOUNTNO || "");
//             setFieldValue("partyBankId", data.NUM_PARTYBANK_ID || "");
//         } catch (err) {
//             console.error("Party Bank Details API Error:", err);
//         }
//     };

//     const fetchPartyBankList = async () => {
//         try {
//             setLoadingBanks(true);
//             const res = await axios.post(
//                 `${BASE_URL}/api/frmSDRef/party-bank-list`,
//                 { partyId: Number(partyId) },
//                 { headers: { Authorization: `Bearer ${token}` } }
//             );
//             const data = res.data?.data?.data || [];
//             setPartyBankList(data);
//             setShowBankModal(true);
//         } catch (err) {
//             console.error("Party Bank List API Error:", err);
//             Swal.fire({ icon: "error", text: "Failed to fetch bank details" });
//         } finally {
//             setLoadingBanks(false);
//         }
//     };

//     const fetchVoucherMaster = async ({ refNo, partyId, sdid, setFieldValue }) => {
//         try {
//             const res = await axios.post(
//                 `${BASE_URL}/api/frmSDRef/voucher-master`,
//                 { refNo: Number(refNo), partyId: Number(partyId), ulbId: ulbId, sdid: Number(sdid) },
//                 { headers: { Authorization: `Bearer ${token}` } }
//             );
//             const data = res.data?.data?.data?.[0];
//             if (!data) return null;

//             setFieldValue("voucherDate", data.TRNSDATE ? new Date(data.TRNSDATE) : "");
//             setFieldValue("transactionNo", data.VCHNO || "");
//             setFieldValue("totalAmount", data.TOTALAMT || "");
//             setFieldValue("details", data.VAR_RECEIPTDET_NARRATION || "");
//             setFieldValue("department", data.DEPTID?.toString() || "");

//             if (data.NUM_RECEIPTMST_BUDGET_ID && data.NUM_RECEIPTMST_BUDGET_ID !== 0) {
//                 const budgetId = data.NUM_RECEIPTMST_BUDGET_ID.toString();
//                 setFieldValue("budget", budgetId);
//                 await fetchNidhiList(data.NUM_RECEIPTMST_BUDGET_ID);
//             } else {
//                 setFieldValue("budget", "");
//             }

//             if (data.NIDHI_ID && data.NIDHI_ID !== null) {
//                 setFieldValue("fund", data.NIDHI_ID.toString());
//             } else {
//                 setFieldValue("fund", "");
//             }

//             if (data.DRGL && data.DRGL !== 0) {
//                 let functionCodeValue = data.DRGL.toString();
//                 const matchedGL = glList.find(gl => gl.value === functionCodeValue);
//                 if (matchedGL) {
//                     setFieldValue("functionCode", functionCodeValue);
//                 } else {
//                     const numericMatch = glList.find(gl => Number(gl.value) === data.DRGL);
//                     if (numericMatch) {
//                         setFieldValue("functionCode", numericMatch.value);
//                     } else {
//                         setFieldValue("functionCode", functionCodeValue);
//                     }
//                 }
//             } else {
//                 setFieldValue("functionCode", "");
//             }

//             if (data.DRACC && data.DRACC !== 0) {
//                 setFieldValue("objectCode", data.DRACC.toString());
//             } else {
//                 setFieldValue("objectCode", "");
//             }

//             if (data.ZONEID && data.ZONEID !== 0) {
//                 setFieldValue("prabhag", data.ZONEID.toString());
//             } else {
//                 setFieldValue("prabhag", "");
//             }

//             // if (data.PARTYNAME) {
//             //     setFieldValue("entryDeptCode", data.PARTYNAME);
//             //     setPartyName(data.PARTYNAME);
//             // }

//             if (data.PARTYNAME) {
//                 const partyDisplayValue = `${data.PARTYID || partyId}-${data.PARTYNAME}`;
//                 setFieldValue("entryDeptCode", partyDisplayValue);
//                 setPartyName(data.PARTYNAME);
//             }

//             if (data.PARTYBANKID && data.PARTYBANKID !== 0) {
//                 await fetchPartyBankDetails({ partyBankId: data.PARTYBANKID, setFieldValue });
//             }

//             return { transactionNo: data.VCHNO, voucherData: data };
//         } catch (err) {
//             console.error("Voucher Master API Error:", err);
//             throw err;
//         }
//     };

//     const fetchRefundAmount = async ({ refNo, partyId, recNo, setFieldValue }) => {
//         try {
//             const res = await axios.post(
//                 `${BASE_URL}/api/frmSDRef/check-refund-status`,
//                 { refNo: Number(refNo), partyId: Number(partyId), recNo: Number(recNo), ulbId: ulbId },
//                 { headers: { Authorization: `Bearer ${token}` } }
//             );
//             const data = res.data?.data?.data?.[0];
//             if (!data) return;

//             const balanceAmount = Number(data.AMOUNT || 0) - Number(data.PAYAMT || 0);

//             if (balanceAmount === 0) {
//                 Swal.fire({ icon: "warning", text: "Full amount is already refunded" }).then(() => {
//                     navigate("/Transactions/FrmSDRefund");
//                 });
//                 return;
//             }

//             if (Number(data.PAYAMT || 0) > 0) {
//                 Swal.fire({ icon: "info", text: "Partial payment done for the security deposit. Kindly pay the remaining balance" });
//             }

//             setFieldValue("totalAmount", balanceAmount);
//         } catch (err) {
//             console.error("Refund Status API Error:", err);
//         }
//     };

//     const fetchPartyTaxDetails = async ({ partyId, setFieldValue }) => {
//         try {
//             if (!partyId) return;
//             const res = await axios.post(
//                 `${BASE_URL}/api/frmSDRef/party-tax-details`,
//                 { partyId: Number(partyId), ulbId: ulbId },
//                 { headers: { Authorization: `Bearer ${token}` } }
//             );
//             const data = res.data?.data?.data?.[0];
//             if (data) {
//                 if (data.VAR_PARTYMST_PANCARD) setFieldValue("panNo", data.VAR_PARTYMST_PANCARD);
//                 if (data.VAR_PARTYMST_GSTNO) setFieldValue("gstNo", data.VAR_PARTYMST_GSTNO);
//             }
//         } catch (err) {
//             console.error("Party Tax Details API Error:", err);
//         }
//     };

//     const handleSubmit = async (values) => {
//         try {

//             // ---------------- VALIDATIONS ----------------

//             if (!values.prabhag) {
//                 return Swal.fire({ icon: "warning", text: "प्रभाग निवडा" });
//             }

//             if (!values.department) {
//                 return Swal.fire({ icon: "warning", text: "विभाग निवडा" });
//             }

//             if (!values.voucherDate) {
//                 return Swal.fire({ icon: "warning", text: "तारीख निवडा" });
//             }

//             if (!values.refundVoucherNo) {
//                 return Swal.fire({ icon: "warning", text: "सु.अ.परतावा प्रमाणक क्र रिक्त असू शकत नाही" });
//             }

//             if (!values.functionCode) {
//                 return Swal.fire({ icon: "warning", text: "फंक्शन कोड निवडा" });
//             }

//             if (!values.objectCode) {
//                 return Swal.fire({ icon: "warning", text: "ऑब्जेक्ट कोड रिक्त आहे" });
//             }

//             if (!values.totalAmount) {
//                 return Swal.fire({ icon: "warning", text: "एकूण रक्कम रिक्त आहे" });
//             }

//             if (!values.details) {
//                 return Swal.fire({ icon: "warning", text: "तपशील भरा" });
//             }

//             if (!values.bankName || !values.accountNo) {
//                 return Swal.fire({ icon: "warning", text: "कृपया पार्टी बँक निवडा" });
//             }

//             // ---------------- DATE FORMAT ----------------

//             const voucherDate = formatDate(values.voucherDate)
//                 .toUpperCase()
//                 .replace(/-/g, "-");

//             const refundDate = formatDate(values.refundDate)
//                 .toUpperCase()
//                 .replace(/-/g, "-");

//             // convert 27-06-2025 => 27-JUN-2025
//             const convertToOracleDate = (dateStr) => {
//                 const months = [
//                     "JAN", "FEB", "MAR", "APR", "MAY", "JUN",
//                     "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"
//                 ];

//                 const [day, month, year] = dateStr.split("-");
//                 return `${day}-${months[Number(month) - 1]}-${year}`;
//             };

//             const oracleVoucherDate = convertToOracleDate(voucherDate);
//             const oracleRefundDate = convertToOracleDate(refundDate);

//             // ---------------- PARTY BANK ID ----------------

//             // const selectedBank = partyBankList.find(
//             //     (b) => b.VAR_PARTYBANK_ACCOUNTNO === values.accountNo
//             // );

//             // const partyBankId = selectedBank?.NUM_PARTYBANK_ID || 0;

//             const partyBankId = values.partyBankId || 0;

//             if (!partyBankId) {
//                 return Swal.fire({
//                     icon: "warning",
//                     text: "Party Bank ID मिळाला नाही",
//                 });
//             }

//             // ---------------- SEC DEPOSIT STRING ----------------
//             // paramStr4

//             // Static values coming from .NET ViewState
//             // adjust according to your API response if dynamic

//             const SDdeptid = voucherDetails?.[0]?.DEPTID || values.department;
//             const SDdepotypeid = voucherDetails?.[0]?.DEPOTYPEID || 1;
//             const SDdepono = voucherDetails?.[0]?.DEPONO || 0;
//             const SDbankaccno = voucherDetails?.[0]?.BANKACCNO || 0;
//             const depodetail =
//                 voucherDetails?.[0]?.DEPODDETAIL || "E-Deposit";

//             const rectransno = values.transactionNo;

//             const paramStr4 =
//                 `${partyId}#` +
//                 `${values.functionCode}#` +
//                 `${values.objectCode}#` +
//                 `${values.totalAmount}#` +
//                 `${SDdeptid}#` +
//                 `${SDdepotypeid}#` +
//                 `${SDdepono}#` +
//                 `${SDbankaccno}#` +
//                 `${depodetail}#` +
//                 `${oracleRefundDate}#` +
//                 `${values.refundVoucherNo}`;

//             // ---------------- PARAM STRING ----------------
//             // MODE = 3

//             const mode = 3;

//             const paramStr =
//                 `${oracleVoucherDate}~` +
//                 `${values.transactionNo}~` +
//                 `${values.prabhag}~` +
//                 `~` + // Gram Panchayat blank
//                 `${partyId}~` +
//                 `${values.totalAmount}~` +
//                 `${values.functionCode}~` +
//                 `${values.objectCode}~` +
//                 `${partyBankId}~` +
//                 `${mode}~` +
//                 `0~` +
//                 `0~` +
//                 `0~` +
//                 `${values.details}~` +
//                 `${values.budget || 0}~` +
//                 `${values.fund || 0}~` +
//                 `${rectransno}~` +
//                 `${values.totalAmount}~` +
//                 `${values.department}~` +
//                 `${sdid}`;

//             // ---------------- API PAYLOAD ----------------

//             const payload = {
//                 userId: user?.userId,
//                 zoneId: Number(values.prabhag),
//                 paramStr: paramStr,
//                 paramStr2: "",
//                 paramStr3: "",
//                 paramStr4: paramStr4,
//             };

//             console.log("SAVE PAYLOAD", payload);

//             // ---------------- API CALL ----------------

//             Swal.fire({
//                 title: "Saving...",
//                 allowOutsideClick: false,
//                 didOpen: () => Swal.showLoading(),
//             });

//             const res = await axios.post(
//                 `${BASE_URL}/api/frmSDRef/save`,
//                 payload,
//                 {
//                     headers: {
//                         Authorization: `Bearer ${token}`,
//                     },
//                 }
//             );

//             Swal.close();

//             if (res.data?.ok) {

//                 try {
//                     const voucherNo =
//                         res.data?.data?.refno

//                     const pdfRes = await axios.post(
//                         `${BASE_URL}/api/frmSDRef/voucherreceiptpdf`,
//                         {
//                             voucherNo: Number(voucherNo),
//                             ulbId: Number(ulbId),
//                             sdid: Number(sdid),
//                         },
//                         {
//                             headers: {
//                                 Authorization: `Bearer ${token}`,
//                             },
//                         }
//                     );

//                     Swal.fire({
//                         icon: "success",
//                         title: "Success",
//                         text:
//                             res.data?.data?.message
//                     });

//                     if (pdfRes.data?.success && pdfRes.data?.pdfUrl) {
//                         window.open(pdfRes.data.pdfUrl, "_blank");
//                     }

//                     navigate("/Transactions/FrmSDRefund");

//                 } catch (pdfErr) {

//                     console.error("PDF API ERROR", pdfErr);

//                     Swal.fire({
//                         text: "Voucher saved but PDF generation failed",
//                     });

//                     navigate("/Transactions/FrmSDRefund");
//                 }
//             } else {

//                 Swal.fire({
//                     icon: "error",
//                     text: res.data?.message || "Failed to save",
//                 });
//             }

//         } catch (err) {

//             console.error("SAVE API ERROR", err);

//             Swal.close();

//             Swal.fire({
//                 icon: "error",
//                 text:
//                     err.response?.data?.message ||
//                     "Failed to save SD Refund Voucher",
//             });
//         }
//     };

//     return (
//         <Formik
//             initialValues={{
//                 entryDeptCode: "", entryHead: "", fromCheque: "", toCheque: "", prabhag: "",
//                 department: "", budget: "", fund: "", transactionNo: "", totalAmount: "",
//                 functionCode: "", objectCode: "", details: "", refundVoucherNo: "",
//                 voucherDate: "", refundDate: new Date(), sdid: "", bankName: "", branch: "",
//                 ifsc: "", accountNo: "", panNo: "", gstNo: "", partyBankId: "",
//             }}
//             onSubmit={handleSubmit}
//         >
//             {({ values, setFieldValue, handleChange }) => {
//                 const [hasFetched, setHasFetched] = useState(false);
//                 const [isGlListReady, setIsGlListReady] = useState(false);

//                 useEffect(() => {
//                     if (glList.length > 0 && !isGlListReady) setIsGlListReady(true);
//                 }, [glList, isGlListReady]);

//                 useEffect(() => {
//                     const fetchAllData = async () => {
//                         if (hasFetched) return;
//                         if (receiptNo && partyId && sdid && token && isGlListReady) {
//                             Swal.fire({ title: "Loading data...", allowOutsideClick: false, didOpen: () => Swal.showLoading() });
//                             try {
//                                 await fetchRefundAmount({ refNo: receiptNo, partyId, recNo: receiptNo, setFieldValue });
//                                 const result = await fetchVoucherMaster({ refNo: receiptNo, partyId, sdid, setFieldValue });
//                                 await fetchPartyTaxDetails({ partyId, setFieldValue });
//                                 if (result?.transactionNo) {
//                                     await fetchReceiptDetails({ setFieldValue, transactionNo: result.transactionNo });
//                                 }
//                                 await fetchVoucherPrepMaster({ refNo: receiptNo, setFieldValue });
//                                 // If no certificate number exists then fetch next auto certificate no
//                                 if (!certificateNo) {
//                                     await fetchNextCertificateNo({ setFieldValue });
//                                 }
//                                 await fetchVoucherDetails({ refNo: receiptNo, partyId, sdid, setFieldValue });
//                                 setHasFetched(true);
//                                 Swal.close();
//                             } catch (error) {
//                                 Swal.close();
//                                 Swal.fire({ icon: "error", text: "Error loading data: Please try again." });
//                             }
//                         }
//                     };
//                     fetchAllData();
//                 }, [receiptNo, partyId, sdid, token, isGlListReady, hasFetched]);

//                 return (
//                     <Form>
//                         <motion.div className="mt-2 px-2 sm:px-4">
//                             <Card className="border border-gray-300 rounded-sm shadow-none">
//                                 <CardHeader className="border-b py-4 px-4">
//                                     <CardTitle className="text-[18px] font-semibold text-black">
//                                         Security Deposit Refund Voucher Preparation
//                                     </CardTitle>
//                                 </CardHeader>
//                                 <CardContent className="p-3 sm:p-5 space-y-6">
//                                     <div className="border border-gray-300 rounded-sm bg-white p-4 sm:p-5 space-y-6">
//                                         <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
//                                             <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
//                                                 <Label className="sm:w-28 text-left sm:text-right font-semibold" text="तारीख :" />
//                                                 <DatePicker value={values.voucherDate} onChange={(date) => setFieldValue("voucherDate", date)} disabled />
//                                             </div>
//                                             <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
//                                                 <Label className="sm:w-24 text-left sm:text-right font-semibold" text="पार्टी :" />
//                                                 <Input name="entryDeptCode" value={values.entryDeptCode} onChange={handleChange} className="flex-1 w-full h-10" disabled />
//                                             </div>
//                                             <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
//                                                 <Label className="sm:w-28 text-left sm:text-right font-semibold" text="पॅनकार्ड :" />
//                                                 <Input name="panNo" value={values.panNo} onChange={handleChange} className="flex-1 w-full h-10" readOnly />
//                                             </div>
//                                             <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
//                                                 <Label className="sm:w-28 text-left sm:text-right font-semibold" text="जी.एस.टी नंबर :" />
//                                                 <Input name="gstNo" value={values.gstNo} onChange={handleChange} className="flex-1 w-full h-10" readOnly />
//                                             </div>
//                                         </div>

//                                         <div className="border-t border-gray-300 pt-5">
//                                             <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 items-start">
//                                                 <div>
//                                                     <Button type="button" onClick={fetchPartyBankList} className="bg-blue-900 hover:bg-blue-950 text-white px-6">Select Bank</Button>
//                                                 </div>
//                                                 <div className="space-y-4">
//                                                     <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
//                                                         <Label className="sm:w-24 text-left sm:text-right font-semibold" text="Bank :" />
//                                                         <Input name="bankName" value={values.bankName} onChange={handleChange} className="flex-1 w-full h-10" readOnly />
//                                                     </div>
//                                                     <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
//                                                         <Label className="sm:w-24 text-left sm:text-right font-semibold" text="IFSC :" />
//                                                         <Input name="ifsc" value={values.ifsc} onChange={handleChange} className="flex-1 w-full h-10" readOnly />
//                                                     </div>
//                                                 </div>
//                                                 <div className="space-y-4">
//                                                     <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
//                                                         <Label className="sm:w-24 text-left sm:text-right font-semibold" text="Branch :" />
//                                                         <Input name="branch" value={values.branch} onChange={handleChange} className="flex-1 w-full h-10" readOnly />
//                                                     </div>
//                                                     <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
//                                                         <Label className="sm:w-24 text-left sm:text-right font-semibold" text="A/c No :" />
//                                                         <Input name="accountNo" value={values.accountNo} onChange={handleChange} className="flex-1 w-full h-10" readOnly />
//                                                     </div>
//                                                 </div>
//                                             </div>
//                                         </div>

//                                         <div className="border-t border-gray-300 pt-5">
//                                             <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
//                                                 <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
//                                                     <Label className="sm:w-32 text-left sm:text-right font-semibold" text="प्रभाग :" />
//                                                     <Select value={values.prabhag} onValueChange={(value) => setFieldValue("prabhag", value)}>
//                                                         <SelectTrigger className="w-full"><SelectValue placeholder="प्रभाग निवडा" /></SelectTrigger>
//                                                         <SelectContent>{zoneList.map((zone) => (<SelectItem key={zone.value} value={zone.value}>{zone.label}</SelectItem>))}</SelectContent>
//                                                     </Select>
//                                                 </div>
//                                                 <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
//                                                     <Label className="sm:w-36 text-left sm:text-right font-semibold" text="विभाग :" />
//                                                     <Select value={values.department} onValueChange={(value) => setFieldValue("department", value)} disabled>
//                                                         <SelectTrigger className="w-full"><SelectValue placeholder="विभाग निवडा" /></SelectTrigger>
//                                                         <SelectContent>{departmentList.map((dept) => (<SelectItem key={dept.value} value={dept.value}>{dept.label}</SelectItem>))}</SelectContent>
//                                                     </Select>
//                                                 </div>
//                                                 <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
//                                                     <Label className="sm:w-32 text-left sm:text-right font-semibold" text="व्यवहार क्र. :" />
//                                                     <Input name="transactionNo" value={values.transactionNo} onChange={handleChange} className="flex-1 w-full h-10" disabled />
//                                                 </div>
//                                                 <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
//                                                     <Label className="sm:w-36 text-left sm:text-right font-semibold text-nowrap" text="सु.अ.परतावा प्रमाणक क्र. :" />
//                                                     <Input name="refundVoucherNo" value={values.refundVoucherNo} onChange={handleChange} className="flex-1 w-full h-10" disabled />
//                                                 </div>
//                                                 <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
//                                                     <Label className="sm:w-32 text-left sm:text-right font-semibold" text="परतावा तारीख :" />
//                                                     <DatePicker value={values.refundDate} onChange={(date) => setFieldValue("refundDate", date)} />
//                                                 </div>
//                                                 <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
//                                                     <Label className="sm:w-32 text-left sm:text-right font-semibold" text="एकूण देयक रक्कम :" />
//                                                     <Input name="totalAmount" value={values.totalAmount} onChange={handleChange} className="flex-1 w-full h-10" disabled />
//                                                 </div>
//                                                 <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
//                                                     <Label className="sm:w-32 text-left sm:text-right font-semibold" text="बजेट :" />
//                                                     <Select value={values.budget} onValueChange={(value) => { setFieldValue("budget", value); setFieldValue("fund", ""); fetchNidhiList(value); }} disabled>
//                                                         <SelectTrigger className="w-full"><SelectValue placeholder="बजेट निवडा" /></SelectTrigger>
//                                                         <SelectContent>{budgetList.map((budget) => (<SelectItem key={budget.value} value={budget.value}>{budget.label}</SelectItem>))}</SelectContent>
//                                                     </Select>
//                                                 </div>
//                                                 <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
//                                                     <Label className="sm:w-36 text-left sm:text-right font-semibold" text="निधी :" />
//                                                     <Select value={values.fund} onValueChange={(value) => setFieldValue("fund", value)} disabled>
//                                                         <SelectTrigger className="w-full"><SelectValue placeholder="निधी निवडा" /></SelectTrigger>
//                                                         <SelectContent>{nidhiList.map((nidhi) => (<SelectItem key={nidhi.value} value={nidhi.value}>{nidhi.label}</SelectItem>))}</SelectContent>
//                                                     </Select>
//                                                 </div>
//                                                 <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
//                                                     <Label className="sm:w-32 text-left sm:text-right font-semibold" text="फंक्शन कोड. :" />
//                                                     <SearchableSelect name="functionCode" value={values.functionCode} options={glList} onChange={(val) => { if (val) setFieldValue("functionCode", val.value); }} placeholder="फंक्शन कोड निवडा" disabled />
//                                                 </div>

//                                                 <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
//                                                     <Label className="sm:w-36 text-left sm:text-right font-semibold text-nowrap" text="ऑब्जेक्ट कोड/बँक खाते :" />
//                                                     <Input name="objectCode" value={values.objectCode} onChange={handleChange} className="flex-1 w-full h-10" disabled />
//                                                 </div>

//                                                 <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
//                                                     <Label className="sm:w-32 text-left sm:text-right font-semibold" text="तपशील" />
//                                                     <Input name="details" value={values.details} onChange={handleChange} className="flex-1 w-full h-10" />
//                                                 </div>
//                                             </div>
//                                         </div>
//                                         <div className="border-t border-gray-300 pt-6 flex justify-center gap-3">
//                                             <Button type="submit" className="bg-blue-900 hover:bg-blue-950 text-white px-8">Accept</Button>
//                                             <Button type="button" variant="outline" onClick={() => navigate("/Transactions/FrmSDRefund")}>Back</Button>
//                                         </div>
//                                     </div>
//                                 </CardContent>
//                             </Card>
//                         </motion.div>

//                         {showBankModal && (
//                             <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-2">
//                                 <div className="bg-[#f5f1e8] w-full max-w-4xl rounded-md shadow-lg border border-gray-400">
//                                     <div className="border-b p-4 text-center"><h2 className="text-2xl font-semibold">Party Bank Details</h2></div>
//                                     <div className="p-6 overflow-x-auto">
//                                         {loadingBanks ? (<div className="text-center py-10">Loading...</div>) : (
//                                             <table className="w-full border border-gray-300 text-sm">
//                                                 <thead className="bg-gray-100">
//                                                     <tr><th className="border p-2 text-left">बँक नाव</th><th className="border p-2 text-left">ब्रांच नाव</th><th className="border p-2 text-left">IFSC कोड</th><th className="border p-2 text-left">अकाउंट नं.</th><th className="border p-2 text-left">स्टेटस</th><th className="border p-2 text-center">Select</th></tr>
//                                                 </thead>
//                                                 <tbody>
//                                                     {partyBankList.length > 0 ? partyBankList.map((bank) => (
//                                                         <tr key={bank.NUM_PARTYBANK_ID}>
//                                                             <td className="border p-2">{bank.VAR_BANKMST_BANKNAME}</td>
//                                                             <td className="border p-2">{bank.VAR_BRANCHMST_BRANCHNAME}</td>
//                                                             <td className="border p-2">{bank.VAR_PARTYBANK_IFSC}</td>
//                                                             <td className="border p-2">{bank.VAR_PARTYBANK_ACCOUNTNO}</td>
//                                                             <td className="border p-2">{bank.VAR_PARTYBANK_STATUS}</td>
//                                                             <td className="border p-2 text-center">
//                                                                 <button type="button" className="text-blue-600 hover:underline" onClick={() => {
//                                                                     setFieldValue("bankName", bank.VAR_BANKMST_BANKNAME || "");
//                                                                     setFieldValue("branch", bank.VAR_BRANCHMST_BRANCHNAME || "");
//                                                                     setFieldValue("ifsc", bank.VAR_PARTYBANK_IFSC || "");
//                                                                     setFieldValue("accountNo", bank.VAR_PARTYBANK_ACCOUNTNO || "");
//                                                                     setFieldValue("partyBankId", bank.NUM_PARTYBANK_ID || "");
//                                                                     setShowBankModal(false);
//                                                                 }}>Select</button>
//                                                             </td>
//                                                         </tr>
//                                                     )) : (<tr><td colSpan={6} className="text-center p-4">No bank details found</td></tr>)}
//                                                 </tbody>
//                                             </table>
//                                         )}
//                                         <div className="flex justify-center mt-6"><Button type="button" variant="outline" onClick={() => setShowBankModal(false)}>Close</Button></div>
//                                     </div>
//                                 </div>
//                             </div>
//                         )}
//                     </Form>
//                 );
//             }}
//         </Formik>
//     );
// };

// export default FrmSDVchPrepMst;

import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Swal from "sweetalert2";
import { Formik, Form } from "formik";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import SearchableSelect from "@/components/SearchableSelect";
import { DatePicker } from "@/components/ui/calendar";
import { useLocation } from "react-router-dom";

const FrmSDVchPrepMst = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const token = user?.token;
    const ulbId = user?.ulbId;
    const location = useLocation();

    const receiptNo = location.state?.receiptNo;
    const partyId = location.state?.partyId;
    const sdid = location.state?.sdid;

    const BASE_URL = import.meta.env.VITE_BASE_URL;

    const [glList, setGlList] = useState([]);
    const [zoneList, setZoneList] = useState([]);
    const [departmentList, setDepartmentList] = useState([]);
    const [budgetList, setBudgetList] = useState([]);
    const [nidhiList, setNidhiList] = useState([]);
    const [showBankModal, setShowBankModal] = useState(false);
    const [partyBankList, setPartyBankList] = useState([]);
    const [loadingBanks, setLoadingBanks] = useState(false);
    const [voucherDetails, setVoucherDetails] = useState([]);
    const [certificateNo, setCertificateNo] = useState("");
    const [partyName, setPartyName] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const formatDate = (date) => {
        if (!date) return "";
        const d = new Date(date);
        const day = String(d.getDate()).padStart(2, "0");
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const year = d.getFullYear();
        return `${day}-${month}-${year}`;
    };

    useEffect(() => {
        const fetchGLList = async () => {
            try {
                const res = await axios.get(`${BASE_URL}/api/Receipt/searchGLALL`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const data = res.data?.data || [];
                const formatted = data.map((item) => ({
                    label: item.GLSEARCHNAME || "",
                    value: item.GLFUNCTION?.toString() || "",
                }));
                setGlList(formatted);
            } catch (err) {
                console.error("GL List API Error:", err);
            }
        };
        if (token) fetchGLList();
    }, [token, BASE_URL]);

    useEffect(() => {
        const fetchZoneList = async () => {
            try {
                const res = await axios.post(
                    `${BASE_URL}/api/Receipt/zones`,
                    { corp_id: ulbId },
                    { headers: { Authorization: `Bearer ${token}` } },
                );
                const data = res.data?.data || [];
                const formatted = data.map((item) => ({
                    label: item.ZONEENAME,
                    value: item.ZONEID?.toString(),
                }));
                setZoneList(formatted);
            } catch (err) {
                console.error("Zone API Error:", err);
            }
        };

        const fetchDepartmentList = async () => {
            try {
                const res = await axios.get(
                    `${BASE_URL}/api/Bankdeposit/department?ulbId=${ulbId}`,
                    { headers: { Authorization: `Bearer ${token}` } },
                );
                const data = res.data?.data?.list || [];
                const formatted = data.map((item) => ({
                    label: item.DEPTNAME,
                    value: item.DEPTID?.toString(),
                }));
                setDepartmentList(formatted);
            } catch (err) {
                console.error("Department API Error:", err);
            }
        };

        if (token && ulbId) {
            fetchZoneList();
            fetchDepartmentList();
        }
    }, [token, ulbId, BASE_URL]);

    useEffect(() => {
        const fetchBudgetList = async () => {
            try {
                const res = await axios.get(
                    `${BASE_URL}/api/FrmTransfer/budget-heads`,
                    { headers: { Authorization: `Bearer ${token}` } },
                );
                const data = res.data?.data?.rows || [];
                const formatted = data.map((item) => ({
                    label: item.VAR_BUDGETCONFIG_BUDGETNAME,
                    value: item.NUM_BUDGETCONFIG_HEADID?.toString(),
                }));
                setBudgetList(formatted);
            } catch (err) {
                console.error("Budget API Error:", err);
            }
        };
        if (token) fetchBudgetList();
    }, [token, BASE_URL]);

    const fetchNextCertificateNo = async ({ setFieldValue }) => {
        try {
            const res = await axios.get(
                `${BASE_URL}/api/frmSDRef/next-certificate-no/${ulbId}`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                },
            );

            const certNo = res.data?.data?.maxcertino;

            if (certNo) {
                setFieldValue("refundVoucherNo", certNo.toString());
                setCertificateNo(certNo.toString());
            }
        } catch (err) {
            console.error("Next Certificate No API Error:", err);
        }
    };

    const fetchVoucherDetails = async ({
        refNo,
        partyId,
        sdid,
        setFieldValue,
    }) => {
        try {
            const res = await axios.post(
                `${BASE_URL}/api/frmSDRef/voucher-details`,
                {
                    refNo: Number(refNo),
                    partyId: Number(partyId),
                    sdid: Number(sdid),
                    ulbId: ulbId,
                },
                { headers: { Authorization: `Bearer ${token}` } },
            );
            const data = res.data?.data?.data || [];
            if (data.length > 0) {
                const firstDetail = data[0];
                setFieldValue("objectCode", firstDetail.ACCNO?.toString() || "");
                if (firstDetail.NARRATN) {
                    setFieldValue("details", firstDetail.NARRATN);
                }
                setVoucherDetails(data);
            }
        } catch (err) {
            console.error("Voucher Details API Error:", err);
        }
    };

    const fetchReceiptDetails = async ({ setFieldValue, transactionNo }) => {
        try {
            if (!transactionNo) return;
            const res = await axios.post(
                `${BASE_URL}/api/frmSDRef/voucher-receipt-details`,
                { voucherNo: transactionNo, ulbId: ulbId },
                { headers: { Authorization: `Bearer ${token}` } },
            );
            const data = res.data?.data?.data || [];
            if (data.length > 0) {
                const receipt = data[0];
                if (receipt.PANCARD) setFieldValue("panNo", receipt.PANCARD);
                if (receipt.GSTNO || receipt.GST_NUMBER)
                    setFieldValue("gstNo", receipt.GSTNO || receipt.GST_NUMBER);
            }
        } catch (err) {
            console.error("Receipt Details API Error:", err);
        }
    };

    const fetchVoucherPrepMaster = async ({ refNo, setFieldValue }) => {
        try {
            const res = await axios.post(
                `${BASE_URL}/api/frmSDRef/voucher-prep-master`,
                { refNo: Number(refNo), ulbId: ulbId },
                { headers: { Authorization: `Bearer ${token}` } },
            );
            const data = res.data?.data?.data?.[0];
            if (data) {
                if (data.CERTINO && data.CERTINO !== 0 && data.CERTINO !== null) {
                    setFieldValue("refundVoucherNo", data.CERTINO.toString());
                    setCertificateNo(data.CERTINO.toString());
                } else {
                    await fetchNextCertificateNo({ setFieldValue });
                }
                if (data.PAYAMT && data.PAYAMT > 0) {
                    setFieldValue("totalAmount", data.PAYAMT);
                }
            }
        } catch (err) {
            if (err.response?.status !== 404) {
                console.error("Voucher Prep Master API Error:", err);
            }

            await fetchNextCertificateNo({ setFieldValue });
        }
    };

    const fetchNidhiList = async (budgetId) => {
        if (!budgetId) return;
        try {
            const res = await axios.post(
                `${BASE_URL}/api/FrmVoucher/nidhi`,
                { budgetid: Number(budgetId), nidhiFlag: "Y", ulbid: ulbId },
                { headers: { Authorization: `Bearer ${token}` } },
            );
            const data = res.data?.data?.data || [];
            const formatted = data.map((item) => ({
                label: item.NIDHINAME,
                value: item.NIDHIID?.toString(),
            }));
            setNidhiList(formatted);
        } catch (err) {
            console.error("Nidhi API Error:", err);
        }
    };

    const fetchPartyBankDetails = async ({ partyBankId, setFieldValue }) => {
        if (!partyBankId) return;
        try {
            const res = await axios.post(
                `${BASE_URL}/api/frmSDRef/party-bank-details`,
                { partyBankId: Number(partyBankId), ulbId: ulbId },
                { headers: { Authorization: `Bearer ${token}` } },
            );
            const data = res.data?.data?.data?.[0];
            if (!data) return;
            setFieldValue("bankName", data.VAR_BANKMST_BANKNAME || "");
            setFieldValue("branch", data.VAR_BRANCHMST_BRANCHNAME || "");
            setFieldValue("ifsc", data.VAR_PARTYBANK_IFSC || "");
            setFieldValue("accountNo", data.VAR_PARTYBANK_ACCOUNTNO || "");
            setFieldValue("partyBankId", data.NUM_PARTYBANK_ID || "");
        } catch (err) {
            console.error("Party Bank Details API Error:", err);
        }
    };

    const fetchPartyBankList = async () => {
        try {
            setLoadingBanks(true);
            const res = await axios.post(
                `${BASE_URL}/api/frmSDRef/party-bank-list`,
                { partyId: Number(partyId) },
                { headers: { Authorization: `Bearer ${token}` } },
            );
            const data = res.data?.data?.data || [];
            setPartyBankList(data);
            setShowBankModal(true);
        } catch (err) {
            console.error("Party Bank List API Error:", err);
            Swal.fire({ icon: "error", text: "Failed to fetch bank details" });
        } finally {
            setLoadingBanks(false);
        }
    };

    const fetchVoucherMaster = async ({
        refNo,
        partyId,
        sdid,
        setFieldValue,
    }) => {
        try {
            const res = await axios.post(
                `${BASE_URL}/api/frmSDRef/voucher-master`,
                {
                    refNo: Number(refNo),
                    partyId: Number(partyId),
                    ulbId: ulbId,
                    sdid: Number(sdid),
                },
                { headers: { Authorization: `Bearer ${token}` } },
            );
            const data = res.data?.data?.data?.[0];
            if (!data) return null;

            setFieldValue(
                "voucherDate",
                data.TRNSDATE ? new Date(data.TRNSDATE) : "",
            );
            setFieldValue("transactionNo", data.VCHNO || "");
            setFieldValue("totalAmount", data.TOTALAMT || "");
            setFieldValue("details", data.VAR_RECEIPTDET_NARRATION || "");
            setFieldValue("department", data.DEPTID?.toString() || "");

            if (
                data.NUM_RECEIPTMST_BUDGET_ID &&
                data.NUM_RECEIPTMST_BUDGET_ID !== 0
            ) {
                const budgetId = data.NUM_RECEIPTMST_BUDGET_ID.toString();
                setFieldValue("budget", budgetId);
                await fetchNidhiList(data.NUM_RECEIPTMST_BUDGET_ID);
            } else {
                setFieldValue("budget", "");
            }

            if (data.NIDHI_ID && data.NIDHI_ID !== null) {
                setFieldValue("fund", data.NIDHI_ID.toString());
            } else {
                setFieldValue("fund", "");
            }

            if (data.DRGL && data.DRGL !== 0) {
                let functionCodeValue = data.DRGL.toString();
                const matchedGL = glList.find((gl) => gl.value === functionCodeValue);
                if (matchedGL) {
                    setFieldValue("functionCode", functionCodeValue);
                } else {
                    const numericMatch = glList.find(
                        (gl) => Number(gl.value) === data.DRGL,
                    );
                    if (numericMatch) {
                        setFieldValue("functionCode", numericMatch.value);
                    } else {
                        setFieldValue("functionCode", functionCodeValue);
                    }
                }
            } else {
                setFieldValue("functionCode", "");
            }

            if (data.DRACC && data.DRACC !== 0) {
                setFieldValue("objectCode", data.DRACC.toString());
            } else {
                setFieldValue("objectCode", "");
            }

            if (data.ZONEID && data.ZONEID !== 0) {
                setFieldValue("prabhag", data.ZONEID.toString());
            } else {
                setFieldValue("prabhag", "");
            }

            if (data.PARTYNAME) {
                const partyDisplayValue = `${data.PARTYID || partyId}-${data.PARTYNAME}`;
                setFieldValue("entryDeptCode", partyDisplayValue);
                setPartyName(data.PARTYNAME);
            }

            if (data.PARTYBANKID && data.PARTYBANKID !== 0) {
                await fetchPartyBankDetails({
                    partyBankId: data.PARTYBANKID,
                    setFieldValue,
                });
            }

            return { transactionNo: data.VCHNO, voucherData: data };
        } catch (err) {
            console.error("Voucher Master API Error:", err);
            throw err;
        }
    };

    const fetchRefundAmount = async ({
        refNo,
        partyId,
        recNo,
        setFieldValue,
    }) => {
        try {
            const res = await axios.post(
                `${BASE_URL}/api/frmSDRef/check-refund-status`,
                {
                    refNo: Number(refNo),
                    partyId: Number(partyId),
                    recNo: Number(recNo),
                    ulbId: ulbId,
                },
                { headers: { Authorization: `Bearer ${token}` } },
            );
            const data = res.data?.data?.data?.[0];
            if (!data) return;

            const balanceAmount = Number(data.AMOUNT || 0) - Number(data.PAYAMT || 0);

            if (balanceAmount === 0) {
                Swal.fire({
                    icon: "warning",
                    text: "Full amount is already refunded",
                }).then(() => {
                    navigate("/Transactions/FrmSDRefund");
                });
                return;
            }

            if (Number(data.PAYAMT || 0) > 0) {
                Swal.fire({
                    icon: "info",
                    text: "Partial payment done for the security deposit. Kindly pay the remaining balance",
                });
            }

            setFieldValue("totalAmount", balanceAmount);
        } catch (err) {
            console.error("Refund Status API Error:", err);
        }
    };

    const fetchPartyTaxDetails = async ({ partyId, setFieldValue }) => {
        try {
            if (!partyId) return;
            const res = await axios.post(
                `${BASE_URL}/api/frmSDRef/party-tax-details`,
                { partyId: Number(partyId), ulbId: ulbId },
                { headers: { Authorization: `Bearer ${token}` } },
            );
            const data = res.data?.data?.data?.[0];
            if (data) {
                if (data.VAR_PARTYMST_PANCARD)
                    setFieldValue("panNo", data.VAR_PARTYMST_PANCARD);
                if (data.VAR_PARTYMST_GSTNO)
                    setFieldValue("gstNo", data.VAR_PARTYMST_GSTNO);
            }
        } catch (err) {
            console.error("Party Tax Details API Error:", err);
        }
    };

    const handleSubmit = async (values) => {
        try {
            // ---------------- VALIDATIONS ----------------
            if (!values.prabhag) {
                return Swal.fire({ icon: "warning", text: "प्रभाग निवडा" });
            }
            if (!values.department) {
                return Swal.fire({ icon: "warning", text: "विभाग निवडा" });
            }
            if (!values.voucherDate) {
                return Swal.fire({ icon: "warning", text: "तारीख निवडा" });
            }
            if (!values.refundVoucherNo) {
                return Swal.fire({
                    icon: "warning",
                    text: "सु.अ.परतावा प्रमाणक क्र रिक्त असू शकत नाही",
                });
            }
            if (!values.functionCode) {
                return Swal.fire({ icon: "warning", text: "फंक्शन कोड निवडा" });
            }
            if (!values.objectCode) {
                return Swal.fire({ icon: "warning", text: "ऑब्जेक्ट कोड रिक्त आहे" });
            }
            if (!values.totalAmount) {
                return Swal.fire({ icon: "warning", text: "एकूण रक्कम रिक्त आहे" });
            }
            if (!values.details) {
                return Swal.fire({ icon: "warning", text: "तपशील भरा" });
            }
            if (!values.bankName || !values.accountNo) {
                return Swal.fire({ icon: "warning", text: "कृपया पार्टी बँक निवडा" });
            }

            // ---------------- DATE FORMAT ----------------
            const voucherDate = formatDate(values.voucherDate)
                .toUpperCase()
                .replace(/-/g, "-");

            const refundDate = formatDate(values.refundDate)
                .toUpperCase()
                .replace(/-/g, "-");

            const convertToOracleDate = (dateStr) => {
                const months = [
                    "JAN", "FEB", "MAR", "APR", "MAY", "JUN",
                    "JUL", "AUG", "SEP", "OCT", "NOV", "DEC",
                ];
                const [day, month, year] = dateStr.split("-");
                return `${day}-${months[Number(month) - 1]}-${year}`;
            };

            const oracleVoucherDate = convertToOracleDate(voucherDate);
            const oracleRefundDate = convertToOracleDate(refundDate);

            const partyBankId = values.partyBankId || 0;

            if (!partyBankId) {
                return Swal.fire({
                    icon: "warning",
                    text: "Party Bank ID मिळाला नाही",
                });
            }

            const SDdeptid = voucherDetails?.[0]?.DEPTID || values.department;
            const SDdepotypeid = voucherDetails?.[0]?.DEPOTYPEID || 1;
            const SDdepono = voucherDetails?.[0]?.DEPONO || 0;
            const SDbankaccno = voucherDetails?.[0]?.BANKACCNO || 0;
            const depodetail = voucherDetails?.[0]?.DEPODDETAIL || "E-Deposit";
            const rectransno = values.transactionNo;

            const paramStr4 =
                `${partyId}#` +
                `${values.functionCode}#` +
                `${values.objectCode}#` +
                `${values.totalAmount}#` +
                `${SDdeptid}#` +
                `${SDdepotypeid}#` +
                `${SDdepono}#` +
                `${SDbankaccno}#` +
                `${depodetail}#` +
                `${oracleRefundDate}#` +
                `${values.refundVoucherNo}`;

            const mode = 3;

            const paramStr =
                `${oracleVoucherDate}~` +
                `${values.transactionNo}~` +
                `${values.prabhag}~` +
                `~` + // Gram Panchayat blank
                `${partyId}~` +
                `${values.totalAmount}~` +
                `${values.functionCode}~` +
                `${values.objectCode}~` +
                `${partyBankId}~` +
                `${mode}~` +
                `0~` +
                `0~` +
                `0~` +
                `${values.details}~` +
                `${values.budget || 0}~` +
                `${values.fund || 0}~` +
                `${rectransno}~` +
                `${values.totalAmount}~` +
                `${values.department}~` +
                `${sdid}`;

            const payload = {
                userId: user?.userId,
                zoneId: Number(values.prabhag),
                paramStr: paramStr,
                paramStr2: "",
                paramStr3: "",
                paramStr4: paramStr4,
            };

            // Show saving alert
            Swal.fire({
                title: "Saving...",
                allowOutsideClick: false,
                didOpen: () => Swal.showLoading(),
            });

            const res = await axios.post(`${BASE_URL}/api/frmSDRef/save`, payload, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.data?.ok) {
                const voucherNo = res.data?.data?.refno;

                // Close save alert and show PDF generation alert
                Swal.close();
                Swal.fire({
                    title: "Generating PDF...",
                    allowOutsideClick: false,
                    didOpen: () => Swal.showLoading(),
                });

                try {
                    const pdfRes = await axios.post(
                        `${BASE_URL}/api/frmSDRef/voucherreceiptpdf`,
                        {
                            voucherNo: Number(voucherNo),
                            ulbId: Number(ulbId),
                            sdid: Number(sdid),
                        },
                        { headers: { Authorization: `Bearer ${token}` } }
                    );

                    Swal.close();

                    if (pdfRes.data?.success && pdfRes.data?.pdfUrl) {

                        window.open(pdfRes.data.pdfUrl, "_blank");
                        // Show success message
                        await Swal.fire({
                            icon: "success",
                            title: "Success",
                            text: res.data?.data?.message || "SD Refund voucher saved successfully",
                            confirmButtonColor: "#1e3a8a",
                        });



                        // Navigate back
                        navigate("/Transactions/FrmSDRefund");
                    } else {
                        Swal.fire({
                            icon: "success",
                            title: "Success",
                            text: "Voucher saved but PDF generation failed",
                            confirmButtonColor: "#1e3a8a",
                        }).then(() => {
                            navigate("/Transactions/FrmSDRefund");
                        });
                    }
                } catch (pdfErr) {
                    console.error("PDF API ERROR:", pdfErr);
                    Swal.close();
                    Swal.fire({
                        icon: "success",
                        title: "Success",
                        text: "Voucher saved but PDF generation failed",
                        confirmButtonColor: "#1e3a8a",
                    }).then(() => {
                        navigate("/Transactions/FrmSDRefund");
                    });
                }
            } else {
                Swal.close();
                Swal.fire({
                    icon: "error",
                    text: res.data?.message || "Failed to save",
                    confirmButtonColor: "#1e3a8a",
                });
            }
        } catch (err) {
            console.error("SAVE API ERROR:", err);
            Swal.close();
            Swal.fire({
                icon: "error",
                text: err.response?.data?.message || "Failed to save SD Refund Voucher",
                confirmButtonColor: "#1e3a8a",
            });
        }
    };

    return (
        <Formik
            initialValues={{
                entryDeptCode: "",
                entryHead: "",
                fromCheque: "",
                toCheque: "",
                prabhag: "",
                department: "",
                budget: "",
                fund: "",
                transactionNo: "",
                totalAmount: "",
                functionCode: "",
                objectCode: "",
                details: "",
                refundVoucherNo: "",
                voucherDate: "",
                refundDate: new Date(),
                sdid: "",
                bankName: "",
                branch: "",
                ifsc: "",
                accountNo: "",
                panNo: "",
                gstNo: "",
                partyBankId: "",
            }}
            onSubmit={handleSubmit}
        >
            {({ values, setFieldValue, handleChange }) => {
                const [hasFetched, setHasFetched] = useState(false);
                const [isGlListReady, setIsGlListReady] = useState(false);

                useEffect(() => {
                    if (glList.length > 0 && !isGlListReady) setIsGlListReady(true);
                }, [glList, isGlListReady]);

                useEffect(() => {
                    const fetchAllData = async () => {
                        if (hasFetched) return;
                        if (receiptNo && partyId && sdid && token && isGlListReady) {
                            setIsLoading(true);
                            Swal.fire({
                                title: "Loading data...",
                                allowOutsideClick: false,
                                didOpen: () => Swal.showLoading(),
                            });

                            try {
                                await fetchRefundAmount({
                                    refNo: receiptNo,
                                    partyId,
                                    recNo: receiptNo,
                                    setFieldValue,
                                });
                                const result = await fetchVoucherMaster({
                                    refNo: receiptNo,
                                    partyId,
                                    sdid,
                                    setFieldValue,
                                });
                                await fetchPartyTaxDetails({ partyId, setFieldValue });
                                if (result?.transactionNo) {
                                    await fetchReceiptDetails({
                                        setFieldValue,
                                        transactionNo: result.transactionNo,
                                    });
                                }
                                await fetchVoucherPrepMaster({
                                    refNo: receiptNo,
                                    setFieldValue,
                                });
                                if (!certificateNo) {
                                    await fetchNextCertificateNo({ setFieldValue });
                                }
                                await fetchVoucherDetails({
                                    refNo: receiptNo,
                                    partyId,
                                    sdid,
                                    setFieldValue,
                                });
                                setHasFetched(true);
                                Swal.close();
                                setIsLoading(false);
                            } catch (error) {
                                Swal.close();
                                setIsLoading(false);
                                Swal.fire({
                                    icon: "error",
                                    text: "Error loading data: Please try again.",
                                });
                            }
                        }
                    };
                    fetchAllData();
                }, [receiptNo, partyId, sdid, token, isGlListReady, hasFetched]);

                return (
                    <Form>
                        <motion.div className="mt-2 px-2 sm:px-4">
                            <Card className="border border-gray-300 rounded-sm shadow-none">
                                <CardHeader className="border-b py-4 px-4">
                                    <CardTitle className="text-[18px] font-semibold text-black">
                                        Security Deposit Refund Voucher Preparation
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-3 sm:p-5 space-y-6">
                                    <div className="border border-gray-300 rounded-sm bg-white p-4 sm:p-5 space-y-6">
                                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                                                <Label
                                                    className="sm:w-28 text-left sm:text-right font-semibold"
                                                    text="तारीख :"
                                                />
                                                <DatePicker
                                                    value={values.voucherDate}
                                                    onChange={(date) =>
                                                        setFieldValue("voucherDate", date)
                                                    }
                                                    disabled
                                                />
                                            </div>
                                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                                                <Label
                                                    className="sm:w-24 text-left sm:text-right font-semibold"
                                                    text="पार्टी :"
                                                />
                                                <Input
                                                    name="entryDeptCode"
                                                    value={values.entryDeptCode}
                                                    onChange={handleChange}
                                                    className="flex-1 w-full h-10"
                                                    disabled
                                                />
                                            </div>
                                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                                                <Label
                                                    className="sm:w-28 text-left sm:text-right font-semibold"
                                                    text="पॅनकार्ड :"
                                                />
                                                <Input
                                                    name="panNo"
                                                    value={values.panNo}
                                                    onChange={handleChange}
                                                    className="flex-1 w-full h-10"
                                                    readOnly
                                                />
                                            </div>
                                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                                                <Label
                                                    className="sm:w-28 text-left sm:text-right font-semibold"
                                                    text="जी.एस.टी नंबर :"
                                                />
                                                <Input
                                                    name="gstNo"
                                                    value={values.gstNo}
                                                    onChange={handleChange}
                                                    className="flex-1 w-full h-10"
                                                    readOnly
                                                />
                                            </div>
                                        </div>

                                        <div className="border-t border-gray-300 pt-5">
                                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 items-start">
                                                <div>
                                                    <Button
                                                        type="button"
                                                        onClick={fetchPartyBankList}
                                                        className="bg-blue-900 hover:bg-blue-950 text-white px-6"
                                                    >
                                                        Select Bank
                                                    </Button>
                                                </div>
                                                <div className="space-y-4">
                                                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                                                        <Label
                                                            className="sm:w-24 text-left sm:text-right font-semibold"
                                                            text="Bank :"
                                                        />
                                                        <Input
                                                            name="bankName"
                                                            value={values.bankName}
                                                            onChange={handleChange}
                                                            className="flex-1 w-full h-10"
                                                            readOnly
                                                        />
                                                    </div>
                                                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                                                        <Label
                                                            className="sm:w-24 text-left sm:text-right font-semibold"
                                                            text="IFSC :"
                                                        />
                                                        <Input
                                                            name="ifsc"
                                                            value={values.ifsc}
                                                            onChange={handleChange}
                                                            className="flex-1 w-full h-10"
                                                            readOnly
                                                        />
                                                    </div>
                                                </div>
                                                <div className="space-y-4">
                                                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                                                        <Label
                                                            className="sm:w-24 text-left sm:text-right font-semibold"
                                                            text="Branch :"
                                                        />
                                                        <Input
                                                            name="branch"
                                                            value={values.branch}
                                                            onChange={handleChange}
                                                            className="flex-1 w-full h-10"
                                                            readOnly
                                                        />
                                                    </div>
                                                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                                                        <Label
                                                            className="sm:w-24 text-left sm:text-right font-semibold"
                                                            text="A/c No :"
                                                        />
                                                        <Input
                                                            name="accountNo"
                                                            value={values.accountNo}
                                                            onChange={handleChange}
                                                            className="flex-1 w-full h-10"
                                                            readOnly
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="border-t border-gray-300 pt-5">
                                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                                                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                                                    <Label
                                                        className="sm:w-32 text-left sm:text-right font-semibold"
                                                        text="प्रभाग :"
                                                    />
                                                    <Select
                                                        value={values.prabhag}
                                                        onValueChange={(value) =>
                                                            setFieldValue("prabhag", value)
                                                        }
                                                    >
                                                        <SelectTrigger className="w-full">
                                                            <SelectValue placeholder="प्रभाग निवडा" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {zoneList.map((zone) => (
                                                                <SelectItem key={zone.value} value={zone.value}>
                                                                    {zone.label}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                                                    <Label
                                                        className="sm:w-36 text-left sm:text-right font-semibold"
                                                        text="विभाग :"
                                                    />
                                                    <Select
                                                        value={values.department}
                                                        onValueChange={(value) =>
                                                            setFieldValue("department", value)
                                                        }
                                                        disabled
                                                    >
                                                        <SelectTrigger className="w-full">
                                                            <SelectValue placeholder="विभाग निवडा" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {departmentList.map((dept) => (
                                                                <SelectItem key={dept.value} value={dept.value}>
                                                                    {dept.label}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                                                    <Label
                                                        className="sm:w-32 text-left sm:text-right font-semibold"
                                                        text="व्यवहार क्र. :"
                                                    />
                                                    <Input
                                                        name="transactionNo"
                                                        value={values.transactionNo}
                                                        onChange={handleChange}
                                                        className="flex-1 w-full h-10"
                                                        disabled
                                                    />
                                                </div>
                                                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                                                    <Label
                                                        className="sm:w-36 text-left sm:text-right font-semibold text-nowrap"
                                                        text="सु.अ.परतावा प्रमाणक क्र. :"
                                                    />
                                                    <Input
                                                        name="refundVoucherNo"
                                                        value={values.refundVoucherNo}
                                                        onChange={handleChange}
                                                        className="flex-1 w-full h-10"
                                                        disabled
                                                    />
                                                </div>
                                                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                                                    <Label
                                                        className="sm:w-32 text-left sm:text-right font-semibold"
                                                        text="परतावा तारीख :"
                                                    />
                                                    <DatePicker
                                                        value={values.refundDate}
                                                        onChange={(date) =>
                                                            setFieldValue("refundDate", date)
                                                        }
                                                    />
                                                </div>
                                                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                                                    <Label
                                                        className="sm:w-32 text-left sm:text-right font-semibold"
                                                        text="एकूण देयक रक्कम :"
                                                    />
                                                    <Input
                                                        name="totalAmount"
                                                        value={values.totalAmount}
                                                        onChange={handleChange}
                                                        className="flex-1 w-full h-10"
                                                        disabled
                                                    />
                                                </div>
                                                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                                                    <Label
                                                        className="sm:w-32 text-left sm:text-right font-semibold"
                                                        text="बजेट :"
                                                    />
                                                    <Select
                                                        value={values.budget}
                                                        onValueChange={(value) => {
                                                            setFieldValue("budget", value);
                                                            setFieldValue("fund", "");
                                                            fetchNidhiList(value);
                                                        }}
                                                        disabled
                                                    >
                                                        <SelectTrigger className="w-full">
                                                            <SelectValue placeholder="बजेट निवडा" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {budgetList.map((budget) => (
                                                                <SelectItem
                                                                    key={budget.value}
                                                                    value={budget.value}
                                                                >
                                                                    {budget.label}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                                                    <Label
                                                        className="sm:w-36 text-left sm:text-right font-semibold"
                                                        text="निधी :"
                                                    />
                                                    <Select
                                                        value={values.fund}
                                                        onValueChange={(value) =>
                                                            setFieldValue("fund", value)
                                                        }
                                                        disabled
                                                    >
                                                        <SelectTrigger className="w-full">
                                                            <SelectValue placeholder="निधी निवडा" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {nidhiList.map((nidhi) => (
                                                                <SelectItem
                                                                    key={nidhi.value}
                                                                    value={nidhi.value}
                                                                >
                                                                    {nidhi.label}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                                                    <Label
                                                        className="sm:w-32 text-left sm:text-right font-semibold"
                                                        text="फंक्शन कोड. :"
                                                    />
                                                    <SearchableSelect
                                                        name="functionCode"
                                                        value={values.functionCode}
                                                        options={glList}
                                                        onChange={(val) => {
                                                            if (val) setFieldValue("functionCode", val.value);
                                                        }}
                                                        placeholder="फंक्शन कोड निवडा"
                                                        disabled
                                                    />
                                                </div>

                                                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                                                    <Label
                                                        className="sm:w-36 text-left sm:text-right font-semibold text-nowrap"
                                                        text="ऑब्जेक्ट कोड/बँक खाते :"
                                                    />
                                                    <Input
                                                        name="objectCode"
                                                        value={values.objectCode}
                                                        onChange={handleChange}
                                                        className="flex-1 w-full h-10"
                                                        disabled
                                                    />
                                                </div>

                                                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                                                    <Label
                                                        className="sm:w-32 text-left sm:text-right font-semibold"
                                                        text="तपशील"
                                                    />
                                                    <Input
                                                        name="details"
                                                        value={values.details}
                                                        onChange={handleChange}
                                                        className="flex-1 w-full h-10"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="border-t border-gray-300 pt-6 flex justify-center gap-3">
                                            <Button
                                                type="submit"
                                                className="bg-blue-900 hover:bg-blue-950 text-white px-8"
                                            >
                                                Accept
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() => navigate("/Transactions/FrmSDRefund")}
                                            >
                                                Back
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>

                        {showBankModal && (
                            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-2">
                                <div className="bg-[#f5f1e8] w-full max-w-4xl rounded-md shadow-lg border border-gray-400">
                                    <div className="border-b p-4 text-center">
                                        <h2 className="text-2xl font-semibold">
                                            Party Bank Details
                                        </h2>
                                    </div>
                                    <div className="p-6 overflow-x-auto">
                                        {loadingBanks ? (
                                            <div className="text-center py-10">Loading...</div>
                                        ) : (
                                            <table className="w-full border border-gray-300 text-sm">
                                                <thead className="bg-gray-100">
                                                    <tr>
                                                        <th className="border p-2 text-left">बँक नाव</th>
                                                        <th className="border p-2 text-left">ब्रांच नाव</th>
                                                        <th className="border p-2 text-left">IFSC कोड</th>
                                                        <th className="border p-2 text-left">अकाउंट नं.</th>
                                                        <th className="border p-2 text-left">स्टेटस</th>
                                                        <th className="border p-2 text-center">Select</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {partyBankList.length > 0 ? (
                                                        partyBankList.map((bank) => (
                                                            <tr key={bank.NUM_PARTYBANK_ID}>
                                                                <td className="border p-2">
                                                                    {bank.VAR_BANKMST_BANKNAME}
                                                                </td>
                                                                <td className="border p-2">
                                                                    {bank.VAR_BRANCHMST_BRANCHNAME}
                                                                </td>
                                                                <td className="border p-2">
                                                                    {bank.VAR_PARTYBANK_IFSC}
                                                                </td>
                                                                <td className="border p-2">
                                                                    {bank.VAR_PARTYBANK_ACCOUNTNO}
                                                                </td>
                                                                <td className="border p-2">
                                                                    {bank.VAR_PARTYBANK_STATUS}
                                                                </td>
                                                                <td className="border p-2 text-center">
                                                                    <button
                                                                        type="button"
                                                                        className="text-blue-600 hover:underline"
                                                                        onClick={() => {
                                                                            setFieldValue(
                                                                                "bankName",
                                                                                bank.VAR_BANKMST_BANKNAME || "",
                                                                            );
                                                                            setFieldValue(
                                                                                "branch",
                                                                                bank.VAR_BRANCHMST_BRANCHNAME || "",
                                                                            );
                                                                            setFieldValue(
                                                                                "ifsc",
                                                                                bank.VAR_PARTYBANK_IFSC || "",
                                                                            );
                                                                            setFieldValue(
                                                                                "accountNo",
                                                                                bank.VAR_PARTYBANK_ACCOUNTNO || "",
                                                                            );
                                                                            setFieldValue(
                                                                                "partyBankId",
                                                                                bank.NUM_PARTYBANK_ID || "",
                                                                            );
                                                                            setShowBankModal(false);
                                                                        }}
                                                                    >
                                                                        Select
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        ))
                                                    ) : (
                                                        <tr>
                                                            <td colSpan={6} className="text-center p-4">
                                                                No bank details found
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        )}
                                        <div className="flex justify-center mt-6">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() => setShowBankModal(false)}
                                            >
                                                Close
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </Form>
                );
            }}
        </Formik>
    );
};

export default FrmSDVchPrepMst;
