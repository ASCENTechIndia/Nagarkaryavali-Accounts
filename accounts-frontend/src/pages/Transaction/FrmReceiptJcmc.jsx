import { Formik, Form } from "formik";
import { motion } from "framer-motion";
import { ReceiptSchema } from "../validations/global.validation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Swal from "sweetalert2";
import { DatePicker } from "@/components/ui/calendar";
import ShadCNTable from "@/components/ui/table";
import SearchableSelect from "@/components/SearchableSelect";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useLocation } from "react-router-dom";

/* ---------------- ZOD VALIDATOR ---------------- */
// const validateWithZod = (values) => {
//   const result = ReceiptSchema.safeParse(values);

//   if (result.success) return {};

//   const errors = {};
//   result.error.errors.forEach((err) => {
//     errors[err.path[0]] = err.message;
//   });

//   return errors;
// };

const FrmReceiptJcmc = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const refNo = location.state?.receiptNo;
  const ulbId = user?.ulbId;

  console.log("refNo", refNo);
  console.log("ocation.state", location.state);

  const BASE_URL = import.meta.env.VITE_BASE_URL;

  const [zones, setZones] = useState([]);
  const [transTypes, setTransTypes] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [remarks, setRemarks] = useState([]);
  const [glList, setGlList] = useState([]);
  const [partyList, setPartyList] = useState([]);
  const [entryHeadList, setEntryHeadList] = useState([]);
  const [partyMasterList, setPartyMasterList] = useState([]);
  const [tempHead, setTempHead] = useState(null);
  const [glAllList, setGlAllList] = useState([]);
  const [tableData, setTableData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAmountFields, setShowAmountFields] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  const handleAddRow = (values, setFieldValue) => {
    if (!values.entryDeptCode || !values.entryHead || !values.entryAmount) {
      Swal.fire({
        text: "Please fill all required fields",
        confirmButtonColor: "#1e3a8a",
      });
      return;
    }

    const isDuplicate = tableData.some(
      (row) =>
        row.deptCode === values.entryDeptCode && row.head === values.entryHead,
    );

    if (isDuplicate) {
      Swal.fire({
        text: "मेजर कोड आणि मायनर कोड पुन्हा यादीत जाऊ शकत नाही",
        confirmButtonColor: "#1e3a8a",
      });
      return;
    }

    const selectedDept = glAllList.find(
      (g) => g.value === values.entryDeptCode,
    );

    const selectedHead = entryHeadList.find(
      (h) => h.value === values.entryHead,
    );

    const newRow = {
      delete: (
        <button
          type="button"
          onClick={() => handleDeleteRow(tableData.length)}
          className="text-red-600 font-semibold"
        >
          Delete
        </button>
      ),
      deptCode: values.entryDeptCode,
      deptName: selectedDept?.label || "",
      head: values.entryHead,
      headName: selectedHead?.label || "",
      remark: values.remark,
      prevAmount: values.PrevAmount || 0,
      currentAmount: values.CurrentAmount || 0,
      amount:
        Number(values.PrevAmount || 0) +
        Number(values.CurrentAmount || 0),
      partyId: values.partyId || 0,
    };

    setTableData((prev) => [...prev, newRow]);

    const updatedTotal =
      (Number(values.totalAmount) || 0) + Number(values.entryAmount || 0);

    // setFieldValue("totalAmount", updatedTotal);

    // setFieldValue("entryDeptCode", "");
    // setFieldValue("entryHead", "");
    // setFieldValue("entryAmount", "");
    // setFieldValue("remark", "");
    // setFieldValue("PrevAmount", "");
    // setFieldValue("CurrentAmount", "");

    setFieldValue("entryDeptCode", "");
    setFieldValue("entryHead", "");
    setFieldValue("partyId", "");
    setFieldValue("selectedRemark", "");
    setFieldValue("remark", "");
    setFieldValue("entryAmount", "");
    setFieldValue("PrevAmount", "");
    setFieldValue("CurrentAmount", "");

    setEntryHeadList([]);

    return true;
  };

  const handleDeleteRow = (index) => {
    const confirmDelete = window.confirm("Are you sure you want to delete?");

    if (!confirmDelete) return;

    setTableData((prev) => prev.filter((_, i) => i !== index));
  };

  const fetchZones = async () => {
    try {
      const res = await axios.post(
        `${BASE_URL}/api/Receipt/zones`,
        {
          corp_id: ulbId,
        },
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        },
      );
      setZones(res.data.data || []);
    } catch (err) {
      console.error("Zones API Error:", err);
    }
  };

  const fetchTransTypes = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/Receipt/transType`, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });
      setTransTypes(res.data.data || []);
    } catch (err) {
      console.error("Transaction Type API Error:", err);
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await axios.post(
        `${BASE_URL}/api/Receipt/departments`,
        {
          ulbid: ulbId,
        },
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        },
      );
      setDepartments(res.data.data || []);
    } catch (err) {
      console.error("Department API Error:", err);
    }
  };

  const fetchRemarks = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/Receipt/narration`, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });
      setRemarks(res.data.data || []);
    } catch (err) {
      console.error("Remarks API Error:", err);
    }
  };

  const fetchPartyMaster = async () => {
    try {
      const res = await axios.post(
        `${BASE_URL}/api/Receipt/party`,
        {
          ulbid: ulbId,
        },
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        },
      );

      const data = res.data.data || [];

      const formatted = data.map((item) => ({
        label: item.PARTYNAME,
        value: item.NUM_PARTYMST_PARTYID.toString(),
      }));

      setPartyMasterList(formatted);
    } catch (err) {
      console.error("Party API Error:", err);
    }
  };

  const fetchGLAll = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/Receipt/searchGLALL`, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      const data = res.data.data || [];

      const formatted = data.map((item) => ({
        label: item.GLSEARCHNAME,
        value: item.GLFUNCTION.toString(),
      }));

      setGlAllList(formatted);
    } catch (err) {
      console.error("GL ALL API Error:", err);
    }
  };

  // for jcmc only
  const fetchCorporationById = async () => {
    try {
      const res = await axios.post(
        `${BASE_URL}/api/frmPayment/corporation-by-id`,
        {
          corpId: ulbId,
        },
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        },
      );

      const corpData = res.data?.data?.data?.[0];

      if (corpData?.CORPORATIONCODE === "JCMC") {
        setShowAmountFields(true);
      } else {
        setShowAmountFields(false);
      }
    } catch (err) {
      console.error("Corporation API Error:", err);
      setShowAmountFields(false);
    }
  };

  useEffect(() => {
    if (!ulbId) return;

    setIsLoading(true);

    Swal.fire({
      title: "Loading...",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    Promise.all([
      fetchZones(),
      fetchTransTypes(),
      fetchDepartments(),
      fetchRemarks(),
      fetchPartyMaster(),
      fetchGLAll(),
      fetchCorporationById(),
      //   fetchUserMapHeader(setFieldValue),
    ])
      .then(() => {
        if (!refNo) {
          setIsLoading(false);
          Swal.close();
        }
      })
      .catch(() => {
        Swal.close();
        setIsLoading(false);
      });
  }, [ulbId]);

  const fetchGLList = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/Receipt/searchGL`, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });
      setGlList(res.data.data || []);
    } catch (err) {
      console.error("GL API Error:", err);
    }
  };

  const fetchCreditLeasure = async (glcode, type) => {
    try {
      const res = await axios.post(
        `${BASE_URL}/api/FrmTransfer/credit-leasure`,
        {
          corp_id: ulbId,
          glcode: glcode,
        },
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        },
      );

      const data = res.data?.data?.rows || [];

      const formatted = data.map((item) => ({
        label: item.ACCNAME,
        value: item.OBJECTCODE.toString(),
      }));

      if (type === "party") {
        setPartyList(formatted);
      } else if (type === "entryHead") {
        setEntryHeadList(formatted);
      }
    } catch (err) {
      console.error("Credit Leasure API Error:", err);
    }
  };

  const fetchReceiptDetails = async (refNo, setFieldValue) => {
    try {
      Swal.fire({
        title: "Loading ...",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });
      const res = await axios.post(
        `${BASE_URL}/api/Receipt/receiptdetailbyrefno`,
        {
          refNo: refNo,
        },
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        },
      );

      const data = res.data?.data?.data || [];

      if (data.length === 0) return;

      const first = data[0];

      setFieldValue("zoneId", first.ZONEID?.toString() || "");

      setFieldValue(
        "transactionType",
        first.TRNSTYPEID?.toString() || ""
      );

      setFieldValue("reciptNo", first.RECNO || "");

      setFieldValue(
        "department",
        first.ACCDEPTID?.toString() || ""
      );

      setFieldValue(
        "date",
        first.TRNSDATE ? new Date(first.TRNSDATE) : new Date()
      );

      setFieldValue("remark", first.NARRATION || "");

      setFieldValue("wardCode", first.DRGL?.toString() || "");

      setTempHead(first.DRACC?.toString() || "");

      fetchCreditLeasure(first.GLCODE?.toString(), "party");

      const finalTotal = tableData.reduce((sum, row) => {
        const amount = Number(row.amount || 0);

        return row.isDiscount
          ? sum - amount
          : sum + amount;
      }, 0);

      const total = data.reduce(
        (sum, item) => {
          const amount = Number(item.CREDIT || 0);

          return item.ACCNO === "91028290003" || item.ACCNO === "91028290001"
            ? sum - amount
            : sum + amount;
        }, 0);

      setFieldValue("totalAmount", total);

      const tableFormatted = data.map((item, index) => ({
        delete: (
          <button
            type="button"
            onClick={() => handleDeleteRow(index)}
            className="text-red-600 font-semibold"
          >
            Delete
          </button>
        ),

        deptCode: item.GLCODE,
        deptName: item.GLNAME,

        head: item.ACCNO,
        headName: item.ACCOUNTNAME,

        remark: item.NARRATION || "",

        prevAmount: Number(item.NUM_RECEIPTDET_ARRAMOUNT || 0),

        currentAmount: Number(item.NUM_RECEIPTDET_CURRAMOUNT || 0),

        amount: Number(item.CREDIT || 0),

        partyId: item.PARTY || 0,

        isDiscount: item.ACCNO === "91028290003" || item.ACCNO === "91028290001",
      }));

      setTableData(tableFormatted);
    } catch (err) {
      console.error("Receipt Details API Error:", err);
    } finally {
      Swal.close();
    }
  };

  // for jcmc

  const fetchUserMapHeader = async (setFieldValue) => {
    try {
      const res = await axios.post(
        `${BASE_URL}/api/Receipt/usermapheader`,
        {
          userId: user?.userId,
        },
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        },
      );

      const headerData = res.data?.data?.data?.[0];

      if (!headerData) return;

      // Auto fill form fields
      setFieldValue("zoneId", headerData.NUM_ACCUSERMAP_WARD?.toString() || "");

      // setFieldValue(
      //   "transactionType",
      //   headerData.NUM_ACCUSERMAP_TRANSTYPEID?.toString() || "",
      // );

      setFieldValue("reciptNo", headerData.VAR_ACCUSERMAP_RECNO || "");

      setFieldValue(
        "department",
        headerData.NUM_ACCUSERMAP_DEPTID?.toString() || "",
      );

      // setFieldValue("wardCode", headerData.VAR_ACCUSERMAP_GLCODE || "");

      setFieldValue("remark", headerData.VAR_ACCUSERMAP_REMARK || "");

      // Load head dropdown
      await fetchCreditLeasure(headerData.VAR_ACCUSERMAP_GLCODE, "party");

      // Store account no temporarily
      // setTempHead(headerData.VAR_ACCUSERMAP_ACCNO?.trim());
    } catch (err) {
      console.error("User Map Header API Error:", err);
    }
  };

  const fetchAccountMappingDetails = async () => {
    try {
      const res = await axios.post(
        `${BASE_URL}/api/Receipt/accountmappingdetails`,
        {
          userId: user?.userId,
        },
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        },
      );

      const data = res.data?.data?.data || [];

      const formattedData = data.map((item, index) => ({
        delete: (
          <button
            type="button"
            onClick={() => handleDeleteRow(index)}
            className="text-red-600 font-semibold"
          >
            Delete
          </button>
        ),
        deptCode: item.VAR_ACCMPDET_GLCODE,
        deptName: item.VAR_ACCMPDET_GLNAME,
        head: item.VAR_ACCMPDET_ACCNO,
        headName: item.VAR_ACCMPDET_ACCNONAME,
        remark: "",
        amount: "0",
        partyId: 0,
        isDiscount: item.VAR_ACCMPDET_ACCNO === "91028290003" || item.VAR_ACCMPDET_ACCNO === "91028290001",
      }));

      setTableData(formattedData);
    } catch (err) {
      console.error("Account Mapping Details API Error:", err);
    }
  };

  const handleSave = async (values) => {
    console.log("values", values);
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      if (!values.zoneId || values.zoneId === "0") {
        Swal.fire({
          text: "प्रभाग रिक्त असू शकत नाही",
          confirmButtonColor: "#1e3a8a",
        });
        setIsSubmitting(false);
        return;
      }

      if (!values.transactionType || values.transactionType === "0") {
        Swal.fire({
          text: "व्यवहार प्रकार रिक्त असू शकत नाही",
          confirmButtonColor: "#1e3a8a",
        });
        setIsSubmitting(false);
        return;
      }

      if (!values.date) {
        Swal.fire({
          text: "तारीख रिक्त असू शकत नाही",
          confirmButtonColor: "#1e3a8a",
        });
        setIsSubmitting(false);
        return;
      }

      if (!values.reciptNo) {
        Swal.fire({
          text: "चलन/पावती क्र रिक्त असू शकत नाही",
          confirmButtonColor: "#1e3a8a",
        });
        setIsSubmitting(false);
        return;
      }

      if (!values.wardCode) {
        Swal.fire({
          text: "डेबिट GL रिक्त असू शकत नाही",
          confirmButtonColor: "#1e3a8a",
        });
        setIsSubmitting(false);
        return;
      }

      if (!values.head) {
        Swal.fire({
          text: "डेबिट खाते रिक्त असू शकत नाही",
          confirmButtonColor: "#1e3a8a",
        });
        setIsSubmitting(false);
        return;
      }

      if (!values.totalAmount) {
        Swal.fire({
          text: "एकूण रक्कम रिक्त असू शकत नाही",
          confirmButtonColor: "#1e3a8a",
        });
        setIsSubmitting(false);
        return;
      }

      if (tableData.length === 0) {
        Swal.fire({
          text: "व्यवहार ची दिटैल्स व्यवहार सूची मध्ये जोडा",
          confirmButtonColor: "#1e3a8a",
        });
        setIsSubmitting(false);
        return;
      }

      if (values.totalAmount != values.finalTotal) {
        Swal.fire({
          text: "एकूण रक्कम आणि यादीतील एकूण रक्कम जुळत नाही",
          confirmButtonColor: "#1e3a8a",
        });
        setIsSubmitting(false);
        return;
      }

      const formatDate = (date) => {
        const d = new Date(date);
        return d
          .toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })
          .replace(/ /g, "-");
      };

      const TransDate = formatDate(values.date);

      const InMode = refNo ? 2 : 1;
      const RefNo = refNo || 0;

      const paramStr = [
        TransDate,
        values.reciptNo,
        values.transactionType,
        values.zoneId,
        0,
        values.wardCode,
        values.head,
        InMode,
        RefNo,
        values.department,
        "",
        1,
        1,
        values.PrevAmount || 0,
        values.CurrentAmount || 0,
      ].join("~");

      const paramStr2 = tableData
        .map((row) => {
          return [
            row.deptCode,
            row.head,
            row.amount,
            row.remark || "",
            row.partyId || 0,
            row.prevAmount || 0,
            row.currentAmount || 0,
          ].join("#");
        })
        .join("$");

      const res = await axios.post(
        `${BASE_URL}/api/Receipt/receiptInsertUpdate`,
        {
          In_UserId: user?.userId,
          In_ParamStr: paramStr,
          In_ParamStr2: paramStr2,
          In_ParamStr3: "",
          In_ParamStr4: "",
          In_ParamStr5: "",
        
        },
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        },
      );

      console.log("API RESPONSE:", res.data);

      Swal.fire({
        text: res.data?.data?.message,
        confirmButtonColor: "#1e3a8a",
      }).then(async () => {
        // JCMC -> do not generate PDF
        if (showAmountFields) {
          navigate("/Transactions/FrmReceiptList");
          return;
        }

        Swal.fire({
          title: "Generating PDF...",
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          },
        });

        try {
          const generatedRefNo = res.data?.data?.refNo || RefNo;
          const pdfRes = await axios.post(
            `${BASE_URL}/api/Receipt/receipt-pdf`,
            {
              refno: generatedRefNo,
              ulbid: user?.ulbId,
            },
            {
              headers: {
                Authorization: `Bearer ${user.token}`,
              },
            },
          );

          Swal.close();

          if (pdfRes.data?.pdfUrl) {
            window.open(pdfRes.data.pdfUrl, "_blank");
          } else {
            Swal.fire({
              text: "PDF generation failed",
              // icon: "error",
            });
          }
        } catch (pdfErr) {
          console.error("PDF ERROR:", pdfErr);
          Swal.fire({
            text: "PDF generation failed",
            // icon: "error",
          });
        }

        navigate("/Transactions/FrmReceiptList");
      });
    } catch (err) {
      console.error("SAVE ERROR:", err);
      Swal.fire({
        text: "Error while saving",
        confirmButtonColor: "#1e3a8a",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const headers = [
    "Delete",
    "विभाग कोड",
    "विभाग संकेतांकचे नाव",
    "लेखाशीर्ष",
    "लेखाशीर्ष नाव",
    "तपशील",
    "मागील रक्कम",
    "चालू रक्कम",
    "रक्कम",
  ];

  const keyMapping = {
    Delete: "delete",
    "विभाग कोड": "deptCode",
    "विभाग संकेतांकचे नाव": "deptName",
    लेखाशीर्ष: "head",
    "लेखाशीर्ष नाव": "headName",
    तपशील: "remark",
    "मागील रक्कम": "prevAmount",
    "चालू रक्कम": "currentAmount",
    रक्कम: "amount",
  };

  //   const dummyData = tableData;
  const dummyData = tableData.map((row, index) => ({
    ...row,

    delete: (
      <button
        type="button"
        onClick={() => handleDeleteRow(index)}
        className="text-red-600 font-semibold"
      >
        Delete
      </button>
    ),

    prevAmount: (
      <Input
        type="number"
        value={row.prevAmount || ""}
        onChange={(e) => {
          const prevValue = Number(e.target.value || 0);

          setTableData((prev) =>
            prev.map((r, i) =>
              i === index
                ? {
                  ...r,
                  prevAmount: prevValue,
                  amount: prevValue + Number(r.currentAmount || 0),
                }
                : r,
            ),
          );
        }}
      />
    ),

    currentAmount: (
      <Input
        type="number"
        value={row.currentAmount || ""}
        onChange={(e) => {
          const currentValue = Number(e.target.value || 0);

          setTableData((prev) =>
            prev.map((r, i) =>
              i === index
                ? {
                  ...r,
                  currentAmount: currentValue,
                  amount: Number(r.prevAmount || 0) + currentValue,
                }
                : r,
            ),
          );
        }}
      />
    ),

    amount: (
      <Input
        type="number"
        value={row.amount}
        onChange={(e) => {
          const value = e.target.value;

          setTableData((prev) =>
            prev.map((r, i) => (i === index ? { ...r, amount: value } : r)),
          );
        }}
      />
    ),
  }));

  const initialValues = {
    zoneId: "",
    transactionType: "",
    department: "",
    reciptNo: "",
    wardCode: "",
    selectedRemark: "",
    remark: "",
    status: "",
    date: new Date(),
    partyId: "",
    entryDeptCode: "",
    entryHead: "",
    entryAmount: "",
    PrevAmount: "",
    CurrentAmount: "",
  };

  return (
    <Formik
      initialValues={initialValues}
      // validate={validateWithZod}
      onSubmit={(values) => {
        handleSave(values);
      }}
    >
      {({ values, handleChange, setFieldValue, errors, touched }) => {
        useEffect(() => {
          const allLoaded =
            zones.length > 0 &&
            transTypes.length > 0 &&
            departments.length > 0 &&
            remarks.length > 0 &&
            glAllList.length > 0;

          if (!allLoaded) return;

          if (refNo) {
            // EDIT MODE
            fetchReceiptDetails(refNo, setFieldValue).finally(() => {
              setIsLoading(false);
              Swal.close();
            });
          } else {
            // NEW MODE
            fetchUserMapHeader(setFieldValue);
            fetchAccountMappingDetails();

            setIsLoading(false);
            Swal.close();
          }
        }, [refNo, zones, transTypes, departments, remarks, glAllList]);

        // useEffect(() => {
        //   if (
        //     !refNo &&
        //     zones.length > 0 &&
        //     transTypes.length > 0 &&
        //     departments.length > 0
        //   ) {
        //     fetchUserMapHeader(setFieldValue);
        //     fetchAccountMappingDetails();
        //   }
        // }, [refNo, zones, transTypes, departments]);

        useEffect(() => {
          if (values.transactionType) {
            fetchGLList();
          } else {
            setGlList([]);
          }
        }, [values.transactionType]);

        useEffect(() => {
          if (values.wardCode) {
            fetchCreditLeasure(values.wardCode, "party");
          } else {
            setPartyList([]);
          }
        }, [values.wardCode]);

        useEffect(() => {
          if (partyList.length > 0 && tempHead) {
            const exists = partyList.find(
              (item) => item.value?.trim() === tempHead?.trim(),
            );

            if (exists) {
              setFieldValue("head", exists.value); // ✅ set value
              setTempHead(null);
            }
          }
        }, [partyList]);

        useEffect(() => {
          if (values.entryDeptCode) {
            fetchCreditLeasure(values.entryDeptCode, "entryHead");
          } else {
            setEntryHeadList([]);
          }
        }, [values.entryDeptCode]);

        // const finalTotal = tableData.reduce(
        //   (sum, row) => sum + Number(row.amount || 0),
        //   0,
        // );

        const finalTotal = tableData.reduce((sum, row) => {
          const amount = Number(row.amount || 0);

          return row.isDiscount
            ? sum - amount
            : sum + amount;
        }, 0);

        useEffect(() => {
          setFieldValue("finalTotal", finalTotal);
        }, [tableData]);

        useEffect(() => {
          // only for JCMC fields
          if (showAmountFields) {
            const prev = Number(values.PrevAmount || 0);
            const current = Number(values.CurrentAmount || 0);

            const total = prev + current;

            setFieldValue("entryAmount", total ? total.toString() : "");
          }
        }, [values.PrevAmount, values.CurrentAmount, showAmountFields]);

        return (
          <Form>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Card className="border shadow-sm">
                <CardHeader className="border-b">
                  <CardTitle className="text-lg font-semibold">पावती</CardTitle>
                </CardHeader>

                <CardContent className="px-4 sm:px-6 space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <Label text="प्रभाग :" />
                      <Select
                        value={values.zoneId}
                        onValueChange={(v) => setFieldValue("zoneId", v)}
                        disabled
                      >
                        <SelectTrigger className="w-full border rounded-md">
                          <SelectValue placeholder="-- विकल्प निवडा --" />
                        </SelectTrigger>

                        <SelectContent>
                          {zones.map((z) => (
                            <SelectItem
                              key={z.ZONEID}
                              value={z.ZONEID.toString()}
                            >
                              {z.ZONEENAME}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.zoneId && touched.zoneId && (
                        <p className="mt-1 text-sm text-red-500">
                          {errors.zoneId}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label text="व्यवहार प्रकार :" />
                      <Select
                        value={values.transactionType}
                        onValueChange={(v) =>
                          setFieldValue("transactionType", v)
                        }

                      >
                        <SelectTrigger className="w-full border rounded-md">
                          <SelectValue placeholder="-- विकल्प निवडा --" />
                        </SelectTrigger>

                        <SelectContent>
                          {transTypes.map((t) => (
                            <SelectItem
                              key={t.VALUEFIELD}
                              value={t.VALUEFIELD.toString()}
                            >
                              {t.DISPLAYTEXT}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label text="दिनांक :" />
                      <DatePicker
                        value={values.date}
                        onChange={(d) => setFieldValue("date", d)}
                      />
                    </div>

                    <div>
                      <Label text="चलन/पावती क्र :" />
                      <Input
                        name="reciptNo"
                        value={values.reciptNo}
                        onChange={handleChange}
                      />
                      {errors.reciptNo && touched.reciptNo && (
                        <p className="mt-1 text-sm text-red-500">
                          {errors.reciptNo}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label text="विभाग संकेतांक :" />
                      <SearchableSelect
                        options={glList.map((g) => ({
                          label: g.GLNAME,
                          value: g.GLCODE.toString(),
                        }))}
                        name="wardCode"
                        value={values.wardCode}
                        onChange={(val) => setFieldValue("wardCode", val.value)}

                      />
                      {errors.wardCode && touched.wardCode && (
                        <p className="mt-1 text-sm text-red-500">
                          {errors.wardCode}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label text="लेखाशीर्ष :" />
                      <SearchableSelect
                        // key={values.head}
                        options={partyList}
                        name="head"
                        value={values.head}
                        onChange={(val) => setFieldValue("head", val.value)}

                      />
                    </div>

                    <div>
                      <Label text="वसूल रक्कम :" />
                      <Input
                        type="number"
                        name="totalAmount"
                        value={values.totalAmount}
                        onChange={handleChange}
                        autoComplete="off"
                      />
                    </div>

                    <div>
                      <Label text="विभाग :" />
                      <Select
                        value={values.department}
                        onValueChange={(v) => setFieldValue("department", v)}
                        disabled
                      >
                        <SelectTrigger className="w-full border rounded-md">
                          <SelectValue placeholder="-- विकल्प निवडा --" />
                        </SelectTrigger>

                        <SelectContent>
                          {departments.map((d) => (
                            <SelectItem
                              key={d.DEPTID}
                              value={d.DEPTID.toString()}
                            >
                              {d.DEPTNAME}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <hr />

                  <div>
                    <Button type="button" onClick={() => setShowAddModal(true)}>
                      यादीत जोडा
                    </Button>
                  </div>

                  <hr />

                  <div className="w-full overflow-x-auto">
                    <ShadCNTable
                      headers={headers}
                      data={dummyData}
                      keyMapping={keyMapping}
                      pagination={false}
                      className="max-md:min-w-180"
                    />
                  </div>

                  <div className="flex w-full flex-col-reverse lg:flex-row  items-center gap-4 pt-4">
                    <div className="flex gap-3 sm:w-[50%] max-lg:justify-center items-center justify-end">
                      <Button
                        type="submit"
                        className="bg-blue-900 text-white"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? "Saving..." : "साठवा"}
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        onClick={() => navigate("/Transactions/FrmReceiptList")}
                      >
                        रद्द
                      </Button>
                    </div>

                    <div className="flex items-center max-sm:w-full max-sm:justify-center gap-2 w-[50%] justify-end">
                      <Label text="एकूण रक्कम :" />
                      <Input
                        className="w-50"
                        name="finalTotal"
                        value={values.finalTotal || 0}
                        readOnly
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {showAddModal && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 w-[900px] max-h-[90vh] overflow-auto">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold">व्यवहार तपशील</h2>

                    <button
                      type="button"
                      onClick={() => setShowAddModal(false)}
                      className="text-red-600 text-xl"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* विभाग संकेतांक */}
                    <div>
                      <Label text="विभाग संकेतांक :" />
                      <SearchableSelect
                        options={glAllList}
                        name="entryDeptCode"
                        value={values.entryDeptCode}
                        onChange={(val) =>
                          setFieldValue("entryDeptCode", val.value)
                        }
                      />
                    </div>

                    {/* लेखाशीर्ष */}
                    <div>
                      <Label text="लेखाशीर्ष :" />
                      <SearchableSelect
                        options={entryHeadList}
                        name="entryHead"
                        value={values.entryHead}
                        onChange={(val) =>
                          setFieldValue("entryHead", val.value)
                        }
                      />
                    </div>

                    {/* Select Remark */}
                    <div>
                      <Label text="Select Remark :" />

                      <Select
                        value={values.selectedRemark}
                        onValueChange={(v) => {
                          setFieldValue("selectedRemark", v);
                          setFieldValue("remark", v);
                        }}
                      >
                        <SelectTrigger className="w-full border rounded-md">
                          <SelectValue placeholder="-- विकल्प निवडा --" />
                        </SelectTrigger>

                        <SelectContent>
                          {remarks.map((r, index) => (
                            <SelectItem
                              key={index}
                              value={r.VAR_NARRATION_REMARK}
                            >
                              {r.VAR_NARRATION_REMARK}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Previous Amount */}
                    {showAmountFields && (
                      <>
                        <div>
                          <Label text="मागील रक्कम :" />
                          <Input
                            type="number"
                            name="PrevAmount"
                            value={values.PrevAmount || ""}
                            onChange={handleChange}
                          />
                        </div>

                        <div>
                          <Label text="चालू रक्कम :" />
                          <Input
                            type="number"
                            name="CurrentAmount"
                            value={values.CurrentAmount || ""}
                            onChange={handleChange}
                          />
                        </div>
                      </>
                    )}

                    {/* Entry Amount */}
                    <div>
                      <Label text="एकूण रक्कम :" />
                      <Input
                        type="number"
                        name="entryAmount"
                        value={values.entryAmount || ""}
                        onChange={handleChange}
                      />
                    </div>

                    {/* Remark */}
                    <div>
                      <Label text="तपशील :" />
                      <Input
                        name="remark"
                        value={values.remark}
                        onChange={handleChange}
                      />
                    </div>

                    {/* Party */}
                    <div>
                      <Label text="पार्टी संकेतांक :" />

                      <Select
                        value={values.partyId}
                        onValueChange={(v) => setFieldValue("partyId", v)}
                      >
                        <SelectTrigger className="w-full border rounded-md">
                          <SelectValue placeholder="-- विकल्प निवडा --" />
                        </SelectTrigger>

                        <SelectContent>
                          {partyMasterList.map((p) => (
                            <SelectItem key={p.value} value={p.value}>
                              {p.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 mt-6">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowAddModal(false)}
                    >
                      Cancel
                    </Button>

                    <Button
                      type="button"
                      onClick={() => {
                        handleAddRow(values, setFieldValue);
                        setShowAddModal(false);
                      }}
                    >
                      Add
                    </Button>
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

export default FrmReceiptJcmc;