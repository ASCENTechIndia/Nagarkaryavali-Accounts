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
import { FrmTransferRegisterRptValidationSchema } from "../validations/global.validation";
import * as XLSX from "xlsx";

const container = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { staggerChildren: 0.08 } },
};

const FrmTransferRegisterRpt = () => {
  const { user } = useAuth();
  const token = user?.token;
  const ulbId = user?.ulbId;
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [glCodes, setGlCodes] = useState([]);
  const [ledgerOptions, setLedgerOptions] = useState([]);
  const [partyOptions, setPartyOptions] = useState([]);
  const [exportFormat, setExportFormat] = useState("pdf");

  const BASE_URL = import.meta.env.VITE_BASE_URL;

  const initialFormValues = {
    fromDate: new Date(),
    toDate: new Date(),
    useGL: false,
    deptCode: "",
    ledger: "",
    party: "",
  };

  const fetchParties = async () => {
    try {
      const res = await axios.post(
        `${BASE_URL}/api/Receipt/party`,
        { ulbid: ulbId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res?.data?.data) {
        setPartyOptions(
          res.data.data.map((p) => ({
            label: p.PARTYNAME,
            value: p.NUM_PARTYMST_PARTYID.toString(),
          }))
        );
      }
    } catch (err) {
      console.error("Error fetching parties:", err);
    }
  };

  const fetchGLCodes = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/Receipt/searchGLALL`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res?.data?.data) {
        setGlCodes(
          res.data.data.map((g) => ({
            label: g.GLSEARCHNAME,
            value: String(g.GLFUNCTION),
          }))
        );
      }
    } catch (err) {
      console.error("Error fetching GL codes:", err);
    }
  };

  const fetchLedger = async (glcode) => {
    try {
      if (!glcode || !ulbId) return;

      const res = await axios.post(
        `${BASE_URL}/api/FrmTransfer/credit-leasure`,
        { corp_id: Number(ulbId), glcode: Number(glcode) },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res?.data?.data?.success) {
        setLedgerOptions(
          res.data.data.rows.map((l) => ({
            label: l.ACCNAME,
            value: String(l.OBJECTCODE),
          }))
        );
      }
    } catch (err) {
      console.error("Error fetching ledger:", err);
    }
  };

  useEffect(() => {
    if (ulbId) {
      fetchParties();
      fetchGLCodes();
    }
  }, [ulbId]);
  
  const formatDateForAPI = (date) => {
    const d = new Date(date);

    const day = String(d.getDate()).padStart(2, "0");
    const month = d
        .toLocaleString("en-US", { month: "short" })
        .toUpperCase();
    const year = d.getFullYear();

    return `${day}-${month}-${year}`; 
  };

  const handleFormSubmit = async (values, { setSubmitting }) => {
    try {
        setLoading(true);
        const validationResult = FrmTransferRegisterRptValidationSchema.safeParse(values);
        if (!validationResult.success) {
        const firstError = validationResult.error.issues[0];
        await Swal.fire({
            text: firstError.message,
            confirmButtonColor: '#1e3a8a'
        });
        return;
        }

        const payload = {
            ulbId: Number(ulbId),
            fromDate: formatDateForAPI(values.fromDate),
            toDate: formatDateForAPI(values.toDate),
            chkGLCode: values.useGL ? 1 : 0,
            majorCode: values.useGL ? Number(values.deptCode) : null,
            minorCode: values.useGL ? Number(values.ledger) : null,
            partyId: values.party || "",
        };

        if (exportFormat === "pdf") {
            await handlePDFExport(payload);
            return;
        } 
        
        const [table1Res, table2Res] = await Promise.all([
            axios.post(`${BASE_URL}/api/TranRpt/details`, payload, {
                headers: { Authorization: `Bearer ${token}` },
            }),
            axios.post(`${BASE_URL}/api/TranRpt/summary`, payload, {
                headers: { Authorization: `Bearer ${token}` },
            })
        ]);

        const table1Data = table1Res?.data?.data?.list || [];
        const table2Data = table2Res?.data?.data?.summary || {};

        if (exportFormat === "excel") {
            if (table1Data.length === 0 && table2Data.length === 0) {
                Swal.fire({
                text: "कोणतीही माहिती उपलब्ध नाही",
                confirmButtonColor: '#1e3a8a'
                });
                return;
            }

            exportToExcel(table1Data, table2Data);
        }

    } catch (err) {
        console.error("Submit Error:", err);
        Swal.fire({
            text: err.response?.data?.message || "सर्व्हर त्रुटी निर्माण झाली आहे",
            confirmButtonColor: '#1e3a8a',
        });
    } finally {
        setLoading(false);
        setSubmitting(false);
    }
  };

  const exportToExcel = (table1 = [], table2 = []) => {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([]);

    let rowIndex = 0;

    XLSX.utils.sheet_add_aoa(ws, [
        ["General Bank Book / सर्वसाधारण बॅंक पुस्तक"]
    ], { origin: rowIndex });

    rowIndex += 2;

    const header1 = [
        "TRNSDATE", "DOCNO", "ACCNAME",
        "RECEIPTAMT", "PAYMENTAMT",
        "NARRATION", "TRANSNO", "BANKNAME", "ACCNOAC"
    ];

    XLSX.utils.sheet_add_aoa(ws, [header1], { origin: rowIndex });
    rowIndex++;

    const table1Data = table1.map(row => [
        row.TRNSDATE || "",
        row.DOCNO || "",
        row.ACCNAME || "",
        row.RECEIPTAMT || "",
        row.PAYMENTAMT || "",
        row.NARRATION || "",
        row.TRANSNO || "",
        row.BANKNAME || "",
        row.ACCNOAC || "",
    ]);

    XLSX.utils.sheet_add_aoa(ws, table1Data, { origin: rowIndex });

    rowIndex += table1Data.length + 3;

    XLSX.utils.sheet_add_aoa(ws, [
        ["Opening / Closing"]
    ], { origin: rowIndex });

    rowIndex += 2;

    const header2 = [
        "OPENINGBAL", "RECAMT", "PAYAMT", "CLOSINGBAL"
    ];

    XLSX.utils.sheet_add_aoa(ws, [header2], { origin: rowIndex });
    rowIndex++;

    const table2Data = [
      [
        table2?.OPENING || "",
        table2?.RECEIPT || "",
        table2?.PAYMENT || "",
        Math.abs(table2?.CLOSING) || "",
      ]
    ];

    XLSX.utils.sheet_add_aoa(ws, table2Data, { origin: rowIndex });

    ws['!cols'] = [
        { wch: 15 }, { wch: 20 }, { wch: 25 },
        { wch: 15 }, { wch: 15 },
        { wch: 30 }, { wch: 15 }, { wch: 20 }, { wch: 25 },
    ];
    XLSX.utils.book_append_sheet(wb, ws, "Transfer Register");
    const fileName = `Transfer_Register_${formatDateForAPI(new Date())}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  const handlePDFExport = async (payload) => {
    let loaderSwal;

    try {
        loaderSwal = Swal.fire({
        title: "Generating...",
        text: "Please wait for transfer register pdf",
        allowOutsideClick: false,
        showConfirmButton: false,
        didOpen: () => Swal.showLoading(),
        });

        setLoading(true);

        const res = await axios.post(
        `${BASE_URL}/api/TranRpt/pdf`,
        payload,
        {
            headers: { Authorization: `Bearer ${token}` },
        }
        );

        loaderSwal.close();

        if (res?.data?.success && res?.data?.pdfUrl) {
        window.open(res.data.pdfUrl, "_blank");
        } else {
        throw new Error("PDF generation failed");
        }
    } catch (error) {
        console.error(error);

        Swal.fire({
            text: error.response?.data?.message || "PDF तयार करताना त्रुटी",
            confirmButtonColor: "#1e3a8a",
        });
    } finally {
        setLoading(false);
    }
  };
  
  return (
    <Formik initialValues={initialFormValues} onSubmit={handleFormSubmit}>
      {({ values, setFieldValue, isSubmitting, handleSubmit }) => (
        <Form onSubmit={handleSubmit}>
          <motion.div variants={container} initial="hidden" animate="show">
            <Card className="shadow-sm border">
              <CardHeader className="border-b flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                <CardTitle className="text-lg font-semibold">
                  सर्वसाधारण बॅंक पुस्तक
                </CardTitle>
              </CardHeader>

              <CardContent className="p-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <div className="sm:w-36 flex justify-between">
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
                    <div className="sm:w-36 flex justify-between">
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
                    <div className="sm:w-36 flex justify-between">
                        <div className="flex items-center gap-2">
                            <Input
                                type="checkbox"
                                checked={values.useGL}
                                onChange={(e) => {
                                const checked = e.target.checked;
                                setFieldValue("useGL", checked);

                                if (!checked) {
                                    setFieldValue("deptCode", "");
                                    setFieldValue("ledger", "");
                                    setLedgerOptions([]);
                                }
                                }}
                            />
                            <Label text="विभाग संकेतांक." />
                        </div>
                      <span>:</span>
                    </div>
                    <SearchableSelect
                      options={glCodes}
                      value={values.deptCode}
                      onChange={(option) => {
                        const val = option?.value || "";
                        setFieldValue("deptCode", val);
                        setFieldValue("ledger", "");
                        setLedgerOptions([]);
                        if (val) fetchLedger(val);
                      }}
                      placeholder="विभाग संकेतांक निवडा"
                      disabled={!values.useGL}
                    />
                  </div>
                  
                  
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <div className="sm:w-36 flex justify-between">
                      <Label text="लेखाशीर्ष" />
                      <span>:</span>
                    </div>
                    <SearchableSelect
                      options={ledgerOptions}
                      value={values.ledger}
                      onChange={(option) =>
                        setFieldValue("ledger", option?.value || "")
                      }
                      disabled={!values.useGL || !values.deptCode}
                      placeholder="लेखाशीर्ष निवडा"
                    />
                  </div>
                  
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <div className="sm:w-36 flex justify-between">
                      <Label text="पार्टी" />
                      <span>:</span>
                    </div>
                    <SearchableSelect
                      options={partyOptions}
                      value={values.party}
                      onChange={(option) =>
                        setFieldValue("party", option?.value || "")
                      }
                      placeholder="पार्टी शोधा"
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

                  <Button type="button" variant="outline" path="/HomePage/FrmHomePage">
                    बाहेर
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </Form>
      )}
    </Formik>
  );
};

export default FrmTransferRegisterRpt;