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
import config from "@/utils/config.jsx"
import Swal from "sweetalert2";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

import { DatePicker } from "@/components/ui/calendar";
import SearchableSelect from "@/components/SearchableSelect";

const initialValues = {
    zoneId: "",
    fromDate: null,
    toDate: null,
    wardCode: "",
    head: "",
    userId: "",
    reportType: "detail",
    exportType: "excel",
};

const RptReceiptRegister = () => {
    const { user } = useAuth();
    const token = user?.token;
    const ulbId = user?.ulbId;
    const deptId = config.deptId;
    const navigate = useNavigate();

    const BASE_URL = import.meta.env.VITE_BASE_URL;

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
                }
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
                }
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
            const res = await axios.get(`${BASE_URL}/api/Receipt/searchGLALL`,
                {
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
            const res = await axios.get(`${BASE_URL}/api/FrmContract/search-gl?ulbId=${ulbId}`,
                {
                    headers: {
                        Authorization: `Bearer ${user.token}`,
                    },
                });

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
        try {
            Swal.fire({
                title: "Processing...",
                allowOutsideClick: false,
                didOpen: () => Swal.showLoading(),
            });

            const formatDate = (date) => {
                if (!date) return null;
                const d = new Date(date);
                return d.toISOString().split("T")[0];
            };

            const payload = {
                fromDate: formatDate(values.fromDate),
                toDate: formatDate(values.toDate),
                ulbId: ulbId?.toString(),
                rptType: values.reportType === "summary" ? "2" : "1",
                chkGramPanchayat: false,
                majorCode: values.wardCode ? "0" + values.wardCode : null,
                minorCode: values.head || null,
            };

            // ================== ✅ PDF ==================
            if (values.exportType === "pdf") {
                const res = await axios.post(
                    `${BASE_URL}/api/RptReceiptRegister/receipt-register-report-pdf`,
                    payload,
                    {
                        headers: { Authorization: `Bearer ${token}` },
                    }
                );

                Swal.close();

                if (res.data?.success) {
                    const pdfUrl = res.data.pdfUrl;

                    window.open(pdfUrl, "_blank");

                } else {
                    Swal.fire({
                        text: "Failed to generate PDF",
                        confirmButtonColor: "#1e3a8a",
                    });
                }

                return;
            }

            const res = await axios.post(
                `${BASE_URL}/api/RptReceiptRegister/receipt-register`,
                payload,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            Swal.close();

            const rows = res.data?.data?.rows || [];

            if (rows.length === 0) {
                Swal.fire({
                    text: "No data found",
                    confirmButtonColor: "#1e3a8a",
                });
                return;
            }

            const formatDateDisplay = (date) => {
                if (!date) return "";
                const d = new Date(date);
                return `${String(d.getDate()).padStart(2, "0")}-${String(
                    d.getMonth() + 1
                ).padStart(2, "0")}-${d.getFullYear()}`;
            };

            const formattedData = rows.map((item) => ({
                TRNSDATE: formatDateDisplay(item.TRNSDATE),
                GLCODE: item.GLCODE,
                GLNAME: item.GLNAME,
                ACCNO: item.ACCNO,
                ACCNAME: item.ACCNAME,
                ZONEENAME: item.ZONEENAME,
                FUNCTIONCODE: item.FUNCTIONCODE,
                OBJECTCODE: item.OBJECTCODE,
                AMOUNT: item.AMOUNT,
                BUDGETCODE: item.BUDGETCODE,
            }));

            const worksheet = XLSX.utils.json_to_sheet(formattedData);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Receipt Register");

            const excelBuffer = XLSX.write(workbook, {
                bookType: "xlsx",
                type: "array",
            });


            const blob = new Blob([excelBuffer], {
                type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            });

            saveAs(blob, "Receipt_Register.xlsx");

        } catch (err) {
            console.error("Error:", err);
            Swal.fire({
                text: "Something went wrong",
                confirmButtonColor: "#1e3a8a",
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
                                        पावती रजिस्टर
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
                                                onChange={(date) =>
                                                    setFieldValue("fromDate", date)
                                                }
                                            />
                                        </div>
                                        <div>
                                            <Label className="text-sm">दिनांक पर्यंत :</Label>
                                            <DatePicker
                                                value={values.toDate}
                                                onChange={(date) =>
                                                    setFieldValue("toDate", date)
                                                }
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
                                            <Label className="text-sm">वापरकर्ता निवडा :</Label>
                                            <Select
                                                value={values.userId}
                                                onValueChange={(v) => setFieldValue("userId", v)}
                                            >
                                                <SelectTrigger className="w-full sm:flex-1">
                                                    <SelectValue placeholder="-- विकल्प निवडा --" />
                                                </SelectTrigger>

                                                <SelectContent>
                                                    {userList.length > 0 ? (
                                                        userList.map((user) => (
                                                            <SelectItem
                                                                key={user.USERID}
                                                                value={user.USERID}
                                                            >
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

                                    <div className="grid grid-cols-1 md:grid-cols-6 gap-3 items-center">

                                        <Label className="text-sm">अहवालाचा प्रकार :</Label>
                                        <div className="flex gap-4">
                                            <label className="flex items-center gap-2 text-sm">
                                                <input
                                                    type="radio"
                                                    checked={values.reportType === "summary"}
                                                    onChange={() =>
                                                        setFieldValue("reportType", "summary")
                                                    }
                                                />
                                                सारांश
                                            </label>

                                            <label className="flex items-center gap-2 text-sm">
                                                <input
                                                    type="radio"
                                                    checked={values.reportType === "detail"}
                                                    onChange={() =>
                                                        setFieldValue("reportType", "detail")
                                                    }
                                                />
                                                तपशील
                                            </label>
                                        </div>

                                        <Label className="text-sm">Export To :</Label>
                                        <div className="flex gap-4">
                                            <label className="flex items-center gap-2 text-sm">
                                                <input
                                                    type="radio"
                                                    checked={values.exportType === "pdf"}
                                                    onChange={() =>
                                                        setFieldValue("exportType", "pdf")
                                                    }
                                                />
                                                PDF
                                            </label>

                                            <label className="flex items-center gap-2 text-sm">
                                                <input
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

export default RptReceiptRegister;