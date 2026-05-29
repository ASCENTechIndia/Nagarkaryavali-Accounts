import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ShadCNTable from "@/components/ui/table";
import { useAuth } from "@/context/AuthContext";

import axios from "axios";
import { Form, Formik } from "formik";
import { motion } from "framer-motion";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

const container = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { staggerChildren: 0.08 },
  },
};

const initialFormValues = {
  search: "",
  fromDate: new Date(),
  toDate: new Date(),
};

const FrmReceiptReprint = () => {
  const { user } = useAuth();
  const token = user?.token;
  const ulbId = user?.ulbId;
  const navigate = useNavigate();
  const BASE_URL = import.meta.env.VITE_BASE_URL;

  const [loading, setLoading] = useState(false);
  const [tableData, setTableData] = useState([]);

  const headers = [
    "रिफ नं",
    "दिनांक",
    "व्यवहार प्रकार",
    "प्रभाग",
    "बँक नाव",
    "खाते क्रमांक",
    "कर नाव",
    "कर खाते",
    "शेरा",
    "रक्कम",
    "प्रिंट",
  ];

  const keyMapping = {
    "रिफ नं": "REFNO",
    दिनांक: "TRANSDATE",
    "व्यवहार प्रकार": "TRANSTYPE",
    प्रभाग: "ZONEENAME",
    "बँक नाव": "ACCNAME",
    "खाते क्रमांक": "ACCNO",
    "कर नाव": "TAXNAME",
    "कर खाते": "TAXAC",
    शेरा: "REMARKS",
    रक्कम: "AMOUNT",
    प्रिंट: "PRINT",
  };

  const columnStyles = {
    "रिफ नं": { width: "10%" },
    दिनांक: { width: "10%" },
    "व्यवहार प्रकार": { width: "12%" },
    प्रभाग: { width: "8%" },
    "बँक नाव": { width: "15%" },
    "खाते क्रमांक": { width: "12%" },
    "कर नाव": { width: "12%" },
    "कर खाते": { width: "10%" },
    शेरा: { width: "15%" },
    रक्कम: { width: "8%" },
    प्रिंट: { width: "8%" },
  };
  const formatDateForAPI = (date) => {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();

    return `${day}-${month}-${year}`;
  };

  const formatTableDate = (date) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("en-GB");
  };

  const handlePrint = async (row) => {
    try {
      Swal.fire({
        title: "Generating PDF...",
        allowOutsideClick: false,
        showConfirmButton: false,
        didOpen: () => Swal.showLoading(),
      });

      const pdfRes = await axios.post(
        `${BASE_URL}/api/Receipt/receipt-pdf`,
        {
          refno: row.REFNO,
          ulbid: Number(ulbId),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      Swal.close();

      if (pdfRes.data?.pdfUrl) {
        window.open(pdfRes.data.pdfUrl, "_blank");
      } else {
        Swal.fire({
          text: "PDF generation failed",
          icon: "error",
        });
      }
    } catch (error) {
      console.error("PDF ERROR:", error);

      Swal.fire({
        text: error.response?.data?.message || "PDF generation failed",
        icon: "error",
      });
    }
  };

  const handleSubmit = async (values) => {
    try {
      Swal.fire({
        title: "Processing...",
        text: "Please wait",
        allowOutsideClick: false,
        showConfirmButton: false,
        didOpen: () => Swal.showLoading(),
      });

      setLoading(true);

      const payload = {
        ulbid: Number(ulbId),
        fromDate: new Date(values.fromDate)
          .toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })
          .replace(/ /g, "-"),

        toDate: new Date(values.toDate)
          .toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })
          .replace(/ /g, "-"),
      };

      const res = await axios.post(
        `${BASE_URL}/api/Receipt/receiptdetailPdf`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      Swal.close();

      if (res?.data?.ok && res?.data?.data?.success) {
        const apiData = res.data.data.data || [];

        const formattedRows = apiData.map((item) => ({
          ...item,
          TRANSDATE: formatTableDate(item.TRANSDATE),
        }));

        setTableData(formattedRows);

        if (formattedRows.length === 0) {
          Swal.fire({
            text: "No Records found",
            confirmButtonColor: "#1e3a8a",
          });
        }
      } else {
        setTableData([]);

        Swal.fire({
          text: res.data?.message || "No Records found",
          confirmButtonColor: "#1e3a8a",
        });
      }
    } catch (error) {
      console.error(error);

      Swal.fire({
        text: error.response?.data?.message || "डेटा मिळवताना त्रुटी",
        confirmButtonColor: "#1e3a8a",
      });
    } finally {
      setLoading(false);
    }
  };

  const formattedData = tableData.map((item) => ({
    ...item,
    PRINT: (
      <button
        type="button"
        className="text-blue-700 hover:underline"
        onClick={() => handlePrint(item)}
      >
        Print
      </button>
    ),
  }));

  return (
    <Formik initialValues={initialFormValues} onSubmit={handleSubmit}>
      {({ values, setFieldValue, handleSubmit, isSubmitting }) => (
        <Form onSubmit={handleSubmit}>
          <motion.div variants={container} initial="hidden" animate="show">
            <Card className="shadow-sm border">
              <CardHeader className="border-b flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                <CardTitle className="text-lg font-semibold">
                  पावती रीप्रिंट
                </CardTitle>
              </CardHeader>

              <CardContent className="p-4 space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <div className="sm:w-40 flex justify-between">
                      <Label text="दिनांक पासून" />
                      <span>:</span>
                    </div>

                    <DatePicker
                      value={values.fromDate}
                      onChange={(date) => setFieldValue("fromDate", date)}
                      className="w-full h-9"
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <div className="sm:w-40 flex justify-between">
                      <Label text="दिनांक पर्यंत" />
                      <span>:</span>
                    </div>

                    <DatePicker
                      value={values.toDate}
                      onChange={(date) => setFieldValue("toDate", date)}
                      className="w-full h-9"
                    />
                  </div>
                </div>

                <div className="flex justify-center gap-4">
                  <Button type="submit" disabled={isSubmitting || loading}>
                    प्रक्रिया
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate(-1)}
                  >
                    बाहेर
                  </Button>
                </div>

                {formattedData.length > 0 && (
                  <ShadCNTable
                    headers={headers}
                    data={formattedData}
                    keyMapping={keyMapping}
                    columnStyles={columnStyles}
                    pagination={false}
                    className="border border-gray-300 max-sm:min-w-95"
                  />
                )}
              </CardContent>
            </Card>
          </motion.div>
        </Form>
      )}
    </Formik>
  );
};

export default FrmReceiptReprint;
