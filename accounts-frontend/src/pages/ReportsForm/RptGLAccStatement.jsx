import React, { useEffect, useState } from "react";
import { Formik, Form } from "formik";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import axios from "axios";
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
import Swal from "sweetalert2";
import * as XLSX from "xlsx";
import { DatePicker } from "@/components/ui/calendar";

import AsyncSearchableSelect from "@/components/AsyncSearchableSelect";

const initialValues = {
  zoneId: "-1",
  fromDate: new Date(),
  toDate: new Date(),
  wardCode: "",
  head: "",
  reportType: "0",
  exportType: "pdf",
};

export default function RptGLAccStatement() {
  const { user } = useAuth();
  const token = user?.token;
  const ulbId = user?.ulbId;
  const navigate = useNavigate();
  const BASE_URL = import.meta.env.VITE_BASE_URL;

  const [zoneList, setZoneList] = useState([]);
  const [glList, setGlList] = useState([]);
  const [headOptions, setHeadOptions] = useState([]);
  const [isHeadLoading, setIsHeadLoading] = useState(false);
  const [loadingGL, setLoadingGL] = useState(false);

  // ================= ZONES =================
  const fetchZones = async () => {
    try {
      const res = await axios.post(
        `${BASE_URL}/api/Receipt/zones`,
        { corp_id: ulbId },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setZoneList(res.data?.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  // ================= FUNCTIONS =================
  const searchGL = async (prefix, signal) => {
    try {
      setLoadingGL(true);

      // clear old options
      setGlList([]);

      // stop if empty
      if (!prefix?.trim()) {
        return;
      }

      const res = await axios.post(
        `${BASE_URL}/api/FrmAccount/searchGL`,
        {
          prefix: prefix.trim(),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          signal,
        },
      );

      const data = res?.data?.data?.data || [];

      setGlList(
        data.map((item) => ({
          label: item.GLSEARCHNAME,
          value: item.GLFUNCTION?.toString(),
        })),
      );
    } catch (error) {
      if (error.name === "AbortError" || error.code === "ERR_CANCELED") {
        return;
      }

      console.error("GL search error:", error);
      setGlList([]);
    } finally {
      setLoadingGL(false);
    }
  };

  // ================= ACCOUNT HEAD SEARCH =================
  const searchAccountHead = async (searchText, signal, functionCode) => {
    if (!functionCode) return;
    try {
      setIsHeadLoading(true);
      const res = await axios.post(
        `${BASE_URL}/api/RptGLAccStatement/searchAccountHead`,
        { ulbId, functionCode, prefix: searchText },
        { headers: { Authorization: `Bearer ${token}` }, signal },
      );

      const formatted = (res.data?.data?.data || []).map((item) => ({
        label: item.ACCNAME,
        value: item.OBJECTCODE,
      }));
      setHeadOptions(formatted);
    } catch (err) {
    } finally {
      setIsHeadLoading(false);
    }
  };

  useEffect(() => {
    fetchZones();
  }, []);

  // ================= SUBMIT =================
  const handleSubmit = async (values) => {
    try {
      Swal.fire({
        title: "Processing...",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      const formatDate = (d) => {
        const day = String(new Date(d).getDate()).padStart(2, "0");

        const month = new Date(d)
          .toLocaleString("en-US", {
            month: "short",
          })
          .toUpperCase();

        const year = new Date(d).getFullYear();

        return `${day}-${month}-${year}`;
      };

      const payload = {
        functioncode: values.wardCode || null,

        objectcode: values.head || null,

        fromDate: formatDate(values.fromDate),

        toDate: formatDate(values.toDate),

        zoneid: values.zoneId === "-1" ? null : values.zoneId,

        ulbId: ulbId,

        type: values.reportType,
      };

      console.log("Payload:", payload);

      // ================= PDF =================
      if (values.exportType === "pdf") {
        const pdfUrl =
          values.reportType === "0"
            ? `${BASE_URL}/api/RptGLAccStatement/transaction-summaryPdf`
            : `${BASE_URL}/api/RptGLAccStatement/transaction-detailsPdf`;

        const res = await axios.post(pdfUrl, payload, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        Swal.close();

        if (res.data?.success) {
          window.open(res.data.pdfUrl, "_blank");
        } else {
          Swal.fire({
            // icon: "error",
            text: "Failed to generate PDF",
          });
        }

        return;
      }

      // ================= EXCEL =================
      const excelUrl =
        values.reportType === "0"
          ? `${BASE_URL}/api/RptGLAccStatement/transaction-summaryExcel`
          : `${BASE_URL}/api/RptGLAccStatement/transaction-detailsExcel`;

      const res = await axios.post(excelUrl, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      Swal.close();

      const rows = res.data?.data || [];

      if (!rows.length) {
        Swal.fire({
          // icon: "warning",
          text: "No data found",
        });

        return;
      }

      // FORMAT DATES
      const formattedRows = rows.map((row) => {
        const formattedRow = {
          ...row,
        };

        // trnsdate formatting
        if (row.TRNSDATE || row.trnsdate) {
          const date = new Date(row.TRNSDATE || row.trnsdate);

          formattedRow.TRNSDATE = `${String(date.getDate()).padStart(2, "0")}-${String(date.getMonth() + 1).padStart(2, "0")}-${date.getFullYear()}`;
        }

        // chqdate formatting
        if (row.CHQDATE || row.chqdate) {
          const chqDate = new Date(row.CHQDATE || row.chqdate);

          formattedRow.CHQDATE = `${String(chqDate.getDate()).padStart(2, "0")}-${String(chqDate.getMonth() + 1).padStart(2, "0")}-${chqDate.getFullYear()}`;
        }

        return formattedRow;
      });

      const worksheet = XLSX.utils.json_to_sheet(formattedRows);

      // OPTIONAL COLUMN WIDTHS
      worksheet["!cols"] = [
        { wch: 15 },
        { wch: 20 },
        { wch: 40 },
        { wch: 15 },
        { wch: 15 },
        { wch: 15 },
        { wch: 15 },
      ];

      const workbook = XLSX.utils.book_new();

      XLSX.utils.book_append_sheet(workbook, worksheet, "Report");

      XLSX.writeFile(workbook, `GL_Report_${Date.now()}.xlsx`);
    } catch (err) {
      console.error("Handle Submit Error:", err);

      Swal.close();

      Swal.fire({
        icon: "error",
        text: err?.response?.data?.error,
      });
    }
  };

  return (
    <Formik initialValues={initialValues} onSubmit={handleSubmit}>
      {({ values, setFieldValue }) => (
        <Form>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            // className="px-2 sm:px-4 mt-4 sm:mt-6"
          >
            <Card className="border shadow-sm">
              <CardHeader className="border-b">
                <CardTitle className="text-lg font-semibold">
                  सामान्य खातेवही खाते विवरण
                </CardTitle>
              </CardHeader>

              <CardContent className="p-4 sm:p-5 space-y-4">
                {/* ROW 1 */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
                  {/* ZONE */}
                  <div>
                    <Label className="text-sm">प्रभाग :</Label>

                    <Select
                      value={values.zoneId}
                      onValueChange={(v) => setFieldValue("zoneId", v)}
                    >
                      <SelectTrigger className="w-full sm:flex-1">
                        <SelectValue placeholder="-- निवडा --" />
                      </SelectTrigger>

                      <SelectContent>
                        <SelectItem value="-1">-- सर्व --</SelectItem>

                        {zoneList.map((z) => (
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

                  {/* FROM DATE */}
                  <div>
                    <Label className="text-sm">दिनांक पासून :</Label>

                    <DatePicker
                      value={values.fromDate}
                      onChange={(d) => setFieldValue("fromDate", d)}
                    />
                  </div>

                  {/* TO DATE */}
                  <div>
                    <Label className="text-sm">दिनांक पर्यंत :</Label>

                    <DatePicker
                      value={values.toDate}
                      onChange={(d) => setFieldValue("toDate", d)}
                    />
                  </div>
                </div>

                {/* ROW 2 */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
                  {/* FUNCTION */}
                  <div>
                    <Label className="text-sm">विभाग संकेतांक :</Label>

                    <AsyncSearchableSelect
                      value={
                        glList.find((o) => o.value === values.wardCode) || null
                      }
                      options={glList}
                      isLoading={loadingGL}
                      placeholder="Search विभाग..."
                      onSearch={(text, signal) => searchGL(text, signal)}
                      onChange={(opt) => {
                        setFieldValue("wardCode", opt?.value || "");

                        setFieldValue("head", "");
                        setHeadOptions([]);
                      }}
                    />
                  </div>

                  {/* ACCOUNT HEAD */}
                  <div>
                    <Label className="text-sm">लेखाशिर्ष :</Label>

                    <AsyncSearchableSelect
                      value={
                        headOptions.find((o) => o.value === values.head) || null
                      }
                      options={headOptions}
                      isLoading={isHeadLoading}
                      placeholder="Search Account Head..."
                      onSearch={(text, signal) =>
                        searchAccountHead(text, signal, values.wardCode)
                      }
                      onChange={(opt) =>
                        setFieldValue("head", opt?.value || "")
                      }
                      disabled={!values.wardCode}
                    />
                  </div>
                </div>

                {/* ROW 3 */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                  {/* REPORT TYPE */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-6">
                    <Label className="text-sm whitespace-nowrap">
                      अहवालाचा प्रकार :
                    </Label>

                    <div className="flex flex-wrap gap-4">
                      <label className="flex items-center gap-2 text-sm">
                        <Input
                          type="radio"
                          checked={values.reportType === "0"}
                          onChange={() => setFieldValue("reportType", "0")}
                        />
                        सारांश
                      </label>

                      <label className="flex items-center gap-2 text-sm">
                        <Input
                          type="radio"
                          checked={values.reportType === "1"}
                          onChange={() => setFieldValue("reportType", "1")}
                        />
                        तपशील
                      </label>
                    </div>
                  </div>

                  {/* EXPORT TYPE */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-6">
                    <Label className="text-sm whitespace-nowrap">
                      Export To :
                    </Label>

                    <div className="flex flex-wrap gap-3">
                      <label className="flex items-center gap-2 text-sm">
                        <Input
                          type="radio"
                          checked={values.exportType === "pdf"}
                          onChange={() => setFieldValue("exportType", "pdf")}
                        />
                        PDF
                      </label>

                      <label className="flex items-center gap-2 text-sm">
                        <Input
                          type="radio"
                          checked={values.exportType === "excel"}
                          onChange={() => setFieldValue("exportType", "excel")}
                        />
                        Excel
                      </label>
                    </div>
                  </div>
                </div>

                {/* BUTTONS */}
                <div className="flex flex-wrap justify-center gap-3 pt-4">
                  <Button
                    type="submit"
                    className="bg-blue-900 text-white px-6 h-9"
                  >
                    प्रक्रिया
                  </Button>

                  <Button
                    type="reset"
                    variant="destructive"
                    className="px-6 h-9"
                  >
                    हटवा
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    className="px-6 h-9"
                    onClick={() => navigate("/HomePage/FrmHomePage")}
                  >
                    बाहेर जा
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </Form>
      )}
    </Formik>
  );
}
