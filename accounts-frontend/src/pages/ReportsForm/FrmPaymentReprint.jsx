import React, { useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { Formik, Form } from "formik";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/calendar";
import ShadCNTable from "@/components/ui/table";

const initialValues = {
  fromDate: new Date(),
  toDate: new Date(),
};

const FrmPaymentReprint = () => {
  const { user } = useAuth();

  const token = user?.token;
  const ulbId = user?.ulbId;
  const BASE_URL = import.meta.env.VITE_BASE_URL;

  const [tableData, setTableData] = useState([]);

  const formatDate = (date) => {
    if (!date) return "";

    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, "0");
    const months = [
      "JAN", "FEB", "MAR", "APR", "MAY", "JUN",
      "JUL", "AUG", "SEP", "OCT", "NOV", "DEC",
    ];

    return `${day}-${months[d.getMonth()]}-${d.getFullYear()}`;
  };

  const formatDisplayDate = (date) => {
    if (!date) return "";
    return new Date(date).toLocaleDateString("en-GB");
  };

  const fetchData = async (values) => {
    try {
      Swal.fire({
        title: "Loading...",
        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: false,
        didOpen: () => Swal.showLoading(),
      });

      const payload = {
        fromDate: formatDate(values.fromDate),
        toDate: formatDate(values.toDate),
        ulbid: Number(ulbId),
      };

      const res = await axios.post(
        `${BASE_URL}/api/FrmContraRecReprint/payment-list`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const rows = res?.data?.data?.data || [];

      if (rows.length === 0) {
        setTableData([]);
        Swal.close();

        await Swal.fire({
          title: "No Data Found",
          confirmButtonText: "OK",
        });

        return;
      }

      setTableData(
        rows.map((row) => ({
          refno: row.REFNO,
          voucherno: row.TRANSNO,
          zonename: row.ZONEENAME,
          transdate: formatDisplayDate(row.TRANSDATE),
          amount: row.AMT,
          print: (
            <button
              type="button"
              className="text-blue-600 hover:underline hover:cursor-pointer"
              onClick={() => handlePrint(row.REFNO)}
            >
              Print
            </button>
          ),
        }))
      );
    } catch (error) {
      console.error("Fetch error:", error);
      setTableData([]);

      Swal.fire({
        icon: "error",
        title: "Error",
        text:
          error?.response?.data?.message ||
          "Failed to fetch data.",
      });
    } finally {
      Swal.close();
    }
  };

  const handlePrint = async (refno) => {
    try {
      Swal.fire({
        title: "Generating PDF...",
        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: false,
        didOpen: () => Swal.showLoading(),
      });

      const res = await axios.post(
        `${BASE_URL}/api/frmPayment/payment-pdf`,
        {
          refno,
          ulbid: Number(ulbId),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const pdfUrl = res?.data?.pdfUrl;

      Swal.close();

      if (pdfUrl) {
        window.open(pdfUrl, "_blank");
      }
    } catch (error) {
      Swal.close();

      Swal.fire({
        icon: "error",
        title: "Error",
        text:
          error?.response?.data?.message ||
          "Failed to generate PDF.",
      });
    }
  };

  const headers = [
    "रेफ क्रमांक",
    "व्यवहार क्रमांक",
    "प्रभाग",
    "व्हाउचर दिनांक",
    "रक्कम",
    "प्रिंट",
  ];

  const keyMapping = {
    "रेफ क्रमांक": "refno",
    "व्यवहार क्रमांक": "voucherno",
    "प्रभाग": "zonename",
    "व्हाउचर दिनांक": "transdate",
    "रक्कम": "amount",
    "प्रिंट": "print",
  };

  return (
    <Formik initialValues={initialValues} onSubmit={() => {}}>
      {({ values, setFieldValue, resetForm }) => (
        <Form>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Card className="border shadow-sm">
              <CardHeader className="border-b">
                <CardTitle className="text-xl font-semibold">
                  पेट पेमेंट रिप्रिंट
                </CardTitle>
              </CardHeader>

              <CardContent className="p-4 md:p-6 space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <div className="w-full sm:w-40 shrink-0 flex justify-between items-center">
                        <Label text="दिनांक पासून" />
                        <span>:</span>
                      </div>
                      <div className="flex-1">
                        <DatePicker
                          value={values.fromDate}
                          onChange={(date) =>
                            setFieldValue("fromDate", date)
                          }
                        />
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <div className="w-full sm:w-40 shrink-0 flex justify-between items-center">
                        <Label text="दिनांक पर्यंत" />
                        <span>:</span>
                      </div>
                      <div className="flex-1">
                        <DatePicker
                          value={values.toDate}
                          onChange={(date) =>
                            setFieldValue("toDate", date)
                          }
                        />
                      </div>
                    </div>
                  </div>

                <div className="flex flex-wrap justify-center gap-3">
                  <Button
                    type="button"
                    onClick={() => fetchData(values)}
                  >
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
                    बाहेर
                  </Button>
                </div>

                {tableData.length > 0 && (
                  <ShadCNTable
                    headers={headers}
                    data={tableData}
                    keyMapping={keyMapping}
                    className="max-md:min-w-200"
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

export default FrmPaymentReprint;