import { Formik, Form } from "formik";
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
import Swal from "sweetalert2";
import { DatePicker } from "@/components/ui/calendar";
import SearchableSelect from "@/components/SearchableSelect";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";

const FrmReceiptKarjat = () => {
  const { user, token } = useAuth();
  console.log("user: ", user);
  console.log("token: ", token);
  const location = useLocation();
  const navigate = useNavigate();
  const refNo = location.state?.receiptNo;
  const ulbId = user?.ulbId;
  const BASE_URL = import.meta.env.VITE_BASE_URL;

  const [zones, setZones] = useState([]);
  const [receiptTypes, setReceiptTypes] = useState([]);
  const [banks, setBanks] = useState([]);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [ledgerOptions, setLedgerOptions] = useState([]);
  const [ledgerLoading, setLedgerLoading] = useState(false);
  const [entryHeadList, setEntryHeadList] = useState([]);
  const [tableData, setTableData] = useState([
    { subLedger: "", headName: "", amount: "" }
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isIfscLoading, setIsIfscLoading] = useState(false);

  const fetchZones = async () => {
    try {
      const res = await axios.post(`${BASE_URL}/api/Receipt/zones`, {
        corp_id: ulbId,
      },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      setZones(res.data.data || []);
    } catch (err) {
      console.error("Zone API Error:", err);
    }
  };

  const fetchReceiptTypes = async () => {
    try {
      const res = await axios.post(
        `${BASE_URL}/api/FrmReceiptKarjat/receipt-types`, 
        { ulbId: Number(ulbId) },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("Response Receipt Type: ", res);
      
      setReceiptTypes(res.data?.data?.rows || []); 
    } catch (err) {
      console.error("Receipt Types API Error:", err);
    }
  };

  const fetchBanks = async () => {
    try {
      const res = await axios.get(
        `${BASE_URL}/api/FrmParty/bank`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("Response Banks: ", res);
      
      const formattedBanks = (res.data?.data?.list || []).map((bank) => ({
        value: bank.VALUE.toString(),
        label: bank.LABEL
      }));

      setBanks(formattedBanks); 
    } catch (err) {
      console.error("Bank API Error:", err);
    }
  };

  const fetchDynamicSubLedgers = async (recTypeId) => {
    try {
      setLedgerLoading(true);
      const res = await axios.post(
        `${BASE_URL}/api/FrmReceiptKarjat/receipt-accounts`,
        { recTypeId: Number(recTypeId) },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const formatted = (res.data?.data?.rows || []).map((item) => ({
        value: item.NUM_RECACCCONFIG_ACCNO?.toString() || "",
        label: item.ACCOUNTSEARCHNAME || "",
      }));

      setLedgerOptions(formatted);
    } catch (err) {
      console.error("Sub-Ledger API Error:", err);
      setLedgerOptions([]);
    } finally {
      setLedgerLoading(false);
    }
  };

  const fetchBankAccounts = async (bankId) => {
    try {
      setLedgerLoading(true);
      const res = await axios.post(
        `${BASE_URL}/api/FrmReceiptKarjat/bank-accounts`,
        { bankId: Number(bankId) },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("bank account res: ", res);

      const formatted = (res.data?.data?.rows || []).map((item) => ({
        value: item.ACCNO?.toString() || "",
        label: item.ACCSEARCHNAME || "",
      }));

      setBankAccounts(formatted);
    } catch (err) {
      console.error("Sub-Ledger API Error:", err);
      setLedgerOptions([]);
    } finally {
      setLedgerLoading(false);
    }
  };

  useEffect(() => {
     if (ulbId) {
      fetchZones();
      fetchReceiptTypes();
      fetchBanks();
    }
  }, [ulbId]);

  const handleAddRow = (values, setFieldValue) => {
    if (!values.subLedger || !values.rowAmount) {
      Swal.fire({
        text: "कृपया सब-लेजर आणि रक्कम भरा",
        confirmButtonColor: "#1e3a8a",
      });
      return;
    }

    const savedRows = tableData.slice(0, -1);
    // const isDuplicate = savedRows.some(
    //   (row) => row.subLedger === values.subLedger
    // );
    
    // if (isDuplicate) {
    //   Swal.fire({
    //     text: "हा सब-लेजर आधीच यादीत आहे",
    //     confirmButtonColor: "#1e3a8a",
    //   });
    //   return;
    // }

    const selectedHead = ledgerOptions.find(
      (h) => h.value === values.subLedger
    );

    const newSavedRow = {
      subLedger: values.subLedger,
      headName: selectedHead?.label || "",
      amount: values.rowAmount,
    };

    setTableData((prev) => {
      const currentSavedRows = prev.slice(0, -1);
      return [...currentSavedRows, newSavedRow, { subLedger: "", headName: "", amount: "" }];
    });

    setFieldValue("subLedger", "");
    setFieldValue("rowAmount", "");
  };

  const handleDeleteRow = (index) => {
    if (index === tableData.length - 1) return; 
    // const confirmDelete = window.confirm("तुम्हाला ही नोंद काढायची आहे का?");
    // if (!confirmDelete) return;
    
    setTableData((prev) => prev.filter((_, i) => i !== index));
  };

  const handleIfscChange = async (e, setFieldValue) => {
    const ifsc = e.target.value.toUpperCase();
    setFieldValue("ifscCode", ifsc);

    if (ifsc.length === 11) {
      setIsIfscLoading(true);
      try {
        const res = await axios.post(
          `${BASE_URL}/api/FrmReceiptKarjat/bank-branch-by-ifsc`,
          { ifsc: ifsc },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const data = res.data?.data;

        console.log("data: ", data);
        
        if (data && data.bank && data.branch) {
          setFieldValue("bankName", data.bank.BANKNAME || "");
          setFieldValue("branchName", data.branch.BRANCHNAME || "");
        } else {
          Swal.fire({
            text: "या IFSC कोडची माहिती सापडली नाही. कृपया पुन्हा तपासा.",
            confirmButtonColor: "#1e3a8a",
          });
          setFieldValue("bankName", "");
          setFieldValue("branchName", "");
        }
      } catch (err) {
        console.error("IFSC Lookup Error:", err);
        setFieldValue("bankName", "");
        setFieldValue("branchName", "");
      } finally {
        setIsIfscLoading(false);
      }
    } else {
      setFieldValue("bankName", "");
      setFieldValue("branchName", "");
    }
  };

  const handleSave = async (values, resetForm) => {
    const hasDraftData = values.subLedger && values.rowAmount;
    const selectedHead = ledgerOptions.find((h) => h.value === values.subLedger);
    
    const finalTableData = hasDraftData 
      ? [...tableData.slice(0, -1), { 
          subLedger: values.subLedger, 
          headName: selectedHead?.label || "", 
          amount: values.rowAmount 
        }] 
      : tableData.slice(0, -1);

    if (!values.pavtiDinank) {
      Swal.fire({ text: 'पावती दिनांक रिक्त असू शकत नाही', confirmButtonColor: '#1e3a8a' });
      return;
    }
    if (!values.pavtiPrakar) {
      Swal.fire({ text: 'पावती प्रकार रिक्त असू शकत नाही', confirmButtonColor: '#1e3a8a' });
      return;
    }
    if (!values.dvareAda || values.dvareAda.trim() === "") {
      Swal.fire({ text: 'द्वारे अदा रिक्त असू शकत नाही', confirmButtonColor: '#1e3a8a' });
      return;
    }
    if (!values.shera || values.shera.trim() === "") {
      Swal.fire({ text: 'शेरा रिक्त असू शकत नाही', confirmButtonColor: '#1e3a8a' });
      return;
    }
    if (!values.prashasakiyaVibhag) {
      Swal.fire({ text: 'प्रशासकीय विभाग रिक्त असू शकत नाही', confirmButtonColor: '#1e3a8a' });
      return;
    }

    if (finalTableData.length === 0) {
      Swal.fire({ text: 'व्यवहार ची दिटैल्स व्यवहार सूची मध्ये जोडा', confirmButtonColor: '#1e3a8a' });
      return;
    }

    if (values.bharnyachePrakar === "dhanadesh") {
      if (!values.ifscCode || values.ifscCode.length !== 11) {
        Swal.fire({ text: 'कृपया वैध IFSC कोड प्रविष्ट करा (११ अक्षरी)', confirmButtonColor: '#1e3a8a' });
        return;
      }
      if (!values.chequeinstrumentNumber) {
        Swal.fire({ text: 'इन्स्ट्रुमेंट क्रमांक रिक्त असू शकत नाही', confirmButtonColor: '#1e3a8a' });
        return;
      }
      if (!values.chequeinstrumentDate) {
        Swal.fire({ text: 'इन्स्ट्रुमेंट दिनांक रिक्त असू शकत नाही', confirmButtonColor: '#1e3a8a' });
        return;
      }
    }

    if (values.bharnyachePrakar === "directBank") {
      if (!values.instrumentNumber) {
        Swal.fire({ text: 'UTR क्रमांक रिक्त असू शकत नाही', confirmButtonColor: '#1e3a8a' });
        return;
      }
      if (!values.instrumentDate) {
        Swal.fire({ text: 'इन्स्ट्रुमेंट दिनांक रिक्त असू शकत नाही', confirmButtonColor: '#1e3a8a' });
        return;
      }
      if (!values.directBankName) {
        Swal.fire({ text: 'बँकेचे नाव रिक्त असू शकत नाही', confirmButtonColor: '#1e3a8a' });
        return;
      }
      if (!values.directAccountNo) {
        Swal.fire({ text: 'बँक खाते क्रमांक रिक्त असू शकत नाही', confirmButtonColor: '#1e3a8a' });
        return;
      }
    }

    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const formatDate = (date) => {
        const d = new Date(date);
        return `${String(d.getDate()).padStart(2, "0")}-${d.toLocaleString("default", { month: "short" })}-${d.getFullYear()}`;
      };

      const TransDate = formatDate(values.pavtiDinank);
      const InMode = refNo ? 2 : 1;
      const RefNo = refNo || 0;

      const recModeMapping = {
        "rokh": 1,
        "dhanadesh": 2,
        "dd": 3,
        "directBank": 4
      };
      const recModeId = recModeMapping[values.bharnyachePrakar] || 1;

      let wardCode = "0";
      let head = "0";

      try {
        const payModeRes = await axios.post(
          `${BASE_URL}/api/FrmReceiptKarjat/paymode-accounts`,
          { payModeId: recModeId },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        const mappedAcc = payModeRes.data?.data?.rows?.[0];
        console.log("mappedAcc: ", mappedAcc);
        if (mappedAcc) {
          wardCode = mappedAcc.NUM_PAYMODEACCCONF_GLCODE || "0";
          head = mappedAcc.NUM_PAYMODEACCCONF_ACCNO || "0";
        }
      } catch (err) {
        console.error("Error fetching paymode accounts for header:", err);
      }

      const totalAmount = finalTableData.reduce(
        (sum, row) => sum + Number(row.amount || 0),
        0
      );

      const paramStr = [
        TransDate, 
        values.pavtiPrakar, 
        recModeId, 
        values.prashasakiyaVibhag || "0", 
        0, 
        wardCode, 
        head, 
        InMode, 
        RefNo, 
        values.prashasakiyaVibhag || "", 
        values.shera || "", 
        1,  
        1,  
        totalAmount,
        totalAmount,
        values.pavtiPrakar,
        values.dvareAda || "",
        values.emailAddress || "",
        values.mobaliKramank || "",
        values.anudanKramank || "1",
        recModeId,
        values.directBankName || "0",
        values.directAccountNo || "0",
        String(values.chequeinstrumentNumber || values.instrumentNumber || "").substring(0, 10),
        values.chequeinstrumentDate ? formatDate(values.chequeinstrumentDate) : 
        values.instrumentDate ? formatDate(values.instrumentDate) : ""
      ].join("~");

      const defaultRemark = recModeId === 1 ? "रोख जमा" : "धनादेशाने जमा";

      const paramStr2Array = await Promise.all(
        finalTableData.map(async (row) => {
          try {
            const res = await axios.post(
              `${BASE_URL}/api/FrmReceiptKarjat/account-details`,
              { accno: row.subLedger },
              { headers: { Authorization: `Bearer ${token}` } }
            );
            
            const accDetails = res.data?.data?.rows?.[0];
            
            if (accDetails) {
              return [
                accDetails.VIBHAGCODE,
                accDetails.LEKHASHIRSH,
                row.amount, 
                defaultRemark,
                ""    
              ].join("#");
            }
            return null;
          } catch (err) {
            console.error("Error fetching account details for accno:", row.subLedger, err);
            return null;
          }
        })
      );

      const paramStr2 = paramStr2Array.filter(Boolean).join("$");

      const payload = {
        In_UserId: user?.userId,
        In_ParamStr: paramStr,
        In_ParamStr2: paramStr2,
        In_ParamStr3: "",
        In_ParamStr4: "",
        In_ParamStr5: "",
        In_ParamStr6: "",
      };

      console.log("Submitting Payload:", payload);

      const res = await axios.post(`${BASE_URL}/api/Receipt/receiptInsertUpdate`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      Swal.fire({
        text: res.data?.data?.message || "पावती यशस्वीरित्या जतन केली गेली!",
        confirmButtonColor: "#1e3a8a",
      }).then(() => {
        navigate("/Transactions/FrmReceiptListKarjat");
      });

    } catch (err) {
      console.error("SAVE ERROR:", err);
      Swal.fire({ text: "Error while saving", confirmButtonColor: "#1e3a8a" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const initialValues = {
    pavtiDinank: new Date(),
    pavtiPrakar: "",
    sandarbhaKramank: "",
    sandarbhaDinank: "",
    dvareAda: "",
    emailAddress: "",
    shera: "",
    mobaliKramank: "",
    anudanKramank: "",
    prashasakiyaVibhag: "",
    anudanKramank: "",

    subLedger: "",
    rowAmount: "",

    bharnyachePrakar: "rokh",

    ifscCode: "",
    bankName: "",
    branchName: "",
    chequeinstrumentNumber: "",
    chequeinstrumentDate: "",


    utrNumber: "",
    ddDate: "",

    directBankName: "",
    directAccountNo: "",
    instrumentNumber: "",
    instrumentDate: "",
  };

  return (
    <Formik
      initialValues={initialValues}
      onSubmit={(values, { resetForm }) => handleSave(values, resetForm)}
    >
      {({ values, handleChange, setFieldValue, resetForm }) => {

        useEffect(() => {
          if (values.pavtiPrakar) {
            fetchDynamicSubLedgers(values.pavtiPrakar);
          } else {
            setLedgerOptions([]);
          }
        }, [values.pavtiPrakar]);

        useEffect(() => {
          if (values.directBankName) {
            fetchBankAccounts(values.directBankName);
          } else {
            setBankAccounts([]);
          }
        }, [values.directBankName]);

        return (
          <Form>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="pb-10"
            >
              <Card className="border shadow-sm">
                <CardHeader className="border-b">
                  <CardTitle className="text-lg font-semibold">
                    पावती प्रवेश जोडा
                  </CardTitle>
                </CardHeader>

                <CardContent className="p-6 space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <div className="sm:w-36 shrink-0 flex justify-start sm:justify-between items-center">
                        <Label text="पावती दिनांक" required />
                        <span>:</span>
                      </div>
                      <DatePicker
                        value={values.pavtiDinank}
                        onChange={(d) => setFieldValue("pavtiDinank", d)}
                        className="w-full h-9"
                      />
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <div className="sm:w-36 shrink-0 flex justify-start sm:justify-between items-center">
                        <Label text="पावती प्रकार" required />
                        <span>:</span>
                      </div>
                      <Select
                        value={values.pavtiPrakar}
                        onValueChange={(v) => setFieldValue("pavtiPrakar", v)}
                        className="w-full h-9"
                      >
                        <SelectTrigger className="w-full border border-gray-400 rounded-md h-9">
                          <SelectValue placeholder="-- निवडा --" />
                        </SelectTrigger>
                        <SelectContent>
                          {receiptTypes.map((t) => (
                            <SelectItem
                              key={t.NUM_REC_TYPE_ID}
                              value={t.NUM_REC_TYPE_ID.toString()}
                            >
                              {t.VAR_REC_TYPE}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <div className="sm:w-36 shrink-0 flex justify-start sm:justify-between items-center">
                        <Label text="संदर्भ क्रमांक" />
                        <span>:</span>
                      </div>
                      <Input
                        type="number"
                        name="sandarbhaKramank"
                        value={values.sandarbhaKramank}
                        onChange={handleChange}
                        className="w-full h-9"
                      />
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <div className="sm:w-36 shrink-0 flex justify-start sm:justify-between items-center">
                        <Label text="संदर्भ दिनांक" />
                        <span>:</span>
                      </div>
                      <DatePicker
                        key={values.sandarbhaDinank ? values.sandarbhaDinank.toString() : "reset-sandarbha"}
                        value={values.sandarbhaDinank || null}
                        onChange={(d) => setFieldValue("sandarbhaDinank", d)}
                        className="w-full h-9"
                      />
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <div className="sm:w-36 shrink-0 flex justify-start sm:justify-between items-center">
                        <Label text="द्वारे अदा" required />
                        <span>:</span>
                      </div>
                      <Input
                        name="dvareAda"
                        value={values.dvareAda}
                        onChange={handleChange}
                        className="w-full h-9"
                      />
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <div className="sm:w-36 shrink-0 flex justify-start sm:justify-between items-center">
                        <Label text="मोबाईल क्रमांक" />
                        <span>:</span>
                      </div>
                      <Input
                        name="mobaliKramank"
                        value={values.mobaliKramank}
                        maxLength={10}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, "");
                          setFieldValue("mobaliKramank", val);
                        }}
                        className="w-full h-9"
                      />
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <div className="sm:w-36 shrink-0 flex justify-start sm:justify-between items-center">
                        <Label text="ईमेल आयडी" />
                        <span>:</span>
                      </div>
                      <Input
                        type="email"
                        name="emailAddress"
                        value={values.emailAddress}
                        onChange={handleChange}
                        className="w-full h-9"
                      />
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <div className="sm:w-36 shrink-0 flex justify-start sm:justify-between items-center">
                        <Label text="प्रशासकीय विभाग" />
                        <span>:</span>
                      </div>
                      <Select
                        value={values.prashasakiyaVibhag}
                        onValueChange={(v) =>
                          setFieldValue("prashasakiyaVibhag", v)
                        }
                        className="w-full h-9"
                      >
                        <SelectTrigger className="w-full border border-gray-400 rounded-md h-9">
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
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <div className="sm:w-36 shrink-0 flex justify-start sm:justify-between items-center">
                        <Label text="शेरा" required />
                        <span>:</span>
                      </div>
                      <Input
                        name="shera"
                        value={values.shera}
                        onChange={handleChange}
                        className="w-full h-9"
                      />
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <div className="sm:w-36 shrink-0 flex justify-start sm:justify-between items-center">
                        <Label text="अनुदान क्रमांक" />
                        <span>:</span>
                      </div>
                      <Select
                        value={values.anudanKramank}
                        onValueChange={(v) => setFieldValue("anudanKramank", v)}
                        className="w-full h-9"
                      >
                        <SelectTrigger className="w-full border border-gray-400 rounded-md h-9">
                          <SelectValue placeholder="-- निवडा --" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">अनुदान १</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <hr className="border-gray-200" />

                  <div>
                    <h3 className="font-heading group-data-[size=sm]/card:text-sm text-lg font-semibold mb-3">
                      पावती प्रवेशिका सारणी
                    </h3>

                    <div className="rounded-md border border-gray-300 overflow-hidden">
                      <Table className="w-full max-md:min-w-380 [&_thead_tr:hover]:bg-[#083c76]">
                        <TableHeader className="bg-[#083c76]">
                          <TableRow>
                            <TableHead className="text-white text-center font-semibold w-[10%] border-r border-indigo-400">
                              अनु. क्र.
                            </TableHead>
                            <TableHead className="text-white text-center font-semibold w-[50%] border-r border-indigo-400">
                              सब-लेजर
                            </TableHead>
                            <TableHead className="text-white text-center font-semibold w-[20%] border-r border-indigo-400">
                              रक्कम
                            </TableHead>
                            <TableHead className="text-white text-center font-semibold w-[20%]">
                              नविन / काढुन टाका
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {tableData.map((row, index) => {
                            const isDraftRow = index === tableData.length - 1;

                            return (
                              <TableRow key={index} className="hover:bg-slate-50">
                                <TableCell className="text-center border-r border-gray-200 font-semibold">
                                  {index + 1}
                                </TableCell>
                                
                                <TableCell className="border-r border-gray-200 py-2">
                                  {isDraftRow ? (
                                    <SearchableSelect
                                      options={ledgerOptions}
                                      name="subLedger"
                                      value={values.subLedger}
                                      onChange={(val) =>
                                        setFieldValue("subLedger", val.value)
                                      }
                                      disabled={ledgerLoading}
                                      placeholder={ledgerLoading ? "Loading..." : ""}
                                      className="w-full border border-gray-400 rounded-md h-9"
                                    />
                                  ) : (
                                    row.headName
                                  )}
                                </TableCell>

                                <TableCell className="border-r border-gray-200 py-2 text-right">
                                  {isDraftRow ? (
                                    <Input
                                      type="number"
                                      name="rowAmount"
                                      value={values.rowAmount}
                                      onChange={handleChange}
                                      className="w-full border border-gray-400 rounded-md h-9 text-right"
                                    />
                                  ) : (
                                    Number(row.amount).toFixed(2)
                                  )}
                                </TableCell>

                                <TableCell className="text-center py-2">
                                  {isDraftRow ? (
                                    <Button
                                      type="button"
                                      onClick={() => handleAddRow(values, setFieldValue)}
                                      className="bg-blue-900 text-white hover:bg-blue-800"
                                    >
                                      Add
                                    </Button>
                                  ) : (
                                    <Button
                                      type="button"
                                      variant="destructive"
                                      size="sm"
                                      onClick={() => handleDeleteRow(index)}
                                      className="h-7 px-3 text-xs"
                                    >
                                      Delete
                                    </Button>
                                  )}
                                </TableCell>
                              </TableRow>
                            );
                          })}

                          <TableRow className="font-bold">
                            <TableCell
                              colSpan={2}
                              className="text-center border-r border-gray-200 text-base py-3"
                            >
                              एकूण
                            </TableCell>
                          <TableCell className="text-right border-r border-gray-200 text-base">
                              {(
                                tableData.slice(0, -1).reduce((sum, row) => sum + Number(row.amount || 0), 0) + 
                                (Number(values.rowAmount) || 0)
                              ).toFixed(2)}
                            </TableCell>
                            <TableCell></TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                  </div>

                  <hr className="border-gray-200" />

                  <div>
                    <h3 className="font-heading group-data-[size=sm]/card:text-sm text-lg font-semibold mb-3">
                      भरण्याची पद्धत
                    </h3>

                    <div className="flex flex-wrap items-center gap-8 mb-6">
                      {["rokh", "dhanadesh", "dd", "directBank"].map((mode) => (
                        <label
                          key={mode}
                          className="flex items-center gap-2 cursor-pointer"
                        >
                          <Input
                            type="radio"
                            name="bharnyachePrakar"
                            value={mode}
                            checked={values.bharnyachePrakar === mode}
                            onChange={handleChange}
                            className="text-blue-600 focus:ring-blue-500 h-4 w-4"
                          />
                          <span className="text-sm font-medium text-slate-700 capitalize">
                            {mode === "rokh" && "रोख"}
                            {mode === "dhanadesh" && "धनादेश"}
                            {mode === "dd" && "डीडी"}
                            {mode === "directBank" && "डायरेक्ट बँक"}
                          </span>
                        </label>
                      ))}
                    </div>

                    <div>
                      {values.bharnyachePrakar === "rokh" && <div></div>}

                      {values.bharnyachePrakar === "dhanadesh" && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fadeIn">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                            <div className="sm:w-36 shrink-0 flex justify-start sm:justify-between items-center">
                              <Label text="IFSC कोड" required />
                              <span>:</span>
                            </div>
                            <Input
                              name="ifscCode"
                              value={values.ifscCode}
                              onChange={(e) => {
                                const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 11);
                                setFieldValue("ifscCode", val);
                                handleIfscChange({ target: { value: val } }, setFieldValue);
                              }}
                              maxLength={11}
                              className="w-full h-9"
                            />
                          </div>
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                            <div className="sm:w-36 shrink-0 flex justify-start sm:justify-between items-center">
                              <Label text="बँकेचे नाव" />
                              <span>:</span>
                            </div>
                            <Input
                              name="bankName"
                              value={values.bankName}
                              readOnly
                              className="w-full h-9"
                            />
                          </div>
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                            <div className="sm:w-36 shrink-0 flex justify-start sm:justify-between items-center">
                              <Label text="शाखा" />
                              <span>:</span>
                            </div>
                            <Input
                              name="branchName"
                              value={values.branchName}
                              readOnly
                              className="w-full h-9"
                            />
                          </div>
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                            <div className="sm:w-36 shrink-0 flex justify-start sm:justify-between items-center">
                              <Label text="इन्स्ट्रुमेंट क्रमांक" required />
                              <span>:</span>
                            </div>
                            <Input
                              name="chequeinstrumentNumber"
                              value={values.chequeinstrumentNumber}
                              onChange={(e) => {
                                const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "");
                                setFieldValue("chequeinstrumentNumber", val);
                              }}
                              maxLength={6}
                              className="w-full h-9"
                            />
                          </div>
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                            <div className="sm:w-36 shrink-0 flex justify-start sm:justify-between items-center">
                              <Label text="इन्स्ट्रुमेंट दिनांक" required />
                              <span>:</span>
                            </div>
                            <DatePicker
                              value={values.chequeinstrumentDate}
                              onChange={(d) =>
                                setFieldValue("chequeinstrumentDate", d)
                              }
                              className="w-full h-9"
                            />
                          </div>
                        </div>
                      )}

                      {values.bharnyachePrakar === "dd" && <div></div>}

                      {values.bharnyachePrakar === "directBank" && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fadeIn">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                            <div className="sm:w-36 shrink-0 flex justify-start sm:justify-between items-center">
                              <Label text="UTR क्रमांक" required />
                              <span>:</span>
                            </div>
                            <Input
                              name="instrumentNumber"
                              value={values.instrumentNumber}
                              onChange={(e) => {
                                const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "");
                                setFieldValue("instrumentNumber", val);
                              }}
                              maxLength={6}
                              className="w-full h-9"
                            />
                          </div>
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                            <div className="sm:w-36 shrink-0 flex justify-start sm:justify-between items-center">
                              <Label text="इन्स्ट्रुमेंट दिनांक" required />
                              <span>:</span>
                            </div>
                            <DatePicker
                              value={values.instrumentDate}
                              onChange={(d) =>
                                setFieldValue("instrumentDate", d)
                              }
                              className="w-full h-9"
                            />
                          </div>
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                            <div className="sm:w-36 shrink-0 flex justify-start sm:justify-between items-center">
                              <Label text="बँकेचे नाव" required />
                              <span>:</span>
                            </div>
                            <Select
                              value={values.directBankName}
                              onValueChange={(v) =>
                                setFieldValue("directBankName", v)
                              }
                              className="w-full h-9"
                            >
                              <SelectTrigger className="w-full border border-gray-400">
                                <SelectValue placeholder="--Select--" />
                              </SelectTrigger>
                              <SelectContent>
                                {banks.map((t) => (
                                  <SelectItem
                                    key={t.value}
                                    value={t.value}
                                  >
                                    {t.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                            <div className="sm:w-36 shrink-0 flex justify-start sm:justify-between items-center">
                              <Label text="बँक खाते क्रमांक" required />
                              <span>:</span>
                            </div>
                            <Select
                              value={values.directAccountNo}
                              onValueChange={(v) =>
                                setFieldValue("directAccountNo", v)
                              }
                            >
                              <SelectTrigger className="w-full border border-gray-400 h-9 overflow-hidden truncate">
                                <SelectValue placeholder="--Select--" className="truncate" />
                              </SelectTrigger>
                              <SelectContent 
                                position="popper" 
                                className="max-w-[var(--radix-select-trigger-width)] sm:max-w-[500px] max-h-[300px]"
                              >
                                {bankAccounts.map((account) => (
                                  <SelectItem
                                    key={account.value}
                                    value={account.value}
                                    className="truncate"
                                  >
                                    {account.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-center gap-3 pt-6 border-t border-gray-200">
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="bg-blue-900 text-white hover:bg-blue-800"
                    >
                      {isSubmitting ? "Saving..." : "सेव्ह करा"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="border border-gray-400 text-black hover:bg-gray-100"
                      onClick={() => {
                        resetForm();
                        setTableData([
                          { subLedger: "", headName: "", amount: "" }
                        ]);
                      }}
                    >
                      पुनर्स्थित करा
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="border border-gray-400 text-black hover:bg-gray-100"
                      onClick={() => navigate("/Transactions/FrmReceiptList")}
                    >
                      बंद करा
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

export default FrmReceiptKarjat;
