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
  date: new Date(),
  party: "",
  pancard: "",
  gstNo: "",
  bank: "",
  branch: "",
  ifscCode: "",
  accountNo: "",
  prabhag: "",
  vibhag: "",
  voucherNo: "",
  totalPayable: "",
  deductionAmount: "",
  netPayable: "",
  deptCode: "",
  ledger: "",
  contractYear: "",
  remark: "",
  contract: "",
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

const FrmVoucherPreparation = () => {
  const location = useLocation();
  const { mode, voucherData } = location.state || {};

  const { user } = useAuth();
  const token = user?.token;
  const ulbId = user?.ulbId;
  const [tableData, setTableData] = useState([]);
  const [showBankDetails, setShowBankDetails] = useState(false);
  const [showBankModal, setShowBankModal] = useState(false);
  const [partyOptions, setPartyOptions] = useState([]);
  const [bankList, setBankList] = useState([]);
  const [loadingBanks, setLoadingBanks] = useState(false);
  const [zones, setZones] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [contractYears, setContractYears] = useState([]);
  const [glCodes, setGlCodes] = useState([]);
  const [ledgerOptions, setLedgerOptions] = useState([]);
  const [entryLedgerOptions, setEntryLedgerOptions] = useState({});
  const [entryGlCodes, setEntryGlCodes] = useState([]);
  const [pendingDeptCode, setPendingDeptCode] = useState(null);
  const [loadingVoucher, setLoadingVoucher] = useState(false);

  const BASE_URL = import.meta.env.VITE_BASE_URL;

  const headers = [
    "Delete",
    "कार्य/क्रियाकलाप संकेतांक",
    "विभाग संकेतांक नाव",
    "लेखाशीर्ष",
    "लेखाशीर्ष नाव",
    "रक्कम",
    "तपशील",
  ];

  const keyMapping = {
    Delete: "delete",
    "कार्य/क्रियाकलाप संकेतांक": "activityCode",
    "विभाग संकेतांक नाव": "deptName",
    लेखाशीर्ष: "ledger",
    "लेखाशीर्ष नाव": "ledgerName",
    रक्कम: "amount",
    तपशील: "remark",
  };

  const fetchParties = async () => {
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

        setPartyOptions(formatted);
      }
    } catch (err) {
      console.error("Error fetching parties:", err);
    }
  };

  const fetchPartyBanks = async (partyId) => {
    try {
      if (!partyId) return;

      setLoadingBanks(true);

      const res = await axios.post(`${BASE_URL}/api/FrmVoucher/party-bank`, 
        {
          partyid: Number(partyId),
        },
        {
            headers: {
              Authorization: `Bearer ${token}`,
            },
        }
      );

      if (res?.data?.data?.success) {
        setBankList(res.data.data.data || []);
      }
    } catch (err) {
      console.error("Error fetching bank list:", err);
    } finally {
      setLoadingBanks(false);
    }
  };

  const fetchAndSetBankDetails = async (bankId, setFieldValue) => {
    try {
      const res = await axios.post(`${BASE_URL}/api/FrmVoucher/bank-details`, 
        {
          bankID: bankId,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (res?.data?.data?.success && res.data.data.data.length > 0) {
        const bank = res.data.data.data[0];
        console.log("Bank: ", bank);

        setFieldValue("bank", bank.VAR_BANKMST_BANKNAME?.trim());
        setFieldValue("branch", bank.VAR_BRANCHMST_BRANCHNAME);
        setFieldValue("ifscCode", bank.VAR_PARTYBANK_IFSC);
        setFieldValue("accountNo", bank.VAR_PARTYBANK_ACCOUNTNO);
      }
    } catch (err) {
      console.error("Error fetching bank details:", err);
    }
  };

  const fetchPartyTax = async (partyId, setFieldValue) => {
    try {
      if (!partyId || !ulbId) return;

      const res = await axios.post(`${BASE_URL}/api/FrmVoucher/party-tax`, 
        {
          partyid: Number(partyId),
          ulbid: Number(ulbId),
        },
        {
            headers: {
              Authorization: `Bearer ${token}`,
            },
        }
      );

      if (res?.data?.data?.success && res.data.data.data.length > 0) {
        const tax = res.data.data.data[0];
        console.log("tax: ", tax);

        setFieldValue("pancard", tax.VAR_PARTYMST_PANCARD || "");
        setFieldValue("gstNo", tax.VAR_PARTYMST_GSTNO || "");
      }
    } catch (err) {
      console.error("Error fetching party tax:", err);
    }
  };

  const fetchZones = async () => {
    try {
      const res = await axios.post(`${BASE_URL}/api/Receipt/zones`, 
        {
          corp_id: Number(ulbId),
        },
        {
            headers: {
              Authorization: `Bearer ${token}`,
            },
        }
      );

      if (res?.data?.data) {
        setZones(res.data.data);
      }
    } catch (err) {
      console.error("Error fetching zones:", err);
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await axios.post(`${BASE_URL}/api/Receipt/departments`, 
        {
          ulbid: Number(ulbId),
        },
        {
            headers: {
              Authorization: `Bearer ${token}`,
            },
        }
      );

      if (res?.data?.data) {
        setDepartments(res.data.data);
      }
    } catch (err) {
      console.error("Error fetching departments:", err);
    }
  };

  const fetchContracts = async (partyId, zoneId) => {
    try {
      if (!partyId || !zoneId) return;

      const res = await axios.post(`${BASE_URL}/api/FrmVoucher/contracts`, 
        {
          contractorid: Number(partyId),
          zoneid: Number(zoneId),
        },
        {
            headers: {
              Authorization: `Bearer ${token}`,
            },
        }
      );

      if (res?.data?.data?.success) {
        setContracts(res.data.data.data || []);
      } else {
        setContracts([]);
      }
    } catch (err) {
      console.error("Error fetching contracts:", err);
    }
  };

  const fetchContractYears = async (contractId) => {
    try {
      if (!contractId) return;

      const res = await axios.post(`${BASE_URL}/api/FrmVoucher/contract-year`, 
        {
          contractid: Number(contractId),
        },
        {
            headers: {
              Authorization: `Bearer ${token}`,
            },
        }
      );

      if (res?.data?.data?.success) {
        setContractYears(res.data.data.data || []);
      }
    } catch (err) {
      console.error("Error fetching contract years:", err);
    }
  };

  const fetchGLCodes = async () => {
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
          value: g.GLFUNCTION.toString(),
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

      console.log("Creadit Leasure:", res);

      if (res?.data?.data?.success) {
        const formatted = res.data.data.rows.map((l) => ({
          label: l.ACCNAME,
          value: l.OBJECTCODE,
        }));

        setLedgerOptions(formatted);
      }
    } catch (err) {
      console.error("Error fetching ledger:", err);
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
        // setFieldValue("contractYear", d.VAR_VCHPREPMST_ACCYEAR || "");
        setFieldValue(
          "contract",
          d.NUM_VCHPREPMST_CONTRACTID
            ? d.NUM_VCHPREPMST_CONTRACTID.toString()
            : ""
        );

        setFieldValue(
          "contractYear",
          d.VAR_VCHPREPMST_ACCYEAR && d.VAR_VCHPREPMST_ACCYEAR !== "0"
            ? d.VAR_VCHPREPMST_ACCYEAR
            : ""
        );

        if (d.TRNSDATE) {
          setFieldValue("date", new Date(d.TRNSDATE));
        }

        if (d.PARTYBANKID) {
          fetchAndSetBankDetails(d.PARTYBANKID, setFieldValue);
        }

        if (d.DRGL) {
          fetchLedger(d.DRGL.toString());
        }

        fetchPartyTax(d.PARTYID, setFieldValue);
        fetchPartyBanks(d.PARTYID);
        fetchContracts(d.PARTYID, d.ZONEID);

        if (d.NUM_VCHPREPMST_CONTRACTID) {
          const contractId = d.NUM_VCHPREPMST_CONTRACTID.toString();
          setFieldValue("contract", contractId);

          await fetchContractYears(contractId);
        }

        if (d.VAR_VCHPREPMST_ACCYEAR && d.VAR_VCHPREPMST_ACCYEAR !== "0") {
          setFieldValue("contractYear", d.VAR_VCHPREPMST_ACCYEAR);
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
    fetchParties();
    fetchZones();
    fetchDepartments();
    fetchGLCodes();
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

  const bankHeaders = [
    "बँक नाव",
    "ब्रांच नाव",
    "आयएफएससी",
    "अकाउंट न.",
    "स्थिती",
    "Select",
  ];

  const bankKeyMapping = {
    "बँक नाव": "bank",
    "ब्रांच नाव": "branch",
    "आयएफएससी": "ifsc",
    "अकाउंट न.": "account",
    "स्थिती": "status",
    "Select": "action",
  };

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

        const handleBankSelect = async (bankId) => {
          try {
            const res = await axios.post(`${BASE_URL}/api/FrmVoucher/bank-details`, 
              {
                bankID: bankId,
              },
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            );

            if (res?.data?.data?.success && res.data.data.data.length > 0) {
              const bank = res.data.data.data[0];
              console.log("Autofilled Bank: ", bank)

              setFieldValue("bank", bank.VAR_BANKMST_BANKNAME?.trim());
              setFieldValue("branch", bank.VAR_BRANCHMST_BRANCHNAME);
              setFieldValue("ifscCode", bank.VAR_PARTYBANK_IFSC);
              setFieldValue("accountNo", bank.VAR_PARTYBANK_ACCOUNTNO);

              setShowBankModal(false);
            }
          } catch (err) {
            console.error("Error fetching bank details:", err);
          }
        };

        const transformedBankData = bankList.map((b) => ({
          bank: b.VAR_BANKMST_BANKNAME?.trim(),
          branch: b.VAR_BRANCHMST_BRANCHNAME,
          ifsc: b.VAR_PARTYBANK_IFSC,
          account: b.VAR_PARTYBANK_ACCOUNTNO,
          status: b.VAR_PARTYBANK_STATUS,
          action: (
            <Button
              variant="link"
              className="text-blue-600 underline"
              onClick={() => handleBankSelect(b.NUM_PARTYBANK_ID)}
            >
              Select
            </Button>
          ),
        }));

        useEffect(() => {
          const total = parseFloat(values.totalPayable) || 0;
          const deduction = parseFloat(values.deductionAmount) || 0;

          const net = total - deduction;

          setFieldValue("netPayable", net >= 0 ? net : 0);
        }, [values.totalPayable, values.deductionAmount]);

        useEffect(() => {
          if (
            mode === 2 &&
            voucherData?.refno &&
            voucherData?.zoneid &&
            partyOptions.length > 0
          ) {
            const loadData = async () => {
              try {
                setLoadingVoucher(true);

                await fetchVoucherDetails(
                  voucherData.refno,
                  voucherData.zoneid,
                  setFieldValue
                );

                await fetchVoucherLines(voucherData.refno);

              } catch (err) {
                console.error(err);
              } finally {
                setLoadingVoucher(false);
              }
            };

            loadData();
          }
        }, [mode, voucherData, partyOptions]);

        useEffect(() => {
          if (pendingDeptCode && glCodes.length > 0) {
            const normalizedCode = pendingDeptCode.toString().padStart(3, "0");
            const matched = glCodes.find(g => g.value === normalizedCode);
            if (matched) {
              setFieldValue("deptCode", matched.value);
              fetchLedger(matched.value);
            }
            setPendingDeptCode(null);
          }
        }, [pendingDeptCode, glCodes]);

        if (loadingVoucher) {
          return (
            <div className="flex items-center justify-center h-[60vh]">
              <div className="text-center space-y-3">
                <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
                <p className="text-gray-600">माहिती लोड होत आहे...</p>
              </div>
            </div>
          );
        }


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
                  प्रमाणकची तयारी
                </CardTitle>
              </CardHeader>

              <CardContent className="p-4 sm:p-6 space-y-6">

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="flex items-center justify-center gap-2">
                    <Label text="दिनांक :" className='w-32' />
                    <DatePicker
                      value={values.date}
                      onChange={(d) => setFieldValue("date", d)}
                      className='flex-1 h-9'
                    />
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <Label text="पार्टी :" className='w-32'  />
                    <SearchableSelect
                      options={partyOptions}
                      value={values.party}
                      onChange={(option) => {
                        const val = option?.value || "";

                        setFieldValue("party", val)
                        setFieldValue("pancard", "");
                        setFieldValue("gstNo", "");
                        setFieldValue("contract", "");
                        setFieldValue("contractYear", "");

                        setContracts([]);
                        setContractYears([]);

                        fetchPartyTax(val, setFieldValue);
                        if (values.prabhag) {
                          fetchContracts(val, values.prabhag);
                        }
                      }}
                      placeholder="पार्टी शोधा"
                    />
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <Label text="पॅनकार्ड :" className='w-32' />
                    <Input
                      name="pancard"
                      value={values.pancard}
                      onChange={handleChange}
                      placeholder="पॅनकार्ड क्रमांक"
                      className='flex-1 h-9'
                      disabled
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="flex items-center justify-center gap-2">
                    <Label text="जी.एस.टी नंबर :" className='w-32' />
                    <Input
                      name="gstNo"
                      value={values.gstNo}
                      onChange={handleChange}
                      placeholder="जी.एस.टी नंबर"
                      className='flex-1 h-9'
                      disabled
                    />
                  </div>
                </div>

                <div>
                  <Button
                    type="button"
                    className="bg-blue-900 hover:bg-blue-800 text-white"
                    onClick={() => {
                      if (!values.party) {
                        alert("Please select party first");
                        return;
                      }

                      fetchPartyBanks(values.party);
                      setShowBankModal(true);
                    }}
                  >
                    बँक निवडा
                  </Button>
                </div>

                
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gray-50 p-4 rounded-lg border"
                >
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="flex items-center justify-center gap-2">
                      <Label text="बँक :" className='w-32' />
                      <div className='flex-1'>
                          {values.bank}
                      </div>
                      </div>
                      <div className="flex items-center justify-center gap-2">
                      <Label text="ब्रांच :" className='w-32' />
                      <div className='flex-1'>
                          {values.branch}
                      </div>
                      </div>
                      <div className="flex items-center justify-center gap-2">
                      <Label text="आयएफएससी संकेतांक :" className='w-32' />
                      <div className='flex-1'>
                          {values.ifscCode}
                      </div>
                      </div>
                      <div className="flex items-center justify-center gap-2">
                      <Label text="खाते क्र :" className='w-32' />
                      <div className='flex-1'>
                          {values.accountNo}
                      </div>
                      </div>
                  </div>
                </motion.div>

                <hr />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="flex items-center justify-center gap-2">
                    <Label text="प्रभाग :" className='w-32' />
                    <Select
                      value={values.prabhag}
                      onValueChange={(v) => {
                        setFieldValue("prabhag", v);
                        setFieldValue("contract", "");
                        setFieldValue("contractYear", "");
                        setContracts([]);
                        setContractYears([]);
                        if (values.party) {
                          fetchContracts(values.party, v);
                        }
                      }}
                    >
                      <SelectTrigger className="w-full border rounded-md flex-1 h-9">
                        <SelectValue placeholder="-- विकल्प निवडा --" />
                      </SelectTrigger>

                      <SelectContent>
                        {zones.map((z) => (
                          <SelectItem key={z.ZONEID} value={z.ZONEID.toString()}>
                            {z.ZONEENAME}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <Label text="विभाग :" className='w-32' />
                    <Select 
                      value={values.vibhag}
                      onValueChange={(v) => setFieldValue("vibhag", v)}
                    >
                      <SelectTrigger className="w-full border rounded-md flex-1 h-9">
                        <SelectValue placeholder="-- विकल्प निवडा --" />
                      </SelectTrigger>

                      <SelectContent>
                        {departments.map((d) => (
                          <SelectItem key={d.DEPTID} value={d.DEPTID.toString()}>
                            {d.DEPTNAME}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <Label text="प्रमाणक क्र. :" className='w-32' />
                    <Input
                      name="voucherNo"
                      value={values.voucherNo}
                      onChange={handleChange}
                      placeholder="प्रमाणक क्रमांक"
                      className='flex-1 h-9'
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="flex items-center justify-center gap-2">
                    <Label text="एकूण देय रक्कम :" className='w-32' />
                    <Input
                      name="totalPayable"
                      value={values.totalPayable}
                      onChange={handleChange}
                      placeholder="एकूण देय रक्कम"
                      type="number"
                      className='flex-1 h-9'
                    />
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <Label text="कपात रक्कम :" className='w-32' />
                    <Input
                      name="deductionAmount"
                      value={values.deductionAmount}
                      onChange={handleChange}
                      placeholder="कपात रक्कम"
                      type="number"
                      className='flex-1 h-9'
                    />
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <Label text="निव्वळ देय रक्कम :" className='w-32' />
                    <Input
                      name="netPayable"
                      value={values.netPayable}
                      placeholder="निव्वळ देय रक्कम"
                      type="number"
                      className='flex-1 h-9'
                      readOnly
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="flex items-center justify-center gap-2">
                    <Label text="विभाग संकेतांक. :" className='w-32' />
                    <SearchableSelect
                      options={glCodes}
                      value={values.deptCode}
                      // onChange={(val) => {
                      //   setFieldValue("deptCode", val);
                      //   setFieldValue("ledger", "");
                      //   setLedgerOptions([]);

                      //   fetchLedger(val);
                      // }}
                      onChange={(option) => {
                        const val = option?.value || "";
                        setFieldValue("deptCode", val);
                        setFieldValue("ledger", "");
                        setLedgerOptions([]);
                        fetchLedger(val);
                      }}
                      placeholder="विभाग संकेतांक निवडा"
                    />
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <Label text="लेखाशीर्ष :" className='w-32' />
                    <SearchableSelect
                      options={ledgerOptions}
                      value={values.ledger}
                      // onChange={(val) => setFieldValue("ledger", val)}
                      onChange={(option) => {
                        setFieldValue("ledger", option?.value || "");
                      }}
                      placeholder="लेखाशीर्ष निवडा"
                      disabled={!values.deptCode}
                    />
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <Label text="कंत्राट वर्ष :" className='w-32' />
                    <Select 
                      value={values.contractYear}
                      onValueChange={(v) => setFieldValue("contractYear", v)}
                    >
                      <SelectTrigger className="flex-1 h-9">
                        <SelectValue placeholder="कंत्राट वर्ष निवडा" />
                      </SelectTrigger>

                      <SelectContent>
                        {contractYears.map((y) => (
                          <SelectItem
                            key={y.NUM_CONTRACTDET_ID}
                            value={y.NUM_CONTRACTDET_ID.toString()}
                          >
                            {y.VAR_CONTRACTDET_ACCYR}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-center justify-center gap-2">
                    <Label text="तपशील :" className='w-32' />
                    <Input
                      name="remark"
                      value={values.remark}
                      onChange={handleChange}
                      placeholder="तपशील"
                      className='flex-1 h-9'
                    />
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <Label text="कंत्राट :" className='w-32' />
                    <Select
                      value={values.contract}
                      onValueChange={(v) => {
                        setFieldValue("contract", v);
                        setFieldValue("contractYear", "");
                        setContractYears([]);
                        fetchContractYears(v);
                      }}
                    >
                      <SelectTrigger className="flex-1 h-9">
                        <SelectValue placeholder="कंत्राट निवडा" />
                      </SelectTrigger>

                      <SelectContent>
                        {contracts.map((c) => (
                          <SelectItem
                            key={c.NUM_CONTRACTMST_ID}
                            value={c.NUM_CONTRACTMST_ID.toString()}
                          >
                            {c.VAR_CONTRACTMST_NAME}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <hr />

                <div className="space-y-4">
                  <h3 className="text-md font-semibold text-gray-700">कपात</h3>
                  
                  <FieldArray name="entries">
                    {({ remove, form }) => (
                      <>
                        {values.entries.map((entry, index) => (
                            <div key={index} className="space-y-4">
                                <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="flex items-center justify-center gap-2">
                                    <Label text="विभाग संकेतांक :" className='w-32' />
                                    {/* <Input
                                        name={`entries.${index}.activityCode`}
                                        value={entry.activityCode}
                                        onChange={handleChange}
                                        placeholder="विभाग संकेतांक"
                                        className='flex-1 h-9'
                                    /> */}
                                    <SearchableSelect
                                      options={entryGlCodes}
                                      value={entry.activityCode}
                                      // onChange={(val) => {
                                      //   setFieldValue(`entries.${index}.activityCode`, val);
                                      //   setFieldValue(`entries.${index}.ledger`, "");

                                      //   fetchEntryLedger(val, index);
                                      // }}
                                      onChange={(option) => {
                                        const val = option?.value || "";
                                        setFieldValue(`entries.${index}.activityCode`, val);
                                        setFieldValue(`entries.${index}.ledger`, "");

                                        fetchEntryLedger(val, index);
                                      }}
                                      placeholder="विभाग संकेतांक निवडा"
                                    />
                                    </div>

                                    <div className="flex items-center justify-center gap-2">
                                    <Label text="लेखा शिर्ष :" className='w-32' />
                                    {/* <Input
                                        name={`entries.${index}.ledger`}
                                        value={entry.ledger}
                                        onChange={handleChange}
                                        placeholder="लेखा शिर्ष"
                                        className='flex-1 h-9'
                                    /> */}
                                      <SearchableSelect
                                        options={entryLedgerOptions[index] || []}
                                        value={entry.ledger}
                                        // onChange={(val) =>
                                        //   setFieldValue(`entries.${index}.ledger`, val)
                                        // }
                                        onChange={(option) =>
                                          setFieldValue(`entries.${index}.ledger`, option?.value)
                                        }
                                        placeholder="लेखा शिर्ष निवडा"
                                        disabled={!entry.activityCode}
                                      />
                                    </div>

                                    <div className="flex items-center justify-center gap-2">
                                    <Label text="रक्कम :" className='w-32' />
                                    <Input
                                        name={`entries.${index}.amount`}
                                        value={entry.amount}
                                        onChange={handleChange}
                                        placeholder="रक्कम"
                                        type="number"
                                        className='flex-1 h-9'
                                    />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="flex items-center justify-center gap-2">
                                        <Label text="तपशील :" className='w-32' />
                                        <Input
                                            name={`entries.${index}.remark`}
                                            value={entry.remark}
                                            onChange={handleChange}
                                            placeholder="तपशील"
                                            className='flex-1 h-9'
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
                                      यादीत जोडा
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-center justify-center gap-2">
                    <Label text="एकूण :" className='w-32' />
                    <Input
                      className="w-50 flex-1 h-9"
                      value={calculateTotal().toFixed(2)}
                      readOnly
                      disabled
                    />
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <Label text="फरक :" className='w-32' />
                    <Input
                      className="w-50 flex-1 h-9"
                      value={calculateDifference(values).toFixed(2)}
                      readOnly
                      disabled
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center flex-wrap gap-3 pt-4">
                  <Button type="submit" className="bg-blue-900 hover:bg-blue-800 text-white">
                    स्वीकार
                  </Button>
                  <Button type="button" variant="outline" path="/Transactions/FrmVoucherPreparationList">
                    परत
                  </Button>
                  <Button type="button" variant="outline" path="/Transactions/FrmVoucherPreparationList">
                    बदल
                  </Button>
                  <Button type="button" variant="destructive" path="/Transactions/FrmVoucherPreparationList">
                    काढून टाका
                  </Button>
                </div>

              </CardContent>
            </Card>
          </motion.div>
        </Form>
        {showBankModal && (
            <div
                className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
                onClick={() => setShowBankModal(false)}
            >
                <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white p-4 sm:p-6 rounded-lg w-[95%] sm:w-175 max-h-[90vh] overflow-y-auto shadow-lg"
                >
                <h2 className="text-center text-lg font-semibold mb-4">
                    पार्टी बँक माहिती
                </h2>

                {loadingBanks ? (
                  <div className="text-center py-4">Loading banks...</div>
                ) : (
                  <ShadCNTable
                    headers={bankHeaders}
                    data={transformedBankData}
                    keyMapping={bankKeyMapping}
                    pagination={false}
                    className="max-md:min-w-380"
                  />
                )}
                

                <div className="text-center mt-4">
                    <Button
                    variant="destructive"
                    onClick={() => setShowBankModal(false)}
                    >
                    Close
                    </Button>
                </div>
                </motion.div>
            </div>
        )}
        </>
      )}}
    </Formik>
  );
};

export default FrmVoucherPreparation;