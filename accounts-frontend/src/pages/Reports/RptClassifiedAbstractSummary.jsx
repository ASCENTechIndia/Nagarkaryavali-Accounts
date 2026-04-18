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
import { DatePicker } from "@/components/ui/calendar";


const initialValues = {
    zoneId: "",
    fromDate: new Date(),
    toDate: new Date(),
    wardCode: "",
    head: "",
    userId: "",
    transactionType: "receipt",
    exportType: "pdf",
};

const RptClassifiedAbstractSummary = () => {
    const { user } = useAuth();
    const token = user?.token;
    const ulbId = user?.ulbId;
    const deptId = config.deptId;
    const navigate = useNavigate();

    const BASE_URL = import.meta.env.VITE_BASE_URL;

    const [zoneList, setZoneList] = useState([]);

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

    useEffect(() => {
        fetchZones();
    }, [ulbId]);

    const formatDate = (date) => {
        if (!date) return "";
        const d = new Date(date);
        return d.toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        }).replace(/ /g, "-").toUpperCase();
    };

    const handleSubmit = async (values) => {
        try {
            Swal.fire({
                title: "Processing...",
                allowOutsideClick: false,
                didOpen: () => Swal.showLoading(),
            });

            const payload = {
                ulbId: ulbId,
                fromDate: formatDate(values.fromDate),
                toDate: formatDate(values.toDate),
                rptType: values.transactionType === "receipt" ? "0" : "1",
                zoneId: values.zoneId || "-1",
            };

            if (values.exportType === "pdf") {
                const res = await axios.post(
                    `${BASE_URL}/api/Abstract/budgetreportpdf`,
                    payload,
                    { headers: { Authorization: `Bearer ${token}` } }
                );

                Swal.close();

                if (res.data?.success && res.data?.pdfUrl) {
                    window.open(res.data.pdfUrl, "_blank");
                } else {
                    Swal.fire({ text: res.data?.message || "Failed to generate PDF" });
                }
                return;
            }

            const res = await axios.post(
                `${BASE_URL}/api/Abstract/budgetexpenditurereport`,
                payload,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            Swal.close();

            const list = res.data?.data?.list || [];

            if (list.length === 0) {
                Swal.fire({ text: "No data found" });
                return;
            }

            const excelData = list.map((item) => ({
                "GL Code": item.GLCODE,
                "GL Name": item.GLNAME,
                "Acc No": item.ACCNO,
                "Acc Name": item.ACCNAME,
                "Budget Prov": item.BUDGPROV,
                "Function Code": item.FUNCTIONCODE,
                "Account Code": item.ACCOUNTCODE,
                "Actual Payment": item.ACTUAL_PAYMENT,
                "Expenditure": item.EXPENDITURE,
                "Balance": item.BALANCE,
            }));

            const worksheet = XLSX.utils.json_to_sheet(excelData);

            worksheet["!cols"] = [
                { wch: 10 }, // GL Code
                { wch: 35 }, // GL Name
                { wch: 15 }, // Acc No
                { wch: 35 }, // Acc Name
                { wch: 15 }, // Budget Prov
                { wch: 15 }, // Function Code
                { wch: 18 }, // Account Code
                { wch: 18 }, // Actual Payment
                { wch: 15 }, // Expenditure
                { wch: 15 }, // Balance
            ];

            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Abstract Summary");

            const timestamp = new Date().toISOString().split("T")[0].replace(/-/g, "");
            XLSX.writeFile(workbook, `Classified_Abstract_Summary_${timestamp}.xlsx`);

        } catch (err) {
            console.error("Submit Error:", err);
            Swal.close();
            Swal.fire({ text: err.response?.data?.message || "Something went wrong" });
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
                                        Classified Abstract Receipts/Payments Summary
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
                                                    <SelectValue placeholder="-- ALL --" />
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

                                    {/* व्यवहार प्रकार */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
                                        <div>
                                            <Label className="text-sm">व्यवहार प्रकार :</Label>
                                            <div className="flex gap-4 mt-1">
                                                <label className="flex items-center gap-2">
                                                    <Input
                                                        type="radio"
                                                        name="transactionType"
                                                        value="receipt"
                                                        checked={values.transactionType === "receipt"}
                                                        onChange={() => setFieldValue("transactionType", "receipt")}
                                                    />
                                                    रेसिट
                                                </label>
                                                <label className="flex items-center gap-2">
                                                    <Input
                                                        type="radio"
                                                        name="transactionType"
                                                        value="payment"
                                                        checked={values.transactionType === "payment"}
                                                        onChange={() => setFieldValue("transactionType", "payment")}
                                                    />
                                                    पेमेंट
                                                </label>
                                            </div>
                                        </div>

                                        {/* Export To */}
                                        <div>
                                            <Label className="text-sm">Export To :</Label>
                                            <div className="flex gap-4 mt-1">
                                                <label className="flex items-center gap-2">
                                                    <Input
                                                        type="radio"
                                                        name="exportType"
                                                        value="pdf"
                                                        checked={values.exportType === "pdf"}
                                                        onChange={() => setFieldValue("exportType", "pdf")}
                                                    />
                                                    Pdf
                                                </label>
                                                <label className="flex items-center gap-2">
                                                    <Input
                                                        type="radio"
                                                        name="exportType"
                                                        value="excel"
                                                        checked={values.exportType === "excel"}
                                                        onChange={() => setFieldValue("exportType", "excel")}
                                                    />
                                                    Excel
                                                </label>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap justify-center gap-3 pt-4">
                                        <Button type="submit" className="bg-blue-900 text-white px-6 h-9">
                                            प्रक्रिया
                                        </Button>

                                        <Button type="reset" variant="destructive" className="px-6 h-9">
                                            हटवा
                                        </Button>

                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="px-6 h-9"
                                            onClick={() => navigate("/HomePage/FrmHomePage")}
                                        >
                                            बाहेर
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

export default RptClassifiedAbstractSummary;