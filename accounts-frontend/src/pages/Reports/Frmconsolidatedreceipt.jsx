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
import { FrmconsolidatedreceiptValidationSchema } from "../validations/global.validation";

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
  const [exportType, setExportType] = useState("1");
  
  const [departmentOptions, setDepartmentOptions] = useState([]);
  const [zoneOptions, setZoneOptions] = useState([]);
  const [collectionCenterOptions, setCollectionCenterOptions] = useState([]);
  const [paymentModeOptions, setPaymentModeOptions] = useState([]);
  
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

      const res = await axios.post(
        `${BASE_URL}/api/Receipt/departments`,
        {
          ulbid: Number(ulbId),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (res?.data?.ok) {
        const formatted = res.data.data.map((dept) => ({
          value: String(dept.DEPTID),
          label: dept.DEPTNAME,
        }));

        setDepartmentOptions([
          { value: "-1", label: "-- ALL --" },
          ...formatted,
        ]);
      }
    } catch (err) {
      console.error("Error fetching departments:", err);

      setDepartmentOptions([
        { value: "-1", label: "-- ALL --" },
      ]);
    } finally {
      setLoadingDepartment(false);
    }
  };

  const fetchZones = async (values) => {
    try {
      setLoadingZone(true);

      const res = await axios.post(
        `${BASE_URL}/api/RptChequeDishonour/zones-by-department`,
        {
          deptId: values.department,
          ulbId: Number(ulbId),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (
        res?.data?.ok &&
        res?.data?.data?.success &&
        res?.data?.data?.list?.length > 0
      ) {
        const formatted = res.data.data.list.map((zone) => ({
          value: String(zone.ID),
          label: zone.NAME,
        }));

        setZoneOptions([
          { value: "-1", label: "-- ALL --" },
          ...formatted,
        ]);
      } else {
        setZoneOptions([
          { value: "-1", label: "-- ALL --" },
        ]);
      }
    } catch (err) {
      console.error("Error fetching zones:", err);

      setZoneOptions([
        { value: "-1", label: "-- ALL --" },
      ]);
    } finally {
      setLoadingZone(false);
    }
  };
  
  const fetchCollectionCenter = async (values) => {
    try {
      setLoadingCollectionCenter(true);

      const res = await axios.post(
        `${BASE_URL}/api/RptChequeDishonour/collection-centers`,
        {
          zoneId:
            values.prabhag !== "-1"
              ? values.prabhag
              : null,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (
        res?.data?.ok &&
        res?.data?.data?.success &&
        res?.data?.data?.list?.length > 0
      ) {
        const formatted = res.data.data.list.map((center) => ({
          value: String(center.ID),
          label: center.NAME,
        }));

        setCollectionCenterOptions([
          { value: "-1", label: "-- ALL --" },
          ...formatted,
        ]);
      }
    } catch (err) {
      console.error("Error fetching collection centers:", err);

      setCollectionCenterOptions([
        { value: "-1", label: "-- ALL --" },
      ]);
    } finally {
      setLoadingCollectionCenter(false);
    }
  };

  const fetchPaymentMode = async () => {
    try {
      setLoadingPaymentMode(true);

      const res = await axios.get(
        `${BASE_URL}/api/FrmConsolidatedReceipt/payment-types`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (res?.data?.data?.success) {
        const formatted = res.data.data.data.map((mode) => ({
          value: String(mode.RECMODEID),
          label: mode.RECMODNAME,
        }));

        setPaymentModeOptions([
          { value: "-1", label: "-- ALL --" },
          ...formatted,
        ]);
      }
    } catch (err) {
      console.error("Error fetching payment modes:", err);

      setPaymentModeOptions([
        { value: "-1", label: "-- ALL --" },
      ]);
    } finally {
      setLoadingPaymentMode(false);
    }
  };

  const formatDateForAPI = (date) => {
    if (!date) return null;

    const d = new Date(date);

    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();

    return `${day}-${month}-${year}`;
  };

  const handleExportExcel = async (values) => {
    setLoading(true);

    let loaderSwal;

    try {
      loaderSwal = Swal.fire({
        title: "Exporting Excel...",
        text: "Please wait...",
        allowOutsideClick: false,
        showConfirmButton: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      const payload = {
        fromDate: formatDateForAPI(values.fromDate),
        toDate: formatDateForAPI(values.toDate),

        deptId:
          values.department !== "-1"
            ? Number(values.department)
            : null,

        zoneId:
          values.prabhag !== "-1"
            ? Number(values.prabhag)
            : null,

        collectionCenterId:
          values.collCenter !== "-1"
            ? Number(values.collCenter)
            : null,

        paymentTypeId:
          values.payMode !== "-1"
            ? Number(values.payMode)
            : null,

        reportType: exportType,

        ulbId: Number(ulbId),
      };

      console.log("Excel Payload:", payload);

      const res = await axios.post(
        `${BASE_URL}/api/FrmConsolidatedReceipt/receipt-data`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      loaderSwal.close();

      if (!res?.data?.success) {
        throw new Error("No data found");
      }

      const apiData = res.data.data || [];

      if (apiData.length === 0) {
        Swal.fire({
          text: "No records found",
          confirmButtonColor: "#1e3a8a",
        });
        return;
      }

      const excelData = apiData.map((item, index) => {
        const rowData = {
          "Sr No": index + 1,

          Department: item.DEPARTMENT || "",

          "Account Description":
            item.ACCDESCRIPTION || "",

          "Account Head":
            item.ACCOUNTHEAD || "",

          "No Of Transaction":
            item.NOOFTRANSACTION || 0,

          "Cash Amount":
            item.CASHAMT || 0,

          "Cheque Amount":
            item.CHEQUEAMT || 0,

          "Bank Amount":
            item.BANKAMT || 0,

          "Online Amount":
            item.ONLINEAMT || 0,

          Total: item.TOTAL || 0,
        };

        if (exportType === "1") {
          rowData["Receipt Date"] = item.RECDATE
            ? new Date(item.RECDATE).toLocaleDateString("en-GB")
            : "";
        }

        return rowData;
      });

      const worksheet =
        XLSX.utils.json_to_sheet(excelData);

      const columnWidths =
        exportType === "1"
        ? [
            { wch: 8 },
            { wch: 15 }, 
            { wch: 25 },
            { wch: 40 },
            { wch: 20 },
            { wch: 18 },
            { wch: 15 },
            { wch: 18 },
            { wch: 15 },
            { wch: 18 },
            { wch: 15 },
          ]
      : [
          { wch: 8 },
          { wch: 25 },
          { wch: 40 },
          { wch: 20 },
          { wch: 18 },
          { wch: 15 },
          { wch: 18 },
          { wch: 15 },
          { wch: 18 },
          { wch: 15 },
        ];

      worksheet["!cols"] = columnWidths;

      const workbook = XLSX.utils.book_new();

      XLSX.utils.book_append_sheet(
        workbook,
        worksheet,
        "Consolidated Receipt"
      );

      const fileName = `Consolidated_Receipt_${formatDateForAPI(
        values.fromDate
      )}_to_${formatDateForAPI(values.toDate)}.xlsx`;

      XLSX.writeFile(workbook, fileName);

      Swal.fire({
        text: "Excel exported successfully!",
        confirmButtonColor: "#1e3a8a",
        timer: 2000,
      });

    } catch (error) {
      console.log("Excel Export Error:", error);

      Swal.fire({
        text:
          error?.response?.data?.message ||
          error?.message ||
          "Failed to export excel",
        confirmButtonColor: "#1e3a8a",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async (values) => {
    setLoading(true);

    let loaderSwal;

    try {
      loaderSwal = Swal.fire({
        title: "Generating...",
        text: "Please wait...",
        allowOutsideClick: false,
        showConfirmButton: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      const selectedDepartment =
        departmentOptions.find(
          (d) => d.value === values.department
        );

    const selectedZone =
      zoneOptions.find(
        (z) => z.value === values.prabhag
      );

      const payload = {
        fromDate: formatDateForAPI(values.fromDate),
        toDate: formatDateForAPI(values.toDate),

        deptId:
          values.department !== "-1"
            ? Number(values.department)
            : null,

        zoneId:
          values.prabhag !== "-1"
            ? Number(values.prabhag)
            : null,

        collectionCenterId:
          values.collCenter !== "-1"
            ? Number(values.collCenter)
            : null,

        paymentTypeId:
          values.payMode !== "-1"
            ? Number(values.payMode)
            : null,

        reportType: exportType,

        ulbId: Number(ulbId),

        departmentName:
          selectedDepartment?.label || "ALL",

        wardName:
          selectedZone?.label || "ALL",
      };

      console.log("Payload:", payload);

      const res = await axios.post(
        `${BASE_URL}/api/FrmConsolidatedReceipt/receipt`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      loaderSwal.close();

      if (res?.data?.success) {
        window.open(res.data.pdfUrl, "_blank");

        Swal.fire({
          text: "Report generated successfully!",
          confirmButtonColor: "#1e3a8a",
          timer: 2000,
        });
      } else {
        throw new Error("Report generation failed");
      }
    } catch (error) {
      console.error("Error generating report:", error);

      Swal.fire({
        text:
          error?.response?.data?.message ||
          error?.message ||
          "Failed to generate report",
        confirmButtonColor: "#1e3a8a",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = async (
    values,
    { setSubmitting }
  ) => {
    const validationResult = FrmconsolidatedreceiptValidationSchema.safeParse(values);
    if (!validationResult.success) {
        const firstError = validationResult.error.issues[0];
        console.log("Validation error:", firstError);
        await Swal.fire({
            text: firstError.message,
            confirmButtonColor: '#1e3a8a'
        });
        setSubmitting(false);
        setLoading(false);
        return;
    }

    if (exportFormat === "pdf") {
      await generateReport(values);
    } else {
      await handleExportExcel(values);
    }

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
        
          useEffect(() => {
            if (values.department && values.department !== "-1") {
              fetchZones(values);
            } else {
              setZoneOptions([
                { value: "-1", label: "-- ALL --" },
              ]);
            }
          }, [values.department]);

          useEffect(() => {
            if (values.prabhag && values.prabhag !== "-1") {
              fetchCollectionCenter(values);
            } else {
              setCollectionCenterOptions([
                { value: "-1", label: "-- ALL --" },
              ]);
            }
          }, [values.prabhag]);

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
                        disabled={loadingZone || !values.department}
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
                        disabled={loadingCollectionCenter || !values.collCenter}
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
                            value="1"
                            checked={exportType === "1"}
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
                            value="2"
                            checked={exportType === "2"}
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