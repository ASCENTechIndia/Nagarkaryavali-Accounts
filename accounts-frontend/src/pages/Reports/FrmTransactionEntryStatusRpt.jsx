import React, { useEffect, useState } from "react";
import { Formik, Form } from "formik";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import config from "@/utils/config.jsx";
import Swal from "sweetalert2";
import * as XLSX from "xlsx";
import { DatePicker } from "@/components/ui/calendar";
import SearchableSelect from "@/components/SearchableSelect";
import { Input } from "@/components/ui/input";

const initialValues = {
  zoneId: "",
  fromDate: new Date(),
  toDate: new Date(),
  wardCode: "",
  userId: "",
  department: "-1",
  exportType: "pdf",
};

const FrmTransactionEntryStatusRpt = () => {
  const { user } = useAuth();
  const token = user?.token;
  const ulbId = user?.ulbId;
  const deptId = config.deptId;
  const navigate = useNavigate();

  const BASE_URL = import.meta.env.VITE_BASE_URL;

  const [zoneList, setZoneList] = useState([]);
  const [userList, setUserList] = useState([]);
  const [departments, setDepartments] = useState([]);

  const fetchZones = async () => {
    try {
      const res = await axios.post(
        `${BASE_URL}/api/Receipt/zones`,
        { corp_id: ulbId },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (res.data?.ok) {
        setZoneList(res.data.data || []);
      }
    } catch (err) {
      console.error("Zone API Error:", err);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await axios.post(
        `${BASE_URL}/api/FrmTransactionEntryStatusRpt/username-list`,
        {
          ulbId: ulbId,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (res.data?.success) {
        setUserList(res.data.rows || []);
      }
    } catch (err) {
      console.error("User API Error:", err);
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

      const data = res.data.data || [];

      const formattedData = [{ DEPTID: "-1", DEPTNAME: "-- ALL --" }, ...data];

      setDepartments(formattedData);
    } catch (err) {
      console.error("Department API Error:", err);
    }
  };

  useEffect(() => {
    fetchZones();
    fetchUsers();
    fetchDepartments();
  }, [ulbId]);

  const handleSubmit = async (values) => {
    try {
      console.log(values);

      if (!values.fromDate || !values.toDate) {
        Swal.fire({
          text: "कृपया दिनांक श्रेणी निवडा.",
          confirmButtonColor: "#1e3a8a",
        });
        return;
      }

      Swal.fire({
        title: "Processing...",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      const formatDate = (date) => {
        if (!date) return null;
        const d = new Date(date);
        const day = String(d.getDate()).padStart(2, "0");
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const year = d.getFullYear();
        return `${day}-${month}-${year}`;
      };
      const payload = {
        fromDate: formatDate(values.fromDate),
        toDate: formatDate(values.toDate),
        ulbId: ulbId,
        zoneId: values.zoneId || "-1",
        department: values.department || "-1",
        userId: values.userId || "0",
      };

      if (values.exportType === "pdf") {
        const { data } = await axios.post(
          `${BASE_URL}/api/FrmTransactionEntryStatusRpt/generate-transaction-entry-status-pdf`,
          payload,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        Swal.close();

        if (data.success) {
          window.open(data.pdfUrl, "_blank");
        } else {
          Swal.fire({
            icon: "error",
            text: data.message || "Unable to generate PDF",
          });
        }

        return;
      }

      // Excel
      const { data } = await axios.post(
        `${BASE_URL}/api/FrmTransactionEntryStatusRpt/report`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      Swal.close();

      const rows = data?.data?.rows || [];

      if (!rows.length) {
        return Swal.fire({
          icon: "info",
          text: "No data found.",
        });
      }


      const excelData = [];

      // excelData.push(["JALGAON MUNICIPAL CORPORATION"]);
      // excelData.push(["सरदार वल्लभ भाई पटेल टॉवर, प्रशासकीय इमारत"]);
      // excelData.push(["फोन:०२५७-२२२२२६१, ६२, ६३, ६४, ६५ फॅक्स: २२२२२६०"]);
      // excelData.push(["Transactions Entry Status"]);
      // excelData.push([
      //   `दिनांक पासून ${payload.fromDate} ते दिनांक पर्यंत ${payload.toDate}`,
      // ]);
      // excelData.push([]);


      excelData.push([
        "अ.क्र.",
        "दिनांक",
        "प्रभाग",
        "विभागाचे नाव",
        "वापरकर्ता आय. डी.",
        "पावती क्र.",
        "व्यवहार क्र.",
        "नोंदी संख्या",
        "पावती रक्कम",
      ]);


      let totalCount = 0;
      let totalAmount = 0;

      rows.forEach((item, index) => {
        const count = Number(item.CNT || 0);
        const amount = Number(item.AMOUNT || 0);

        totalCount += count;
        totalAmount += amount;

        excelData.push([
          index + 1,
          item.TRNSDATE || "",
          item.PRABHAGNAME || "",
          item.VIBHAGNAME || "",
          item.USERID || "",
          item.RECNO || "",
          item.TRANSNO || "",
          count,
          amount,
        ]);
      });

      excelData.push([
        "",
        "",
        "",
        "",
        "",
        "",
        "एकूण (Total)",
        totalCount,
        totalAmount,
      ]);

      const worksheet = XLSX.utils.aoa_to_sheet(excelData);

      worksheet["!cols"] = [
        { wch: 8 },   // Sr No
        { wch: 15 },  // Date
        { wch: 14 },  // Zone
        { wch: 35 },  // Department
        { wch: 18 },  // User
        { wch: 18 },  // Receipt
        { wch: 18 },  // Transaction
        { wch: 12 },  // Count
        { wch: 15 },  // Amount
      ];

      const workbook = XLSX.utils.book_new();

      XLSX.utils.book_append_sheet(
        workbook,
        worksheet,
        "Transaction Entry Status"
      );

      XLSX.writeFile(workbook, "Transaction_Entry_Status.xlsx");

    } catch (err) {
      console.error("Error:", err);
      Swal.close();
      Swal.fire({
        text:
          err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Something went wrong. Please try again.",
        confirmButtonColor: "#1e3a8a",
      });
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
              className="px-2 sm:px-4 mt-4 sm:mt-6"
            >
              <Card className="border shadow-sm">
                <CardHeader className="border-b">
                  <CardTitle className="text-lg font-semibold">
                    Transactions Entry Status
                  </CardTitle>
                </CardHeader>

                <CardContent className="p-4 sm:p-5 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <div className="sm:w-36 shrink-0 flex justify-start sm:justify-between items-center">
                        <Label text="वापरकर्ता" />
                        <span>:</span>
                      </div>

                      <Select
                        value={values.userId}
                        onValueChange={(v) => setFieldValue("userId", v)}
                      >
                        <SelectTrigger className="w-full h-9">
                          <SelectValue placeholder="-- विकल्प निवडा --" />
                        </SelectTrigger>

                        <SelectContent>
                          {userList.length > 0 ? (
                            userList.map((user) => (
                              <SelectItem key={user.USERID} value={user.USERID}>
                                {user.USERNAME}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="no-data" disabled>
                              No Users Found
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                      <div className="sm:w-36 shrink-0 flex justify-start sm:justify-between items-center">
                        <Label text="प्रभाग" />
                        <span>:</span>
                      </div>

                      <Select
                        value={values.zoneId}
                        onValueChange={(v) => setFieldValue("zoneId", v)}
                      >
                        <SelectTrigger className="w-full h-9 overflow-hidden">
                          <SelectValue placeholder="-- ALL --" />
                        </SelectTrigger>

                        <SelectContent>
                          <SelectItem value={"-1"}>-- ALL --</SelectItem>
                          {zoneList.map((zone) => (
                            <SelectItem
                              key={zone.ZONEID}
                              value={zone.ZONEID.toString()}
                            >
                              {zone.ZONEENAME}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <div className="sm:w-36 shrink-0 flex justify-start sm:justify-between items-center">
                        <Label text="विभाग" />
                        <span>:</span>
                      </div>
                      <Select
                        value={values.department}
                        onValueChange={(v) => setFieldValue("department", v)}
                      >
                        <SelectTrigger className="w-full h-9 overflow-hidden">
                          <SelectValue placeholder="-- विकल्प निवडा --" />
                        </SelectTrigger>

                        <SelectContent>
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
                        <Label text="Export To" />
                        <span>:</span>
                      </div>

                      <div className="flex flex-wrap items-center gap-4">
                        <label className="flex items-center gap-2 text-sm">
                          <Input
                            type="radio"
                            name="exportType"
                            checked={values.exportType === "pdf"}
                            onChange={() => setFieldValue("exportType", "pdf")}
                            className="h-4 w-4"
                          />
                          PDF
                        </label>

                        <label className="flex items-center gap-2 text-sm">
                          <Input
                            type="radio"
                            name="exportType"
                            checked={values.exportType === "excel"}
                            onChange={() =>
                              setFieldValue("exportType", "excel")
                            }
                            className="h-4 w-4"
                          />
                          Excel
                        </label>
                      </div>
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
        );
      }}
    </Formik>
  );
};

export default FrmTransactionEntryStatusRpt;
