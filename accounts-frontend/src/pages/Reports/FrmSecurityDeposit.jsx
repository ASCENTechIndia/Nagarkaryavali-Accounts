import SearchableSelect from "@/components/SearchableSelect";
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
import { useAuth } from "@/context/AuthContext";
import axios from "axios";
import { Form, Formik } from "formik";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import * as XLSX from "xlsx";
import { FrmSecurityDepositValidationSchema } from "../validations/global.validation";
import { DatePicker } from "@/components/ui/calendar";

const container = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { staggerChildren: 0.08 } },
};

const FrmSecurityDeposit = () => {
  const { user } = useAuth();
  const token = user?.token;
  const ulbId = user?.ulbId;
  const [loading, setLoading] = useState(false);
  const [zones, setZones] = useState([]);
  const [exportFormat, setExportFormat] = useState("pdf");
  const [reportType, setReportType] = useState("depReceived")
  const [formValues, setSelectedFormValues] = useState(null);
  

  const BASE_URL = import.meta.env.VITE_BASE_URL;

  const initialFormValues = {
    prabhag: "-1",
    deptCode: "",
    ledger: "",
    fromDate: new Date(),
    toDate: new Date(),
  };

  const fetchZones = async () => {
    try {
      const res = await axios.post(
        `${BASE_URL}/api/Receipt/zones`,
        { corp_id: ulbId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res?.data) setZones(res.data.data);
    } catch (err) {
      console.error("Error fetching zones:", err);
    }
  };

  const handleFormSubmit = async (values, { setSubmitting }) => {
    try {
        const validationResult = FrmSecurityDepositValidationSchema.safeParse(values);

        if (!validationResult.success) {
        const firstError = validationResult.error.issues[0];
        await Swal.fire({
            text: firstError.message,
            confirmButtonColor: "#1e3a8a",
        });
        return;
        }

        setSelectedFormValues(values);

        if (exportFormat === "pdf") {
            await handlePDFExport(values);
        } else {
            await exportToExcel(values);
        }
    } catch (error) {
        console.error("Submit Error:", error);
        await Swal.fire({
        text: "प्रक्रिया करताना त्रुटी आली",
        confirmButtonColor: "#1e3a8a",
        });
    } finally {
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
        setExportFormat("pdf")
        setReportType("depReceived")
        setSelectedFormValues(null);
        setLoading(false);
        Swal.fire({
          text: "फॉर्म रीसेट झाला",
          confirmButtonColor: '#1e3a8a',
        });
      }
    });
  };

  useEffect(() => {
    if (ulbId) {
      fetchZones();
    }
  }, [ulbId]);

  const prabhagOptions = [
    { value: "-1", label: "-- ALL --" },
    ...(zones.map((z) => ({
      value: z.ZONEID?.toString(),
      label: z.ZONEENAME,
    })) || []),
  ];

  const exportToExcel = async (formValues) => {
    let loaderSwal;
    try {
        if (!formValues) {
        Swal.fire({
            text: "कृपया प्रथम अहवाल तयार करा",
            confirmButtonColor: "#1e3a8a",
        });
        return;
        }

        loaderSwal = Swal.fire({
        title: "Generating Excel...",
        text: "Please wait for security deposit report generation",
        allowOutsideClick: false,
        showConfirmButton: false,
        didOpen: () => {
            Swal.showLoading();
        },
        });

        let apiEndpoint = "";
        switch(reportType) {
        case 'depReceived':
            apiEndpoint = `${BASE_URL}/api/FrmSecurityDeposit/rbt-deposit/received`;
            break;
        case 'depoPayment':
            apiEndpoint = `${BASE_URL}/api/FrmSecurityDeposit/rbt-deposit/payment`;
            break;
        case 'unpaid':
            apiEndpoint = `${BASE_URL}/api/FrmSecurityDeposit/rbt-deposit/unpaid`;
            break;
        case 'report147':
            apiEndpoint = `${BASE_URL}/api/FrmSecurityDeposit/rdo-report/147`;
            break;
        default:
            throw new Error("Invalid report type");
        }

        const payload = {
        corpId: String(ulbId),
        zoneId: formValues.prabhag === "-1" ? "-1" : String(formValues.prabhag),
        fromDate: formatDateForAPI(formValues.fromDate),
        toDate: formatDateForAPI(formValues.toDate),
        };

        const response = await axios.post(apiEndpoint, payload, {
        headers: { Authorization: `Bearer ${token}` },
        });

        loaderSwal.close();

        if (response?.data?.ok && response?.data?.data?.list?.length > 0) {
        const data = response.data.data.list;
        
        const headers = [
            'PARTYID', 'PARTYNAME', 'PANCARD', 'PROPNAME', 'GLCODE', 'GLNAME', 
            'ACCNAME', 'AMOUNT', 'DEPTNAME', 'DEPOSITTYPE', 'DEPONO', 'BANKACCNO', 
            'DEPODETAIL', 'RECTRANSNO', 'RECTRANSDATE', 'PAYTRNSNO', 'PAYTRNSDATE', 'FUNCTIONCODE'
        ];

        const rows = data.map(item => [
            item.PARTYID || '',
            item.PARTYNAME || '',
            item.PANCARD || '',
            item.PROPNAME || '',
            item.GLCODE || '',
            item.GLNAME || '',
            item.ACCNAME || '',
            item.AMOUNT || 0,
            item.DEPTNAME || '',
            item.DEPOSITTYPE || '',
            item.DEPONO || '',
            item.BANKACCNO || '',
            item.DEPODETAIL || '',
            item.RECTRANSNO || '',
            item.RECTRANSDATE ? new Date(item.RECTRANSDATE).toLocaleDateString('en-GB') : '',
            item.PAYTRNSNO || '',
            item.PAYTRNSDATE ? new Date(item.PAYTRNSDATE).toLocaleDateString('en-GB') : '',
            item.FUNCTIONCODE || ''
        ]);

        const worksheetData = [headers, ...rows];
        const ws = XLSX.utils.aoa_to_sheet(worksheetData);

        ws['!cols'] = [
            { wch: 10 }, // PARTYID
            { wch: 30 }, // PARTYNAME
            { wch: 15 }, // PANCARD
            { wch: 25 }, // PROPNAME
            { wch: 10 }, // GLCODE
            { wch: 35 }, // GLNAME
            { wch: 20 }, // ACCNAME
            { wch: 12 }, // AMOUNT
            { wch: 15 }, // DEPTNAME
            { wch: 20 }, // DEPOSITTYPE
            { wch: 15 }, // DEPONO
            { wch: 15 }, // BANKACCNO
            { wch: 40 }, // DEPODETAIL
            { wch: 15 }, // RECTRANSNO
            { wch: 15 }, // RECTRANSDATE
            { wch: 15 }, // PAYTRNSNO
            { wch: 15 }, // PAYTRNSDATE
            { wch: 12 }  // FUNCTIONCODE
        ];

        const range = XLSX.utils.decode_range(ws['!ref']);
        for (let C = range.s.c; C <= range.e.c; ++C) {
            const address = XLSX.utils.encode_cell({ r: 0, c: C });
            if (!ws[address]) continue;
            ws[address].s = {
            font: { bold: true, sz: 11, color: { rgb: "FFFFFF" } },
            fill: { fgColor: { rgb: "1e3a8a" }, patternType: "solid" },
            alignment: { horizontal: "center", vertical: "center" }
            };
        }

        const wb = XLSX.utils.book_new();
        const reportTypeName = {
            depReceived: 'ठेव_प्राप्त',
            depoPayment: 'ठेव_देयक',
            unpaid: 'ठेव_बाकी',
            report147: 'अहवाल_147'
        }[reportType];
        
        XLSX.utils.book_append_sheet(wb, ws, `Security_Deposit_${reportTypeName}`);
        
        const fromDateFormatted = formatDateForAPI(formValues.fromDate);
        const toDateFormatted = formatDateForAPI(formValues.toDate);
        const fileName = `Security_Deposit_${reportTypeName}_${fromDateFormatted}_to_${toDateFormatted}.xlsx`;
        
        XLSX.writeFile(wb, fileName);
        
        Swal.fire({
            text: `अहवाल यशस्वीरीत्या निर्यात झाला.`,
            confirmButtonColor: "#1e3a8a",
        });
        } else {
        Swal.fire({
            text: "कोणताही डेटा सापडला नाही",
            confirmButtonColor: "#1e3a8a",
        });
        }
    } catch (error) {
        if (loaderSwal) loaderSwal.close();
        console.error("Excel Export Error:", error);
        Swal.fire({
        text: error.response?.data?.message || "Excel तयार करताना त्रुटी आली",
        confirmButtonColor: "#1e3a8a",
        });
    }
  };

  const formatDateForAPI = (date) => {
    if (!date) return "";
    const d = new Date(date);
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const day = String(d.getDate()).padStart(2, '0');
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  };
  
  const handlePDFExport = async (formValues) => {
    let loaderSwal;
    try {
        loaderSwal = Swal.fire({
        title: "Generating...",
        text: "Please wait for security deposit pdf generation",
        allowOutsideClick: false,
        showConfirmButton: false,
        didOpen: () => {
            Swal.showLoading();
        },
        });

        const payload = {
            corpId: String(ulbId),
            zoneId: formValues.prabhag === "-1" ? "-1" : String(formValues.prabhag),
            fromDate: formatDateForAPI(formValues.fromDate),
            toDate: formatDateForAPI(formValues.toDate),
            reportType: reportType,
        };

        const res = await axios.post(
        `${BASE_URL}/api/FrmSecurityDeposit/security-deposit/pdf`,
        payload,
        {
            headers: { Authorization: `Bearer ${token}` },
        }
        );

        loaderSwal.close();

        if (res?.data?.success) {
        window.open(res.data.pdfUrl, "_blank");
        
        Swal.fire({
            text: res.data.message || `PDF यशस्वीरीत्या तयार झाला.`,
            confirmButtonColor: "#1e3a8a",
        });
        } else {
        throw new Error(res.data?.message || "PDF generation failed");
        }
    } catch (error) {
        if (loaderSwal) loaderSwal.close();
        console.error("PDF Export Error:", error);
        Swal.fire({
        text: error.response?.data?.message || "PDF तयार करताना त्रुटी आली",
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
      {({ values, setFieldValue, isSubmitting, resetForm }) => {
        return (
          <Form>
            <motion.div variants={container} initial="hidden" animate="show">
              <Card className="shadow-sm border">
                <CardHeader className="border-b flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                  <CardTitle className="text-lg font-semibold">
                    सुरक्षा ठेव अहवाल
                  </CardTitle>
                </CardHeader>

                <CardContent className="p-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
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
                          {prabhagOptions.map((option) => (
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
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                        <div className="flex items-center gap-2">
                        <div className="sm:w-36 shrink-0 flex justify-start sm:justify-between items-center">
                            <Label text="अहवालाचा प्रकार" />
                            <span>:</span>
                        </div>
                        <div className="flex items-center gap-4 ml-2">
                            <div className="flex items-center gap-2">
                            <Input
                                type="radio"
                                id="exportDepReceived"
                                name="reportType"
                                value="depReceived"
                                checked={reportType === "depReceived"}
                                onChange={(e) => setReportType(e.target.value)}
                                className="h-4 w-4"
                            />
                            <Label htmlFor="exportDepReceived" className="font-medium text-gray-700 cursor-pointer">
                                ठेव प्राप्त
                            </Label>
                            </div>
                            <div className="flex items-center gap-2">
                            <Input
                                type="radio"
                                id="exportDepoPayment"
                                name="reportType"
                                value="depoPayment"
                                checked={reportType === "depoPayment"}
                                onChange={(e) => setReportType(e.target.value)}
                                className="h-4 w-4"
                            />
                            <Label htmlFor="exportdepoPayment" className="font-medium text-gray-700 cursor-pointer">
                                ठेव देयक
                            </Label>
                            </div>
                            <div className="flex items-center gap-2">
                            <Input
                                type="radio"
                                id="exportUnpaid"
                                name="reportType"
                                value="unpaid"
                                checked={reportType === "unpaid"}
                                onChange={(e) => setReportType(e.target.value)}
                                className="h-4 w-4"
                            />
                            <Label htmlFor="exportUnpaid" className="font-medium text-gray-700 cursor-pointer">
                                ठेव बाकी
                            </Label>
                            </div>
                            <div className="flex items-center gap-2">
                            <Input
                                type="radio"
                                id="exportReport147"
                                name="reportType"
                                value="report147"
                                checked={reportType === "report147"}
                                onChange={(e) => setReportType(e.target.value)}
                                className="h-4 w-4"
                            />
                            <Label htmlFor="exportReport147" className="font-medium text-gray-700 cursor-pointer">
                                अहवाल 147
                            </Label>
                            </div>
                        </div>
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

export default FrmSecurityDeposit;