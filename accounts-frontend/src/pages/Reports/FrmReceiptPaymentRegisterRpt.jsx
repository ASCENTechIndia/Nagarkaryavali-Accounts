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
import { FrmReceiptPaymentRegisterRptValidationSchema } from "../validations/global.validation";

const container = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { staggerChildren: 0.08 } },
};

const FrmReceiptPaymentRegisterRpt = () => {
  const { user } = useAuth();
  const token = user?.token;
  const ulbId = user?.ulbId;
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);

  const BASE_URL = import.meta.env.VITE_BASE_URL;

  const initialFormValues = {
    fromDate: new Date(),
    toDate: new Date(),
  };
  
  const formatDateForAPI = (date) => {
    const d = new Date(date);

    const day = String(d.getDate()).padStart(2, "0");
    const month = d
        .toLocaleString("en-US", { month: "short" })
        .toUpperCase();
    const year = d.getFullYear();

    return `${day}-${month}-${year}`; 
  };

  const handlePDFExport = async (values) => {
    let loaderSwal;

    try {
        const validationResult = FrmReceiptPaymentRegisterRptValidationSchema.safeParse(values);
        
        if (!validationResult.success) {
            const firstError = validationResult.error.issues[0];
            await Swal.fire({
                text: firstError.message,
                confirmButtonColor: "#1e3a8a",
            });
            return;
        }

        loaderSwal = Swal.fire({
            title: "Generating...",
            text: "Please wait for receipt payment register pdf",
            allowOutsideClick: false,
            showConfirmButton: false,
            didOpen: () => Swal.showLoading(),
        });

        const payload = {
          ulbId: Number(ulbId),
          fromDate: formatDateForAPI(values.fromDate),
          toDate: formatDateForAPI(values.toDate),
        };

        setLoading(true);

        const res = await axios.post(
        `${BASE_URL}/api/ReceiptPaymentRegister/generate-receipt`,
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
    <Formik initialValues={initialFormValues} onSubmit={handlePDFExport}>
      {({ values, setFieldValue, isSubmitting, handleSubmit }) => (
        <Form onSubmit={handleSubmit}>
          <motion.div variants={container} initial="hidden" animate="show">
            <Card className="shadow-sm border">
              <CardHeader className="border-b flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                <CardTitle className="text-lg font-semibold">
                  सर्वसाधारण रोकडवही / रोखपालाची रोकडवही
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
                </div>

                <div className="flex justify-center gap-4">
                  <Button type="submit" disabled={isSubmitting || loading}>
                    {loading ? "लोड करत आहे..." : "प्रक्रिया"}
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    path="/HomePage/FrmHomePage"
                  >
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

export default FrmReceiptPaymentRegisterRpt;