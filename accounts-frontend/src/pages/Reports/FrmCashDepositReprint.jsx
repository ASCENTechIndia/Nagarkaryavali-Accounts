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
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from "@/components/ui/select";

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

const FrmCashDepositReprint = () => {
    const { user } = useAuth();
    const token = user?.token;
    const ulbId = user?.ulbId;
    const navigate = useNavigate();
    const BASE_URL = import.meta.env.VITE_BASE_URL;

    const [loading, setLoading] = useState(false);

    const [tableData, setTableData] = useState([]);

    const [payModes, setPayModes] = useState([]);

    const headers = [
        "Reference No",
        "Receipt Date",
        "Amount",
        "Paymode",
        "प्रिंट",
    ];

    const keyMapping = {
        "Reference No": "REFNO",
        "Receipt Date": "RECDATE",
        "Amount": "AMOUNT",
        "Paymode": "PAYMODENAME",
        "प्रिंट": "PRINT",
    };

    const columnStyles = {
        "Reference No": { width: "25%" },
        "Receipt Date": { width: "20%" },
        "Amount": { width: "18%" },
        "Paymode": { width: "18%" },
        "प्रिंट": { width: "10%" },
    };

    const formatDateForAPI = (date) => {
        const d = new Date(date);

        const day = String(d.getDate()).padStart(2, "0");
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
            "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const month = monthNames[d.getMonth()];
        const year = d.getFullYear();

        return `${day}-${month}-${year}`;
    };


    const formatTableDate = (date) => {
        if (!date) return "-";

        return new Date(date).toLocaleDateString("en-GB");
    };

    // 🔥 FETCH PAYMODES
    const fetchPayModes = async () => {
        try {
            const res = await axios.get(
                `${BASE_URL}/api/FrmCashDepositReprint/paymodes?ulbId=${ulbId}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (res?.data?.ok && res?.data?.data?.success) {
                setPayModes(res.data.data.data || []);
            }
        } catch (error) {
            console.error("Paymode Fetch Error :", error);
        }
    };

    useEffect(() => {
        if (ulbId) {
            fetchPayModes();
        }
    }, [ulbId]);

    const handlePrint = async (row) => {
        try {
            Swal.fire({
                title: "Generating...",
                text: "Please wait",
                allowOutsideClick: false,
                showConfirmButton: false,
                didOpen: () => Swal.showLoading(),
            });

            const payload = {
                refNo: String(row.REFNO),
                ulbId: String(ulbId),
            };

            // 🔥 Dynamic API Based On Paymode
            const apiUrl =
                row.PAYMODENAME?.toLowerCase() === "cheque"
                    ? `${BASE_URL}/api/ChequeDepo/generatechequedepositpdf`
                    : `${BASE_URL}/api/FrmCashDeposit/generate-cash-deposit-pdf`;

            const res = await axios.post(apiUrl, payload, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            Swal.close();

            if (res?.data?.success && res?.data?.pdfUrl) {
                window.open(res.data.pdfUrl, "_blank");
            } else {
                throw new Error("PDF generation failed");
            }
        } catch (error) {
            console.error(error);

            Swal.fire({
                text:
                    error.response?.data?.message ||
                    "PDF तयार करताना त्रुटी",
                confirmButtonColor: "#1e3a8a",
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
                fromDate: formatDateForAPI(values.fromDate),
                toDate: formatDateForAPI(values.toDate),
                ulbId: String(ulbId),
                paymode: values.paymode || "-1",
            };

            const res = await axios.post(
                `${BASE_URL}/api/FrmCashDepositReprint/receipt-report`,
                payload,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            Swal.close();

            if (res?.data?.ok && res?.data?.data?.success) {
                const apiData = res.data.data.data || [];

                const formattedRows = apiData.map((item) => ({
                    ...item,
                    RECDATE: formatTableDate(item.RECDATE),
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
                    <motion.div
                        variants={container}
                        initial="hidden"
                        animate="show"
                    >
                        <Card className="shadow-sm border">
                            <CardHeader className="border-b flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                                <CardTitle className="text-lg font-semibold">
                                    Cash/Cheque Deposit Reprint
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
                                            onChange={(date) =>
                                                setFieldValue("fromDate", date)
                                            }
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
                                            onChange={(date) =>
                                                setFieldValue("toDate", date)
                                            }
                                            className="w-full h-9"
                                        />
                                    </div>

                                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                        <div className="sm:w-24 flex justify-between">
                                            <Label text="Deposit Mode" />
                                            <span>:</span>
                                        </div>
                                        <Select
                                            value={values.paymode}
                                            onValueChange={(v) =>
                                                setFieldValue(
                                                    "paymode",
                                                    v
                                                )
                                            }
                                        >
                                            <SelectTrigger className="w-full h-9">
                                                <SelectValue placeholder="-- ALL --" />
                                            </SelectTrigger>

                                            <SelectContent>
                                                <SelectItem value="-1">
                                                    -- ALL --
                                                </SelectItem>

                                                {payModes.map((item) => (
                                                    <SelectItem
                                                        key={
                                                            item.PAYMODE_ID
                                                        }
                                                        value={String(
                                                            item.PAYMODE_ID
                                                        )}
                                                    >
                                                        {
                                                            item.PAYMODE_NAME
                                                        }
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="flex justify-center gap-4">
                                    <Button
                                        type="submit"
                                        disabled={isSubmitting || loading}
                                    >
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

export default FrmCashDepositReprint;