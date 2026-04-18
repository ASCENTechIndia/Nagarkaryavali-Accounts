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
import { Formik, Form } from "formik";
import * as XLSX from "xlsx";

const container = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { staggerChildren: 0.08 } },
};

const Frmconsolidatedreceipt = () => {
  const { user } = useAuth();
  const token = user?.token;
  const ulbId = user?.ulbId;
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [exportFormat, setExportFormat] = useState("pdf");
  const [exportType, setExportType] = useState("summary");
  
  // Dropdown states
  const [departmentOptions, setDepartmentOptions] = useState([]);
  const [zoneOptions, setZoneOptions] = useState([]);
  const [collectionCenterOptions, setCollectionCenterOptions] = useState([]);
  const [paymentModeOptions, setPaymentModeOptions] = useState([]);
  
  // Loading states for dropdowns
  const [loadingDepartment, setLoadingDepartment] = useState(false);
  const [loadingZone, setLoadingZone] = useState(false);
  const [loadingCollectionCenter, setLoadingCollectionCenter] = useState(false);
  const [loadingPaymentMode, setLoadingPaymentMode] = useState(false);

  const BASE_URL = import.meta.env.VITE_BASE_URL;

  const initialFormValues = {
    department: "-1",
    prabhag: "-1",
    collCenter: "-1",
    payMode: "-1",
    fromDate: new Date(),
    toDate: new Date(),
  };

  const fetchDepartment = async () => {
    try {
      setLoadingDepartment(true);
      const response = await axios.get(`${BASE_URL}/api/Receipt/departments`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { ulbid: Number(ulbId) }
      });
      
      if (response?.data?.data) {
        const formatted = [
          { value: "-1", label: "-- ALL --" },
          ...response.data.data.map((dept) => ({
            value: dept.DEPTID?.toString(),
            label: dept.DEPTNAME,
          }))
        ];
        setDepartmentOptions(formatted);
      }
    } catch (err) {
      console.error("Error fetching departments:", err);
      setDepartmentOptions([{ value: "-1", label: "-- ALL --" }]);
    } finally {
      setLoadingDepartment(false);
    }
  };

  const fetchZones = async () => {
    try {
      setLoadingZone(true);
      const response = await axios.post(
        `${BASE_URL}/api/Receipt/zones`,
        { corp_id: ulbId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response?.data?.data) {
        const formatted = [
          { value: "-1", label: "-- ALL --" },
          ...response.data.data.map((zone) => ({
            value: zone.ZONEID?.toString(),
            label: zone.ZONEENAME,
          }))
        ];
        setZoneOptions(formatted);
      }
    } catch (err) {
      console.error("Error fetching zones:", err);
      setZoneOptions([{ value: "-1", label: "-- ALL --" }]);
    } finally {
      setLoadingZone(false);
    }
  };

  const fetchCollectionCenter = async () => {
    try {
      setLoadingCollectionCenter(true);
      const response = await axios.get(`${BASE_URL}/api/utils/collCenterList`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response?.data?.data) {
        const formatted = [
          { value: "-1", label: "-- ALL --" },
          ...response.data.data.map((center) => ({
            value: center.zoneid?.toString(),
            label: center.zonename,
          }))
        ];
        setCollectionCenterOptions(formatted);
      } else if (response?.data?.ok && response?.data?.data) {
        const formatted = [
          { value: "-1", label: "-- ALL --" },
          ...response.data.data.map((center) => ({
            value: center.zoneid?.toString(),
            label: center.zonename,
          }))
        ];
        setCollectionCenterOptions(formatted);
      }
    } catch (err) {
      console.error("Error fetching collection centers:", err);
      setCollectionCenterOptions([{ value: "-1", label: "-- ALL --" }]);
    } finally {
      setLoadingCollectionCenter(false);
    }
  };

  const fetchPaymentMode = async () => {
    try {
      setLoadingPaymentMode(true);
      
      const response = await axios.get(`${BASE_URL}/api/Receipt/payment-modes`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response?.data?.data) {
        const formatted = [{ value: "-1", label: "-- ALL --" }, ...response.data.data];
        setPaymentModeOptions(formatted);
      } else {
        setPaymentModeOptions(paymentModes);
      }
    } catch (err) {
      console.error("Error fetching payment modes:", err);
      setPaymentModeOptions([{ value: "-1", label: "-- ALL --" }]);
    } finally {
      setLoadingPaymentMode(false);
    }
  };

  const validateForm = async (values) => {
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

  const formatDateForAPI = (date) => {
    if (!date) return null;
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${year}-${month}-${day}`;
  };

  const generateReport = async (values) => {
    setLoading(true);

    try {
      const payload = {
        fromDate: formatDateForAPI(values.fromDate),
        toDate: formatDateForAPI(values.toDate),
        departmentId: values.department !== "-1" ? values.department : null,
        zoneId: values.prabhag !== "-1" ? values.prabhag : null,
        collectionCenterId: values.collCenter !== "-1" ? values.collCenter : null,
        paymentMode: values.payMode !== "-1" ? values.payMode : null,
        reportType: exportType, // "summary" or "details"
        ulbId: Number(ulbId)
      };

      console.log("Report Payload:", payload);

      if (exportFormat === "excel") {
        // Download Excel from backend
        const response = await axios.post(
          `${BASE_URL}/api/Report/consolidated-receipt-excel`,
          payload,
          {
            headers: { 
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            responseType: 'blob' // Important for file download
          }
        );

        // Create download link
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `Consolidated_Receipt_Report_${exportType}_${Date.now()}.xlsx`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);

        await Swal.fire({
          text: "Excel report downloaded successfully!",
          confirmButtonColor: '#1e3a8a',
          timer: 2000
        });
      } 
      else if (exportFormat === "pdf") {
        // Open PDF in new tab from backend
        const response = await axios.post(
          `${BASE_URL}/api/Report/consolidated-receipt-pdf`,
          payload,
          {
            headers: { 
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            responseType: 'blob'
          }
        );

        // Create blob URL and open in new tab
        const blob = new Blob([response.data], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        window.open(url, '_blank');
        window.URL.revokeObjectURL(url);

        await Swal.fire({
          text: "PDF report opened in new tab!",
          confirmButtonColor: '#1e3a8a',
          timer: 2000
        });
      }
    } catch (error) {
      console.error("Error generating report:", error);
      await Swal.fire({
        text: error.response?.data?.message || "Failed to generate report. Please try again.",
        confirmButtonColor: '#1e3a8a'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = async (values, { setSubmitting }) => {
    const isValid = await validateForm(values);
    if (!isValid) {
      setSubmitting(false);
      return;
    }
    await generateReport(values);
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
        Swal.fire({
          text: "फॉर्म रीसेट झाला",
          confirmButtonColor: '#1e3a8a',
          timer: 1500
        });
      }
    });
  };

  useEffect(() => {
    if (ulbId && token) {
      fetchDepartment();
      fetchZones();
      fetchCollectionCenter();
      fetchPaymentMode();
    }
  }, [ulbId, token]);

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
                    Consolidated Receipt/संघटित पावती अहवाल
                  </CardTitle>
                </CardHeader>

                <CardContent className="p-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                      <div className="sm:w-36 shrink-0 flex justify-start sm:justify-between items-center">
                        <Label text="Department" />
                        <span>:</span>
                      </div>
                      <Select
                        value={values.department}
                        onValueChange={(v) => setFieldValue("department", v)}
                        disabled={loadingDepartment}
                      >
                        <SelectTrigger className="w-full h-9">
                          <SelectValue placeholder={loadingDepartment ? "Loading..." : "-- विकल्प निवडा --"} />
                        </SelectTrigger>
                        <SelectContent>
                          {departmentOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                      <div className="sm:w-36 shrink-0 flex justify-start sm:justify-between items-center">
                        <Label text="प्रभाग" />
                        <span>:</span>
                      </div>
                      <Select
                        value={values.prabhag}
                        onValueChange={(v) => setFieldValue("prabhag", v)}
                        disabled={loadingZone}
                      >
                        <SelectTrigger className="w-full h-9">
                          <SelectValue placeholder={loadingZone ? "Loading..." : "-- विकल्प निवडा --"} />
                        </SelectTrigger>
                        <SelectContent>
                          {zoneOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                      <div className="sm:w-36 shrink-0 flex justify-start sm:justify-between items-center">
                        <Label text="कलेक्शन सेंटर" />
                        <span>:</span>
                      </div>
                      <Select
                        value={values.collCenter}
                        onValueChange={(v) => setFieldValue("collCenter", v)}
                        disabled={loadingCollectionCenter}
                      >
                        <SelectTrigger className="w-full h-9">
                          <SelectValue placeholder={loadingCollectionCenter ? "Loading..." : "-- विकल्प निवडा --"} />
                        </SelectTrigger>
                        <SelectContent>
                          {collectionCenterOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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

                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                      <div className="sm:w-36 shrink-0 flex justify-start sm:justify-between items-center">
                        <Label text="देयक प्रकार" />
                        <span>:</span>
                      </div>
                      <Select
                        value={values.payMode}
                        onValueChange={(v) => setFieldValue("payMode", v)}
                        disabled={loadingPaymentMode}
                      >
                        <SelectTrigger className="w-full h-9">
                          <SelectValue placeholder={loadingPaymentMode ? "Loading..." : "-- विकल्प निवडा --"} />
                        </SelectTrigger>
                        <SelectContent>
                          {paymentModeOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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

                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <div className="flex items-center gap-2">
                      <div className="sm:w-36 shrink-0 flex justify-start sm:justify-between items-center">
                        <Label text="Type" />
                        <span>:</span>
                      </div>
                      <div className="flex items-center gap-4 ml-2">
                        <div className="flex items-center gap-2">
                          <Input
                            type="radio"
                            id="summary"
                            name="exportType"
                            value="summary"
                            checked={exportType === "summary"}
                            onChange={(e) => setExportType(e.target.value)}  
                            className="h-4 w-4"
                          />
                          <Label htmlFor="summary" className="font-medium text-gray-700 cursor-pointer">
                            Summary
                          </Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <Input
                            type="radio"
                            id="details"
                            name="exportType"
                            value="details"
                            checked={exportType === "details"}
                            onChange={(e) => setExportType(e.target.value)} 
                            className="h-4 w-4"
                          />
                          <Label htmlFor="details" className="font-medium text-gray-700 cursor-pointer">
                            Details
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
                </CardContent>
              </Card>
            </motion.div>
          </Form>
        );
      }}
    </Formik>
  );
};

export default Frmconsolidatedreceipt;