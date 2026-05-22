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
  head: "",
  userId: "",
  reportType: "1",
  exportType: "pdf",
};

const RptPaymentRegisterDetails = () => {
  const { user } = useAuth();
  const token = user?.token;
  const ulbId = user?.ulbId;
  const deptId = config.deptId;
  const navigate = useNavigate();

  const BASE_URL = import.meta.env.VITE_BASE_URL;
  console.log("Base URL:", BASE_URL);

  const [zoneList, setZoneList] = useState([]);
  const [userList, setUserList] = useState([]);
  const [glList, setGlList] = useState([]);
  const [partyList, setPartyList] = useState([]);

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
        `${BASE_URL}/api/FrmTransAuthList/user-list`,
        {
          ulbId: ulbId?.toString(),
          deptId: deptId,
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

  const fetchGLList = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/Receipt/searchGLALL`, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });
      setGlList(res.data.data || []);
    } catch (err) {
      console.error("GL API Error:", err);
    }
  };

  const fetchCreditLeasure = async (glcode, type) => {
    try {
      const res = await axios.get(
        `${BASE_URL}/api/FrmContract/search-gl?ulbId=${ulbId}`,
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        },
      );

      const data = res.data?.data?.list || [];

      const formatted = data.map((item) => ({
        label: item.ACCNAME,
        value: item.OBJECTCODE.toString(),
      }));

      if (type === "party") {
        setPartyList(formatted);
      }
    } catch (err) {
      console.error("Credit Leasure API Error:", err);
    }
  };

  useEffect(() => {
    fetchZones();
    fetchUsers();
  }, [ulbId]);

  const handleSubmit = async (values) => {
    if (!values.fromDate || !values.toDate) {
      Swal.fire({
        text: "Please select date",
        icon: "warning",
        confirmButtonColor: "#1e3a8a",
      });
      return;
    }

    const loading = Swal.fire({
      title: "Generating Report...",
      text: "Please wait",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    const formatDate = (date) => {
      if (!date) return null;
      const d = new Date(date);
      return `${String(d.getDate()).padStart(2, "0")}-${String(
        d.getMonth() + 1
      ).padStart(2, "0")}-${d.getFullYear()}`;
    };

    const payload = {
      fromDate: formatDate(values.fromDate),
      toDate: formatDate(values.toDate),

      ulbid: Number(ulbId),
      zoneid: Number(values.zoneId) || "",
      glcode: Number(values.wardCode) || "",
      functioncode: Number(values.wardCode) || "",
      objectcode: Number(values.head) || "",

      budgetid: null,
      nidhi_id: null,
    };

    try {
      const url =
        values.exportType === "pdf"
          ? "/api/RptPaymentRegister/paymentRegisterReportPdf"
          : "/api/RptPaymentRegister/payment-register-report";

      const res = await axios.post(`${BASE_URL}${url}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 120000, // ✅ prevent infinite waiting
      });

      Swal.close();

      /* ================= PDF ================= */
      if (values.exportType === "pdf") {
        if (res.data?.pdfUrl) {
          window.open(res.data.pdfUrl, "_blank");
        } else {
          Swal.fire({
            text: "PDF generation failed",
            icon: "error",
          });
        }
        return;
      }

      /* ================= EXCEL ================= */
      const rows = res.data?.data?.rows || [];

      if (!rows.length) {
        Swal.fire({
          text: "No data found",
          icon: "info",
        });
        return;
      }

      const formattedData = rows.map((item) => ({
        DATE: item.TRNSDATE
          ? new Date(item.TRNSDATE).toLocaleDateString("en-GB")
          : "",
        VOUCHER_NO: item.VCHREFNO || "",
        TRANS_NO: item.TRANSNO || "",
        DOC_NO: item.DOCNO || "",
        GLCODE: item.GLCODE || "",
        GLNAME: item.GLNAME || "",
        ACCNO: item.ACCNO || "",
        ACCNAME: item.ACCNAME || "",
        ZONE: item.DEPTNAME || "",
        FUNCTIONCODE: item.FUNCTIONCODE || "",
        OBJECTCODE: item.OBJECTCODE || "",
        // AMOUNT: item.AMOUNT || 0,
        AMOUNT: Math.abs(item.AMOUNT || 0),
        NARRATION: item.NARRATION || "",
      }));

      const worksheet = XLSX.utils.json_to_sheet(formattedData);

      worksheet["!cols"] = [
        { wch: 12 },
        { wch: 12 },
        { wch: 12 },
        { wch: 10 },
        { wch: 10 },
        { wch: 25 },
        { wch: 15 },
        { wch: 30 },
        { wch: 15 },
        { wch: 15 },
        { wch: 15 },
        { wch: 15 },
        { wch: 40 },
      ];

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Payment Register");

      XLSX.writeFile(workbook, `Payment_Register_${Date.now()}.xlsx`);
    } catch (err) {
      console.error(err);

      Swal.close();

      Swal.fire({
        text:
          err?.response?.data?.message ||
          "Server is taking too long. Try again.",
        icon: "error",
      });
    }
  };
  return (
    <Formik initialValues={initialValues} onSubmit={handleSubmit}>
      {({ values, setFieldValue }) => {
        useEffect(() => {
          fetchGLList();
        }, []);

        useEffect(() => {
          if (values.wardCode) {
            fetchCreditLeasure(values.wardCode, "party");
          } else {
            setPartyList([]);
          }
        }, [values.wardCode]);
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
                    पेमेंट रजिस्टर तपशील
                  </CardTitle>
                </CardHeader>

                <CardContent className="p-4 sm:p-5 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
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

                    <div>
                      <Label className="text-sm">दिनांक पासून :</Label>
                      <DatePicker
                        value={values.fromDate}
                        onChange={(date) => setFieldValue("fromDate", date)}
                      />
                    </div>
                    <div>
                      <Label className="text-sm">दिनांक पर्यंत :</Label>
                      <DatePicker
                        value={values.toDate}
                        onChange={(date) => setFieldValue("toDate", date)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
                    <div>
                      <Label text="विभाग संकेतांक :" />
                      <SearchableSelect
                        options={glList.map((g) => ({
                          label: g.GLSEARCHNAME,
                          value: g.GLCODE.toString(),
                        }))}
                        name="wardCode"
                        value={values.wardCode}
                        onChange={(val) => setFieldValue("wardCode", val.value)}
                      />
                    </div>

                    <div>
                      <Label text="लेखाशीर्ष :" />
                      <SearchableSelect
                        key={values.head}
                        options={partyList}
                        name="head"
                        value={values.head}
                        onChange={(val) => setFieldValue("head", val.value)}
                      />
                    </div>
                    <div>
                      <div className="flex gap-4">
                        <Label className="text-sm">Export To :</Label>
                        <label className="flex items-center gap-2 text-sm">
                          <Input
                            type="radio"
                            name="exportType"
                            checked={values.exportType === "pdf"}
                            onChange={() => setFieldValue("exportType", "pdf")}
                          />
                          PDF
                        </label>

                        <label className="flex items-center gap-2 text-sm">
                          <Input
                            type="radio"
                            checked={values.exportType === "excel"}
                            onChange={() =>
                              setFieldValue("exportType", "excel")
                            }
                          />
                          Excel
                        </label>
                      </div>
                    </div>
                  </div>

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
        );
      }}
    </Formik>
  );
};

export default RptPaymentRegisterDetails;
