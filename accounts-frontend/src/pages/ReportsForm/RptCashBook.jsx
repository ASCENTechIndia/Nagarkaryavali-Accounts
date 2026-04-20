import { Formik, Form } from "formik";
import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "@/context/AuthContext";
import Swal from "sweetalert2";

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

import ShadCNTable from "@/components/ui/table";
import { set } from "date-fns";

/* ================= INITIAL ================= */
const getInitialValues = () => {
  return {
    ward: "-1", // ✅ FIXED (no empty string)
    date: new Date(),
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

const CashBook = () => {
  const { user } = useAuth();
  const token = user?.token;
  const ulbId = user?.ulbId;
  const BASE_URL = import.meta.env.VITE_BASE_URL;

  const [zones, setZones] = useState([]);
  const [tableData, setTableData] = useState([]);
  const [buttonLoading, setButtonLoading] = useState([]);
  const [loading, setLoading] = useState(false);

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

  /* ================= HANDLE SEARCH ================= */
  const handleSearch = async (values) => {
    try {
      setLoading(true);

      const payload = {
        ulbId,
        date: values.date?.toISOString()?.split("T")[0],
        zoneId: values.ward === "ALL" ? null : values.ward, // ✅ FIXED
        exportType: values.exportType,
      };

      const res = await axios.post(
        `${BASE_URL}/api/RptCashBook/report`,
        payload,
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: values.exportType === "Excel" ? "blob" : "json",
        },
      );

      /* ================= PDF ================= */
      if (values.exportType === "PDF") {
        const pdfUrl = res.data?.pdfUrl;

        if (pdfUrl) {
          window.open(pdfUrl, "_blank");
        } else {
          Swal.fire("No Data", "No records found", "warning");
        }
        return;
      }

      /* ================= EXCEL ================= */
      if (values.exportType === "Excel") {
        const blob = new Blob([res.data], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });

        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");

        link.href = url;
        link.download = `CashBook_${Date.now()}.xlsx`;

        document.body.appendChild(link);
        link.click();
        link.remove();

        window.URL.revokeObjectURL(url);
        return;
      }

      /* ================= TABLE ================= */
      const list = res.data?.data || [];

      if (list.length === 0) {
        Swal.fire("No Data", "No records found", "warning");
      }
      setButtonLoading(values.exportType); // Set loading state for the clicked button
      setTableData(list);
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Something went wrong", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Formik initialValues={getInitialValues()} onSubmit={handleSearch}>
      {({ values, setFieldValue, resetForm }) => (
        <Form>
          <Card className="shadow-sm border rounded-lg">
            {/* HEADER */}
            <CardHeader className="border-b">
              <CardTitle className="text-lg font-semibold">कॅश बुक</CardTitle>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* FILTER ROW */}
              <div className="grid md:grid-cols-3 gap-4">
                {/* ZONE */}
                <Row label="झोन">
                  <Select
                    value={values.ward}
                    onValueChange={(v) => setFieldValue("ward", v)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="-- ALL --" />
                    </SelectTrigger>

                    <SelectContent>
                      {/* ✅ FIXED (NO EMPTY VALUE) */}
                      <SelectItem value="-1">-- ALL --</SelectItem>

                      {zones.map((z) => (
                        <SelectItem key={z.ZONEID} value={String(z.ZONEID)}>
                          {z.ZONEENAME}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Row>

                {/* DATE */}
                <Row label="दिनांक">
                  <DatePicker
                    value={values.date}
                    onChange={(d) => setFieldValue("date", d)}
                  />
                </Row>

                {buttonLoading.length > 0 && (
                  <div className="flex items-center gap-3">
                    <Button
                      type="submit"
                      disabled={loading}
                      onClick={() => setFieldValue("exportType", "PDF")}
                    >
                      {loading ? "Loading..." : "छापा"}
                    </Button>

                    <Button
                      type="submit"
                      disabled={loading}
                      onClick={() => setFieldValue("exportType", "Excel")}
                    >
                      Excel
                    </Button>
                  </div>
                )}
                {/* EXPORT BUTTONS */}
              </div>

              {/* TABLE */}
              {tableData.length > 0 && (
                <div className="border rounded-md overflow-hidden">
                  <ShadCNTable
                    headers={[
                      "अनुक्रमांक",
                      "दिनांक",
                      "प्रमाणक क्र.",
                      "खाते कोड",
                      "कथन",
                      "रोख रक्कम",
                      "बँकेची रक्कम",
                      "शिल्लक",
                    ]}
                    keyMapping={{
                      अनुक्रमांक: "SRNO",
                      दिनांक: "DATE",
                      "प्रमाणक क्र.": "DOCNO",
                      "खाते कोड": "ACCODE",
                      कथन: "NARRATION",
                      "रोख रक्कम": "CASH",
                      "बँकेची रक्कम": "BANK",
                      शिल्लक: "BALANCE",
                    }}
                    data={tableData.map((item) => ({
                      ...item,
                      DATE: new Date(item.DATE).toLocaleDateString(),
                    }))}
                    pagination
                    rowsPerPage={5}
                  />
                </div>
              )}

              {/* TOTAL SECTION */}
              {tableData.length > 0 && (
                <div className="flex justify-center gap-4 items-center">
                  <Label>एकूण :</Label>
                  <input className="border p-1 w-24" value="0" readOnly />
                  <input className="border p-1 w-24" value="0" readOnly />
                  <input className="border p-1 w-24" value="0" readOnly />
                  <input className="border p-1 w-24" value="0" readOnly />
                </div>
              )}

              {/* ACTION BUTTONS */}
              <div className="flex gap-3 justify-center">
                <Button type="submit" disabled={loading}>
                  प्रक्रिया
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

                <Button variant="outline">बाहेर जा</Button>
              </div>
            </CardContent>
          </Card>
        </Form>
      )}
    </Formik>
  );
};

export default CashBook;
