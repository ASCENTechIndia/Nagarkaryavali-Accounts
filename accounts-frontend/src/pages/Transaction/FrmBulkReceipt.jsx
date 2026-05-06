import React, { useEffect, useState } from "react";
import { Formik, Form } from "formik";
import { motion } from "framer-motion";
import axios from "axios";
import Swal from "sweetalert2";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

import SearchableSelect from "@/components/SearchableSelect";
import ShadCNTable from "@/components/ui/table";

import { useAuth } from "@/context/AuthContext";
import AsyncSearchableSelect from "@/components/AsyncSearchableSelect";

const initialValues = {
    deptId: "",
    challanNo: "",
    trnsType: "",
    trnsDate: new Date().toLocaleDateString("en-CA"),
    receiptNo: "",
    glcode: "",
    accno: "",
    narration: "",
    amount: "",
    budgetHead: "",
};

const FrmBulkReceipt = () => {
    const { user } = useAuth();

    const token = user?.token;
    const ulbId = user?.ulbId;

    const BASE_URL = import.meta.env.VITE_BASE_URL;

    const [departmentList, setDepartmentList] = useState([]);
    const [transactionTypes, setTransactionTypes] = useState([]);
    const [budgetHeads, setBudgetHeads] = useState([]);
    const [glOptions, setGlOptions] = useState([]);
    const [accountOptions, setAccountOptions] = useState([]);
    const [tableData, setTableData] = useState([]);
    const [loadingGL, setLoadingGL] = useState(false);
    const [loadingAccount, setLoadingAccount] = useState(false);
    const [loadingTable, setLoadingTable] = useState(false);
    const [selectedGL, setSelectedGL] = useState("");
    const headers = [
        "Select",
        "GL Code",
        "GL Name",
        "Account No",
        "Account Name",
        "Credit",
        "Discount",
    ];

    const keyMapping = {
        Select: "select",
        "GL Code": "GLCODE",
        "GL Name": "GLNAME",
        "Account No": "ACCNO",
        "Account Name": "ACCOUNTNAME",
        Credit: "CREDIT",
        Discount: "DISCOUNT",
    };

    useEffect(() => {
        fetchDepartments();
        fetchTransactionTypes();
        fetchBudgetHeads();
    }, []);

    const fetchDepartments = async () => {
        try {
            const res = await axios.get(
                `${BASE_URL}/api/Bankdeposit/department?ulbId=${ulbId}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (res?.data?.data?.list) {
                const formatted = res.data.data.list.map((d) => ({
                    label: d.DEPTNAME,
                    value: d.DEPTID.toString(),
                }));

                setDepartmentList(formatted);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const fetchTransactionTypes = async () => {
        try {
            const res = await axios.get(
                `${BASE_URL}/api/Receipt/transType`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (res?.data?.data) {
                const formatted = res.data.data.map((t) => ({
                    label: t.DISPLAYTEXT,
                    value: t.VALUEFIELD.toString(),
                }));

                setTransactionTypes(formatted);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const fetchBudgetHeads = async () => {
        try {
            const res = await axios.get(
                `${BASE_URL}/api/Receipt/budget-heads`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (res?.data?.data) {
                const formatted = res.data.data.map((b) => ({
                    label: b.VAR_BUDGETCONFIG_BUDGETNAME,
                    value: b.NUM_BUDGETCONFIG_HEADID.toString(),
                }));

                setBudgetHeads(formatted);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const searchGL = async (prefix) => {
        try {
            setLoadingGL(true);
            console.log(
                "Calling GL API with prefix =>",
                prefix
            );
            const res = await axios.post(
                `${BASE_URL}/api/FrmAccount/searchGL`,
                {
                    prefix,
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (res?.data?.data?.data) {
                const formatted =
                    res.data.data.data.map((g) => ({
                        label: g.GLSEARCHNAME,
                        value: g.GLFUNCTION.toString(),
                    }));

                setGlOptions(formatted);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingGL(false);
        }
    };

    const searchAccount = async (
        searchText,
        glcode
    ) => {
        try {
            setLoadingAccount(true);

            const payload = {
                ulbid: ulbId,
            };

            if (searchText) {
                payload.accno = searchText;
            }

            // if (glcode) {
            //     payload.glcode = glcode;
            // }
            console.log(
                "Calling Account API with =>",
                {
                    searchText,
                    glcode,
                }
            );
            const res = await axios.post(
                `${BASE_URL}/api/FrmBulkReceipt/bulk-receipt-account-search`,
                payload,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (res?.data?.data?.data) {
                const formatted =
                    res.data.data.data.map((a) => ({
                        label: `${a.ACCNO} - ${a.ACCOUNTNAME}`,
                        value: a.ACCNO.toString(),
                    }));

                setAccountOptions(formatted);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingAccount(false);
        }
    };

    const handleCheckboxChange = (
        row,
        checked,
        setFieldValue
    ) => {
        const updatedRows = tableData.map((item) => {
            if (item.ACCNO === row.ACCNO) {
                return {
                    ...item,
                    selected: checked,
                };
            }

            return item;
        });

        setTableData(updatedRows);

        const total = updatedRows
            .filter((x) => x.selected)
            .reduce(
                (sum, item) =>
                    sum + Number(item.CREDIT || 0),
                0
            );

        setFieldValue("amount", total);
    };

    const fetchBulkReceiptDetails = async (
        values,
        setFieldValue
    ) => {
        try {
            setLoadingTable(true);
            if (!values.deptId) {
                Swal.fire({
                    text: "Please select department",
                    confirmButtonColor: "#1e3a8a",
                });
                return;
            }

            if (!values.challanNo) {
                Swal.fire({
                    text: "Please enter challan number",
                    confirmButtonColor: "#1e3a8a",
                });
                return;
            }

            const res = await axios.post(
                `${BASE_URL}/api/FrmBulkReceipt/bulk-receipt-list`,
                {
                    challanNo: values.challanNo,
                    deptId: Number(values.deptId),
                    ulbId: Number(ulbId),
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (res?.data?.data?.data?.length > 0) {
                const rows = res.data.data.data.map((r) => ({
                    ...r,
                    selected: false,
                }));

                setTableData(rows);

                setFieldValue("amount", "");
            } else {
                setTableData([]);

                Swal.fire({
                    text: "Data Not Found",
                    confirmButtonColor: "#1e3a8a",
                });
            }
        } catch (err) {
            console.error(err);

            Swal.fire({
                text:
                    err?.response?.data?.message ||
                    "Error fetching transaction details",
                confirmButtonColor: "#1e3a8a",
            });
        } finally {
            setLoadingTable(false);
        }
    };


    return (
        <Formik
            initialValues={initialValues}
            enableReinitialize
            onSubmit={(values) => {
                console.log(values);
            }}
        >
            {({
                values,
                setFieldValue,
                handleChange,
                resetForm,
            }) => {
                const transformedTableData = tableData.map(
                    (item) => ({
                        ...item,

                        select: (
                            <input
                                type="checkbox"
                                checked={item.selected || false}
                                onChange={(e) =>
                                    handleCheckboxChange(
                                        item,
                                        e.target.checked,
                                        setFieldValue
                                    )
                                }
                            />
                        ),
                    })
                );

                return (
                    <Form>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                        >
                            <Card className="border shadow-sm">
                                <CardHeader className="border-b">
                                    <CardTitle className="text-lg font-semibold">
                                        Bulk Receipt
                                    </CardTitle>
                                </CardHeader>

                                <CardContent className="p-4 sm:p-6 space-y-8">
                                    {/* TOP SECTION */}

                                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
                                        {/* Department */}

                                        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                            <div className="w-full sm:w-40 shrink-0 flex justify-between items-center">
                                                <Label text="Department" />
                                                <span>:</span>
                                            </div>

                                            <Select
                                                value={values.deptId}
                                                onValueChange={(v) =>
                                                    setFieldValue("deptId", v)
                                                }
                                            >
                                                <SelectTrigger className="w-full h-9">
                                                    <SelectValue placeholder="-- विकल्प निवडा --" />
                                                </SelectTrigger>

                                                <SelectContent>
                                                    {departmentList.map((d) => (
                                                        <SelectItem
                                                            key={d.value}
                                                            value={d.value}
                                                        >
                                                            {d.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {/* Challan */}

                                        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                            <div className="w-full sm:w-40 shrink-0 flex justify-between items-center">
                                                <Label text="Chalan Number" />
                                                <span>:</span>
                                            </div>

                                            <Input
                                                name="challanNo"
                                                value={values.challanNo}
                                                onChange={handleChange}
                                                className="w-full h-9"
                                            />
                                        </div>

                                        {/* Search Button */}

                                        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-end">
                                            <Button
                                                type="button"
                                                className="bg-blue-900 hover:bg-blue-800 text-white"
                                                onClick={() =>
                                                    fetchBulkReceiptDetails(
                                                        values,
                                                        setFieldValue
                                                    )
                                                }
                                            >
                                                व्यवहार तपशील
                                            </Button>

                                            <Button
                                                type="button"
                                                variant="destructive"
                                                onClick={() => {
                                                    resetForm();

                                                    setTableData([]);
                                                    setGlOptions([]);
                                                    setAccountOptions([]);
                                                }}
                                            >
                                                रिसेट
                                            </Button>
                                        </div>
                                    </div>

                                    <hr />

                                    {/* MAIN FORM */}

                                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                                        {/* व्यवहार प्रकार */}

                                        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                            <div className="w-full sm:w-40 shrink-0 flex justify-between items-center">
                                                <Label text="व्यवहार प्रकार" />
                                                <span>:</span>
                                            </div>

                                            <Select
                                                value={values.trnsType}
                                                onValueChange={(v) =>
                                                    setFieldValue("trnsType", v)
                                                }
                                            >
                                                <SelectTrigger className="w-full h-9">
                                                    <SelectValue placeholder="-- Select --" />
                                                </SelectTrigger>

                                                <SelectContent>
                                                    {transactionTypes.map((t) => (
                                                        <SelectItem
                                                            key={t.value}
                                                            value={t.value}
                                                        >
                                                            {t.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {/* व्यवहार दिनांक */}

                                        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                            <div className="w-full sm:w-40 shrink-0 flex justify-between items-center">
                                                <Label text="व्यवहार दिनांक" />
                                                <span>:</span>
                                            </div>

                                            <Input
                                                type="date"
                                                name="trnsDate"
                                                value={values.trnsDate}
                                                onChange={handleChange}
                                                className="w-full h-9"
                                            />
                                        </div>

                                        {/* Receipt No */}

                                        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                            <div className="w-full sm:w-40 shrink-0 flex justify-between items-center">
                                                <Label text="पावती क्रमांक" />
                                                <span>:</span>
                                            </div>

                                            <Input
                                                name="receiptNo"
                                                value={values.receiptNo}
                                                onChange={handleChange}
                                                className="w-full h-9"
                                            />
                                        </div>

                                        {/* विभाग संकेतांक */}

                                        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                            <div className="w-full sm:w-40 shrink-0 flex justify-between items-center">
                                                <Label text="विभाग संकेतांक" />
                                                <span>:</span>
                                            </div>

                                            <AsyncSearchableSelect
                                                options={glOptions}
                                                value={values.glcode}
                                                onSearch={(value) => {
                                                    console.log(
                                                        "Searching GL =>",
                                                        value
                                                    );

                                                    searchGL(value);
                                                }}
                                                isLoading={loadingGL}
                                                loadingMessage="Searching GL..."
                                                noOptionsMessage="No Data Found"
                                                onChange={(option) => {
                                                    const value = option?.value || "";

                                                    setFieldValue("glcode", value);

                                                    setSelectedGL(value);
                                                }}
                                                placeholder="विभाग संकेतांक निवडा"
                                            />
                                        </div>

                                        {/* Amount */}

                                        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                            <div className="w-full sm:w-40 shrink-0 flex justify-between items-center">
                                                <Label text="एकूण रक्कम" />
                                                <span>:</span>
                                            </div>

                                            <Input
                                                name="amount"
                                                value={values.amount}
                                                disabled
                                                className="w-full h-9 bg-gray-100"
                                            />
                                        </div>

                                        {/* Budget */}

                                        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                            <div className="w-full sm:w-40 shrink-0 flex justify-between items-center">
                                                <Label text="बजेट" />
                                                <span>:</span>
                                            </div>

                                            <Select
                                                value={values.budgetHead}
                                                onValueChange={(v) =>
                                                    setFieldValue("budgetHead", v)
                                                }
                                            >
                                                <SelectTrigger className="w-full h-9">
                                                    <SelectValue placeholder="-- Select --" />
                                                </SelectTrigger>

                                                <SelectContent>
                                                    {budgetHeads.map((b) => (
                                                        <SelectItem
                                                            key={b.value}
                                                            value={b.value}
                                                        >
                                                            {b.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {/* लेखाशीर्ष */}

                                        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                            <div className="w-full sm:w-40 shrink-0 flex justify-between items-center">
                                                <Label text="लेखाशीर्ष" />
                                                <span>:</span>
                                            </div>

                                            <AsyncSearchableSelect
                                                options={accountOptions}
                                                value={values.accno}
                                                onSearch={(value) => {
                                                    console.log(
                                                        "Searching Account =>",
                                                        value
                                                    );

                                                    searchAccount(
                                                        value,
                                                        selectedGL
                                                    );
                                                }}
                                                isLoading={loadingAccount}
                                                loadingMessage="Searching Account..."
                                                noOptionsMessage="No Data Found"
                                                onChange={(option) =>
                                                    setFieldValue(
                                                        "accno",
                                                        option?.value || ""
                                                    )
                                                }
                                                placeholder="लेखाशीर्ष निवडा"
                                            />
                                        </div>
                                    </div>

                                    {/* TABLE */}
                                    {loadingTable && (
                                        <div className="flex justify-center items-center py-10">
                                            <div className="text-blue-900 font-medium animate-pulse">
                                                Loading transaction details...
                                            </div>
                                        </div>
                                    )}

                                    {tableData.length > 0 && (
                                        <>
                                            <hr />

                                            <ShadCNTable
                                                headers={headers}
                                                data={transformedTableData}
                                                keyMapping={keyMapping}
                                                pagination={true}
                                                rowsPerPage={5}
                                                className="max-md:min-w-380"
                                            />
                                        </>
                                    )}

                                    {/* Narration */}

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="flex flex-col sm:flex-row sm:items-start gap-2">
                                            <div className="w-full sm:w-40 shrink-0 flex justify-between items-center pt-2">
                                                <Label text="तपशील" />
                                                <span>:</span>
                                            </div>

                                            <textarea
                                                name="narration"
                                                value={values.narration}
                                                onChange={handleChange}
                                                className="w-full border rounded-md p-3 min-h-24"
                                            />
                                        </div>
                                    </div>

                                    {/* BUTTONS */}

                                    <div className="flex justify-center gap-4 pt-4">
                                        <Button
                                            type="submit"
                                            className="bg-blue-900 hover:bg-blue-800 text-white"
                                        >
                                            सेव्ह
                                        </Button>

                                        <Button
                                            type="button"
                                            variant="destructive"
                                        >
                                            परत
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

export default FrmBulkReceipt;