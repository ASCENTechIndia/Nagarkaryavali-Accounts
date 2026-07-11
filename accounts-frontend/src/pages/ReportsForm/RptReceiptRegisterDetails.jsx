import { Formik, Form } from "formik";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "@/context/AuthContext";
import Swal from "sweetalert2";

import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { DatePicker } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";

import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

import SearchableSelect from "@/components/SearchableSelect";
import ShadCNTable from "@/components/ui/table";

/* ================= INITIAL ================= */
const getInitialValues = () => {
  const today = new Date();
  return {
    ward: "-1",
    fromDate: today,
    toDate: today,
    deptCode: "",
    ledger: "",
    exportType: "PDF",
  };
};

const Row = ({ label, children }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 items-center">
    <Label className="text-sm sm:text-right sm:pr-2 font-medium">
      {label} :
    </Label>
    {children}
  </div>
);

const RptReceiptRegisterDetails = () => {
  const { user } = useAuth();
  const token = user?.token;
  const ulbId = user?.ulbId;
  const BASE_URL = import.meta.env.VITE_BASE_URL;

  const navigate = useNavigate();

  const [zones, setZones] = useState([]);
  const [glCodes, setGlCodes] = useState([]);
  const [ledgers, setLedgers] = useState([]);
  const [tableData, setTableData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState([]);

  /* ================= LOAD ZONES ================= */
  useEffect(() => {
    if (!ulbId) return;

    axios
      .post(
        `${BASE_URL}/api/Receipt/zones`,
        { corp_id: ulbId },
        { headers: { Authorization: `Bearer ${token}` } },
      )
      .then((res) => setZones(res.data?.data || []))
      .catch(console.error);
  }, [ulbId]);

  /* ================= LOAD GL ================= */
  useEffect(() => {
    if (!ulbId) return;

    axios
      .get(`${BASE_URL}/api/Receipt/searchGLALL`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        console.log("GL Response: ", res)

        const data = res.data?.data || [];
        setGlCodes(data);
      })
      .catch(console.error);
  }, [ulbId]);

  useEffect(() => {
    console.log(glCodes);
  }, [glCodes]);

  /* ================= LOAD LEDGERS ================= */
  const loadLedgers = async (glcode) => {
    if (!glcode) return;

    try {
      const res = await axios.post(
        `${BASE_URL}/api/FrmTransfer/credit-leasure`,
        { corp_id: ulbId, glcode },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      console.log("Ledger Response: ", res);

      setLedgers(res.data?.data?.rows || []);
    } catch (err) {
      console.error(err);
    }
  };

  /* ================= 🔥 HANDLE SEARCH ================= */
  const formatDate = (date) => {
    if (!date) return null;

    const d = new Date(date);

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  //   const handleSearch = async (values) => {
  //     try {
  //       setLoading(true);
  //  const selectedZone = zones.find(
  //         (z) => String(z.ZONEID) === String(values.ward)
  //       );
  //        const payload = {
  //         ulbId: ulbId,
  //         fromDate: formatDate(values.fromDate),
  //         toDate: formatDate(values.toDate),
  //         majorCode: values.deptCode || null,
  //         minorCode: values.ledger || null,
  //         zoneId: values.ward || null,
  //         zoneName: selectedZone?.ZONEENAME || null,
  //         gramPanchayatId: null,
  //         corpCode: null,
  //         budgetId: null,
  //         nidhiId: null,
  //         exportType: values.exportType, // 🔥 important
  //       };

  //       const res = await axios.post(
  //         `${BASE_URL}/api/RptRegister/transaction-report-pdf`,
  //         payload,
  //         {
  //           headers: { Authorization: `Bearer ${token}` },
  //           responseType: values.exportType === "Excel" ? "blob" : "json",
  //         },
  //       );

  //       /* ================= PDF ================= */
  //       if (values.exportType === "PDF") {
  //         const pdfUrl = res.data?.pdfUrl;

  //         if (pdfUrl) {
  //           window.open(pdfUrl, "_blank");
  //         } else {
  //           Swal.fire("No Data", "No records found for PDF", "warning");
  //         }
  //         return;
  //       }

  //       /* ================= EXCEL DOWNLOAD ================= */
  //       if (values.exportType === "Excel") {
  //         const blob = new Blob([res.data], {
  //           type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  //         });

  //         const url = window.URL.createObjectURL(blob);

  //         const link = document.createElement("a");
  //         link.href = url;
  //         link.download = `Receipt_Register_${Date.now()}.xlsx`;

  //         document.body.appendChild(link);
  //         link.click();

  //         link.remove();
  //         window.URL.revokeObjectURL(url);

  //         return;
  //       }

  //       /* ================= TABLE ================= */
  //       const list = res.data?.data?.list || [];

  //       if (list.length === 0) {
  //         Swal.fire("No Data", "No records found", "warning");
  //       }

  //       setTableData(list);
  //     } catch (err) {
  //       console.error(err);
  //       Swal.fire({
  //               text: err?.response?.data?.message ,
  //             });
  //     } finally {
  //       setLoading(false);
  //     }
  //   };
  const exportTransactionExcel = (rows, values, zoneName) => {
    const excelData = rows.map((item, index) => ({
      "Sr No": index + 1,
      "Date": item.TRNSDATE
        ? new Date(item.TRNSDATE).toLocaleDateString("en-GB")
        : "",

      "Transaction No": item.TRANSNO || "",
      "Document No": item.DOCNO || "",

      "GL Code": item.GLCODE || "",
      "GL Name": item.GLNAME || "",

      "Account No": item.ACCNO || "",
      "Account Name": item.ACCNAME || "",

      "Zone": item.ZONEENAME || "",
      "Gram Panchayat": item.GRAMPANCH || "",

      "Function Code": item.FUNCTIONCODE || "",
      "Object Code": item.OBJECTCODE || "",

      "Party Name": item.PARTYNAME || "",
      "Narration": item.NARRATION || "",

      "Amount": Number(item.AMOUNT || 0),
    }));

    const ws = XLSX.utils.json_to_sheet(excelData);

    ws["!cols"] = [
      { wch: 8 },
      { wch: 15 },
      { wch: 18 },
      { wch: 18 },
      { wch: 12 },
      { wch: 30 },
      { wch: 18 },
      { wch: 35 },
      { wch: 25 },
      { wch: 25 },
      { wch: 15 },
      { wch: 15 },
      { wch: 30 },
      { wch: 40 },
      { wch: 15 },
    ];

    const wb = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      wb,
      ws,
      "Receipt Register"
    );

    XLSX.writeFile(
      wb,
      `Receipt_Register_${Date.now()}.xlsx`
    );
  };

  const handleSearch = async (values) => {
    try {
      setLoading(true);

      const selectedZone = zones.find(
        (z) => String(z.ZONEID) === String(values.ward)
      );

      const payload = {
        ulbId: ulbId,
        fromDate: formatDate(values.fromDate),
        toDate: formatDate(values.toDate),
        majorCode: values.deptCode || null,
        minorCode: values.ledger || null,
        zoneId: values.ward || null,
        zoneName: selectedZone?.ZONEENAME || null,
        gramPanchayatId: null,
        corpCode: null,
        budgetId: null,
        nidhiId: null,
        department: values.department
      };

      /* ================= PDF ================= */
      if (values.exportType === "PDF") {
        const res = await axios.post(
          `${BASE_URL}/api/RptRegister/transaction-report-pdf`,
          payload,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const pdfUrl = res.data?.pdfUrl;

        if (pdfUrl) {
          window.open(pdfUrl, "_blank");
        } else {
          Swal.fire("No Data", "No records found", "warning");
        }

        return;
      }

      /* ================= EXCEL ================= */

      const res = await axios.post(
        `${BASE_URL}/api/RptRegister/transaction-report`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const rows = res.data?.data?.list || [];

      if (!rows.length) {
        Swal.fire("No Data", "No records found", "warning");
        return;
      }

      exportTransactionExcel(
        rows,
        values,
        selectedZone?.ZONEENAME || "ALL"
      );

    } catch (err) {
      console.error(err);

      Swal.fire({
        text:
          err?.response?.data?.message ||
          "Unable to generate report",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await axios.post(
        `${BASE_URL}/api/Receipt/departments`,
        {
          ulbid: ulbId,
        },
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        },
      );
      setDepartments(res.data.data || []);
    } catch (err) {
      console.error("Department API Error:", err);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, [ulbId]);

  return (
    <Formik initialValues={getInitialValues()} onSubmit={handleSearch}>
      {({ values, setFieldValue, resetForm }) => (
        <Form>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="shadow-sm border rounded-lg">
              {/* Header */}
              <CardHeader className="border-b">
                <CardTitle className="text-lg font-semibold">
                  पावती नोंदणी तपशील
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* ROW 1 */}
                <div className="grid md:grid-cols-3 gap-4">
                  {/* <Row label="प्रभाग"> */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <div className="sm:w-36 shrink-0 flex justify-start sm:justify-between items-center">
                      <Label text="प्रभाग" />
                      <span>:</span>
                    </div>
                    <Select
                      value={values.ward || "ALL"}
                      onValueChange={(v) => setFieldValue("ward", v)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="-- निवडा --" />
                      </SelectTrigger>

                      <SelectContent>
                        {/* 🔥 ALL OPTION */}
                        <SelectItem value="-1">-- All --</SelectItem>

                        {zones.map((z) => (
                          <SelectItem key={z.ZONEID} value={String(z.ZONEID)}>
                            {z.ZONEENAME}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {/* </Row> */}

                  {/* <Row label="दिनांक पासून"> */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <div className="sm:w-36 shrink-0 flex justify-start sm:justify-between items-center">
                      <Label text="दिनांक पासून" />
                      <span>:</span>
                    </div>
                    <DatePicker
                      value={values.fromDate}
                      onChange={(date) => setFieldValue("fromDate", date)}
                    />
                  </div>
                  {/* </Row> */}

                  {/* <Row label="दिनांक पर्यंत"> */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <div className="sm:w-36 shrink-0 flex justify-start sm:justify-between items-center">
                      <Label text="दिनांक पासून" />
                      <span>:</span>
                    </div>
                    <DatePicker
                      value={values.toDate}
                      onChange={(date) => setFieldValue("toDate", date)}
                    />
                  </div>
                  {/* </Row> */}
                </div>

                {/* ROW 2 */}
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <div className="sm:w-36 shrink-0 flex justify-start sm:justify-between items-center">
                      <Label text="विभाग" />
                      <span>:</span>
                    </div>
                    <Select
                      value={values.department}
                      onValueChange={(v) => setFieldValue("department", v)}
                    >
                      <SelectTrigger className="w-full overflow-hidden">
                        <SelectValue placeholder="-- ALL --" />
                      </SelectTrigger>

                      <SelectContent>
                        <SelectItem

                          value="-1"
                        >
                          -- ALL --
                        </SelectItem>
                        {departments.map((d) => (
                          <SelectItem
                            key={d.DEPTID}
                            value={d.DEPTID.toString()}
                          >
                            {d.DEPTNAME}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <div className="sm:w-36 shrink-0 flex justify-start sm:justify-between items-center">
                      <Label text="विभाग संकेतांक" />
                      <span>:</span>
                    </div>
                    <SearchableSelect
                      options={glCodes.map((g) => ({
                        label: g.GLSEARCHNAME,
                        value: String(g.GLCODE),
                      }))}
                      value={values.deptCode}
                      onChange={async (selected) => {
                        setFieldValue("deptCode", selected.value);
                        setFieldValue("ledger", "");
                        await loadLedgers(selected.value);
                      }}
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <div className="sm:w-36 shrink-0 flex justify-start sm:justify-between items-center">
                      <Label text="लेखाशिर्ष" />
                      <span>:</span>
                    </div>
                    <SearchableSelect
                      options={ledgers.map((l) => ({
                        label: l.ACCNAME,
                        value: l.OBJECTCODE,
                      }))}
                      value={values.ledger}
                      onChange={(selected) =>
                        setFieldValue("ledger", selected.value)
                      }
                    />
                  </div>
                </div>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-4">
                    <Label className="text-sm font-medium">Export To :</Label>

                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        checked={values.exportType === "PDF"}
                        onChange={() => setFieldValue("exportType", "PDF")}
                      />
                      PDF
                    </label>

                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        checked={values.exportType === "Excel"}
                        onChange={() => setFieldValue("exportType", "Excel")}
                      />
                      Excel
                    </label>
                  </div>
                </div>

                {/* BUTTONS */}
                <div className="flex gap-3 justify-center">
                  <Button type="submit" disabled={loading}>
                    {loading ? "Loading..." : "प्रक्रिया"}
                  </Button>

                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => {
                      resetForm();
                      setTableData([]);
                    }}
                  >
                    हटवा
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate("/HomePage/FrmHomePage")}
                  >
                    बाहेर जा
                  </Button>
                </div>

                {/* ================= TABLE ================= */}
                {tableData.length > 0 && (
                  <div className="border rounded-md overflow-hidden">
                    <ShadCNTable
                      headers={[
                        "Date",
                        "Trans No",
                        "Doc No",
                        "GL Name",
                        "Account Name",
                        "Zone",
                        "Amount",
                        "Narration",
                        "Party Name",
                      ]}
                      keyMapping={{
                        Date: "TRNSDATE",
                        "Trans No": "TRANSNO",
                        "Doc No": "DOCNO",
                        "GL Name": "GLNAME",
                        "Account Name": "ACCNAME",
                        Zone: "ZONEENAME",
                        Amount: "AMOUNT",
                        Narration: "NARRATION",
                        "Party Name": "PARTYNAME",
                      }}
                      data={tableData.map((item) => ({
                        ...item,
                        TRNSDATE: new Date(item.TRNSDATE).toLocaleDateString(),
                      }))}
                      pagination
                      rowsPerPage={5}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </Form>
      )}
    </Formik>
  );
};

export default RptReceiptRegisterDetails;
