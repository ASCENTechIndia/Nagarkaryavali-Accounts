import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import ShadCNTable from "@/components/ui/table";
import { useAuth } from "@/context/AuthContext";
import axios from "axios";
import { Form, Formik } from "formik";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import * as XLSX from "xlsx";
import { RptChequeDishonourValidationSchema } from "../validations/global.validation";
import { Input } from "@/components/ui/input";

const container = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { staggerChildren: 0.08 } },
};

const RptChequeDishonour = () => {
  const { user } = useAuth();
  const token = user?.token;
  const ulbId = user?.ulbId;
  const navigate = useNavigate();

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [vibhagOptions, setVibhagOptions] = useState([]);
  const [collCenOptions, setCollCenOptions] = useState([]);
  const [prabhagOptions, setPrabhagOptions] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [exportFormat, setExportFormat] = useState("pdf");

  const BASE_URL = import.meta.env.VITE_BASE_URL;

  const initialFormValues = {
    vibhag: "-1",
    prabhag: "-1",
    colCen: "-1",
    fromDate: new Date(),
    toDate: new Date(),
  };

  const fetchVibhag = async () => {
    try {
      if (!ulbId) return;
      
      const res = await axios.post(
        `${BASE_URL}/api/Receipt/departments`,
        {ulbid: Number(ulbId)},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (res?.data?.ok) {
        const formatted = res.data.data.map((l) => ({
          label: l.DEPTNAME,
          value: String(l.DEPTID),
        }));

        const allFormated = [
            { value: "-1", label: "-- ALL --" },
            ...formatted
        ]

        setVibhagOptions(allFormated);
      }
    } catch (err) {
      console.error("Error fetching colCen:", err);
    }
  };

  const fetchPrabhag = async (values) => {
    try {
      if (!ulbId) return;
      
      const res = await axios.post(
        `${BASE_URL}/api/RptChequeDishonour/zones-by-department`,
        {   
            deptId: values.vibhag,
            ulbId: Number(ulbId)
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (res?.data?.ok && res?.data?.data?.success) {
        const formatted = res.data.data.list.map((l) => ({
          label: l.NAME,
          value: String(l.ID),
        }));

        const allFormarted = [
            { value: "-1", label: "-- ALL --" },
            ...formatted
        ]

        setPrabhagOptions(allFormarted);
      }
    } catch (err) {
      console.error("Error fetching colCen:", err);
    }
  };

  const fetchCollCenter = async (values) => {
    try {
      if (!ulbId) return;
      
      const res = await axios.post(
        `${BASE_URL}/api/RptChequeDishonour/collection-centers`,
        {   
            zoneId: values.prabhag
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (res?.data?.ok && res?.data?.data?.success) {
        const formatted = res.data.data.list.map((l) => ({
          label: l.NAME,
          value: String(l.ID),
        }));

        const allFormarted = [
            { value: "-1", label: "-- ALL --" },
            ...formatted
        ]

        setCollCenOptions(allFormarted);
      }
    } catch (err) {
      console.error("Error fetching colCen:", err);
    }
  };

  const formatDateForAPI = (date) => {
    if (!date) return null;
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, "0");
    const month = d.toLocaleString('en', { month: 'short' }).toUpperCase();
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  };

  useEffect(() => {
    if (ulbId) {
      fetchVibhag();
    }
  }, [ulbId]);

  const handleFormSubmit = async (values, { setSubmitting }) => {
    try {
        setLoading(true);
        setHasSearched(true);

        const validationResult = RptChequeDishonourValidationSchema.safeParse(values);
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

        const payload = {
            ulbId: Number(ulbId),
            deptId: values.vibhag || null,
            zoneId: values.prabhag || null,
            collCenterId: values.colCen || null,
            fromDate: formatDateForAPI(values.fromDate),
            toDate: formatDateForAPI(values.toDate),
        };

        if (exportFormat === "pdf") {
            await handlePDFExport(payload); 
            return;
        }

        const res = await axios.post(`${BASE_URL}/api/RptChequeDishonour/cheque-return-list`, 
            payload, 
        {
            headers: { Authorization: `Bearer ${token}` },
        });

        if (res?.data?.ok && res?.data?.data?.list?.length > 0) {
            const fetchedRows = res.data.data.list;
            setData(fetchedRows);
            if (exportFormat === "excel") {
                exportToExcel(fetchedRows);
            }
            } else {
            setData([]);
            Swal.fire({
                text: res.data.message || res.data.data.message || "कोणतीही माहिती उपलब्ध नाही",
                confirmButtonColor: '#1e3a8a'
            });
        }
    } catch (err) {
        console.error("Fetch Error:", err);
        Swal.fire({ 
            text: err.response?.data?.message || "सर्व्हर त्रुटी निर्माण झाली आहे", 
            confirmButtonColor: '#1e3a8a' 
        });
    } finally {
        setLoading(false);
        setSubmitting(false);
    }
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
        setData([]);
        setExportFormat("pdf");
        setLoading(false);
        setSubmitting(false);
        Swal.fire({
        text: "फॉर्म रीसेट झाला",
        confirmButtonColor: '#1e3a8a',
        timer: 1500
        });
    }
    });
  };
  
  const exportToExcel = (dataToExport) => {
    const data = dataToExport || data;
    if (!data || data.length === 0) return;
    const dynamicKeys = Object.keys(data[0]);

    const excelData = data.map((row, index) => {
        const newRow = {};
        

        dynamicKeys.forEach((key) => {
        let value = row[key];
        if (typeof value === "string" && (key.includes("DT") || key.includes("DATE"))) {
            const dateObj = new Date(value);
            if (!isNaN(dateObj.getTime())) {
            value = dateObj.toLocaleDateString("en-GB");
            }
        }

        newRow[key] = value ?? "";
        });

        return newRow;
    });

    const ws = XLSX.utils.json_to_sheet(excelData);

    ws["!cols"] = [
        ...dynamicKeys.map(() => ({ wch: 20 }))
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Report");
    
    const fileName = `Report_${formatDateForAPI(new Date())}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };
  
  const handlePDFExport = async (payload) => {
    let loaderSwal;
    try {
    loaderSwal = Swal.fire({
        title: "Generating...",
        text: "Please wait for cheque dishonour report generation",
        allowOutsideClick: false,
        showConfirmButton: false,
        didOpen: () => {
            Swal.showLoading();
        },
    });

    setLoading(true);

    console.log("PDF Payload: ", payload);

    const res = await axios.post(
        `${BASE_URL}/api/RptChequeDishonour/pdf`,
        payload,
        {
        headers: { Authorization: `Bearer ${token}` },
        }
    );

    loaderSwal.close();

    if (res?.data?.success) {
        window.open(res.data.pdfUrl, "_blank");
    } else {
        throw new Error("PDF generation failed");
    }
    } catch (error) {
    console.error("PDF Export Error:", error);
    Swal.fire({
        text: error.response?.data?.message || "PDF तयार करताना त्रुटी",
        confirmButtonColor: "#1e3a8a",
    });
    } finally {
    setLoading(false);
    }
  };

  return (
    <Formik
      initialValues={initialFormValues}
      enableReinitialize={false}
      onSubmit={handleFormSubmit}
    >
      {({ values, setFieldValue, isSubmitting, handleSubmit, resetForm }) => {

        useEffect(() => {
            fetchPrabhag(values);
            fetchCollCenter(values);
        }, [values]);

        return (
          <Form onSubmit={handleSubmit}>
            <motion.div variants={container} initial="hidden" animate="show">
              <Card className="shadow-sm border">
                <CardHeader className="border-b flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                  <CardTitle className="text-lg font-semibold">
                    Cheque Dishonour Register Report
                  </CardTitle>
                </CardHeader>

                <CardContent className="p-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                      <div className="sm:w-36 shrink-0 flex justify-start sm:justify-between items-center">
                        <Label text="विभाग" />
                        <span>:</span>
                      </div>
                      <Select
                        value={values.vibhag}
                        onValueChange={(v) => setFieldValue("vibhag", v)}
                      >
                        <SelectTrigger className="!w-full h-9 overflow-hidden">
                          <SelectValue placeholder="-- विकल्प निवडा --" />
                        </SelectTrigger>
                        <SelectContent>
                          {vibhagOptions.map((option) => (
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
                        // disabled={!values.vibhag || values.vibhag == "-1"}
                      >
                        <SelectTrigger className="w-full h-9">
                          <SelectValue placeholder="-- विकल्प निवडा --" />
                        </SelectTrigger>
                        <SelectContent>
                          {prabhagOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                        <div className="sm:w-36 shrink-0 flex justify-start sm:justify-between items-center">
                            <Label text="Collection" />
                            <span>:</span>
                        </div>
                        <Select
                            value={values.colCen}
                            onValueChange={(v) => setFieldValue("colCen", v)}
                            // disabled={!values.prabhag || values.prabhag == "-1"}
                        >
                            <SelectTrigger className="w-full h-9">
                            <SelectValue placeholder="-- विकल्प निवडा --" />
                            </SelectTrigger>
                            <SelectContent>
                            {collCenOptions.map((option) => (
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
                  </div>

                  <div className="flex justify-center gap-4">
                    <Button type="submit" disabled={isSubmitting || loading}>
                      {loading ? "लोड करत आहे..." : "प्रक्रिया"}
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={() => handleResetForm(resetForm)}
                      disabled={loading}
                    >
                      हटवा
                    </Button>
                    <Button type="button" variant="outline" path="/HomePage/FrmHomePage">
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

export default RptChequeDishonour;