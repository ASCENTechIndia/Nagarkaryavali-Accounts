import React, { useEffect, useState } from "react";
import { useRef } from "react";
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
import { DatePicker } from "@/components/ui/calendar";
import { Table, TableCell, TableHead, TableHeader, TableRow, TableBody } from "@/components/ui/table";
import SearchableSelect from "@/components/SearchableSelect";
import { useAuth } from "@/context/AuthContext";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { contractValidationSchema } from "../validations/global.validation";

const getInitialValues = () => ({
  prabhag: "",
  contractor: "",
  contractDate: new Date(),
  contractAmount: "",
  startDate: new Date(),
  endDate: new Date(),
  technicalApproval: new Date(),
  administrativeApproval: "",
  newspaperName: "",
  newspaperDate: new Date(),
  tenderApproval: "",
  workOrderDate: new Date(),
  description: "",
});

const FrmContractEntry = () => {
  const { user } = useAuth();
  const token = user?.token;
  const ulbId = user?.ulbId;
  const navigate = useNavigate();

  const location = useLocation();
  const { mode, voucherData } = location.state || {};
  const contractId = voucherData?.contractno;
  
  const [zones, setZones] = useState([]);
  const [contractorOptions, setContractorOptions] = useState([]);
  const [tableData, setTableData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [initialValues, setInitialValues] = useState(getInitialValues());

  const currentYear = new Date().getFullYear();
  const years = [`${currentYear}-${currentYear + 1}`];
  const BASE_URL = import.meta.env.VITE_BASE_URL;

  const fetchZones = async () => {
    try {
      const res = await axios.post(`${BASE_URL}/api/Receipt/zones`, 
        { corp_id: ulbId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res?.data) setZones(res.data.data);
    } catch (err) {
      console.error("Error fetching zones:", err);
    }
  };

  const fetchContractors = async () => {
    try {
      const res = await axios.post(`${BASE_URL}/api/Receipt/party`, 
        { ulbid: ulbId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res?.data?.data) {
        const formatted = res.data.data.map((p) => ({
          label: p.PARTYNAME,
          value: p.NUM_PARTYMST_PARTYID.toString(),
        }));
        setContractorOptions(formatted);
      }
    } catch (err) {
      console.error("Error fetching contractors:", err);
    }
  };

  useEffect(() => {
    if (ulbId) {
      fetchZones();
      fetchContractors();
    }
  }, [ulbId]);

  useEffect(() => {
    if (mode !== 2) {
      const initialTableData = years.map((year, index) => ({
        id: Date.now() + index,
        year: year,
        amount: "",
        description: "",
        transactionNo: "",
      }));
      setTableData(initialTableData);
      setInitialValues(getInitialValues());
    }
  }, [mode]);

  const fetchContractDetails = async () => {
    try {
      if (!contractId) return;

      setLoading(true);

      const res = await axios.get(
        `${BASE_URL}/api/FrmContract/contract/${contractId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const contract = res?.data?.data?.data?.contract;
      const details = res?.data?.data?.data?.details || [];

      if (contract) {
        setInitialValues({
          prabhag: contract.NUM_CONTRACTMST_ZONEID?.toString() || "",
          contractor: contract.CONTRACTORID?.toString() || "",
          contractDate: contract.CONTRACTDATE ? new Date(contract.CONTRACTDATE) : new Date(),
          contractAmount: contract.CONTRACT_AMOUNT || "",
          startDate: contract.STARTDATE ? new Date(contract.STARTDATE) : new Date(),
          endDate: contract.ENDDATE ? new Date(contract.ENDDATE) : new Date(),
          technicalApproval: contract.DATE_CONTRACTMST_TECHAPLDATE
            ? new Date(contract.DATE_CONTRACTMST_TECHAPLDATE)
            : new Date(),
          administrativeApproval: contract.VAR_CONTRACTMST_ADMINAPL || "",
          newspaperName: contract.VAR_CONTRACTMST_NEWSPAPER || "",
          newspaperDate: contract.VAR_CONTRACTMST_NEWSPAPER_DATE
            ? new Date(contract.VAR_CONTRACTMST_NEWSPAPER_DATE)
            : new Date(),
          tenderApproval: contract.VAR_CONTRACTMST_NEWSPAPERAPP || "",
          workOrderDate: contract.VAR_CONTRACTMST_WORKORDER
            ? new Date(contract.VAR_CONTRACTMST_WORKORDER)
            : new Date(),
          description: contract.DESCPN || "",
        });
      }

      const formattedDetails = details.map((item, index) => ({
        id: Date.now() + index,
        year: item.ACCYEAR,
        amount: item.AMOUNT,
        description: item.DESCB,
        transactionNo: item.TRNSNO,
      }));

      setTableData(formattedDetails);

    } catch (err) {
      console.error("Error fetching contract details:", err);
    } finally {
      setLoading(false);
    }
  };

  const calculateTotal = () => {
    return tableData.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
  };

  const handleAmountChange = (id, value) => {
    const numericValue = value.replace(/[^0-9.]/g, '');
    // Prevent multiple decimal points
    const parts = numericValue.split('.');
    const formattedValue = parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : numericValue;
    
    setTableData(tableData.map(item => 
      item.id === id ? { ...item, amount: formattedValue } : item
    ));
  };

  const handleDescriptionChange = (id, value) => {
    setTableData(tableData.map(item => 
      item.id === id ? { ...item, description: value } : item
    ));
  };

  const handleTransactionNoChange = (id, value) => {
    setTableData(tableData.map(item => 
      item.id === id ? { ...item, transactionNo: value } : item
    ));
  };

  const handleAddRecord = () => {
    const baseYear = `${currentYear}-${currentYear + 1}`;
    const newRecord = {
      id: Date.now(),
      year: baseYear,
      amount: "",
      description: "",
      transactionNo: "",
    };
    setTableData([...tableData, newRecord]);
  };

  const handleDeleteRecord = (id) => {
    Swal.fire({
      title: 'निश्चिती?',
      text: "ही माहिती हटवायची आहे का?",
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'होय, हटवा',
      cancelButtonText: 'रद्द करा'
    }).then((result) => {
      if (result.isConfirmed) {
        setTableData(tableData.filter(item => item.id !== id));
        Swal.fire({
          title: 'हटवले!',
          text: 'माहिती यशस्वीरित्या हटवली.',
          confirmButtonColor: '#1e3a8a',
          timer: 1500
        });
      }
    });
  };

  const validateContractAmount = (contractAmount, totalAmount) => {
    const contractAmt = parseFloat(contractAmount);
    const totalAmt = parseFloat(totalAmount);
    
    if (isNaN(contractAmt) || isNaN(totalAmt)) {
      return false;
    }
    
    return Math.abs(contractAmt - totalAmt) <= 0.01;
  };

  const validateTableData = () => {
    if (tableData.length === 0) {
      Swal.fire({
        text: 'कृपया वर्षानुसार तपशील भरा',
        confirmButtonColor: '#1e3a8a',
      });
      return false;
    }

    for (let i = 0; i < tableData.length; i++) {
      if (!tableData[i].description || tableData[i].description.trim() === "") {
        Swal.fire({
          text: `कृपया ${tableData[i].year} साठी तपशील भरा`,
          confirmButtonColor: '#1e3a8a',
        });
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (values, { setSubmitting: setFormSubmitting }) => {
    try {
      const validationResult = contractValidationSchema.safeParse(values);
      if (!validationResult.success) {
        const firstError = validationResult.error.issues[0];
        await Swal.fire({
          text: firstError.message,
          confirmButtonColor: '#1e3a8a',
        });
        setFormSubmitting(false);
        return;
      }

      if (!validateTableData()) {
        setFormSubmitting(false);
        return;
      }

      // Validate amount matching
      const totalAmount = calculateTotal();
      if (!validateContractAmount(values.contractAmount, totalAmount)) {
        await Swal.fire({
          title: 'रक्कम जुळत नाही',
          html: `कॉन्ट्रॅक्ट रक्कम: ${parseFloat(values.contractAmount).toLocaleString('en-IN')}<br/>एकूण रक्कम: ${totalAmount.toLocaleString('en-IN')}<br/><br/>कृपया रक्कम योग्य करा.`,
          confirmButtonColor: '#1e3a8a',
        });
        setFormSubmitting(false);
        return;
      }

      // Show confirmation dialog
      const result = await Swal.fire({
        title: 'निश्चिती?',
        text: mode === 2 ? "कंत्राट माहिती अद्यतनित करायची आहे का?" : "कंत्राट माहिती जतन करायची आहे का?",
        // icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#1e3a8a',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'होय, जतन करा',
        cancelButtonText: 'रद्द करा'
      });

      if (!result.isConfirmed) {
        setFormSubmitting(false);
        return;
      }

      setSubmitting(true);

      // Format dates for Oracle (DD-MON-YYYY)
      const formatDateForOracle = (date) => {
        if (!date) return "";
        const d = new Date(date);
        const day = String(d.getDate()).padStart(2, '0');
        const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 
                        'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
        const month = months[d.getMonth()];
        const year = d.getFullYear();
        return `${day}-${month}-${year}`;
      };

      // Prepare contract details
      const contractDetails = tableData.map(row => ({
        accyr: row.year,
        amount: row.amount || "0",
        description: row.description || ""
      }));

      // Prepare request data
      const requestData = {
        userId: user?.userId || user?.id,
        zoneId: parseInt(values.prabhag),
        ulbId: parseInt(ulbId),
        contractorId: parseInt(values.contractor),
        contractDate: formatDateForOracle(values.contractDate),
        amount: values.contractAmount,
        startDate: formatDateForOracle(values.startDate),
        endDate: formatDateForOracle(values.endDate),
        description: values.description,
        administrativeApproval: values.administrativeApproval || "",
        technicalApprovalDate: values.technicalApproval ? formatDateForOracle(values.technicalApproval) : "",
        newspaper: values.newspaperName || "",
        newspaperDate: values.newspaperDate ? formatDateForOracle(values.newspaperDate) : "",
        newspaperApproval: values.tenderApproval || "",
        workOrder: values.workOrderDate ? formatDateForOracle(values.workOrderDate) : "",
        contractDetails: contractDetails,
        mode: mode === 2 ? 2 : 1,
        contractId: mode === 2 ? parseInt(contractId) : 0,
        drgl: "",
        dracc: "",
        crgl: "",
        cracc: ""
      };

      const response = await axios.post(
        `${BASE_URL}/api/FrmContract/contract-master`,
        requestData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        }
      );

      if (response.data?.success === true) {
        await Swal.fire({
          // icon: 'success',
          title: 'यशस्वी!',
          text: response.data?.message || (mode === 2 ? "कंत्राट माहिती यशस्वीरित्या अद्यतनित झाली" : "कंत्राट माहिती यशस्वीरित्या जतन झाली"),
          confirmButtonColor: '#1e3a8a',
          timer: 2000
        });
        
        navigate("/Transactions/FrmContractList");
      } else {
        throw new Error(response.data?.message || "Failed to save contract");
      }

    } catch (error) {
      console.error("Error submitting contract:", error);
      
      let errorMessage = "कंत्राट माहिती जतन करताना त्रुटी आली";
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message && !error.message.includes("Contract created successfully")) {
        errorMessage = error.message;
      }
      
      await Swal.fire({
        text: errorMessage,
        confirmButtonColor: '#1e3a8a',
      });
    } finally {
      setSubmitting(false);
      setFormSubmitting(false);
    }
  };

  const handleContractAmountChange = (e, setFieldValue) => {
    const value = e.target.value;
    const numericValue = value.replace(/[^0-9.]/g, '');
    const parts = numericValue.split('.');
    const formattedValue = parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : numericValue;
    setFieldValue("contractAmount", formattedValue);
  };

  useEffect(() => {
    if (mode === 2 && contractId) {
      fetchContractDetails();
    }
  }, [mode, contractId]);

  if (loading && mode === 2) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900 mx-auto"></div>
            <p className="mt-4 text-gray-600">माहिती लोड होत आहे...</p>
        </div>
      </div>
    );
  }

  return (
    <Formik
      initialValues={initialValues}
      enableReinitialize={true}
      onSubmit={handleSubmit}
    >
      {({
        values,
        handleChange,
        setFieldValue,
        isSubmitting,
      }) => {
        return (
          <Form>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Card className="border shadow-sm">
                <CardHeader className="border-b ">
                  <CardTitle className="text-lg font-semibold ">
                    कंत्राट मास्टर
                  </CardTitle>
                </CardHeader>

                <CardContent className="p-4 sm:p-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      {/* <Label className='w-36 shrink-0' text="प्रभाग :" /> */}
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
                          {zones.map((zone) => (
                            <SelectItem key={zone.ZONEID} value={zone.ZONEID.toString()}>
                              {zone.ZONEENAME}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      {/* <Label className='w-36 shrink-0' text="कॉन्ट्रॅक्टर :" /> */}
                      <div className="sm:w-36 shrink-0 flex justify-start sm:justify-between items-center">
                        <Label text="कॉन्ट्रॅक्टर" />
                        <span>:</span>
                      </div>
                      <SearchableSelect
                        options={contractorOptions}
                        value={values.contractor}
                        onChange={(option) => setFieldValue("contractor", option?.value || "")}
                        placeholder="कॉन्ट्रॅक्टर शोधा"
                        className="w-full h-9"
                      />
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      {/* <Label className='w-36 shrink-0' text="कॉन्ट्रॅक्ट दिनांक :" /> */}
                      <div className="sm:w-36 shrink-0 flex justify-start sm:justify-between items-center">
                        <Label text="कॉन्ट्रॅक्ट दिनांक" />
                        <span>:</span>
                      </div>
                      <DatePicker
                        value={values.contractDate}
                        onChange={(d) => setFieldValue("contractDate", d)}
                        className="w-full h-9"
                      />
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      {/* <Label className='w-36 shrink-0' text="कॉन्ट्रॅक्ट रक्कम :" /> */}
                      <div className="sm:w-36 shrink-0 flex justify-start sm:justify-between items-center">
                        <Label text="कॉन्ट्रॅक्ट रक्कम" />
                        <span>:</span>
                      </div>
                      <Input
                        name="contractAmount"
                        value={values.contractAmount}
                        onChange={(e) => handleContractAmountChange(e, setFieldValue)}
                        type="text"
                        inputMode="decimal"
                        placeholder="रक्कम"
                        className="w-full h-9"
                      />
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      {/* <Label className='w-36 shrink-0' text="प्रारंभ दिनांक :" /> */}
                      <div className="sm:w-36 shrink-0 flex justify-start sm:justify-between items-center">
                        <Label text="प्रारंभ दिनांक" />
                        <span>:</span>
                      </div>
                      <DatePicker
                        value={values.startDate}
                        onChange={(d) => setFieldValue("startDate", d)}
                        className="w-full h-9"
                      />
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      {/* <Label className='w-36 shrink-0' text="शेवटची दिनांक :" /> */}
                      <div className="sm:w-36 shrink-0 flex justify-start sm:justify-between items-center">
                        <Label text="शेवटची दिनांक" />
                        <span>:</span>
                      </div>
                      <DatePicker
                        value={values.endDate}
                        onChange={(d) => setFieldValue("endDate", d)}
                        className="w-full h-9"
                      />
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      {/* <Label className='w-36 shrink-0' text="तांत्रित मान्यता :" /> */}
                      <div className="sm:w-36 shrink-0 flex justify-start sm:justify-between items-center">
                        <Label text="तांत्रित मान्यता" />
                        <span>:</span>
                      </div>
                      <DatePicker
                        value={values.technicalApproval}
                        onChange={(d) => setFieldValue("technicalApproval", d)}
                        className="w-full h-9"
                      />
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      {/* <Label className='w-36 shrink-0' text="प्रशासकीय मान्यता :" /> */}
                      <div className="sm:w-36 shrink-0 flex justify-start sm:justify-between items-center">
                        <Label text="प्रशासकीय मान्यता" />
                        <span>:</span>
                      </div>
                      <Input
                        name="administrativeApproval"
                        value={values.administrativeApproval}
                        onChange={handleChange}
                        placeholder="प्रशासकीय मान्यता"
                        className="w-full h-9"
                      />
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      {/* <Label className='w-36 shrink-0' text="निविदा प्रसिध्दी वृत्तपत्राचे नाव :" /> */}
                      <div className="sm:w-36 shrink-0 flex justify-start sm:justify-between items-center">
                        <Label text="निविदा प्रसिध्दी वृत्तपत्राचे नाव" />
                        <span>:</span>
                      </div>
                      <Input
                        name="newspaperName"
                        value={values.newspaperName}
                        onChange={handleChange}
                        placeholder="निविदा प्रसिध्दी वृत्तपत्राचे नाव"
                        className="w-full h-9"
                      />
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      {/* <Label className='w-36 shrink-0' text="वृत्तपत्राचे दिनांक :" /> */}
                      <div className="sm:w-36 shrink-0 flex justify-start sm:justify-between items-center">
                        <Label text="वृत्तपत्राचे दिनांक" />
                        <span>:</span>
                      </div>
                      <DatePicker
                        value={values.newspaperDate}
                        onChange={(d) => setFieldValue("newspaperDate", d)}
                        className="w-full h-9"
                      />
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      {/* <Label className='w-36 shrink-0' text="निविदा मंजुरी :" /> */}
                      <div className="sm:w-36 shrink-0 flex justify-start sm:justify-between items-center">
                        <Label text="निविदा मंजुरी" />
                        <span>:</span>
                      </div>
                      <Input
                        name="tenderApproval"
                        value={values.tenderApproval}
                        onChange={handleChange}
                        placeholder="निविदा मंजुरी"
                        className="w-full h-9"
                      />
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      {/* <Label className='w-36 shrink-0' text="कार्यादेश दिनांक :" /> */}
                      <div className="sm:w-36 shrink-0 flex justify-start sm:justify-between items-center">
                        <Label text="कार्यादेश दिनांक" />
                        <span>:</span>
                      </div>
                      <DatePicker
                        value={values.workOrderDate}
                        onChange={(d) => setFieldValue("workOrderDate", d)}
                        className="w-full h-9"
                      />
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      {/* <Label className='w-36 shrink-0' text="तपशील :" /> */}
                      <div className="sm:w-36 shrink-0 flex justify-start sm:justify-between items-center">
                        <Label text="तपशील" />
                        <span>:</span>
                      </div>
                      <Input
                        name="description"
                        value={values.description}
                        onChange={handleChange}
                        placeholder="तपशील"
                        className="w-full h-9"
                      />
                    </div>
                  </div>

                  <hr className="border-gray-200" />

                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-md font-semibold">वर्षानुसार तपशील</h3>
                      <Button
                        type="button"
                        onClick={handleAddRecord}
                        className="bg-blue-900 hover:bg-blue-800 text-white"
                      >
                        रेकॉर्ड जोडा
                      </Button>
                    </div>

                    <div className="border rounded-lg overflow-hidden">
                      <div className="overflow-x-auto">
                        <Table className="w-full max-md:min-w-380 [&_thead_tr:hover]:bg-[#083c76]">
                          <TableHeader>
                            <TableRow className="bg-blue-900">
                              <TableHead className="text-white text-center font-semibold p-3 whitespace-nowrap">
                                वर्ष
                              </TableHead>
                              <TableHead className="text-white text-center font-semibold p-3 whitespace-nowrap">
                                रक्कम
                              </TableHead>
                              <TableHead className="text-white text-center font-semibold p-3 whitespace-nowrap">
                                तपशील
                              </TableHead>
                              <TableHead className="text-white text-center font-semibold p-3 whitespace-nowrap">
                                व्यवहार क्र.
                              </TableHead>
                              <TableHead className="text-white text-center font-semibold p-3 whitespace-nowrap">
                                क्रिया
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {tableData.map((row) => (
                              <TableRow key={row.id} className="hover:bg-gray-50">
                                <TableCell className="p-2 text-center">
                                  <Input
                                    value={row.year}
                                    className="w-full h-9 text-center bg-gray-100"
                                    readOnly
                                    disabled
                                  />
                                </TableCell>
                                <TableCell className="p-2">
                                  <Input
                                    type="text"
                                    inputMode="decimal"
                                    value={row.amount}
                                    onChange={(e) => handleAmountChange(row.id, e.target.value)}
                                    placeholder="रक्कम"
                                    className="w-full h-9"
                                  />
                                </TableCell>
                                <TableCell className="p-2">
                                  <Input
                                    value={row.description}
                                    onChange={(e) => handleDescriptionChange(row.id, e.target.value)}
                                    placeholder="तपशील"
                                    className="w-full h-9"
                                  />
                                </TableCell>
                                <TableCell className="p-2">
                                  <Input
                                    value={row.transactionNo}
                                    onChange={(e) => handleTransactionNoChange(row.id, e.target.value)}
                                    placeholder="व्यवहार क्र."
                                    className="w-full h-9 bg-gray-50"
                                    disabled
                                  />
                                </TableCell>
                                <TableCell className="p-2 text-center">
                                  <Button
                                    type="button"
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => handleDeleteRecord(row.id)}
                                    className="bg-red-600 hover:bg-red-700 text-white"
                                  >
                                    रद्द करा
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                            {tableData.length === 0 && (
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
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      {/* <Label className='w-36 shrink-0' text="एकूण :" /> */}
                      <div className="sm:w-36 shrink-0 flex justify-start sm:justify-between items-center">
                        <Label text="एकूण" />
                        <span>:</span>
                      </div>
                      <Input
                        className="w-full h-9 bg-gray-100"
                        value={`${calculateTotal().toLocaleString("en-IN")}`}
                        readOnly
                        disabled
                      />
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4 border-t">
                    <Button 
                      type="submit" 
                      className="bg-blue-900 hover:bg-blue-800 text-white px-8"
                      disabled={submitting || isSubmitting}
                    >
                      {submitting ? (
                        <>
                          <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full inline-block mr-2"></div>
                          प्रक्रिया करत आहे...
                        </>
                      ) : (
                        "स्वीकार"
                      )}
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      className="px-8 border-gray-300 hover:bg-gray-50"
                      onClick={() => navigate("/Transactions/FrmContractList")}
                    >
                      परत
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

export default FrmContractEntry;