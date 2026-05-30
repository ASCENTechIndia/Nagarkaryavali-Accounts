import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import Swal from "sweetalert2";
import { Formik, Form } from "formik";
import { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ShadCNTable from "@/components/ui/table";
import { DatePicker } from "@/components/ui/calendar";
import AsyncSearchableSelect from "@/components/AsyncSearchableSelect";

const FrmSDRefund = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const token = user?.token;
    const ulbId = user?.ulbId;

    const BASE_URL = import.meta.env.VITE_BASE_URL;

    const [tableData, setTableData] = useState([]);
    const [partyOptions, setPartyOptions] = useState([]);
    const [contractorOptions, setContractorOptions] = useState([]);

    const [loadingParty, setLoadingParty] = useState(false);
    const [loadingContractor, setLoadingContractor] = useState(false);

    const headers = [
        "Select",
        "Party Code",
        "Party Name",
        "Receipt No",
        "Date",
        "Amount",
        "Details",
        "Refund Status",
    ];

    const keyMapping = {
        "Select": "select",
        "Party Code": "partyCode",
        "Party Name": "partyName",
        "Receipt No": "receiptNo",
        "Date": "transDate",
        "Amount": "amount",
        "Details": "details",
        "Refund Status": "status",
    };


    const formatDate = (date) => {
        if (!date) return "";

        const d = new Date(date);
        const day = String(d.getDate()).padStart(2, "0");
        const monthNames = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN",
            "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
        const month = monthNames[d.getMonth()];
        const year = d.getFullYear();

        return `${day}-${month}-${year}`;
    };


    const searchParty = async (value) => {
        if (!value || value.trim().length < 1) {
            setPartyOptions([]);
            return;
        }

        try {
            setLoadingParty(true);

            const res = await axios.post(
                `${BASE_URL}/api/frmSDRef/party-search`,
                {
                    prefix: value,
                    ulbId: ulbId,
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const data = res.data?.data?.data || [];

            const formatted = data.map((item) => ({
                label: item.PARTYNAME,
                value: item.PARTYID?.toString(),
            }));

            setPartyOptions(formatted);
        } catch (err) {
            console.error("Party Search Error:", err);
        } finally {
            setLoadingParty(false);
        }
    };


    const searchContractor = async (value) => {
        if (!value || value.trim().length < 1) {
            setContractorOptions([]);
            return;
        }

        try {
            setLoadingContractor(true);

            const res = await axios.post(
                `${BASE_URL}/api/frmSDRef/party-search-standard`,
                {
                    prefix: value,
                    ulbId: ulbId,
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const data = res.data?.data?.data || [];

            const formatted = data.map((item) => ({
                label: item.PARTYNAME,
                value: item.PARTYID?.toString(),
            }));

            setContractorOptions(formatted);
        } catch (err) {
            console.error("Contractor Search Error:", err);
        } finally {
            setLoadingContractor(false);
        }
    };

    const handlePrint = async (values) => {
        try {
            Swal.fire({
                title: "Loading...",
                allowOutsideClick: false,
                didOpen: () => Swal.showLoading(),
            });

            const payload = {
                ulbId: ulbId,

                receiptNo: values.fromCheque || "",
                voucherNo: values.toCheque || "",
                contrName: values.contractorName || "",
                collectionDate: values.depositDate
                    ? formatDate(values.depositDate).toUpperCase()
                    : "",
                partyId: values.entryDeptCode || "",
            };

            // 🔥 FETCH DATA FIRST
            const listRes = await axios.post(
                `${BASE_URL}/api/frmSDRef/refund-list`,
                payload,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const list = listRes.data?.data?.data || [];

            if (list.length === 0) {
                Swal.close();

                Swal.fire({
                    // icon: "info",
                    text: "No data found",
                });

                return;
            }

            if (values.exportType === "pdf") {
                const pdfRes = await axios.post(
                    `${BASE_URL}/api/frmSDRef/refund-pdf`,
                    payload,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                Swal.close();

                if (pdfRes.data?.success && pdfRes.data?.pdfUrl) {
                    window.open(pdfRes.data.pdfUrl, "_blank");
                } else {
                    Swal.fire({
                        // icon: "error",
                        text: "PDF URL not found",
                    });
                }

                return;
            }

            const excelData = list.map((item, index) => ({
                "अ.क्र": index + 1,
                "पार्टी कोड": item.PARTYCODE || "",
                "पार्टी नाव": item.PARTYNAME || "",
                "पावती क्रमांक": item.RECEIPTNO || "",
                "दिनांक": item.TRANSDT || "",
                "रक्कम": item.TRANSAMNT || "",
                "तपशील": item.DETAILS || "",
                "रिफंड स्थिती": item.STATUS || "",
                "व्हाउचर क्रमांक": item.TRANSNO || "",
            }));

            const worksheet = XLSX.utils.json_to_sheet(excelData);

            worksheet["!cols"] = [
                { wch: 8 },
                { wch: 15 },
                { wch: 35 },
                { wch: 18 },
                { wch: 18 },
                { wch: 15 },
                { wch: 40 },
                { wch: 20 },
                { wch: 20 },
            ];

            const workbook = XLSX.utils.book_new();

            XLSX.utils.book_append_sheet(
                workbook,
                worksheet,
                "SD Refund List"
            );

            const timestamp = new Date()
                .toISOString()
                .split("T")[0]
                .replace(/-/g, "");

            XLSX.writeFile(
                workbook,
                `SD_Refund_List_${timestamp}.xlsx`
            );

            Swal.close();
        } catch (err) {
            console.error("Export Error:", err);

            Swal.close();

            Swal.fire({
                // icon: "error",
                text:
                    err.response?.data?.message ||
                    "Failed to export data",
            });
        }
    };

    const handleSubmit = async (values) => {
        try {
            Swal.fire({
                title: "Loading...",
                allowOutsideClick: false,
                didOpen: () => Swal.showLoading(),
            });

            const payload = {
                ulbId: ulbId,

                receiptNo: values.fromCheque || "",
                voucherNo: values.toCheque || "",
                contrName: values.contractorName || "",
                collectionDate: values.depositDate
                    ? formatDate(values.depositDate).toUpperCase()
                    : "",
                partyId: values.entryDeptCode || "",
            };

            const res = await axios.post(
                `${BASE_URL}/api/frmSDRef/refund-list`,
                payload,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const rows = res.data?.data?.data || [];

            if (!rows || rows.length === 0) {
                setTableData([]);
                Swal.fire({
                    text: "No Record Found",
                    confirmButtonColor: "#1e3a8a",
                });
                return;
            }

            const formatted = rows.map((item) => ({
                select: (
                    <Button
                        variant="link"
                        type="button"
                        className="text-blue-700 px-0 h-auto"
                        onClick={() =>
                            navigate("/Transactions/FrmSDVchPrepMst", {
                                state: {
                                    mode: 3,
                                    receiptNo: item.RECEIPTNO,
                                    sdid: item.SDID,
                                    RefNo: item.TRANSNO,
                                    partyId: item.PARTYCODE,
                                },
                            })
                        }
                    >
                        Select
                    </Button>
                ),

                partyCode: item.PARTYCODE || "",
                partyName: item.PARTYNAME || "",
                receiptNo: item.RECEIPTNO || "",
                transDate: item.TRANSDT || "",
                amount: item.TRANSAMNT || "",
                details: item.DETAILS || "",
                status: item.STATUS || "",
                voucherNo: item.TRANSNO || "",
                sdid: item.SDID || "",
            }));

            setTableData(formatted);

            Swal.close();
        } catch (err) {
            console.error("Refund List API Error:", err);

            Swal.fire({
                // icon: "error",
                text: "Failed to fetch refund list",
            });
        }
    };



    return (
        <Formik
            initialValues={{
                entryDeptCode: "",
                contractorName: "",
                depositDate: new Date(),
                fromCheque: "",
                toCheque: "",
                exportType: "pdf",
            }}
            onSubmit={handleSubmit}
        >
            {({ values, setFieldValue, handleChange, resetForm }) => (
                <Form>
                    <motion.div className="mt-2 px-2 sm:px-4">
                        <Card className="rounded-sm shadow-none">
                            <CardHeader className="border-b py-4 px-4">
                                <CardTitle className="text-[18px] font-semibold text-black">
                                    Security Deposit Refund List
                                </CardTitle>
                            </CardHeader>

                            <CardContent className="p-3 sm:p-5 space-y-6">

                                <div >
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                                            <Label
                                                className="sm:w-40 text-left sm:text-right font-semibold"
                                                text="सु.अ.क्र.शोध :"
                                            />

                                            <Input
                                                name="fromCheque"
                                                value={values.fromCheque}
                                                onChange={handleChange}
                                                className="flex-1 w-full h-10 rounded-sm border-gray-300"
                                            />
                                        </div>

                                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                                            <Label
                                                className="sm:w-40 text-left sm:text-right font-semibold"
                                                text="पार्टी कोड :"
                                            />

                                            <div className="flex-1 w-full">
                                                <AsyncSearchableSelect
                                                    options={partyOptions}
                                                    value={values.entryDeptCode}
                                                    onSearch={(value) => {
                                                        searchParty(value);
                                                    }}
                                                    isLoading={loadingParty}
                                                    loadingMessage="Searching Party..."
                                                    noOptionsMessage="No Data Found"
                                                    onChange={(option) => {
                                                        const value = option?.value || "";

                                                        setFieldValue("entryDeptCode", value);

                                                        fetchCreditLeasure(value);

                                                        setFieldValue("contractorName", "");
                                                    }}
                                                    placeholder="पार्टी कोड निवडा"
                                                />
                                            </div>
                                        </div>

                                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                                            <Label
                                                className="sm:w-40 text-left sm:text-right font-semibold"
                                                text="कंत्राटदार नाव :"
                                            />

                                            <div className="flex-1 w-full">
                                                <AsyncSearchableSelect
                                                    options={contractorOptions}
                                                    value={values.contractorName}
                                                    onSearch={(value) => {
                                                        searchContractor(value);
                                                    }}
                                                    isLoading={loadingContractor}
                                                    loadingMessage="Searching Contractor..."
                                                    noOptionsMessage="No Data Found"
                                                    onChange={(option) => {
                                                        setFieldValue(
                                                            "contractorName",
                                                            option?.label || ""
                                                        );
                                                    }}
                                                    placeholder="कंत्राटदार नाव निवडा"
                                                />
                                            </div>
                                        </div>

                                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                                            <Label
                                                className="sm:w-40 text-left sm:text-right font-semibold"
                                                text="सु. अ. जमा दिनांक :"
                                            />
                                            <DatePicker
                                                value={values.depositDate}
                                                onChange={(date) => setFieldValue("depositDate", date)}
                                            />

                                        </div>
                                    </div>

                                    <div className="flex flex-wrap justify-center gap-3 mt-6">

                                        <Button
                                            type="submit"
                                            className="bg-blue-900 hover:bg-blue-950 text-white px-6"
                                        >
                                            Search
                                        </Button>

                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => {
                                                resetForm();
                                                setTableData([]);
                                            }}
                                        >
                                            Clear
                                        </Button>

                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="text-red-600"
                                            onClick={() =>
                                                navigate("/HomePage/FrmHomePage")
                                            }
                                        >
                                            Exit
                                        </Button>
                                    </div>

                                    {tableData.length > 0 && (
                                        <div>
                                            <div className="flex flex-wrap items-center gap-6 mt-8">

                                                <div className="flex items-center gap-4">

                                                    <Label
                                                        className="font-semibold text-[15px]"
                                                        text="Export To"
                                                    />

                                                    <span className="font-semibold">:</span>

                                                    <div className="flex items-center gap-4">

                                                        <label className="flex items-center gap-2 text-sm">
                                                            <input
                                                                type="radio"
                                                                name="exportType"
                                                                value="pdf"
                                                                checked={values.exportType === "pdf"}
                                                                onChange={handleChange}
                                                            />
                                                            Pdf
                                                        </label>

                                                        <label className="flex items-center gap-2 text-sm">
                                                            <input
                                                                type="radio"
                                                                name="exportType"
                                                                value="excel"
                                                                checked={values.exportType === "excel"}
                                                                onChange={handleChange}
                                                            />
                                                            Excel
                                                        </label>
                                                    </div>
                                                </div>

                                                <Button
                                                    type="button"
                                                    className="bg-blue-900 hover:bg-blue-950 text-white px-8"
                                                    onClick={() => handlePrint(values)}
                                                >
                                                    Print
                                                </Button>
                                            </div>

                                            <div className="mt-6 border-t pt-4">
                                                <ShadCNTable
                                                    headers={headers}
                                                    data={tableData}
                                                    keyMapping={keyMapping}
                                                    pagination={true}
                                                    rowsPerPage={5}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                </Form>
            )}
        </Formik>
    );
};

export default FrmSDRefund;