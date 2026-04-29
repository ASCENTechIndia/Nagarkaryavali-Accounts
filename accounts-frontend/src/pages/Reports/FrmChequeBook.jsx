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
import { FrmChequeBookValidationSchema } from "../validations/global.validation";

const container = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { staggerChildren: 0.08 } },
};

const FrmChequeBook = () => {
  const { user } = useAuth();
  const token = user?.token;
  const ulbId = user?.ulbId;
  const [loading, setLoading] = useState(false);
  const [zones, setZones] = useState([]);
  const [glCodes, setGlCodes] = useState([]);
  const [ledgerOptions, setLedgerOptions] = useState([]);
  const [exportFormat, setExportFormat] = useState("pdf");
  const [formValues, setSelectedFormValues] = useState(null);
  

  const BASE_URL = import.meta.env.VITE_BASE_URL;

  const initialFormValues = {
    prabhag: "-1",
    deptCode: "",
    ledger: "",
    chequeFrom: "",
    chequeTo: "",
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

  const fetchGLCodes = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/Receipt/searchGLALL`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res?.data?.data) {
        const formatted = res.data.data.map((g) => ({
          label: g.GLSEARCHNAME,
          value: String(g.GLFUNCTION),
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
      console.log("Fetching ledger for GL code:", glcode);
      
      const res = await axios.post(
        `${BASE_URL}/api/FrmTransfer/credit-leasure`,
        { corp_id: Number(ulbId), glcode: Number(glcode) },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (res?.data?.data?.success) {
        const formatted = res.data.data.rows.map((l) => ({
          label: l.ACCNAME,
          value: String(l.OBJECTCODE),
        }));
        setLedgerOptions(formatted);
      }
    } catch (err) {
      console.error("Error fetching ledger:", err);
    }
  };

  const handleFormSubmit = async (values, { setSubmitting }) => {
    try {
        const validationResult =
        FrmChequeBookValidationSchema.safeParse(values);

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
        setLedgerOptions([]);
        setSelectedFormValues(null);
        setLoading(false);
        Swal.fire({
          text: "फॉर्म रीसेट झाला",
          confirmButtonColor: '#1e3a8a',
          timer: 1500
        });
      }
    });
  };

  useEffect(() => {
    if (ulbId) {
      fetchZones();
      fetchGLCodes();
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
        text: "Please wait for cheque book report generation",
        allowOutsideClick: false,
        showConfirmButton: false,
        didOpen: () => {
            Swal.showLoading();
        },
        });

        const payload = {
            majorCode: Number(formValues.deptCode),
            bankAcc: Number(formValues.ledger),
            chequeFrom: formValues.chequeFrom || "",
            chequeTo: formValues.chequeTo || "",
            zoneId:
            formValues.prabhag === "-1"
                ? "-1"
                : formValues.prabhag,
            ulbId: Number(ulbId),
        };

        const response = await axios.post(
        `${BASE_URL}/api/FrmChequeBook/cheque-book`,
        payload,
        {
            headers: { Authorization: `Bearer ${token}` },
        }
        );

        loaderSwal.close();

        if (response?.data?.ok && response?.data?.data?.length > 0) {
        const headers = [
            'CHQNO', 'TRNSNO', 'TRNSDATE', 'TRNSTYPE', 'PARTYNAME', 'DOCNO',
            'CHQDATE', 'NARRATION', 'ZONE', 'AMOUNT', 'CRDR', 'GLCODE',
            'GLNAME', 'ACCNO', 'ACCNAME', 'CHQBOOKNO', 'FUNCTIONCODE', 'OBJECTCODE'
        ];

        const rows = response.data.data.map(item => [
            item.CHQNO || '',
            item.TRNSNO || '',
            item.TRNSDATE || '',
            item.TRNSTYPE || '',
            item.PARTYNAME || '',
            item.DOCNO || '',
            item.CHQDATE || '',
            item.NARRATION || '',
            item.ZONE || '',
            item.AMOUNT || '',
            item.CRDR || '',
            item.GLCODE || '',
            item.GLNAME || '',
            item.ACCNO || '',
            item.ACCNAME || '',
            item.CHQBOOKNO || '',
            item.FUNCTIONCODE || '',
            item.OBJECTCODE || ''
        ]);

        const worksheetData = [headers, ...rows];

        const ws = XLSX.utils.aoa_to_sheet(worksheetData);

        ws['!cols'] = [
            { wch: 12 }, // CHQNO
            { wch: 12 }, // TRNSNO
            { wch: 12 }, // TRNSDATE
            { wch: 15 }, // TRNSTYPE
            { wch: 30 }, // PARTYNAME
            { wch: 10 }, // DOCNO
            { wch: 12 }, // CHQDATE
            { wch: 40 }, // NARRATION
            { wch: 15 }, // ZONE
            { wch: 15 }, // AMOUNT
            { wch: 8 },  // CRDR
            { wch: 12 }, // GLCODE
            { wch: 35 }, // GLNAME
            { wch: 15 }, // ACCNO
            { wch: 40 }, // ACCNAME
            { wch: 12 }, // CHQBOOKNO
            { wch: 15 }, // FUNCTIONCODE
            { wch: 15 }, // OBJECTCODE
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
        XLSX.utils.book_append_sheet(wb, ws, "Cheque_Book_Report");
        
        const fileName = `cheque_book_report_${formValues.chequeFrom}_to_${formValues.chequeTo}_${formatDateForExport(new Date())}.xlsx`;
        
        XLSX.writeFile(wb, fileName);
        
        Swal.fire({
            text: "अहवाल यशस्वीरीत्या निर्यात झाला",
            confirmButtonColor: "#1e3a8a",
            timer: 2000
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
  
  const handlePDFExport = async (formValues) => {
    let loaderSwal;
    try {
    debugger;
      loaderSwal = Swal.fire({
          title: "Generating...",
          text: "Please wait for ledger pdf generation",
          allowOutsideClick: false,
          showConfirmButton: false,
          didOpen: () => {
              Swal.showLoading();
          },
      });

      const payload = {
        majorCode: Number(formValues.deptCode),
        bankAcc: Number(formValues.ledger),
        chequeFrom: formValues.chequeFrom || "",
        chequeTo: formValues.chequeTo || "",
        zoneId:
          formValues.prabhag === "-1"
            ? "-1"
            : formValues.prabhag,
        ulbId: Number(ulbId),
      };

      console.log("Payload: ", payload);

      setLoading(true);

      const res = await axios.post(
        `${BASE_URL}/api/FrmChequeBook/cheque-book-pdf`,
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
        if (Swal.isVisible()) {
            Swal.close();
        }
      console.error("PDF Export Error:", error);
      Swal.fire({
        text: error.response?.data?.message || "PDF तयार करताना त्रुटी",
        confirmButtonColor: "#1e3a8a",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDateForExport = (date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
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
                    चेकबुक
                  </CardTitle>
                </CardHeader>

                <CardContent className="p-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                        <Label text="विभाग संकेतांक." />
                        <span>:</span>
                      </div>
                      <SearchableSelect
                        options={glCodes}
                        value={values.deptCode}
                        onChange={(option) => {
                          console.log("DeptCode onChange - selected option:", option);
                          const val = option?.value || "";
                          setFieldValue("deptCode", val);
                          setFieldValue("ledger", "");
                          setLedgerOptions([]);
                          if (val) {
                            fetchLedger(val);
                          }
                        }}
                        placeholder="विभाग संकेतांक निवडा"
                        className="w-full h-9"
                      />
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <div className="sm:w-36 shrink-0 flex justify-start sm:justify-between items-center">
                        <Label text="लेखाशीर्ष" />
                        <span>:</span>
                      </div>
                      <SearchableSelect
                        options={ledgerOptions}
                        value={values.ledger}
                        onChange={(option) => {
                          console.log("Ledger onChange - selected option:", option);
                          setFieldValue("ledger", option?.value || "");
                        }}
                        placeholder="लेखाशीर्ष निवडा"
                        disabled={!values.deptCode}
                        className="w-full h-9"
                      />
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-center gap-2">
                        <div className="sm:w-36 shrink-0 flex justify-start sm:justify-between items-center">
                            <Label text="धनादेश पासून" />
                            <span>:</span>
                        </div>
                        <Input
                            name="chequeFrom"
                            value={values.chequeFrom}
                            onChange={(e) => {
                                const value = e.target.value.replace(/[^0-9]/g, "").slice(0, 6);
                                setFieldValue("chequeFrom", value);
                            }}
                            placeholder="6 digits"
                            type="text"
                            maxLength={6}
                            className="w-full h-9"
                        />
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-center gap-2">
                        <div className="sm:w-36 shrink-0 flex justify-start sm:justify-between items-center">
                            <Label text="धनादेश पर्यंत" />
                            <span>:</span>
                        </div>
                        <Input
                            name="chequeTo"
                            value={values.chequeTo}
                            onChange={(e) => {
                                const value = e.target.value.replace(/[^0-9]/g, "").slice(0, 6);
                                setFieldValue("chequeTo", value);
                            }}
                            placeholder="6 digits"
                            type="text"
                            maxLength={6}
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

export default FrmChequeBook;