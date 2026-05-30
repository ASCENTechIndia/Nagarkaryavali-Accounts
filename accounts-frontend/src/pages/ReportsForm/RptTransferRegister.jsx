import { Formik, Form } from "formik";
import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
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
import { de } from "date-fns/locale";

/* ================= INITIAL ================= */
const getInitialValues = () => {
  const today = new Date();
  return {
    zoneId: "",
    fromDate: today,
    toDate: today,
    trnstypeid: "",
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

const RptTransferRegister = () => {
  const { user } = useAuth();
  const token = user?.token;
  const ulbId = user?.ulbId;
  const BASE_URL = import.meta.env.VITE_BASE_URL;

  const navigate = useNavigate();

  const [zones, setZones] = useState([]);
  const [trnTypes, setTrnTypes] = useState([]);
  const [loading, setLoading] = useState(false);

  /* ================= LOAD ZONES ================= */
  useEffect(() => {
    axios
      .post(
        `${BASE_URL}/api/Receipt/zones`,
        { corp_id: ulbId },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      .then((res) => setZones(res.data?.data || []))
      .catch(console.error);
  }, [ulbId]);

  /* ================= LOAD TRANSACTION TYPES ================= */
  useEffect(() => {
    debugger;
    axios
      .get(`${BASE_URL}/api/RptTransferRegister/transfer-type`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setTrnTypes(res.data?.data?.data || []);
      })
      .catch(console.error);
  }, []);



  const handleSearch = async (values) => {
    if (!values.fromDate || !values.toDate) {
      Swal.fire({
        text: "Please select date",
        // icon: "warning",
      });
      return;
    }

    if (!values.trnstypeid) {
      Swal.fire({
        text: "Please select transtype",
      });
      return;
    }

    Swal.fire({
      title: "Generating Report...",
      text: "Please wait",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    const formatDate = (date) => {
      const d = new Date(date);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    const payload = {
      ulbId: Number(ulbId),
      fromDate: formatDate(values.fromDate),
      toDate: formatDate(values.toDate),
      trnsType: values.trnstypeid || "",
    };

    try {
      const url =
        values.exportType === "PDF"
          ? "/api/FrmSecurityDeposit/TransferReportpdf"
          : "/api/FrmSecurityDeposit/TransferReport";

      const res = await axios.post(`${BASE_URL}${url}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 120000,
      });

      Swal.close();

      if (values.exportType === "PDF") {
        if (res.data?.pdfUrl) {
          window.open(res.data.pdfUrl, "_blank");
        } else {
          Swal.fire("Error", "PDF not generated", "error");
        }
        return;
      }

      /* ================= EXCEL ================= */
      const list = res.data?.data?.list || [];

      if (!list.length) {
        Swal.fire("No Data", "No records found", "info");
        return;
      }

      /* 🔹 Format Data */
      const formattedData = list.map((item) => ({
        DATE: item.TRNSDATE
          ? new Date(item.TRNSDATE).toLocaleDateString("en-GB")
          : "",
        TRANS_NO: item.TRANSNO,
        DOC_NO: item.DOCNO,
        GLCODE: item.GLCODE,
        GLNAME: item.GLNAME,
        ACCNO: item.ACCNO,
        ACCNAME: item.ACCNAME,
        DEPARTMENT: item.DEPTNAME,
        CREDIT: item.CREDIT,
        DEBIT: item.DEBIT,
        BUDGETCODE: item.BUDGETCODE,
        FUNCTIONCODE: item.FUNCTIONCODE,
        OBJECTCODE: item.OBJECTCODE,
      }));

      /* 🔹 Create Sheet */
      const worksheet = XLSX.utils.json_to_sheet(formattedData);

      /* 🔹 Column Widths (optional but good UI) */
      worksheet["!cols"] = [
        { wch: 12 },
        { wch: 11 },
        { wch: 11 },
        { wch: 10 },
        { wch: 28 },
        { wch: 14 },
        { wch: 28 },
        { wch: 13 },
        { wch: 11 },
        { wch: 11 },
        { wch: 12 },
        { wch: 14 },
        { wch: 15 },
      ];

      /* 🔹 Workbook */
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(
        workbook,
        worksheet,
        "Transfer Register"
      );

      /* 🔹 Direct Download (NO file-saver) */
      XLSX.writeFile(
        workbook,
        `Transfer_Register_${Date.now()}.xlsx`
      );

      Swal.fire("Success", `Exported ${list.length} records`, "success");

    } catch (err) {
      console.error(err);

      Swal.close();

      Swal.fire({
        text:
          err?.response?.data?.message ||
          "Something went wrong.",
        // icon: "error",
      });
    }
  };

  return (
    <Formik initialValues={getInitialValues()} onSubmit={handleSearch}>
      {({ values, setFieldValue, resetForm }) => (
        <Form>
          <Card className="shadow-sm border rounded-lg">
            {/* HEADER */}
            <CardHeader className="border-b">
              <CardTitle className="text-lg font-semibold">
                हस्तांतरण नोंदणी अहवाल
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-6">

              {/* ROW 1 */}
              <div className="grid md:grid-cols-3 gap-4">

                {/* PRABHAG */}
                <Row label="प्रभाग">
                  <Select
                    value={values.zoneId}
                    onValueChange={(v) => setFieldValue("zoneId", v)}
                  >
                    <SelectTrigger className="w-full" >
                      <SelectValue placeholder="-- ALL --" />
                    </SelectTrigger>
                    <SelectContent>
                      {zones.map((z) => (
                        <SelectItem key={z.ZONEID} value={String(z.ZONEID)}>
                          {z.ZONEENAME}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Row>

                {/* FROM DATE */}
                <Row label="दिनांक पासून">
                  <DatePicker
                    value={values.fromDate}
                    onChange={(date) => setFieldValue("fromDate", date)}
                  />
                </Row>

                {/* TO DATE */}
                <Row label="दिनांक पर्यंत">
                  <DatePicker
                    value={values.toDate}
                    onChange={(date) => setFieldValue("toDate", date)}
                  />
                </Row>
              </div>

              {/* ROW 2 */}
              <div className="grid md:grid-cols-3 gap-4">

                {/* TRANSACTION TYPE */}
                <Row label="व्यवहार प्रकार">
                  <Select
                    value={values.trnstypeid}
                    onValueChange={(v) => setFieldValue("trnstypeid", v)}
                  >
                    <SelectTrigger className="w-full" >
                      <SelectValue placeholder="-- निवडा --" />
                    </SelectTrigger>
                    <SelectContent>
                      {trnTypes.map((t) => (
                        <SelectItem
                          key={t.TRNSTYPEID}
                          value={String(t.TRNSTYPEID)}
                        >
                          {t.TRNSTYPE}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Row>

                {/* EXPORT */}
                <div className="flex items-center gap-4">
                  <Label>Export To :</Label>

                  <label className="flex gap-2">
                    <input
                      type="radio"
                      checked={values.exportType === "PDF"}
                      onChange={() => setFieldValue("exportType", "PDF")}
                    />
                    PDF
                  </label>

                  <label className="flex gap-2">
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
                  onClick={() => resetForm()}
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

            </CardContent>
          </Card>
        </Form>
      )}
    </Formik>
  );
};

export default RptTransferRegister;