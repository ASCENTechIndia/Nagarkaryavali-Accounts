import React, { useEffect, useMemo, useRef, useState } from "react";
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
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/calendar";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import AsyncSearchableSelect from "@/components/AsyncSearchableSelect";
import ShadCNTable from "@/components/ui/table";

const initialValues = {
    department: "",
    zone: "",
    collection: "ALL",
    fromDate: new Date(),
    toDate: new Date(),
    glcode: "",
    accno: "",
    depositDate: new Date(),
};

const ChequeDeposit = () => {
    const { user } = useAuth();
    const token = user?.token;
    const ulbId = user?.ulbId;
    const BASE_URL = import.meta.env.VITE_BASE_URL;

    const [departmentList, setDepartmentList] = useState([]);
    const [zoneList, setZoneList] = useState([]);
    const [glOptions, setGlOptions] = useState([]);
    const [accountOptions, setAccountOptions] = useState([]);
    const [collectionList, setCollectionList] = useState([]);
    const [loadingGL, setLoadingGL] = useState(false);
    const [loadingAccount, setLoadingAccount] = useState(false);
    const [summaryData, setSummaryData] = useState([]);
    const [detailData, setDetailData] = useState([]);
    const [detailDataCache, setDetailDataCache] = useState({});

    const authHeaders = {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    };

    useEffect(() => {
        if (token && ulbId) {
            fetchDepartments();
        }
    }, [token, ulbId]);


    const formatDate = (date) => {
        if (!date) return "";

        const d = new Date(date);
        if (Number.isNaN(d.getTime())) {
            return "";
        }
        const day = String(d.getDate()).padStart(2, "0");
        const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC",];
        const month = months[d.getMonth()];
        const year = d.getFullYear();

        return `${day}-${month}-${year}`;
    };

    const fetchDepartments = async () => {
        try {
            Swal.fire({
                title: "Loading Departments...",
                allowOutsideClick: false,
                allowEscapeKey: false,
                showConfirmButton: false,
                didOpen: () => {
                    Swal.showLoading();
                },
            });

            const res = await axios.get(
                `${BASE_URL}/api/Bankdeposit/department?ulbId=${ulbId}`,
                authHeaders
            );

            const list = res?.data?.data?.list || [];

            setDepartmentList(
                list.map((item) => ({
                    value: String(item.DEPTID),
                    label: item.DEPTNAME,
                }))
            );
        } catch (error) {
            console.error("Department fetch error:", error);
            setDepartmentList([]);
        } finally {
            Swal.close();
        }
    };

    const fetchZones = async (departmentId) => {
        try {
            if (!departmentId) {
                setZoneList([]);
                return;
            }

            Swal.fire({
                title: "Loading Zone...",
                allowOutsideClick: false,
                allowEscapeKey: false,
                showConfirmButton: false,
                didOpen: () => {
                    Swal.showLoading();
                },
            });

            const res = await axios.post(
                `${BASE_URL}/api/FrmCashDeposit/zones-by-department`,
                {
                    deptId: String(departmentId),
                    ulbId: Number(ulbId),
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const list = res?.data?.data?.list || [];

            setZoneList(
                list.map((zone) => ({
                    value: String(zone.ID),
                    label: zone.NAME,
                }))
            );
        } catch (err) {
            console.error(
                "Error fetching zones by department:",
                err
            );
            setZoneList([]);
        } finally {
            Swal.close();
        }
    };

    const fetchCollectionCenters = async (prabhagId) => {
        try {
            if (!prabhagId) {
                setCollectionList([]);
                return;
            }
            Swal.fire({
                title: "Loading Collection Center...",
                allowOutsideClick: false,
                allowEscapeKey: false,
                showConfirmButton: false,
                didOpen: () => {
                    Swal.showLoading();
                },
            });
            // Convert zone IDs: KINDA  Hardcoded values
            const collectionPrabhagId = Number(prabhagId) - 1282;

            const res = await axios.get(
                `${BASE_URL}/api/ChequeDepo/collectioncenter/${collectionPrabhagId}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const rows = res?.data?.data?.rows || [];

            setCollectionList(
                rows.map((item) => ({
                    value: String(
                        item.VAR_COLLCEN_COLLCENID
                    ),
                    label:
                        item.VAR_COLLCEN_COLLCENNAME,
                }))
            );
        } catch (error) {
            console.error(
                "Error fetching collection centers:",
                error
            );
            setCollectionList([]);
        } finally {
            Swal.close();
        }
    };

    const searchGL = async (prefix, signal) => {
        try {
            setLoadingGL(true);
            // Clear old results immediately
            setGlOptions([]);
            // If input is empty, do not call API
            if (!prefix?.trim()) {
                return;
            }
            const res = await axios.post(
                `${BASE_URL}/api/FrmAccount/searchGL`,
                { prefix: prefix.trim(), },
                { ...authHeaders, signal, }
            );
            const data = res?.data?.data?.data || [];
            setGlOptions(
                data.map((item) => ({
                    label: item.GLSEARCHNAME,
                    value: item.GLFUNCTION?.toString(),
                }))
            );
        } catch (error) {
            // Ignore cancelled requests
            if (
                error.name === "AbortError" || error.code === "ERR_CANCELED"
            ) {
                return;
            }
            console.error("GL search error:", error);
            // Clear options on error
            setGlOptions([]);
        } finally {
            // Stop loading
            setLoadingGL(false);
        }
    };

    const searchAccount = async (searchText, signal) => {
        try {
            // Clear previous results immediately
            setAccountOptions([]);
            // Validation
            if (!searchText?.trim() || !ulbId) {
                return;
            }
            setLoadingAccount(true);
            const res = await axios.post(
                `${BASE_URL}/api/FrmBulkReceipt/bulk-receipt-account-search`,
                { ulbid: Number(ulbId), accno: searchText.trim(), },
                { ...authHeaders, signal, }
            );

            const data = res?.data?.data?.data || [];
            setAccountOptions(
                data.map((item) => ({
                    label: `${item.ACCNO} - ${item.ACCOUNTNAME}`,
                    value: String(item.ACCNO),
                }))
            );
        } catch (error) {
            // Ignore cancelled requests
            if (
                error.name === "AbortError" || error.code === "ERR_CANCELED"
            ) {
                return;
            }

            console.error("Account search error:", error);
            setAccountOptions([]);
        } finally {
            setLoadingAccount(false);
        }
    };

    const handleSearch = async (values) => {
        try {
            Swal.fire({
                title: "Loading ...",
                allowOutsideClick: false,
                allowEscapeKey: false,
                showConfirmButton: false,
                didOpen: () => {
                    Swal.showLoading();
                },
            });
            const payload = {
                fromDate: formatDate(values.fromDate),
                toDate: formatDate(values.toDate),
                ulbId: String(ulbId),
                zoneId: values.zone || null,
                deptId: values.department || null,
                collId: values.department === "7" ? values.collection || null : null,
            };
            setDetailDataCache({});
            console.log("Cheque Deposit Summary Payload:", payload);

            const res = await axios.post(
                `${BASE_URL}/api/ChequeDepo/chequedepositsummary`,
                payload,
                {
                    headers: { Authorization: `Bearer ${token}`, },
                }
            );
            const rows = res?.data?.data?.rows || [];

            if (rows.length === 0) {
                Swal.close(); // close loader first

                setSummaryData([]);
                setDetailData([]);

                await Swal.fire({
                    // icon: "info",
                    title: "No Data Found",
                    confirmButtonText: "OK",
                    allowOutsideClick: false,
                });

                return;
            }

            setSummaryData(
                rows.map((row) => ({
                    checked: false,
                    department: row.DEPARTMENT,
                    bankName: row.BANKNAME,
                    amount: Number(row.BAMOUNT || 0),
                }))
            );
            setDetailData([]);
        } catch (error) {
            console.error(
                "Error fetching cheque deposit summary:",
                error
            );
            Swal.fire({
                icon: "error",
                title: "Error",
                text:
                    error?.response?.data?.message ||
                    "Failed to fetch cheque deposit summary.",
            });
            setSummaryData([]);
            setDetailData([]);
        } finally {
            Swal.close();
        }
    };

    const loadDetailTable = async (
        values,
        selectedSummaryRows
    ) => {
        try {
            Swal.fire({
                title: "Loading...",
                allowOutsideClick: false,
                allowEscapeKey: false,
                showConfirmButton: false,
                didOpen: () => {
                    Swal.showLoading();
                },
            });
            const selectedBankNames = selectedSummaryRows.map((row) => row.bankName).filter(Boolean).sort();

            const cacheKey = JSON.stringify({
                fromDate: formatDate(values.fromDate),
                toDate: formatDate(values.toDate),
                ulbId: String(ulbId),
                bankNames: selectedBankNames,
                zoneId: values.zone || null,
                deptId: values.department || null,
                collId: values.department === "7" ? values.collection || null : null,
            });

            if (detailDataCache[cacheKey]) {
                setDetailData(
                    detailDataCache[cacheKey].map((row) => ({
                        ...row,
                        checked: false,
                    }))
                );
                return;
            }

            const payload = JSON.parse(cacheKey);

            console.log("Cheque Deposit Detail Payload:", payload);

            const res = await axios.post(
                `${BASE_URL}/api/ChequeDepo/chequedepositdetails`,
                payload,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            const rows = res?.data?.data?.rows || [];

            if (rows.length === 0) {
                Swal.close(); // close loader first

                setDetailData([]);

                await Swal.fire({
                    // icon: "info",
                    title: "No Data Found",

                    confirmButtonText: "OK",
                    allowOutsideClick: false,
                });

                return;
            }


            const mappedData = rows.map((row) => ({
                checked: false,
                receiptNumber: row.RECNO || "",
                refNo: row.CHALLANO || "",
                receiptDate: row.RECDATE ? new Date(row.RECDATE).toLocaleDateString("en-GB") : "",
                mode: row.RMODE_DESC || "",
                department: row.DEPARTMENT || "",
                chequeNo: row.CHEQUENO ? String(row.CHEQUENO) : "",
                chequeDate: row.CHEQDT ? new Date(row.CHEQDT).toLocaleDateString("en-GB") : "",
                bankName: row.BANKNAME || "",
                amount: Number(row.AMOUNT || 0),
                deptId: row.DEPTID,
                zoneId: row.ZONEID,
                propNo: row.PROPNO,
            }));

            setDetailDataCache((prev) => ({ ...prev, [cacheKey]: mappedData, }));

            setDetailData(mappedData);
        } catch (error) {
            console.error(
                "Error fetching cheque deposit details:",
                error
            );

            Swal.fire({
                icon: "error",
                title: "Error",
                text:
                    error?.response?.data?.message ||
                    "Failed to fetch detail data.",
            });

            setDetailData([]);
        } finally {
            Swal.close();
        }
    };

    const handleSummarySelectAll = async (
        checked,
        values
    ) => {
        const updated = summaryData.map((row) => ({ ...row, checked: !!checked, }));

        setSummaryData(updated);

        if (!checked) { setDetailData([]); return; }

        // Load second table for all selected rows
        await loadDetailTable(values, updated);
    };

    const handleSummaryRowCheck = async (
        row,
        checked,
        values
    ) => {
        const updated = summaryData.map((item) =>
            item === row ? { ...item, checked: !!checked } : item);

        setSummaryData(updated);

        const selectedRows = updated.filter(
            (item) => item.checked
        );

        if (selectedRows.length === 0) {
            setDetailData([]);
            return;
        }

        await loadDetailTable(values, selectedRows);
    };

    const handleDetailSelectAll = (checked) => {
        setDetailData((prev) =>
            prev.map((row) => ({
                ...row,
                checked: !!checked,
            }))
        );
    };

    const handleDetailRowCheck = (row, checked) => {
        setDetailData((prev) =>
            prev.map((item) =>
                item === row ? { ...item, checked } : item
            )
        );
    };

    const handleSave = async (values, resetForm) => {
        try {
            if (!values.glcode) {
                Swal.fire({
                    icon: "warning",
                    // title: "Validation",
                    text: "विभाग संकेतांक रिक्त असू शकत नाही",
                });
                return;
            }
            if (!values.accno) {
                Swal.fire({
                    icon: "warning",
                    // title: "Validation",
                    text: "लेखाशीर्ष रिक्त असू शकत नाही",
                });
                return;
            }
            if (!values.depositDate) {
                Swal.fire({
                    icon: "warning",
                    // title: "Validation",
                    text: "ठेव तारीख रिक्त असू शकत नाही",
                });
                return;
            }
            const selectedRows = detailData.filter((row) => row.checked);

            if (selectedRows.length === 0) {
                Swal.fire({
                    icon: "warning",
                    // title: "Validation",
                    text: "Please select at least one record.",
                });
                return;
            }

            const paramStrParts = [
                formatDate(values.depositDate), // 1 Transaction Date
                "111", // 2 Voucher No
                "2", // 3 Transaction Type
                values.zone || "0", // 4 Zone Id
                "0", // 5 Gram Panchayat Id
                values.glcode || "0", // 6 Debit GL
                values.accno || "0", // 7 Debit Account
                "5", // 8 InMode
                "0", // 9 Reserved
                values.department || "0", // 10 Department Id
                "", // 11 Sub Department Id
                "0", // 12 Budget Id
                values.department === "7" ? values.collection || "0" : "", // 13 Collection Center Id
            ];

            while (
                paramStrParts.length &&
                (paramStrParts[paramStrParts.length - 1] === "" ||
                    paramStrParts[paramStrParts.length - 1] === null ||
                    paramStrParts[paramStrParts.length - 1] === undefined)
            ) {
                paramStrParts.pop();
            }

            const paramStr = paramStrParts.join("~");

            const paramStr2 = selectedRows
                .map((row) => {
                    let modeCode = "4";
                    const modeText = (row.mode || "").toLowerCase();

                    if (modeText === "cheque") { modeCode = "189"; }
                    else if (
                        modeText === "pay order" || modeText === "dd / po"
                    ) {
                        modeCode = "191";
                    }
                    return [
                        row.receiptNumber || "",
                        row.receiptDate ? formatDate(new Date(row.receiptDate)) : "",
                        modeCode,
                        values.department || "0",
                        Number(row.amount || 0),
                        values.zone || "0",
                        row.mode,
                        row.chequeNo || "",
                        row.chequeDate ? formatDate(new Date(row.chequeDate)) : "",
                        row.bankName || "",
                        values.glcode || "0",
                        values.accno || "0",
                        values.glcode || "0",
                        values.accno || "0",
                    ].join("#");
                })
                .join("$");
            const payload = {
                userId: user?.userId,
                ulbId: String(ulbId),
                paramStr,
                paramStr2,
                fromDate: formatDate(values.fromDate),
                toDate: formatDate(values.toDate),
            };

            console.log("Save Payload =>", payload);

            Swal.fire({
                title: "Saving...",
                allowOutsideClick: false,
                allowEscapeKey: false,
                showConfirmButton: false,
                didOpen: () => {
                    Swal.showLoading();
                },
            });

            const res = await axios.post(`${BASE_URL}/api/ChequeDepo/savecashierreceipt`, payload,
                {
                    headers: { Authorization: `Bearer ${token}`, },
                }
            );
            Swal.close();

            const result = res?.data?.data;
            console.log("result", result)
            if (result?.errorCode === -100) {
                const refNo = result?.returnStr;

                Swal.fire({
                    title: "Generating PDF...",
                    allowOutsideClick: false,
                    allowEscapeKey: false,
                    showConfirmButton: false,
                    didOpen: () => {
                        Swal.showLoading();
                    },
                });

                try {
                    // PDF API Call
                    const pdfRes = await axios.post(
                        `${BASE_URL}/api/ChequeDepo/generatechequedepositpdf`,
                        {
                            refNo: String(refNo),
                            ulbId: String(ulbId),
                        },
                        {
                            headers: {
                                Authorization: `Bearer ${token}`,
                            },
                        }
                    );
                    Swal.close();

                    const pdfUrl =
                        pdfRes?.data?.pdfUrl || pdfRes?.data?.data?.pdfUrl;

                    await Swal.fire({
                        icon: "success",
                        title: "Success",
                        text:
                            result?.errorMsg ||
                            `Transaction saved successfully. Reference No: ${refNo}`,
                    });

                    if (pdfUrl) {
                        window.open(pdfUrl, "_blank");

                    }

                    // Reset Formik form
                    resetForm({
                        values: {
                            department: "",
                            zone: "",
                            collection: "ALL",
                            fromDate: new Date(),
                            toDate: new Date(),
                            glcode: "",
                            accno: "",
                            depositDate: new Date(),
                        },
                    });

                    setSummaryData([]);
                    setDetailData([]);
                    setDetailDataCache({});
                    setZoneList([]);
                    setCollectionList([]);
                    setGlOptions([]);
                    setAccountOptions([]);

                    await fetchDepartments();
                } catch (pdfError) {
                    Swal.close();

                    console.error("PDF generation error:", pdfError);

                    await Swal.fire({
                        icon: "success",
                        title: "Transaction Saved",
                        text: result?.errorMsg || `Transaction saved successfully. Reference No: ${refNo}`,
                    });
                }
            } else {
                Swal.close();

                Swal.fire({
                    icon: "warning",
                    title: "Warning",
                    text: result?.errorMsg || "Unable to save transaction.",
                });
            }
        } catch (error) {
            Swal.close();

            console.error("Save error:", error);

            Swal.fire({
                icon: "error",
                title: "Error",
                text: error?.response?.data?.error || error?.response?.data?.message || "Failed to save transaction.",
            });
        }
    };

    const totalSelectedAmount = useMemo(() => {
        return detailData
            .filter((item) => item.checked)
            .reduce(
                (sum, item) => sum + Number(item.amount || 0),
                0
            );
    }, [detailData]);

    const summaryHeaders = [
        "Select All",
        "Department",
        "Bank Name",
        "Amount",
    ];

    const summaryKeyMapping = {
        "Select All": "checked",
        Department: "department",
        "Bank Name": "bankName",
        Amount: "amount",
    };

    const detailHeaders = [
        "Select All",
        "Receipt Number",
        "Challan No",
        "Receipt Date",
        "Mode",
        "Department",
        "Cheque/DD/Pay order number",
        "Cheque/DD/Pay order Date",
        "Bank Name",
        "Amount",
    ];

    const detailKeyMapping = {
        "Select All": "checked",
        "Receipt Number": "receiptNumber",
        "Challan No": "refNo",
        "Receipt Date": "receiptDate",
        Mode: "mode",
        Department: "department",
        "Cheque/DD/Pay order number": "chequeNo",
        "Cheque/DD/Pay order Date": "chequeDate",
        "Bank Name": "bankName",
        Amount: "amount",
    };

    return (
        <Formik initialValues={initialValues} onSubmit={() => { }}>
            {({ values, setFieldValue, resetForm }) => {

                return (
                    <Form>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                        >
                            <Card className="border shadow-sm">
                                <CardHeader className="border-b">
                                    <CardTitle className="text-xl font-semibold">
                                        Cheque Deposit
                                    </CardTitle>
                                </CardHeader>

                                <CardContent className="p-4 md:p-6 space-y-6">
                                    <div className="border rounded-md p-4 md:p-6 space-y-4">
                                        <div className={`grid grid-cols-1 gap-4 ${values.department === "7" ? "lg:grid-cols-3" : "lg:grid-cols-2"}`}>
                                            <FieldRow label="विभाग">
                                                <Select
                                                    value={values.department}
                                                    onValueChange={async (value) => {
                                                        setFieldValue("department", value);
                                                        setFieldValue("zone", "");
                                                        setFieldValue("collection", "");
                                                        setFieldValue("glcode", "");
                                                        setFieldValue("accno", "");
                                                        setZoneList([]);
                                                        setCollectionList([]);
                                                        setGlOptions([]);
                                                        setAccountOptions([]);
                                                        await fetchZones(value);
                                                    }}
                                                >
                                                    <SelectTrigger className="w-full">
                                                        <SelectValue placeholder="-- Select --" />
                                                    </SelectTrigger>

                                                    <SelectContent>
                                                        {departmentList.map((item) => (
                                                            <SelectItem
                                                                key={item.value}
                                                                value={item.value}
                                                            >
                                                                {item.label}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </FieldRow>

                                            <FieldRow label="प्रभाग">
                                                <Select
                                                    value={values.zone}
                                                    onValueChange={async (value) => {
                                                        setFieldValue("zone", value);
                                                        setFieldValue("collection", "");
                                                        setCollectionList([]);
                                                        // If विभाग = 7, load collection centers
                                                        if (values.department === "7") {
                                                            await fetchCollectionCenters(value);
                                                        }
                                                    }}
                                                >
                                                    <SelectTrigger
                                                        className="w-full"
                                                        disabled={!values.department}
                                                    >
                                                        <SelectValue placeholder="-- Select --" />
                                                    </SelectTrigger>

                                                    <SelectContent>
                                                        {zoneList.map((item) => (
                                                            <SelectItem
                                                                key={item.value}
                                                                value={item.value}
                                                            >
                                                                {item.label}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </FieldRow>

                                            {values.department === "7" && (
                                                <FieldRow label="Collection Center">
                                                    <Select
                                                        value={values.collection}
                                                        onValueChange={(value) =>
                                                            setFieldValue("collection", value)
                                                        }
                                                    >
                                                        <SelectTrigger
                                                            className="w-full"
                                                            disabled={!values.zone}
                                                        >
                                                            <SelectValue placeholder="-- Select --" />
                                                        </SelectTrigger>

                                                        <SelectContent>
                                                            {collectionList.map((item) => (
                                                                <SelectItem
                                                                    key={item.value}
                                                                    value={item.value}
                                                                >
                                                                    {item.label}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </FieldRow>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                            <FieldRow label="दिनांक पासून">
                                                <DatePicker
                                                    value={values.fromDate}
                                                    onChange={(date) =>
                                                        setFieldValue("fromDate", date)
                                                    }
                                                />
                                            </FieldRow>

                                            <FieldRow label="दिनांक पर्यंत">
                                                <DatePicker
                                                    value={values.toDate}
                                                    onChange={(date) =>
                                                        setFieldValue("toDate", date)
                                                    }
                                                />
                                            </FieldRow>
                                        </div>
                                    </div>

                                    <div className="flex justify-center gap-3">
                                        <Button
                                            type="button"
                                            onClick={() => handleSearch(values)}
                                        >
                                            Search
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => {
                                                resetForm();

                                                setSummaryData([]);
                                                setDetailData([]);
                                                setDetailDataCache({});
                                                setZoneList([]);
                                                setCollectionList([]);
                                                setGlOptions([]);
                                                setAccountOptions([]);
                                            }}
                                        >
                                            Reset
                                        </Button>
                                    </div>


                                    {summaryData.length > 0 && (
                                        <>
                                            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                                                <FieldRow label="विभाग संकेतांक">
                                                    <AsyncSearchableSelect
                                                        options={glOptions}
                                                        value={values.glcode}
                                                        onSearch={searchGL}
                                                        isLoading={loadingGL}
                                                        loadingMessage="Searching GL..."
                                                        noOptionsMessage="No Data Found"
                                                        onChange={(option) => {
                                                            const selectedValue =
                                                                option?.value || "";

                                                            setFieldValue(
                                                                "glcode",
                                                                selectedValue
                                                            );

                                                            // Reset लेखाशीर्ष
                                                            setFieldValue("accno", "");
                                                            setAccountOptions([]);
                                                        }}
                                                        placeholder="विभाग संकेतांक निवडा"
                                                    />
                                                </FieldRow>

                                                <FieldRow label="लेखाशीर्ष">
                                                    <AsyncSearchableSelect
                                                        options={accountOptions}
                                                        value={values.accno}
                                                        onSearch={searchAccount}
                                                        isLoading={loadingAccount}
                                                        loadingMessage="Searching..."
                                                        noOptionsMessage="No Data Found"
                                                        onChange={(option) =>
                                                            setFieldValue(
                                                                "accno",
                                                                option?.value || ""
                                                            )
                                                        }
                                                        placeholder="लेखाशीर्ष निवडा"
                                                    />
                                                </FieldRow>

                                                <FieldRow label="Deposit Date">
                                                    <DatePicker
                                                        value={values.depositDate}
                                                        onChange={(date) =>
                                                            setFieldValue(
                                                                "depositDate",
                                                                date
                                                            )
                                                        }
                                                    />
                                                </FieldRow>
                                            </div>

                                            <ShadCNTable
                                                headers={summaryHeaders}
                                                data={summaryData}
                                                keyMapping={summaryKeyMapping}
                                                onSelectAllChange={(checked) =>
                                                    handleSummarySelectAll(
                                                        checked,
                                                        values
                                                    )
                                                }
                                                onRowCheckChange={(row, checked) =>
                                                    handleSummaryRowCheck(
                                                        row,
                                                        checked,
                                                        values
                                                    )
                                                }
                                            />
                                        </>
                                    )}

                                    {detailData.length > 0 && (
                                        <>
                                            <ShadCNTable
                                                headers={detailHeaders}
                                                data={detailData}
                                                keyMapping={detailKeyMapping}
                                                onSelectAllChange={
                                                    handleDetailSelectAll
                                                }
                                                onRowCheckChange={
                                                    handleDetailRowCheck
                                                }
                                            />

                                            <div className="max-w-xs">
                                                <FieldRow label="Total Selected Amount">
                                                    <Input
                                                        value={totalSelectedAmount.toFixed(2)}
                                                        disabled
                                                    />
                                                </FieldRow>
                                            </div>

                                            <div className="flex justify-center">
                                                <Button
                                                    type="button"
                                                    onClick={() =>
                                                        handleSave(values, resetForm)
                                                    }
                                                >
                                                    Save
                                                </Button>
                                            </div>
                                        </>
                                    )}
                                </CardContent>
                            </Card>
                        </motion.div>
                    </Form>
                );
            }}
        </Formik>
    );
};

const FieldRow = ({ label, children }) => {
    return (
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <div className="w-full sm:w-40 shrink-0 flex justify-between items-center">
                <Label text={label} />
                <span>:</span>
            </div>
            <div className="flex-1">{children}</div>
        </div>
    );
};

export default ChequeDeposit;

