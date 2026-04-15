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
import { DatePicker } from "@/components/ui/calendar";
import ShadCNTable from "@/components/ui/table";
import SearchableSelect from "@/components/SearchableSelect";
import apiService from "@/apiService";
import { useAuth } from "@/context/AuthContext";
import { useLocation } from "react-router-dom";
import axios from "axios";

const initialValues = {
  selectedCorporation: "",
  head: "",
  subHead: "",
  group: "",
  subGroup: "",
  entryGlCodes: "",
  ledger: "",
  entryLedgerCode: "",
  budgetNo: "",
  budgetProv: "",
  amount: "",
  entries: [
    {
      activityCode: "",
      deptName: "",
      ledger: "",
      amount: "",
      remark: "",
    },
  ],
};

const FrmBudgetAccountMap = () => {
  const location = useLocation();
  const { mode, voucherData } = location.state || {};

  const { user } = useAuth();
  const token = user?.token;
  const ulbId = user?.ulbId;
  const [tableData, setTableData] = useState([]);
  
  const [selectedCorporation, setSelectedCorporation] = useState("");
  const [corporations, setCorporations] = useState([]);
  const [headOptions, setHeadOpions] = useState([]);
  const [subHeadList, setSubHeadList] = useState([]);
  const [groupList, setGroupList] = useState([]);
  const [subGroupList, setSubGroupList] = useState([]);
  const [loadingHeads, setLoadingHeads] = useState(false);
  const [glCodes, setGlCodes] = useState([]);
  const [entryLedgerOptions, setEntryLedgerOptions] = useState({});
  const [entryGlCodes, setEntryGlCodes] = useState([]);
  const [pendingDeptCode, setPendingDeptCode] = useState(null);
  const [loadingVoucher, setLoadingVoucher] = useState(false);

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
    "Description": "deptName",
    "Provision Amount": "ledger",
    "Revised Amount": "amount",
    SrNo: "remark",
  };
  
  const fetchCorporation = async () => {
    try {
        const res = await axios.get(`${BASE_URL}/api/FrmParty/corporation/list`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        console.log("Corporation List: ", res);

        if (res?.data?.data?.success) {
            const formatted = res.data.data.list.map((s) => ({
                value: s.NUM_CORPORATION_ID.toString(),  
                label: s.VAR_CORPORATION_MNAME,
            }));
            setCorporations(formatted);

            const matched = formatted.find(
                (c) => c.value === ulbId?.toString()
            );

            if (matched) {
                setSelectedCorporation(matched.value);
            }
        }
    } catch (err) {
        console.error("Error fetching corporations:", err);
    }
  };

  const fetchHeads = async () => {
    try {
      const res = await axios.post(`${BASE_URL}/api/Receipt/party`, 
        {
          ulbid: ulbId,
        },
        {
            headers: {
              Authorization: `Bearer ${token}`,
            },
        }
      );

      if (res?.data?.data) {
        const formatted = res?.data?.data.map((p) => ({
          label: p.PARTYNAME,
          value: p.NUM_PARTYMST_PARTYID.toString(),
        }));

        setHeadOpions(formatted);
      }
    } catch (err) {
      console.error("Error fetching heads:", err);
    }
  };

  const fetchSubHeads = async (headId) => {
    try {
      if (!headId) return;

      setLoadingHeads(true);

      const res = await axios.post(`${BASE_URL}/api/FrmVoucher/party-bank`, 
        {
          partyid: Number(headId),
        },
        {
            headers: {
              Authorization: `Bearer ${token}`,
            },
        }
      );

      if (res?.data?.data?.success) {
        setSubHeadList(res.data.data.data || []);
      }
    } catch (err) {
      console.error("Error fetching sub group head:", err);
    } finally {
      setLoadingHeads(false);
    }
  };

  const fetchGroups = async (subHeadId) => {
    try {
      const res = await axios.post(`${BASE_URL}/api/FrmVoucher/bank-details`, 
        {
          bankID: subHeadId,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (res?.data?.data?.success) {
        setGroupList(res.data.data.data || []);
      }
    } catch (err) {
      console.error("Error fetching groups:", err);
    }
  };

  const fetchSubGroups = async (groupId) => {
    try {
      if (!groupId || !ulbId) return;

      const res = await axios.post(`${BASE_URL}/api/FrmVoucher/party-tax`, 
        {
          partyid: Number(groupId),
          ulbid: Number(ulbId),
        },
        {
            headers: {
              Authorization: `Bearer ${token}`,
            },
        }
      );

      if (res?.data?.data?.success) {
        setSubGroupList(res.data.data.data || []);
      }
    } catch (err) {
      console.error("Error fetching subgroups:", err);
    }
  };

  const fetchEntryGLCodes = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/Receipt/searchGLALL`, 
        // {
        //   ulbid: Number(ulbId)
        // },
        {
            headers: {
              Authorization: `Bearer ${token}`,
            },
        }
      );

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
      const res = await axios.post(`${BASE_URL}/api/FrmTransfer/credit-leasure`, 
        {
          corp_id: Number(ulbId),
          glcode: Number(glcode),
        },
        {
            headers: {
              Authorization: `Bearer ${token}`,
            },
        }
      
      );

      if (res?.data?.data?.success) {
        const formatted = res.data.data.rows.map((l, i) => ({
          label: l.ACCNAME,
          value: l.OBJECTCODE
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

  const fetchVoucherDetails = async (refno, zoneid, setFieldValue) => {
    try {
      const res = await axios.post(`${BASE_URL}/api/FrmVoucher/voucher-details`, 
        {
          refno: Number(refno),
          zoneid: Number(zoneid),
          ulbid: Number(ulbId),
        },
        {
            headers: {
              Authorization: `Bearer ${token}`,
            },
        }
      );

      if (res?.data?.data?.success && res.data.data.data.length > 0) {
        const d = res.data.data.data[0];
        console.log("d: ", d);

        setFieldValue("party", d.PARTYID?.toString());
        setFieldValue("prabhag", d.ZONEID?.toString());
        setFieldValue("vibhag", d.DEPTID?.toString());
        setFieldValue("voucherNo", d.VCHNO || "");
        setFieldValue("totalPayable", d.TOTALAMT || "");
        setFieldValue("remark", d.VAR_VCHPREMST_NARRATION || "");
        setPendingDeptCode(d.DRGL?.toString());
        setFieldValue("ledger", d.DRACC?.toString());
        // setFieldValue("contract", d.NUM_VCHPREPMST_CONTRACTID?.toString() || "");
        // setFieldValue("head", d.VAR_VCHPREPMST_ACCYEAR || "");
        setFieldValue(
          "contract",
          d.NUM_VCHPREPMST_CONTRACTID
            ? d.NUM_VCHPREPMST_CONTRACTID.toString()
            : ""
        );

        setFieldValue(
          "head",
          d.VAR_VCHPREPMST_ACCYEAR && d.VAR_VCHPREPMST_ACCYEAR !== "0"
            ? d.VAR_VCHPREPMST_ACCYEAR
            : ""
        );

        if (d.TRNSDATE) {
          setFieldValue("date", new Date(d.TRNSDATE));
        }

        if (d.PARTYBANKID) {
          fetchGroups(d.PARTYBANKID, setFieldValue);
        }

        if (d.DRGL) {
          fetchLedger(d.DRGL.toString());
        }

        fetchSubGroups(d.PARTYID, setFieldValue);
        fetchSubHeads(d.PARTYID);
        fetchContracts(d.PARTYID, d.ZONEID);

        if (d.NUM_VCHPREPMST_CONTRACTID) {
          const contractId = d.NUM_VCHPREPMST_CONTRACTID.toString();
          setFieldValue("contract", contractId);

          await fetchContractYears(contractId);
        }

        if (d.VAR_VCHPREPMST_ACCYEAR && d.VAR_VCHPREPMST_ACCYEAR !== "0") {
          setFieldValue("head", d.VAR_VCHPREPMST_ACCYEAR);
        }
      }
    } catch (err) {
      console.error("Error fetching voucher details:", err);
    }
  };

  const fetchVoucherLines = async (refno) => {
    try {
      const res = await axios.post(`${BASE_URL}/api/FrmVoucher/voucher-detail-lines`, 
        {
          refno: Number(refno),
          ulbid: Number(ulbId),
        },
        {
            headers: {
              Authorization: `Bearer ${token}`,
            },
        }
      );

      if (res?.data?.data.success) {
        const rows = res.data.data.data.map((item) => ({
          id: Date.now() + Math.random(),
          delete: "",
          activityCode: item.GLCODE,
          deptName: item.GLNAME,
          ledger: item.ACCNO,
          ledgerName: item.ACCNAME,
          amount: item.AMT,
          remark: item.NARRATN,
        }));

        setTableData(rows);
      }
    } catch (err) {
      console.error("Error fetching voucher lines:", err);
    }
  };

  useEffect(() => {
    fetchCorporation();
    fetchHeads();
    fetchEntryGLCodes();
  }, []);

  const handleAddToList = (values, setFieldValue, entries) => {
    if (entries && entries.length > 0) {
      const lastEntry = entries[entries.length - 1];
      if (lastEntry.activityCode && lastEntry.ledger && lastEntry.amount) {
        const newEntry = {
          id: Date.now(),
          delete: "",
          activityCode: lastEntry.activityCode,
          deptName: lastEntry.deptName,
          ledger: lastEntry.ledger,
          ledgerName: lastEntry.ledgerName,
          amount: lastEntry.amount,
          remark: lastEntry.remark || "",
        };
        setTableData([...tableData, newEntry]);
        
        const updatedEntries = [...entries];
        updatedEntries[updatedEntries.length - 1] = {
          activityCode: "",
          deptName: "",
          ledger: "",
          amount: "",
          remark: "",
        };
        setFieldValue("entries", updatedEntries);
      }
    }
  };

  const handleDeleteRow = (id) => {
    setTableData(tableData.filter(item => item.id !== id));
  };

  const calculateTotal = () => {
    return tableData.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
  };

  const calculateDifference = (values) => {
    const totalPayable = calculateTotal();
    const totalDeduction = parseFloat(values.deductionAmount) || 0;

    return totalPayable - totalDeduction;
  };

  const transformedTableData = tableData.map(item => ({
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
    )
  }));

  return (
    <Formik
      initialValues={initialValues}
      onSubmit={(values) => {
        console.log("Submitted:", { ...values, entries: tableData });
      }}
    >
      {({
        values,
        handleChange,
        setFieldValue,
        errors,
        touched,
      }) => {
      

        return (
        <>
        <Form>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            // className="p-4 sm:p-6"
          >
            <Card className="border shadow-sm">
              <CardHeader className="border-b">
                <CardTitle className="text-lg font-semibold">
                  Budget Account Mapping
                </CardTitle>
              </CardHeader>

              <CardContent className="p-4 sm:p-6 space-y-6">

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                        {/* <Label text="ULB Name :" className='w-36 shrink-0' /> */}
                        <div className="sm:w-36 shrink-0 flex justify-start sm:justify-between items-center">
                        <Label text="ULB Name" />
                        <span>:</span>
                        </div>
                        <Select
                            value={selectedCorporation}
                            onValueChange={(v) => setSelectedCorporation(v)}
                            disabled
                            >
                            <SelectTrigger className="w-full h-9">
                                <SelectValue placeholder="-- विकल्प निवडा --" />
                            </SelectTrigger>
                            <SelectContent>
                                {corporations.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                        {/* <Label text="Head :" className='w-36 shrink-0'  /> */}
                        <div className="sm:w-36 shrink-0 flex justify-start sm:justify-between items-center">
                        <Label text="Head" />
                        <span>:</span>
                        </div>
                        <Select 
                        value={values.head}
                        onValueChange={(v) => setFieldValue("head", v)}
                        >
                        <SelectTrigger className="w-full h-9">
                            <SelectValue placeholder="-- विकल्प निवडा --" />
                        </SelectTrigger>

                        <SelectContent>
                            {headOptions.map((y) => (
                            <SelectItem
                                key={y.NUM_CONTRACTDET_ID}
                                value={y.NUM_CONTRACTDET_ID}
                            >
                                {y.VAR_CONTRACTDET_ACCYR}
                            </SelectItem>
                            ))}
                        </SelectContent>
                        </Select>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                        {/* <Label text="Sub-Head :" className='w-36 shrink-0' /> */}
                        <div className="sm:w-36 shrink-0 flex justify-start sm:justify-between items-center">
                        <Label text="Sub-Head" />
                        <span>:</span>
                        </div>
                        <Select 
                            value={values.subHead}
                            onValueChange={(v) => setFieldValue("subHead", v)}
                        >
                        <SelectTrigger className="w-full h-9">
                            <SelectValue placeholder="-- विकल्प निवडा --" />
                        </SelectTrigger>

                        <SelectContent>
                            {subHeadList.map((y) => (
                            <SelectItem
                                key={y.NUM_CONTRACTDET_ID}
                                value={y.NUM_CONTRACTDET_ID}
                            >
                                {y.VAR_CONTRACTDET_ACCYR}
                            </SelectItem>
                            ))}
                        </SelectContent>
                        </Select>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                        {/* <Label text="Group :" className='w-36 shrink-0' /> */}
                        <div className="sm:w-36 shrink-0 flex justify-start sm:justify-between items-center">
                        <Label text="Group" />
                        <span>:</span>
                        </div>
                        <Select 
                            value={values.group}
                            onValueChange={(v) => setFieldValue("group", v)}
                            >
                            <SelectTrigger className="w-full h-9">
                                <SelectValue placeholder="-- विकल्प निवडा --" />
                            </SelectTrigger>

                            <SelectContent>
                                {groupList.map((y) => (
                                <SelectItem
                                    key={y.NUM_CONTRACTDET_ID}
                                    value={y.NUM_CONTRACTDET_ID}
                                >
                                    {y.VAR_CONTRACTDET_ACCYR}
                                </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                        {/* <Label text="Sub-Group :" className='w-36 shrink-0' /> */}
                        <div className="sm:w-36 shrink-0 flex justify-start sm:justify-between items-center">
                        <Label text="Sub-Group" />
                        <span>:</span>
                        </div>
                        <Select 
                            value={values.subGroup}
                            onValueChange={(v) => setFieldValue("subGroup", v)}
                            >
                            <SelectTrigger className="w-full h-9">
                                <SelectValue placeholder="-- विकल्प निवडा --" />
                            </SelectTrigger>

                            <SelectContent>
                                {subGroupList.map((y) => (
                                <SelectItem
                                    key={y.NUM_CONTRACTDET_ID}
                                    value={y.NUM_CONTRACTDET_ID}
                                >
                                    {y.VAR_CONTRACTDET_ACCYR}
                                </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <Button
                        type="button"
                        className="bg-blue-900 hover:bg-blue-800 text-white w-36"
                        onClick={() => {
                        if (!values.party) {
                            alert("Please select party first");
                            return;
                        }

                        fetchSubHeads(values.party);
                        setShowBankModal(true);
                        }}
                    >
                        Search
                    </Button>
                </div>

                <hr />

                <div className="space-y-4">
                  <FieldArray name="entries">
                    {({ remove, form }) => (
                      <>
                        {values.entries.map((entry, index) => (
                            <div key={index} className="space-y-4">
                                <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                    {/* <Label text="विभाग संकेतांक :" className='w-36 shrink-0' /> */}
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

                                        fetchEntryLedger(val, index);
                                      }}
                                      placeholder="विभाग संकेतांक निवडा"
                                    />
                                    </div>

                                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                    {/* <Label text="लेखा शिर्ष :" className='w-36 shrink-0' /> */}
                                    <div className="sm:w-36 shrink-0 flex justify-start sm:justify-between items-center">
                                        <Label text="लेखा शिर्ष" />
                                        <span>:</span>
                                    </div>
                                      <SearchableSelect
                                        options={entryLedgerOptions[index] || []}
                                        value={entry.ledger}
                                        onChange={(option) =>
                                          setFieldValue(`entries.${index}.ledger`, option?.value)
                                        }
                                        placeholder="लेखा शिर्ष निवडा"
                                        disabled={!entry.activityCode}
                                      />
                                    </div>

                                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                        {/* <Label text="लेखा संकेतांक :" className='w-36 shrink-0' /> */}
                                        <div className="sm:w-36 shrink-0 flex justify-start sm:justify-between items-center">
                                            <Label text="लेखा संकेतांक" />
                                            <span>:</span>
                                        </div>
                                        <Input
                                            name={`entries.${index}.entryLeaderCode`}
                                            value={entry.entryLedgerCode}
                                            onChange={handleChange}
                                            className="w-full h-9"
                                        />
                                    </div>

                                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                        {/* <Label text="Budget Sr.No :" className='w-36 shrink-0' /> */}
                                        <div className="sm:w-36 shrink-0 flex justify-start sm:justify-between items-center">
                                            <Label text="Budget Sr.No" />
                                            <span>:</span>
                                        </div>
                                        <Input
                                            name={`entries.${index}.budgetNo`}
                                            value={entry.budgetNo}
                                            onChange={handleChange}
                                            className="w-full h-9"
                                        />
                                    </div>

                                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                    {/* <Label text="Budget Provision :" className='w-36 shrink-0' /> */}
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
                                    {/* <Label text="Revised Amount :" className='w-36 shrink-0' /> */}
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
                                      onClick={() => {
                                        if (entry.activityCode && entry.ledger && entry.amount) {
                                          const activityObj = entryGlCodes.find(
                                            (g) => g.value === entry.activityCode
                                          );
                                          const ledgerObj = (entryLedgerOptions[index] || []).find(
                                            (l) => l.value === entry.ledger
                                          );
                                          const newRow = {
                                            id: Date.now(),
                                            delete: "",
                                            activityCode: entry.activityCode,
                                            deptName: activityObj?.label || "",
                                            ledger: entry.ledger,
                                            ledgerName: ledgerObj?.label || "",
                                            amount: entry.amount,
                                            remark: entry.remark || "",
                                          };
                                          setTableData((prev) => [...prev, newRow]);
                                          setFieldValue(`entries.${index}`, {
                                            activityCode: "",
                                            deptName: "",
                                            ledger: "",
                                            amount: "",
                                            remark: "",
                                          });
                                        }
                                      }}
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
                  pagination={false}
                  className="max-md:min-w-380"
                />

                <div className="flex flex-col sm:flex-row items-center justify-center flex-wrap gap-3 pt-4">
                  <Button type="submit" className="bg-blue-900 hover:bg-blue-800 text-white">
                    Submit
                  </Button>
                  <Button type="button" variant="outline" path="/Transactions/FrmVoucherPreparationList">
                    Cancle
                  </Button>
                </div>

              </CardContent>
            </Card>
          </motion.div>
        </Form>
        </>
      )}}
    </Formik>
  );
};

export default FrmBudgetAccountMap;