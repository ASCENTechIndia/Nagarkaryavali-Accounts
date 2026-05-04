import SearchableSelect from "@/components/SearchableSelect";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import axios from "axios";
import { Form, Formik } from "formik";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import * as XLSX from "xlsx";
import { FrmSdRefundRptValidationSchema } from "../validations/global.validation";

const container = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { staggerChildren: 0.08 } },
};

const FrmSdRefundRpt = () => {
  const { user } = useAuth();
  const token = user?.token;
  const ulbId = user?.ulbId;
  const navigate = useNavigate();

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [contrOptions, setContrOptions] = useState([]);
  const [partyOptions, setPartyOptions] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [exportFormat, setExportFormat] = useState("pdf");
  const [selectedFormValues, setSelectedFormValues] = useState(null);

  const BASE_URL = import.meta.env.VITE_BASE_URL;

  const initialFormValues = {
    receiptNo: "",
    certiNo: "",
    contrName: "",
    party: "",
    fromDate: new Date(),
    toDate: new Date(),
  };

  const fetchParties = async () => {
      try {
        const res = await axios.post(`${BASE_URL}/api/FrmSdRefundRpt/GetPartyDetails`, 
          {
            ulbid: ulbId
          },
          {
              headers: {
                Authorization: `Bearer ${token}`,
              },
          }
        );
  
        if (res?.data?.data.success) {
          const formatted = res?.data?.data.rows.map((p) => ({
            label: p.PARTYNAME,
            value: p.PARTYID.toString(),
          }));
  
          setPartyOptions(formatted);
        }
      } catch (err) {
        console.error("Error fetching parties:", err);
      }
  };

  const fetchContractorName = async () => {
    try {
      const res = await axios.post(`${BASE_URL}/api/FrmSdRefundRpt/GetContrctNameDetails`, 
      {
        ulbid: ulbId
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("Contract Name: ", res);

      if (res?.data?.data.success) {
        const formatted = res.data.data.rows.map((g) => ({
          label: g.PARTYNAME,
          value: String(g.PARTYID),
        }));
        setContrOptions(formatted);
      }
    } catch (err) {
      console.error("Error fetching GL codes:", err);
    }
  };

  useEffect(() => {
    if (ulbId) {
        fetchParties();
        fetchContractorName();
    }
  }, [ulbId]);

  const formatDateForAPI = (date) => {
    if (!date) return null;
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, "0");
    const month = d.toLocaleString('en', { month: 'short' }).toUpperCase();
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const handleFormSubmit = async (values, { setSubmitting }) => {
      try {
        setLoading(true);
        setHasSearched(true);

        const validationResult = FrmSdRefundRptValidationSchema.safeParse(values);
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
        ulbid: Number(ulbId),
        recno: values.receiptNo || null,
        certino: values.certiNo || null,
        partyname: contrOptions.find(o => o.value === values.contrName)?.label || null,
        partyid: values.party || null,
        fromDate: formatDateForAPI(values.fromDate),
        toDate: formatDateForAPI(values.toDate),
      };

      if (exportFormat === "pdf") {
        await handlePDFExport(payload); 
        return;
      }

      const res = await axios.post(`${BASE_URL}/api/FrmSdRefundRpt/sd-received-paid`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res?.data?.ok && res?.data?.data?.rows?.length > 0) {
        const fetchedRows = res.data.data.rows;
        setTransactions(fetchedRows);
        if (exportFormat === "excel") {
            exportToExcel(fetchedRows);
        }
        } else {
        setTransactions([]);
        Swal.fire({
            text: res.data.message || "कोणतीही माहिती उपलब्ध नाही",
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
        setTransactions([]);
        setExportFormat("pdf");
        setSelectedFormValues(null);
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
    const data = dataToExport || transactions;
    if (data.length === 0) return;

    const excelData = data.map((row, index) => ({
        "अनु. क्र.": index + 1, 
        "दिनांक": row.RECTRNSDATE || "",
        "प्रमाणक क्र./ पावती क्र.": row.RECNO || "",
        "पार्टी कोड": row.PARTYID || "",
        "कंत्राटदार / कंपनी चे नाव": row.PARTYNAME || "",
        "अनामत प्रकार": row.NIDHINAME || "",
        "पावती क्र.": row.CERTINO || "",
        "परतफेड दिनांक": row.SDDT || "",
        "रक्कम": row.AMOUNT || 0,
        "ACCNAME": row.ACCNAME || "",
    }));

    const ws = XLSX.utils.json_to_sheet(excelData);

    ws['!cols'] = [
        { wch: 10 }, 
        { wch: 15 }, 
        { wch: 22 }, 
        { wch: 12 }, 
        { wch: 40 }, 
        { wch: 20 }, 
        { wch: 15 }, 
        { wch: 15 }, 
        { wch: 12 }, 
        { wch: 35 },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "SD_Refund_Report");
  
    const fileName = `Security_Deposit_Refund_Report_${formatDateForAPI(new Date())}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  const handlePDFExport = async (payload) => {
    let loaderSwal;
    try {
      loaderSwal = Swal.fire({
          title: "Generating...",
          text: "Please wait for security deposite refund report generation",
          allowOutsideClick: false,
          showConfirmButton: false,
          didOpen: () => {
              Swal.showLoading();
          },
      });

      setLoading(true);

      console.log("PDF Payload: ", payload);

      const res = await axios.post(
        `${BASE_URL}/api/FrmSdRefundRpt/sd-received-paid-pdf`,
        payload,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      console.log("PDF Response: ", res);

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

        return (
          <Form onSubmit={handleSubmit}>
            <motion.div variants={container} initial="hidden" animate="show">
              <Card className="shadow-sm border">
                <CardHeader className="border-b flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                  <CardTitle className="text-lg font-semibold">
                    Security Deposite Refund Report
                  </CardTitle>
                </CardHeader>

                <CardContent className="p-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                      <div className="sm:w-36 shrink-0 flex justify-start sm:justify-between items-center">
                        <Label text="सु.अ.क्र.शोध" />
                        <span>:</span>
                      </div>
                      <Input
                        name="receiptNo"
                        value={values.receiptNo}
                        onChange={(e) => {
                            const value = e.target.value;
                            setFieldValue("receiptNo", value);
                        }}
                        type="text"
                        className="w-full h-9"
                      />
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                      <div className="sm:w-36 shrink-0 flex justify-start sm:justify-between items-center">
                        <Label text="सु.अ.परतावा.क्र.शोध." />
                        <span>:</span>
                      </div>
                      <Input
                        name="certiNo"
                        value={values.certiNo}
                        onChange={(e) => {
                            const value = e.target.value;
                            setFieldValue("certiNo", value);
                        }}
                        type="text"
                        className="w-full h-9"
                      />
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <div className="sm:w-36 shrink-0 flex justify-start sm:justify-between items-center">
                        <Label text="कंत्राटदार नाव" />
                        <span>:</span>
                      </div>
                      <SearchableSelect
                        options={contrOptions}
                        value={values.contrName}
                        onChange={(option) => {
                          setFieldValue("contrName", option?.value || "");
                        }}
                        className="w-full h-9"
                      />
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <div className="sm:w-36 shrink-0 flex justify-start sm:justify-between items-center">
                        <Label text="पार्टी कोड" />
                        <span>:</span>
                      </div>
                      <SearchableSelect
                        options={partyOptions}
                        value={values.party}
                        onChange={(option) => {
                          setFieldValue("party", option?.value || "");
                        }}
                        className="w-full h-9"
                      />
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

export default FrmSdRefundRpt;