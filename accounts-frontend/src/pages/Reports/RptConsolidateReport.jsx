import React from "react";
import { Formik, Form } from "formik";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import config from "@/utils/config.jsx";
import Swal from "sweetalert2";
import { DatePicker } from "@/components/ui/calendar";

const initialValues = {
  fromDate: new Date(),
  toDate: new Date(),
};

const RptConsolidateReport = () => {
  const { user } = useAuth();
  const token = user?.token;
  const ulbId = user?.ulbId;
  const navigate = useNavigate();
  const BASE_URL = import.meta.env.VITE_BASE_URL;

  const handleSubmit = async (values) => {
    try {
      Swal.fire({
        title: "Processing...",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      const formatDate = (date) => {
        if (!date) return null;
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
      };

      const payload = {
        fromDate: formatDate(values.fromDate),
        toDate: formatDate(values.toDate),
        ulbId: ulbId
      };

      const res = await axios.post(
        `${BASE_URL}/api/RptConsolidateReport/consolidate-challan-pdf`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      Swal.close();

      if (res.data?.success && res.data.pdfUrl) {
        window.open(res.data.pdfUrl, "_blank");
      } else {
        Swal.fire({
          text: res.data?.message || "Failed to generate PDF",
          confirmButtonColor: "#1e3a8a",
        });
      }
    } catch (err) {
      console.error("Error:", err);
      Swal.close();
      Swal.fire({
        text:
          err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Something Went Wrong",
        confirmButtonColor: "#1e3a8a",
      });
    }
  };

  return (
    <Formik initialValues={initialValues} onSubmit={handleSubmit}>
      {({ values, setFieldValue, resetForm }) => (
        <Form>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="px-2 sm:px-4 mt-4 sm:mt-6"
          >
            <Card className="border shadow-sm">
              <CardHeader className="border-b">
                <CardTitle className="text-lg font-semibold">
                  Consolidate Challan
                </CardTitle>
              </CardHeader>

              <CardContent className="p-4 sm:p-5 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <div className="sm:w-36 shrink-0 flex justify-start sm:justify-between items-center">
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
                    <div className="sm:w-36 shrink-0 flex justify-start sm:justify-between items-center">
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

                <div className="flex justify-center flex-wrap gap-4 pt-4">
                  <Button
                    type="submit"
                    className="bg-blue-900 text-white px-6 h-9"
                  >
                    प्रक्रिया
                  </Button>

                  <Button
                    type="button"
                    variant="destructive"
                    className="px-6 h-9"
                    onClick={() => resetForm()}
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
};

export default RptConsolidateReport;