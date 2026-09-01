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

const initialValues = {
  zoneId: "",
  fromDate: new Date(),
  toDate: new Date(),
  wardCode: "",
  head: "",
  userId: "",
  transactionType: "1",
  exportType: "pdf",
  status: "D",
};

const FrmRevokeDeleteRegister = () => {
  const { user } = useAuth();
  const token = user?.token;
  const ulbId = user?.ulbId;
  const navigate = useNavigate();

  const BASE_URL = import.meta.env.VITE_BASE_URL;

  const formatDate = (date) => {
    const d = new Date(date);

    const months = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];

    const day = String(d.getDate()).padStart(2, "0");
    const month = months[d.getMonth()];
    const year = d.getFullYear();

    return `${day}-${month}-${year}`;
  };

  const handleSubmit = async (values) => {
    try {
      Swal.fire({
        title: "Processing...",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      const transactionTypeMap = {
        1: "receipt",
        2: "payment",
        3: "transfer",
        4: "contra",
        5: "voucher",
      };

      const payloadParams = {
        fromDate: formatDate(values.fromDate),
        toDate: formatDate(values.toDate),
        ulbid: ulbId,
        type: transactionTypeMap[values.transactionType],
        flag: values.status,
      };

      const res = await axios.get(`${BASE_URL}/api/Tranrevoke/getrevokelist`, {
        params: payloadParams,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const list = res.data?.data?.rows || [];

      console.log("list : ", list);

      if (list.length === 0) {
        Swal.close();
        setTimeout(() => {
          Swal.fire({
            text: "No data found",
            confirmButtonColor: "#1e3a8a",
          });
        }, 100);

        return;
      }

      if (values.exportType === "pdf") {
        const pdfRes = await axios.post(
          `${BASE_URL}/api/Tranrevoke/getrevokelistpdf`,
          payloadParams,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        Swal.close();

        if (pdfRes.data?.success && pdfRes.data?.pdfUrl) {
          window.open(pdfRes.data.pdfUrl, "_blank");
        } else {
          Swal.fire({
            text: "No data found",
          });
        }

        return;
      }

      const excelData = list.map((item, index) => ({
        "अ.क्र": index + 1,
        "रीवोक दिनांक": formatDate(item.REVOKEDATE),
        "व्यवहार प्रकार": item.TRANSTYPE,
        "व्यवहार क्रमांक": item.TRANSNO,
        "चलन/पावती क्र.": item.RECNO,
        "व्यवहार दिनांक": formatDate(item.TRANSDATE),
        "मेजर कोड": item.MAJORCODE,
        "मायनर कोड": item.MINORCODE,
        "मायनर कोड नाव": item.MINORCODENAME,
        झोन: item.ZONENAME,
        "धनादेश क्र.": item.CHEQUENO || "",
        "धनादेश दिनांक": item.CHEQUEDATE ? formatDate(item.CHEQUEDATE) : "",
        "जमा / खर्च तपशील": item.TAPSHIL,
        "पार्टी कोड": item.PARTYNAME || "",
        अर्थसंकल्प: item.ARTHSANKALP || "",
        "नोंद केलेल्या वापरकर्त्याचे नाव": item.INSBY,
        रक्कम: item.AMOUNT,
        "रीवोक करण्याचे कारण": item.REVOKEREMARK,
        "रीवोक करणाऱ्या वापरकर्त्याचे नाव": item.REVOKEBY,
      }));

      const worksheet = XLSX.utils.json_to_sheet(excelData);

      worksheet["!cols"] = [
        { wch: 8 },
        { wch: 18 },
        { wch: 18 },
        { wch: 18 },
        { wch: 18 },
        { wch: 18 },
        { wch: 15 },
        { wch: 18 },
        { wch: 30 },
        { wch: 18 },
        { wch: 18 },
        { wch: 18 },
        { wch: 35 },
        { wch: 25 },
        { wch: 20 },
        { wch: 35 },
        { wch: 15 },
        { wch: 35 },
        { wch: 35 },
      ];

      const workbook = XLSX.utils.book_new();

      XLSX.utils.book_append_sheet(workbook, worksheet, "Revoke Register");

      const timestamp = new Date()
        .toISOString()
        .split("T")[0]
        .replace(/-/g, "");

      XLSX.writeFile(workbook, `Revoke_Register_${timestamp}.xlsx`);
    } catch (err) {
      console.error("Submit Error:", err);

      Swal.close();

      Swal.fire({
        text: err.response?.data?.message || "No data found",
      });
    } finally {
      Swal.close();
    }
  };

  return (
    <Formik initialValues={initialValues} onSubmit={handleSubmit}>
      {({ values, setFieldValue }) => {
        return (
          <Form>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-2 sm:p-4"
            >
              <Card className="border shadow-sm">
                <CardHeader className="border-b py-3">
                  <CardTitle className="text-lg font-semibold">
                    Revoke Register
                  </CardTitle>
                </CardHeader>

                <CardContent className="p-4">
                  <div className="sm:p-4 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label
                          className="text-sm font-semibold whitespace-nowrap"
                          text="तारीख पासून :"
                        />

                        <DatePicker
                          value={values.fromDate}
                          onChange={(date) => setFieldValue("fromDate", date)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label
                          className="text-sm font-semibold whitespace-nowrap"
                          text="तारीख पर्यंत :"
                        />

                        <DatePicker
                          value={values.toDate}
                          onChange={(date) => setFieldValue("toDate", date)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label
                          className="text-sm font-semibold whitespace-nowrap"
                          text="व्यवहार प्रकार :"
                        />

                        <Select
                          value={values.transactionType}
                          onValueChange={(v) =>
                            setFieldValue("transactionType", v)
                          }
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select Type" />
                          </SelectTrigger>

                          <SelectContent>
                            <SelectItem value="1">Receipt</SelectItem>

                            <SelectItem value="2">Payment</SelectItem>

                            <SelectItem value="3">Transfer</SelectItem>

                            <SelectItem value="4">Contra</SelectItem>

                            <SelectItem value="5">Voucher Revoke</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                      <div className="flex flex-col sm:flex-row gap-3 ">
                        <Label className="text-sm font-semibold">
                          Export To :
                        </Label>

                        <div className="flex flex-wrap items-center gap-6 px-4 py-3 min-h-[42px]">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <Input
                              type="radio"
                              name="exportType"
                              value="pdf"
                              checked={values.exportType === "pdf"}
                              onChange={() =>
                                setFieldValue("exportType", "pdf")
                              }
                              className="w-4 h-4"
                            />
                            Pdf
                          </label>

                          <label className="flex items-center gap-2 cursor-pointer">
                            <Input
                              type="radio"
                              name="exportType"
                              value="excel"
                              checked={values.exportType === "excel"}
                              onChange={() =>
                                setFieldValue("exportType", "excel")
                              }
                              className="w-4 h-4"
                            />
                            Excel
                          </label>
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-3">
                        <Label className="text-sm font-semibold" text="Status :" />

                        <div className="flex flex-wrap items-center gap-6 px-4 py-3 min-h-[42px]">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <Input
                              type="radio"
                              name="status"
                              value="D"
                              checked={values.status === "D"}
                              onChange={() => setFieldValue("status", "D")}
                              className="w-4 h-4"
                            />
                            Delete
                          </label>

                          <label className="flex items-center gap-2 cursor-pointer">
                            <Input
                              type="radio"
                              name="status"
                              value="R"
                              checked={values.status === "R"}
                              onChange={() => setFieldValue("status", "R")}
                              className="w-4 h-4"
                            />
                            Revoke
                          </label>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row justify-center gap-3 pt-6">
                      <Button
                        type="submit"
                        className="bg-blue-900 hover:bg-blue-800 text-white px-8 h-10 w-full sm:w-auto"
                      >
                        Process
                      </Button>

                      <Button
                        type="reset"
                        className="bg-blue-900 hover:bg-blue-800 text-white px-8 h-10 w-full sm:w-auto"
                      >
                        Clear
                      </Button>

                      <Button
                        type="button"
                        variant="outline"
                        className="px-6 h-10 text-red-600 border-gray-300 w-full sm:w-auto"
                        onClick={() => navigate("/HomePage/FrmHomePage")}
                      >
                        Exit
                      </Button>
                    </div>
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

export default FrmRevokeDeleteRegister;
