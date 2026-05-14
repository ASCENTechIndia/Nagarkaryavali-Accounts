import React, { useEffect, useState } from "react";
import { Formik, Form, FieldArray } from "formik";
import { motion } from "framer-motion";
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
import ShadCNTable from "@/components/ui/table";
import SearchableSelect from "@/components/SearchableSelect";
import { useAuth } from "@/context/AuthContext";
import axios from "axios";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";

const initialValues = {
  head: "",
  subHead: "",
  group: "",
  subGroup: "",
  entries: [
    {
      activityCode: "",
      deptName: "",
      ledger: "",
      amount: "",
      remark: "",
      budgetProv: "",
    },
  ],
};

const FrmBudgetAccountMap = () => {
  const { user } = useAuth();
  const token = user?.token;
  const ulbId = user?.ulbId;

  const navigate = useNavigate();

  const [tableData, setTableData] = useState([]);
  const [selectedCorporation, setSelectedCorporation] = useState("");
  const [corporations, setCorporations] = useState([]);
  const [headOptions, setHeadOptions] = useState([]);
  const [subHeadList, setSubHeadList] = useState([]);
  const [groupList, setGroupList] = useState([]);
  const [subGroupList, setSubGroupList] = useState([]);
  const [loadingHeads, setLoadingHeads] = useState(false);
  const [entryLedgerOptions, setEntryLedgerOptions] = useState({});
  const [entryGlCodes, setEntryGlCodes] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const BASE_URL = import.meta.env.VITE_BASE_URL;

  const headers = [
    "Delete",
    "विभाग कोड नाव",
    "लेखाशीर्ष नाव",
    "Description",
    "Provision Amount",
    "Revised Amount",
    "SrNo",
  ];

  const keyMapping = {
    Delete: "delete",
    "विभाग कोड नाव": "activityCode",
    "लेखाशीर्ष नाव": "ledgerName",
    Description: "deptName",
    "Provision Amount": "budgetProv",
    "Revised Amount": "revisedAmount",
    SrNo: "srNo",
  };

  const fetchCorporation = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/FrmParty/corporation/list`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res?.data?.data?.success) {
        const formatted = res.data.data.list.map((s) => ({
          value: s.NUM_CORPORATION_ID.toString(),
          label: s.VAR_CORPORATION_MNAME,
        }));

        console.log("Formatted Corporation:", formatted)

        setCorporations(formatted);

        const selectedValue = String(ulbId);

        const matchedCorporation = formatted.find(
          (item) => item.value === selectedValue
        );

        if (matchedCorporation) {
          setSelectedCorporation(matchedCorporation.value);
        }
      }
    } catch (err) {
      console.error("Error fetching corporations:", err);
    }
  };

  const fetchHeads = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/Receipt/budget-heads`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res?.data?.data) {
        const formatted = res.data.data.map((p) => ({
          label: p.VAR_BUDGETCONFIG_BUDGETNAME,
          value: p.NUM_BUDGETCONFIG_HEADID.toString(),
        }));
        setHeadOptions(formatted);
      }
    } catch (err) {
      console.error("Error fetching heads:", err);
    }
  };

  const fetchSubHeads = async (headId) => {
    try {
      if (!headId || headId === "0") return;
      setLoadingHeads(true);

      const res = await axios.post(
        `${BASE_URL}/api/BudgetAccMap/subhead-list`,
        { headId: Number(headId) },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log("SubHead Response:", res);

      if (res?.data?.success && res?.data?.data?.rows) {
        const formatted = res.data.data.rows.map((p) => ({
          label: p.VAR_BUDGETCONFIG_BUDGETNAME,
          value: p.NUM_BUDGETCONFIG_HEADID.toString(),
        }));
        setSubHeadList(formatted);
      } else {
        setSubHeadList([]);
      }
    } catch (err) {
      console.error("Error fetching sub heads:", err);
      setSubHeadList([]);
    } finally {
      setLoadingHeads(false);
    }
  };

  const fetchGroups = async (subHeadId) => {
    try {
      if (!subHeadId || subHeadId === "0") return;
      setLoadingHeads(true);

      const res = await axios.post(
        `${BASE_URL}/api/BudgetAccMap/group-list`,
        { subHeadId: subHeadId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log("Group Response:", res);

      if (res?.data?.success && res?.data?.data?.rows) {
        const formatted = res.data.data.rows.map((p) => ({
          label: p.VAR_BUDGETCONFIG_BUDGETNAME,
          value: p.NUM_BUDGETCONFIG_HEADID.toString(),
        }));
        setGroupList(formatted);
      } else {
        setGroupList([]);
      }
    } catch (err) {
      console.error("Error fetching groups:", err);
      setGroupList([]);
    } finally {
      setLoadingHeads(false);
    }
  };

  const fetchSubGroups = async (groupId) => {
    try {
      if (!groupId || groupId === "0") return;
      setLoadingHeads(true);

      const res = await axios.post(
        `${BASE_URL}/api/BudgetAccMap/subgroup-list`,
        { groupId: Number(groupId) },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log("SubGroup Response:", res);

      if (res?.data?.success && res?.data?.data?.rows) {
        const formatted = res.data.data.rows.map((p) => ({
          label: p.VAR_BUDGETCONFIG_BUDGETNAME,
          value: p.NUM_BUDGETCONFIG_HEADID.toString(),
        }));
        setSubGroupList(formatted);
      } else {
        setSubGroupList([]);
      }
    } catch (err) {
      console.error("Error fetching subgroups:", err);
      setSubGroupList([]);
    } finally {
      setLoadingHeads(false);
    }
  };

  const fetchEntryGLCodes = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/Receipt/searchGLALL`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res?.data?.data) {
        const formatted = res.data.data.map((g) => ({
          label: g.GLSEARCHNAME,
          value: g.GLCODE.toString(),
        }));
        setEntryGlCodes(formatted);
      }
    } catch (err) {
      console.error("Error fetching GL codes:", err);
    }
  };

  const fetchEntryLedger = async (glcode, index) => {
    try {
      const res = await axios.post(
        `${BASE_URL}/api/FrmTransfer/credit-leasure`,
        {
          corp_id: Number(ulbId),
          glcode: Number(glcode),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res?.data?.data?.success) {
        const formatted = res.data.data.rows.map((l) => ({
          label: l.ACCNAME,
          value: l.OBJECTCODE,
        }));
        setEntryLedgerOptions((prev) => ({
          ...prev,
          [index]: formatted,
        }));
      }
    } catch (err) {
      console.error("Error fetching entry ledger:", err);
    }
  };

  const handleSearch = async (values) => {
    try {
      if (!values.head || values.head === "0") {
        Swal.fire({
          text: "Please select head",
          confirmButtonColor: "#1e3a8a",
        });
        return;
      }

      setLoadingHeads(true);

      let payload = {};
      let apiPayload = {};

      if (
        values.head !== "0" &&
        (values.subHead === "0" || !values.subHead) &&
        (!values.group || values.group === "") &&
        (!values.subGroup || values.subGroup === "")
      ) {
        payload = {
          headId: values.head,
          subGroupId: "0",
          ulbId: Number(ulbId),
        };
        apiPayload = {
          headId: values.head,
          subGroupId: "0",
          ulbId: Number(ulbId),
        };
      }
      else if (values.subGroup && values.subGroup !== "0" && values.subGroup !== "") {
        payload = {
          headId: "0",
          subGroupId: values.subGroup,
          ulbId: Number(ulbId),
        };
        apiPayload = {
          headId: "0",
          subGroupId: values.subGroup,
          ulbId: Number(ulbId),
        };
      } else {
        Swal.fire({
          text: "Please select sub-group",
          confirmButtonColor: "#1e3a8a",
        });
        return;
      }

      console.log("Search Payload:", payload);

      const response = await axios.post(
        `${BASE_URL}/api/BudgetAccMap/budget-account-map`,
        apiPayload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log("Search Response:", response);

      if (response?.data?.success && response?.data?.data?.rows?.length > 0) {
        const rows = response.data.data.rows;

        const transformedData = rows.map((item, idx) => ({
          id: item.NUM_BUDGETACCMAP_ID || idx,
          delete: "",
          activityCode: item.NUM_BUDGETACCMAP_GLCODE,
          activityName: item.FUNCTIONCODE || item.GLNAME,
          ledger: item.NUM_BUDGETACCMAP_ACCOUNTNO,
          ledgerName: item.ACCOUNTSEARCHNAME || item.ACCNAME,
          deptName: item.VAR_BUDGETACCMAP_REMARK || "",
          budgetProv: item.NUM_BUDGETACCMAP_BUDGETPROV || 0,
          revisedAmount: item.NUM_BUDGETACCMAP_REVISEDAMT || 0,
          srNo: item.NUM_BUDGETACCMAP_SRNO || "",
        }));

        setTableData(transformedData);

        Swal.fire({
          text: `${rows.length} रेकॉर्ड्स सापडल्या`,
          confirmButtonColor: "#1e3a8a",
          timer: 1500,
        });
      } else {
        setTableData([]);
        Swal.fire({
          text: "Data Not Found",
          confirmButtonColor: "#1e3a8a",
        });
      }
    } catch (error) {
      console.error("Error searching budget account map:", error);
      setTableData([]);
      Swal.fire({
        text: error.response?.data?.message || "डेटा लोड करताना त्रुटी",
        confirmButtonColor: "#1e3a8a",
      });
    } finally {
      setLoadingHeads(false);
    }
  };

  const handleSubmit = async (values, { setSubmitting }) => {
    let groupSubId = null;

    if (
      values.head !== "0" &&
      (values.subHead === "0" || !values.subHead) &&
      (!values.group || values.group === "") &&
      (!values.subGroup || values.subGroup === "")
    ) {
      groupSubId = values.head;
    } else if (values.subGroup && values.subGroup !== "0" && values.subGroup !== "") {
      groupSubId = values.subGroup;
    } else {
      Swal.fire({
        text: "Please select head.",
        confirmButtonColor: "#1e3a8a",
      });
      setSubmitting(false);
      return;
    }

    if (tableData.length === 0) {
      Swal.fire({
        text: "Please enter budget details.",
        confirmButtonColor: "#1e3a8a",
      });
      setSubmitting(false);
      return;
    }

    setIsSubmitting(true);
    let loaderSwal;
    try {
      let paramStr = "";
      for (const row of tableData) {
        paramStr += `${row.activityCode}#${row.ledger}#${row.deptName || ""}#${
          row.budgetProv || 0
        }#${row.revisedAmount || 0}#${row.srNo || ""}$`;
      }
      if (paramStr.endsWith("$")) {
        paramStr = paramStr.slice(0, -1);
      }

      const payload = {
        userId: user?.userId,
        subGroupId: groupSubId,
        paramStr: paramStr,
        ulbId: Number(ulbId),
      };

      loaderSwal = Swal.fire({
          title: "Submitting...",
          text: "Please wait while your data is being processed.",
          allowOutsideClick: false,
          showConfirmButton: false,
          didOpen: () => {
              Swal.showLoading();
          },
      });

      const response = await axios.post(
        `${BASE_URL}/api/BudgetAccMap/budget-accmap-insert`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      loaderSwal.close();

      if (response?.data?.success && response?.data?.errorCode === -100) {
        Swal.fire({
          text: response.data.message || "Budget details has been configured successfully",
          confirmButtonColor: "#1e3a8a",
        });
        setTableData([]);
        setHeadOptions([]);
        setSubHeadList([]);
        setGroupList([]);
        setSubGroupList([]);
        navigate("/")
      } else {
        Swal.fire({
          text: response?.data?.message || "Failed to save budget details",
          confirmButtonColor: "#1e3a8a",
        });
      }
    } catch (error) {
      console.error("Error submitting budget account map:", error);
      Swal.fire({
        text: error.response?.data?.message || "डेटा सेव्ह करताना त्रुटी",
        confirmButtonColor: "#1e3a8a",
      });
    } finally {
      setIsSubmitting(false);
      setSubmitting(false);
    }
  };

  useEffect(() => {
    fetchCorporation();
    fetchHeads();
    fetchEntryGLCodes();
  }, []);

  useEffect(() => {
    if (ulbId && corporations.length > 0) {
      setSelectedCorporation(String(ulbId));
    }
  }, [ulbId, corporations]);
  
  const handleAddToList = (values, setFieldValue, entries) => {
    if (entries && entries.length > 0) {
      const lastEntry = entries[entries.length - 1];

      if (!lastEntry.activityCode || lastEntry.activityCode === "") {
        Swal.fire({
          text: "विभाग कोड रिक्त असू शकत नाही",
          confirmButtonColor: "#1e3a8a",
        });
        return;
      }

      if (!lastEntry.ledger || lastEntry.ledger === "") {
        Swal.fire({
          text: "मायनर कोड रिक्त असू शकत नाही!",
          confirmButtonColor: "#1e3a8a",
        });
        return;
      }

      if (!lastEntry.deptName || lastEntry.deptName.trim() === "") {
        Swal.fire({
          text: "Description Can not be Blank!",
          confirmButtonColor: "#1e3a8a",
        });
        return;
      }

      if (
        lastEntry.budgetProv === "" ||
        lastEntry.budgetProv === null ||
        lastEntry.budgetProv === undefined
      ) {
        Swal.fire({
          text: "Provisional Amount Can not be Blank!",
          confirmButtonColor: "#1e3a8a",
        });
        return;
      }

      if (
        lastEntry.amount === "" ||
        lastEntry.amount === null ||
        lastEntry.amount === undefined
      ) {
        Swal.fire({
          text: "Revised Amount Can not be Blank!",
          confirmButtonColor: "#1e3a8a",
        });
        return;
      }

      const activityObj = entryGlCodes.find((g) => g.value === lastEntry.activityCode);
      const ledgerObj = (entryLedgerOptions[entries.length - 1] || []).find(
        (l) => l.value === lastEntry.ledger
      );

      const newEntry = {
        id: Date.now(),
        delete: "",
        activityCode: lastEntry.activityCode,
        activityName: activityObj?.label || "",
        ledger: lastEntry.ledger,
        ledgerName: ledgerObj?.label || "",
        deptName: lastEntry.deptName || "",
        budgetProv: lastEntry.budgetProv || "",
        revisedAmount: lastEntry.amount || "",
        srNo: lastEntry.remark || "",
      };

      setTableData([...tableData, newEntry]);

      const updatedEntries = [...entries];
      updatedEntries[updatedEntries.length - 1] = {
        activityCode: "",
        deptName: "",
        ledger: "",
        amount: "",
        remark: "",
        budgetProv: "",
      };
      setFieldValue("entries", updatedEntries);
    }
  };

  const handleDeleteRow = (id) => {
    setTableData(tableData.filter((item) => item.id !== id));
  };

  const transformedTableData = tableData.map((item) => ({
    ...item,
    delete: (
      <Button
        type="button"
        variant="destructive"
        size="sm"
        onClick={() => handleDeleteRow(item.id)}
        className="text-white"
      >
        Delete
      </Button>
    ),
  }));

  return (
    <Formik initialValues={initialValues} onSubmit={handleSubmit}>
      {({ values, handleChange, setFieldValue, isSubmitting, setSubmitting }) => {
        return (
          <Form>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Card className="border shadow-sm">
                <CardHeader className="border-b">
                  <CardTitle className="text-lg font-semibold">
                    Budget Account Mapping
                  </CardTitle>
                </CardHeader>

                <CardContent className="p-4 sm:p-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <div className="sm:w-36 shrink-0 flex justify-start sm:justify-between items-center">
                        <Label text="ULB Name" />
                        <span>:</span>
                      </div>
                      <Select
                        value={selectedCorporation || ""}
                        onValueChange={(v) => setSelectedCorporation(v)}
                        disabled
                      >
                        <SelectTrigger className="w-full h-9">
                          <SelectValue placeholder="-- विकल्प निवडा --" />
                        </SelectTrigger>

                        <SelectContent>
                          {corporations.map((option) => (
                            <SelectItem
                              key={option.value}
                              value={String(option.value)}
                            >
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <div className="sm:w-36 shrink-0 flex justify-start sm:justify-between items-center">
                        <Label text="Head" />
                        <span>:</span>
                      </div>
                      <Select
                        value={values.head}
                        onValueChange={(v) => {
                          setFieldValue("head", v);
                          setFieldValue("subHead", "");
                          setFieldValue("group", "");
                          setFieldValue("subGroup", "");
                          setSubHeadList([]);
                          setGroupList([]);
                          setSubGroupList([]);
                          if (v && v !== "0") {
                            fetchSubHeads(v);
                          }
                        }}
                      >
                        <SelectTrigger className="w-full h-9">
                          <SelectValue placeholder="-- विकल्प निवडा --" />
                        </SelectTrigger>
                        <SelectContent>
                          {headOptions.map((y) => (
                            <SelectItem key={y.value} value={y.value}>
                              {y.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <div className="sm:w-36 shrink-0 flex justify-start sm:justify-between items-center">
                        <Label text="Sub-Head" />
                        <span>:</span>
                      </div>
                      <Select
                        value={values.subHead}
                        onValueChange={(v) => {
                          setFieldValue("subHead", v);
                          setFieldValue("group", "");
                          setFieldValue("subGroup", "");
                          setGroupList([]);
                          setSubGroupList([]);
                          if (v && v !== "0") {
                            fetchGroups(v);
                          }
                        }}
                        disabled={!values.head || values.head === "0"}
                      >
                        <SelectTrigger className="w-full h-9">
                          <SelectValue placeholder="-- विकल्प निवडा --" />
                        </SelectTrigger>
                        <SelectContent>
                          {subHeadList.map((y) => (
                            <SelectItem key={y.value} value={y.value}>
                              {y.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <div className="sm:w-36 shrink-0 flex justify-start sm:justify-between items-center">
                        <Label text="Group" />
                        <span>:</span>
                      </div>
                      <Select
                        value={values.group}
                        onValueChange={(v) => {
                          setFieldValue("group", v);
                          setFieldValue("subGroup", "");
                          setSubGroupList([]);
                          if (v && v !== "0") {
                            fetchSubGroups(v);
                          }
                        }}
                        disabled={!values.subHead || values.subHead === "0"}
                      >
                        <SelectTrigger className="w-full h-9">
                          <SelectValue placeholder="-- विकल्प निवडा --" />
                        </SelectTrigger>
                        <SelectContent>
                          {groupList.map((y) => (
                            <SelectItem key={y.value} value={y.value}>
                              {y.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <div className="sm:w-36 shrink-0 flex justify-start sm:justify-between items-center">
                        <Label text="Sub-Group" />
                        <span>:</span>
                      </div>
                      <Select
                        value={values.subGroup}
                        onValueChange={(v) => setFieldValue("subGroup", v)}
                        disabled={!values.group || values.group === "0"}
                      >
                        <SelectTrigger className="w-full h-9">
                          <SelectValue placeholder="-- विकल्प निवडा --" />
                        </SelectTrigger>
                        <SelectContent>
                          {subGroupList.map((y) => (
                            <SelectItem key={y.value} value={y.value}>
                              {y.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <Button
                      type="button"
                      className="bg-blue-900 hover:bg-blue-800 text-white w-36"
                      onClick={() => handleSearch(values)}
                      disabled={loadingHeads}
                    >
                      Search
                    </Button>
                  </div>

                  <hr />

                  <div className="space-y-4">
                    <FieldArray name="entries">
                      {() => (
                        <>
                          {values.entries.map((entry, index) => (
                            <div key={index} className="space-y-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                  <div className="sm:w-36 shrink-0 flex justify-start sm:justify-between items-center">
                                    <Label text="विभाग संकेतांक" />
                                    <span>:</span>
                                  </div>
                                  <SearchableSelect
                                    options={entryGlCodes}
                                    value={entry.activityCode}
                                    onChange={(option) => {
                                      const val = option?.value || "";
                                      setFieldValue(`entries.${index}.activityCode`, val);
                                      setFieldValue(`entries.${index}.ledger`, "");
                                      if (val) {
                                        fetchEntryLedger(val, index);
                                      }
                                    }}
                                    placeholder="विभाग संकेतांक निवडा"
                                  />
                                </div>

                                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                  <div className="sm:w-36 shrink-0 flex justify-start sm:justify-between items-center">
                                    <Label text="लेखा शिर्ष" />
                                    <span>:</span>
                                  </div>
                                  <SearchableSelect
                                    options={entryLedgerOptions[index] || []}
                                    value={entry.ledger}
                                    onChange={(option) =>
                                      setFieldValue(`entries.${index}.ledger`, option?.value || "")
                                    }
                                    placeholder="लेखा शिर्ष निवडा"
                                    disabled={!entry.activityCode}
                                  />
                                </div>

                                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                  <div className="sm:w-36 shrink-0 flex justify-start sm:justify-between items-center">
                                    <Label text="लेखा संकेतांक" />
                                    <span>:</span>
                                  </div>
                                  <Input
                                    name={`entries.${index}.deptName`}
                                    value={entry.deptName}
                                    onChange={handleChange}
                                    className="w-full h-9"
                                  />
                                </div>

                                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                  <div className="sm:w-36 shrink-0 flex justify-start sm:justify-between items-center">
                                    <Label text="Budget Sr.No" />
                                    <span>:</span>
                                  </div>
                                  <Input
                                    name={`entries.${index}.remark`}
                                    value={entry.remark}
                                    onChange={handleChange}
                                    className="w-full h-9"
                                  />
                                </div>

                                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                  <div className="sm:w-36 shrink-0 flex justify-start sm:justify-between items-center">
                                    <Label text="Budget Provision" />
                                    <span>:</span>
                                  </div>
                                  <Input
                                    name={`entries.${index}.budgetProv`}
                                    value={entry.budgetProv}
                                    onChange={handleChange}
                                    type="number"
                                    className="w-full h-9"
                                  />
                                </div>

                                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                  <div className="sm:w-36 shrink-0 flex justify-start sm:justify-between items-center">
                                    <Label text="Revised Amount" />
                                    <span>:</span>
                                  </div>
                                  <Input
                                    name={`entries.${index}.amount`}
                                    value={entry.amount}
                                    onChange={handleChange}
                                    type="number"
                                    className="w-full h-9"
                                  />
                                </div>
                              </div>

                              <div className="flex gap-2">
                                {index === values.entries.length - 1 && (
                                  <Button
                                    type="button"
                                    className="bg-blue-900 hover:bg-blue-800 text-white"
                                    onClick={() =>
                                      handleAddToList(values, setFieldValue, values.entries)
                                    }
                                  >
                                    Add To List
                                  </Button>
                                )}
                              </div>
                            </div>
                          ))}
                        </>
                      )}
                    </FieldArray>
                  </div>

                  <hr />

                  <ShadCNTable
                    headers={headers}
                    data={transformedTableData}
                    keyMapping={keyMapping}
                    pagination={true}
                    rowsPerPage={5}
                    className="max-md:min-w-380"
                  />

                  <div className="flex flex-col sm:flex-row items-center justify-center flex-wrap gap-3 pt-4">
                    <Button
                      type="submit"
                      className="bg-blue-900 hover:bg-blue-800 text-white"
                      disabled={isSubmitting || loadingHeads}
                    >
                      Submit
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      path="/HomePage/FrmHomePage"
                    >
                      Cancel
                    </Button>
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

export default FrmBudgetAccountMap;