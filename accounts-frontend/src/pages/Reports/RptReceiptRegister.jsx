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
    reportType: "summary",
    exportType: "pdf",
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
        try {

            // JCMC Validation
            if (values.reportType === "JCMC") {
                if (!values.zoneId || values.zoneId === "-1") {
                    Swal.fire({
                        text: "कृपया प्रभाग निवडा.",
                        confirmButtonColor: "#1e3a8a",
                    });
                    return;
                }

                // if (!values.wardCode) {
                //     Swal.fire({
                //         text: "कृपया विभाग संकेतांक निवडा.",
                //         confirmButtonColor: "#1e3a8a",
                //     });
                //     return;
                // }

                // if (!values.head) {
                //     Swal.fire({
                //         text: "कृपया लेखाशीर्ष निवडा.",
                //         confirmButtonColor: "#1e3a8a",
                //     });
                //     return;
                // }
            }

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
                ulbId: ulbId?.toString(),
                zoneId: values.zoneId || "-1",
                rptType:
                    values.reportType === "summary"
                        ? "2"
                        : values.reportType === "detail"
                            ? "1"
                            : "3",
                chkGramPanchayat: false,
                majorCode: values.wardCode
                    ? values.wardCode.padStart(3, "0")
                    : null,
                minorCode: values.head || null,
            };


            if (values.exportType === "pdf") {

                const pdfUrl =
                    values.reportType === "JCMC"
                        ? `${BASE_URL}/api/RptReceiptRegister/receipt-register-user-wise-pdf`
                        : `${BASE_URL}/api/RptReceiptRegister/receipt-register-report-pdf`;

                const res = await axios.post(
                    pdfUrl,
                    payload,
                    {
                        headers: { Authorization: `Bearer ${token}` },
                    }
                );

                Swal.close();

                if (res.data?.success) {
                    window.open(res.data.pdfUrl, "_blank");
                } else {
                    Swal.fire({
                        text: "Failed to generate PDF",
                        confirmButtonColor: "#1e3a8a",
                    });
                }

                return;
            }


            const excelApi =
                values.reportType === "JCMC"
                    ? `${BASE_URL}/api/RptReceiptRegister/receipt-register-user-wise`
                    : `${BASE_URL}/api/RptReceiptRegister/receipt-register`;

            const res = await axios.post(
                excelApi,
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
                    d.getMonth() + 1,
                ).padStart(2, "0")}-${d.getFullYear()}`;
            };

            const formattedData =
                values.reportType === "JCMC"
                    ? rows.map((item) => ({
                        TRNSDATE: formatDateDisplay(item.TRNSDATE),
                        USERID: item.USERID || "",
                        GLCODE: item.GLCODE,
                        GLNAME: item.GLNAME,
                        ACCNO: item.ACCNO,
                        ACCNAME: item.ACCNAME,
                        ZONEENAME: item.ZONEENAME,
                        FUNCTIONCODE: item.FUNCTIONCODE,
                        OBJECTCODE: item.OBJECTCODE,
                        AMOUNT: item.AMOUNT,
                    }))
                    : rows.map((item) => ({
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

            const wscols =
                values.reportType === "JCMC"
                    ? [
                        { wch: 15 }, // TRNSDATE
                        { wch: 15 }, // USERID
                        { wch: 10 }, // GLCODE
                        { wch: 35 }, // GLNAME
                        { wch: 15 }, // ACCNO
                        { wch: 35 }, // ACCNAME
                        { wch: 15 }, // ZONEENAME
                        { wch: 15 }, // FUNCTIONCODE
                        { wch: 20 }, // OBJECTCODE
                        { wch: 15 }, // AMOUNT
                    ]
                    : [
                        { wch: 15 }, // TRNSDATE
                        { wch: 10 }, // GLCODE
                        { wch: 30 }, // GLNAME
                        { wch: 15 }, // ACCNO
                        { wch: 30 }, // ACCNAME
                        { wch: 15 }, // ZONEENAME
                        { wch: 15 }, // FUNCTIONCODE
                        { wch: 20 }, // OBJECTCODE
                        { wch: 12 }, // AMOUNT
                        { wch: 15 }, // BUDGETCODE
                    ];

            worksheet["!cols"] = wscols;

            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Receipt Register");

            const date = new Date();
            const timestamp = date.toISOString().split("T")[0].replace(/-/g, "");
            const filename = `Receipt_Register_${timestamp}.xlsx`;

            XLSX.writeFile(workbook, filename);
        } catch (err) {
            console.error("Error:", err);
            Swal.fire({
                text: err?.response?.data?.message || err?.response?.data?.error || "Something Went WRONG",
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
                                                <SelectTrigger className="w-full h-9">
                                                    <SelectValue placeholder="-- ALL --" />
                                                </SelectTrigger>

                                                <SelectContent>
                                                    <SelectItem
                                                        value={"-1"}
                                                    >
                                                        -- ALL --
                                                    </SelectItem>
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
                                                <Label text="दिनांक पासून" />
                                                <span>:</span>
                                            </div>

                                            <DatePicker
                                                value={values.fromDate}
                                                onChange={(date) =>
                                                    setFieldValue("fromDate", date)
                                                }
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
                                                onChange={(date) =>
                                                    setFieldValue("toDate", date)
                                                }
                                                className="w-full h-9"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                            <div className="sm:w-36 shrink-0 flex justify-start sm:justify-between items-center">
                                                <Label text="विभाग संकेतांक" />
                                                <span>:</span>
                                            </div>

                                            <div className="w-full">
                                                <SearchableSelect
                                                    options={glList.map((g) => ({
                                                        label: g.GLSEARCHNAME,
                                                        value: g.GLCODE.toString(),
                                                    }))}
                                                    name="wardCode"
                                                    value={values.wardCode}
                                                    onChange={(val) =>
                                                        setFieldValue("wardCode", val.value)
                                                    }
                                                />
                                            </div>
                                        </div>
                                        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                            <div className="sm:w-36 shrink-0 flex justify-start sm:justify-between items-center">
                                                <Label text="लेखाशीर्ष" />
                                                <span>:</span>
                                            </div>

                                            <div className="w-full">
                                                <SearchableSelect
                                                    options={partyList}
                                                    name="head"
                                                    value={values.head}
                                                    onChange={(val) =>
                                                        setFieldValue("head", val.value)
                                                    }
                                                />
                                            </div>
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


                                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                        <div className="sm:w-36 shrink-0 flex justify-start sm:justify-between items-center">
                                            <Label text="अहवालाचा प्रकार" />
                                            <span>:</span>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-4">
                                            <label className="flex items-center gap-2 text-sm">
                                                <Input
                                                    type="radio"
                                                    name="reportType"
                                                    checked={values.reportType === "summary"}
                                                    onChange={() =>
                                                        setFieldValue("reportType", "summary")
                                                    }
                                                    className="h-4 w-4"
                                                />
                                                सारांश
                                            </label>

                                            <label className="flex items-center gap-2 text-sm">
                                                <Input
                                                    type="radio"
                                                    name="reportType"
                                                    checked={values.reportType === "detail"}
                                                    onChange={() =>
                                                        setFieldValue("reportType", "detail")
                                                    }
                                                    className="h-4 w-4"
                                                />
                                                तपशील
                                            </label>

                                            <label className="flex items-center gap-2 text-sm">
                                                <Input
                                                    type="radio"
                                                    name="reportType"
                                                    checked={values.reportType === "JCMC"}
                                                    onChange={() =>
                                                        setFieldValue("reportType", "JCMC")
                                                    }
                                                    className="h-4 w-4"
                                                />
                                                चलान 
                                            </label>
                                        </div>
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
                                                    onChange={() =>
                                                        setFieldValue("exportType", "pdf")
                                                    }
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


                                    <div className="flex justify-center flex-wrap gap-4 pt-4">
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