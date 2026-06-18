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
import config from "@/utils/config";

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

const FrmReceiptNew = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  console.log("location", location);
  const mainId = location.state?.mainId;
  const ulbId = user?.ulbId;
  const BASE_URL = import.meta.env.VITE_BASE_URL;

  const [zones, setZones] = useState([]);
  const [transTypes, setTransTypes] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [remarks, setRemarks] = useState([]);
  const [glList, setGlList] = useState([]);
  const [partyList, setPartyList] = useState([]);
  const [entryHeadList, setEntryHeadList] = useState([]);
  const [tempHead, setTempHead] = useState(null);
  const [glAllList, setGlAllList] = useState([]);
  const [tableData, setTableData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAmountFields, setShowAmountFields] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [users, setUsers] = useState([]);

  const handleAddRow = (values, setFieldValue) => {
    if (!values.entryDeptCode || !values.entryHead) {
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
      TransType: values.TransType,
      sqNo: values.sqNo,
      remark: values.remark,
      amount: values.entryAmount,
      partyId: values.partyId || 0,
    };

    setTableData((prev) => [...prev, newRow]);

    setFieldValue("entryDeptCode", "");
    setFieldValue("entryHead", "");
    setFieldValue("entryAmount", "");
    setFieldValue("remark", "");
    setFieldValue("PrevAmount", "");
    setFieldValue("CurrentAmount", "");
    setFieldValue("sqNo", "");
  };

  const handleDeleteRow = (index) => {
    const confirmDelete = window.confirm("Are you sure you want to delete?");

    if (!confirmDelete) return;

    setTableData((prev) => prev.filter((_, i) => i !== index));
  };

  const fetchUsers = async () => {
    try {
      const response = await axios.post(
        `${BASE_URL}/api/FrmTransAuthList/user-list`,
        {
          ulbId: Number(ulbId),
          deptId: config.deptId,
        },
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        },
      );

      console.log("Response User: ", response);

      if (response?.data?.success) {
        setUsers(response.data.rows || []);
      }
    } catch (err) {
      console.error("Error fetching users:", err);
    }
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

  const fetchUserMapDetails = async (mainId, setFieldValue) => {
    try {
      Swal.fire({
        title: "Loading Mapping...",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      const res = await axios.post(
        `${BASE_URL}/api/FrmUserTax/edit`,
        {
          mainId,
        },
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        },
      );

      const rows = res.data?.data?.data || [];

      if (!rows.length) return;

      const first = rows[0];

      setFieldValue("user", first.NUM_ACCUSERMAP_USERID?.toString());
      setFieldValue("zoneId", first.NUM_ACCUSERMAP_WARD?.toString());
      setFieldValue(
        "transactionType",
        first.NUM_ACCUSERMAP_TRANSTYPEID?.toString(),
      );
      setFieldValue("reciptNo", first.VAR_ACCUSERMAP_RECNO || "");
      setFieldValue("wardCode", first.VAR_ACCUSERMAP_GLCODE?.toString());

      setTempHead(first.VAR_ACCUSERMAP_ACCNO?.toString());

      setFieldValue("department", first.NUM_ACCUSERMAP_DEPTID?.toString());

      setFieldValue("remark", first.VAR_ACCUSERMAP_REMARK || "");

      fetchCreditLeasure(first.VAR_ACCUSERMAP_GLCODE?.toString(), "party");

      const tableFormatted = rows.map((item, index) => ({
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
        TransType: item.VAR_ACCMPDET_TYPE,
        sqNo: item.NUM_ACCMPDET_SQID,
        remark: first.VAR_ACCUSERMAP_REMARK || "",
      }));

      setTableData(tableFormatted);
    } catch (err) {
      console.error("Edit Mapping Error:", err);
    } finally {
      Swal.close();
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
      fetchGLAll(),
      fetchCorporationById(),
      fetchUsers(),
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

  const userOptions = [
    { value: "-1", label: "-- सर्व वापरकर्ता --" },
    ...(users?.map((u) => ({
      value: u.USERID?.toString(),
      label: u.USERNAME,
    })) || []),
  ];

  const handleSave = async (values) => {
    console.log("values", values);
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      // Validation for User Mapping
      if (!values.user || values.user === "-1" || values.user === "") {
        Swal.fire({
          text: "वापरकर्ता रिक्त असू शकत नाही",
          confirmButtonColor: "#1e3a8a",
        });
        setIsSubmitting(false);
        return;
      }

      if (!values.zoneId || values.zoneId === "0") {
        Swal.fire({
          text: "प्रभाग/वॉर्ड रिक्त असू शकत नाही",
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

    

      if (!values.department || values.department === "0") {
        Swal.fire({
          text: "विभाग रिक्त असू शकत नाही",
          confirmButtonColor: "#1e3a8a",
        });
        setIsSubmitting(false);
        return;
      }

      if (tableData.length === 0) {
        Swal.fire({
          text: "कृपया यादीत किमान एक व्यवहार जोडा",
          confirmButtonColor: "#1e3a8a",
        });
        setIsSubmitting(false);
        return;
      }

      const InMode = mainId ? 2 : 1;
      const RefNo = mainId || 0;

      const paramStr = [
        values.user, 
        values.zoneId, 
        values.transactionType, 
       values.reciptNo || null, 
        values.wardCode || null, 
        values.head || null,  
        values.department, 
        values.remark || "रोख जमा", 
        InMode, 
      ];

      if (InMode === 2) {
        paramStr.push(RefNo);
      }

      const finalParamStr = paramStr.join("~");

      const paramStr2 = tableData
        .map((row) => {
          return [
            row.deptCode, 
            row.deptName || "", 
            row.head, // ACCNO
            row.headName || "", 
            row.sqNo || "", 
            row.TransType || "", 
          ].join("#");
        })
        .join("$");

      const res = await axios.post(
        `${BASE_URL}/api/FrmUserTax/saveUserMap`,
        {
          userId: user?.userId,
          paramStr: finalParamStr,
          paramStr2: paramStr2,
        },
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        },
      );

      const errorCode = res.data?.data?.errorCode;
      const errorMsg = res.data?.data?.errorMsg;
      const returnStr = res.data?.data?.returnStr;

      if (errorCode === -100) {
        Swal.fire({
          text: errorMsg || "Account Mapping Saved Successfully",
          confirmButtonColor: "#1e3a8a",
          icon: "success",
        }).then(() => {
          navigate("/Transactions/FrmReceiptListNew");
        });
      } else if (errorCode === -140) {
        Swal.fire({
          text: "User Mapping Already Exists for this User",
          confirmButtonColor: "#1e3a8a",
          icon: "warning",
        });
      } else if (errorCode === -120 || errorCode === -130) {
        Swal.fire({
          text: errorMsg || "Invalid parameters",
          confirmButtonColor: "#1e3a8a",
          icon: "error",
        });
      } else if (errorCode === -110) {
        Swal.fire({
          text: errorMsg || "Database error occurred",
          confirmButtonColor: "#1e3a8a",
          icon: "error",
        });
      } else {
        Swal.fire({
          text: res.data?.message || errorMsg || "Error while saving",
          confirmButtonColor: "#1e3a8a",
          icon: "error",
        });
      }
    } catch (err) {
      console.error("SAVE ERROR:", err);
      Swal.fire({
        text: err.response?.data?.message || "Error while saving user mapping",
        confirmButtonColor: "#1e3a8a",
        icon: "error",
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
    "व्यवहार प्रकार",
    "तपशील",
  ];

  const keyMapping = {
    Delete: "delete",
    "विभाग कोड": "deptCode",
    "विभाग संकेतांकचे नाव": "deptName",
    लेखाशीर्ष: "head",
    "लेखाशीर्ष नाव": "headName",
    "व्यवहार प्रकार": "TransType",
    तपशील: "remark",
  };

  const dummyData = tableData;

  const initialValues = {
    user: "",
    zoneId: "",
    transactionType: "",
    department: "",
    reciptNo: "",
    wardCode: "",
    selectedRemark: "",
    remark: "",
    status: "",
    date: new Date(),
    entryDeptCode: "",
    entryHead: "",
    TransType: "C",
    sqNo: ""
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
          console.log("ulbId", ulbId);
          console.log("zones", zones.length);
          console.log("transTypes", transTypes.length);
          console.log("departments", departments.length);
          console.log("remarks", remarks.length);
          console.log("glAllList", glAllList.length);

          const allLoaded =
            ulbId &&
            zones.length &&
            transTypes.length &&
            departments.length &&
            remarks.length &&
            glAllList.length;

          console.log("allLoaded", allLoaded);

          if (allLoaded) {
            console.log("Calling Edit API...");
            fetchUserMapDetails(mainId, setFieldValue);
          }
        }, [ulbId, zones, transTypes, departments, remarks, glAllList]);
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
              setFieldValue("head", exists.value); 
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

        return (
          <Form>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Card className="border shadow-sm">
                <CardHeader className="border-b">
                  <CardTitle className="text-lg font-semibold">
                    Receipt Accountcode Map
                  </CardTitle>
                </CardHeader>

                <CardContent className="px-4 sm:px-6 space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <Label text="वापरकर्ता : " />

                      <Select
                        value={values.user}
                        onValueChange={(v) => setFieldValue("user", v)}
                      >
                        <SelectTrigger className="w-full h-9">
                          <SelectValue placeholder="-- विकल्प निवडा --" />
                        </SelectTrigger>
                        <SelectContent>
                          {userOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label text="प्रभाग :" />
                      <Select
                        value={values.zoneId}
                        onValueChange={(v) => setFieldValue("zoneId", v)}
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
                      <Label text="विभाग :" />
                      <Select
                        value={values.department}
                        onValueChange={(v) => setFieldValue("department", v)}
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

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

                    <div>
                      <Label text="तपशील :" />
                      <Input
                        name="remark"
                        value={values.remark}
                        onChange={handleChange}
                      />
                      {errors.remark && touched.remark && (
                        <p className="mt-1 text-sm text-red-500">
                          {errors.remark}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label text="अनुक्रमांक :" />
                      <Input
                        name="sqNo"
                        value={values.sqNo}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <div className="sm:w-36 shrink-0 flex justify-start sm:justify-between items-center">
                        <Label text="व्यवहार प्रकार:" />
                        <span>:</span>
                      </div>

                      <div className="flex flex-wrap items-center gap-4">
                        <label className="flex items-center gap-2 text-sm">
                          <Input
                            type="radio"
                            name="TransType"
                            checked={values.TransType === "C"}
                            onChange={() => setFieldValue("TransType", "C")}
                            className="h-4 w-4"
                          />
                          Credit
                        </label>

                        <label className="flex items-center gap-2 text-sm">
                          <Input
                            type="radio"
                            name="TransType"
                            checked={values.TransType === "D"}
                            onChange={() =>
                              setFieldValue("TransType", "D")
                            }
                            className="h-4 w-4"
                          />
                          Debit
                        </label>
                      </div>
                    </div>
                  </div>

                  <div>
                    <Button
                      type="button"
                      onClick={() => handleAddRow(values, setFieldValue)}
                    >
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
                        onClick={() =>
                          navigate("/Transactions/FrmReceiptListNew")
                        }
                      >
                        रद्द
                      </Button>
                    </div>
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

export default FrmReceiptNew;