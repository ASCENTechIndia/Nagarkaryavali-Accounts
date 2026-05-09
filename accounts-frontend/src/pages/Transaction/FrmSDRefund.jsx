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

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ShadCNTable from "@/components/ui/table";
import SearchableSelect from "@/components/SearchableSelect";
import { DatePicker } from "@/components/ui/calendar";

const FrmSDRefund = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const token = user?.token;
    const ulbId = user?.ulbId;

    const BASE_URL = import.meta.env.VITE_BASE_URL;

    const [tableData, setTableData] = useState([]);
    const [glList, setGlList] = useState([]);
    const [entryHeadList, setEntryHeadList] = useState([]);

    const formatDate = (date) => {
        if (!date) return "";

        const d = new Date(date);
        const day = String(d.getDate()).padStart(2, "0");
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const year = d.getFullYear();

        return `${day}-${month}-${year}`;
    };

    useEffect(() => {
        const fetchGLList = async () => {
            try {
                const res = await axios.get(
                    `${BASE_URL}/api/Receipt/searchGLALL`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );

                const data = res.data?.data || [];

                const formatted = data.map((item) => ({
                    label: item.GLSEARCHNAME || "",
                    value: item.GLFUNCTION?.toString() || "",
                }));

                setGlList(formatted);
            } catch (err) {
                console.error("GL List API Error:", err);
            }
        };

        if (token) fetchGLList();
    }, [token]);



    const fetchCreditLeasure = async (glcode) => {
        if (!glcode) return;

        try {
            const res = await axios.post(
                `${BASE_URL}/api/FrmTransfer/credit-leasure`,
                {
                    corp_id: ulbId,
                    glcode: glcode,
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            const data = res.data?.data?.rows || [];

            const formatted = data.map((item) => ({
                label: item.ACCNAME || "",
                value: item.OBJECTCODE?.toString() || "",
            }));

            setEntryHeadList(formatted);
        } catch (err) {
            console.error("Credit Leasure API Error:", err);
        }
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
                chequeFrom: values.fromCheque,
                chequeTo: values.toCheque,
                bankGl: values.entryDeptCode,
                bankAccNo: values.entryHead,
            };


            const res = await axios.post(
                `${BASE_URL}/api/FrmChequeUpdateRpt/cheque-update-report`,
                payload,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            const rows = res.data?.data?.rows || [];

            const formatted = rows.map((item) => ({
                chequeNo: item.CHEQNO?.toString() || "",
                bookNo: item.CHQBOOK?.toString() || "",
                status: item.CURNTTSITUATION || "",
                date: formatDate(item.CHEQDATE),
                amount: item.CHEQAMT?.toString() || "",
                voucherNo: item.VCHNO || "",
                voucherDate: formatDate(item.VCHODATE),
                remark: item.BANKNAME || item.REMARK || "",
            }));

            setTableData(formatted);

            Swal.close();

        } catch (err) {
            console.error("Report API Error:", err);

            Swal.fire({
                text: "Failed to fetch report",
            });
        }
    };

    const headers = [
        "धनादेश क्रमांक",
        "धनादेश बुक क्रमांक",
        "सदयस्थिती",
        "धनादेश दिनांक",
        "धनादेश रक्कम",
        "प्रमाणक क्रमांक",
        "प्रमाणक दिनांक",
        "शेरा",
    ];

    const keyMapping = {
        "धनादेश क्रमांक": "chequeNo",
        "धनादेश बुक क्रमांक": "bookNo",
        "सदयस्थिती": "status",
        "धनादेश दिनांक": "date",
        "धनादेश रक्कम": "amount",
        "प्रमाणक क्रमांक": "voucherNo",
        "प्रमाणक दिनांक": "voucherDate",
        "शेरा": "remark",
    };

    return (
        <Formik
            initialValues={{
                entryDeptCode: "",
                entryHead: "",
                fromCheque: "",
                toCheque: "",
            }}
            onSubmit={handleSubmit}
        >
            {({ values, setFieldValue, handleChange, resetForm }) => (
                <Form>
                    <motion.div className="mt-2 px-2 sm:px-4">
                        <Card className="border border-gray-300 rounded-sm shadow-none">
                            <CardHeader className="border-b py-4 px-4">
                                <CardTitle className="text-[18px] font-semibold text-black">
                                    Security Deposit Refund List
                                </CardTitle>
                            </CardHeader>

                            <CardContent className="p-3 sm:p-5 space-y-6">

                                {/* Form Section */}
                                <div className="border border-gray-300 rounded-sm p-4 sm:p-5 bg-white">

                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">

                                        {/* सु.अ.क्र.शोध */}
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

                                        {/* पार्टी कोड */}
                                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                                            <Label
                                                className="sm:w-40 text-left sm:text-right font-semibold"
                                                text="पार्टी कोड :"
                                            />

                                            <div className="flex-1 w-full">
                                                <SearchableSelect
                                                    name="entryDeptCode"
                                                    value={values.entryDeptCode}
                                                    options={glList}
                                                    onChange={(val) => {
                                                        if (!val) return;

                                                        setFieldValue("entryDeptCode", val.value);

                                                        fetchCreditLeasure(val.value);

                                                        setFieldValue("entryHead", "");
                                                    }}
                                                />
                                            </div>
                                        </div>

                                        {/* कंत्राटदार नाव */}
                                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                                            <Label
                                                className="sm:w-40 text-left sm:text-right font-semibold"
                                                text="कंत्राटदार नाव :"
                                            />

                                            <div className="flex-1 w-full">
                                                <SearchableSelect
                                                    name="contractorName"
                                                    value={values.contractorName}
                                                    options={entryHeadList}
                                                    onChange={(val) => {
                                                        if (!val) return;

                                                        setFieldValue(
                                                            "contractorName",
                                                            val.value
                                                        );
                                                    }}
                                                />
                                            </div>
                                        </div>

                                        {/* जमा दिनांक */}
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

                                    {/* Buttons */}
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

                                    {/* Export + Print */}
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
                                                        name="export"
                                                        defaultChecked
                                                    />
                                                    Pdf
                                                </label>

                                                <label className="flex items-center gap-2 text-sm">
                                                    <input
                                                        type="radio"
                                                        name="export"
                                                    />
                                                    Excel
                                                </label>
                                            </div>
                                        </div>

                                        <Button className="bg-blue-900 hover:bg-blue-950 text-white px-8">
                                            Print
                                        </Button>
                                    </div>

                                    {/* Table */}
                                    {tableData.length > 0 && (
                                        <div className="mt-6 border-t pt-4">
                                            <ShadCNTable
                                                headers={headers}
                                                data={tableData}
                                                keyMapping={keyMapping}
                                                pagination={true}
                                                rowsPerPage={5}
                                            />
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