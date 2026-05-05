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

const FrmChequeUpdatereport = () => {
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

            // 🔥 Map API → table format
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

    // ✅ Table config
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
                    <motion.div className="mt-4 px-2 sm:px-4">
                        <Card className="border shadow-sm">

                            {/* HEADER */}
                            <CardHeader className="border-b">
                                <CardTitle className="text-lg font-bold">
                                    Cheque Change Report
                                </CardTitle>
                            </CardHeader>

                            <CardContent className="p-3 sm:p-5 space-y-6">

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">

                                    {/* विभाग संकेतांक */}
                                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                                        <Label className="sm:w-40 text-left sm:text-right" text="विभाग संकेतांक :" />
                                        <div className="flex-1 w-full">
                                            <SearchableSelect
                                                name="entryDeptCode"
                                                value={values.entryDeptCode}
                                                options={glList}
                                                onChange={(val) => {
                                                    if (!val) return;

                                                    setFieldValue("entryDeptCode", val.value);

                                                    // 🔥 call second API
                                                    fetchCreditLeasure(val.value);

                                                    // reset second dropdown
                                                    setFieldValue("entryHead", "");
                                                }}
                                            />
                                        </div>
                                    </div>

                                    {/* लेखाशिर्ष */}
                                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                                        <Label className="sm:w-40 text-left sm:text-right" text="लेखाशिर्ष :" />
                                        <div className="flex-1 w-full">
                                            <SearchableSelect
                                                name="entryHead"
                                                value={values.entryHead}
                                                options={entryHeadList}
                                                onChange={(val) => {
                                                    if (!val) return;
                                                    setFieldValue("entryHead", val.value);
                                                }}
                                            />
                                        </div>
                                    </div>

                                    {/* From Cheque */}
                                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                                        <Label className="sm:w-40 text-left sm:text-right" text="धनादेश पासून :" />
                                        <Input
                                            name="fromCheque"
                                            value={values.fromCheque}
                                            onChange={handleChange}
                                            className="flex-1 w-full bg-cyan-200"
                                        />
                                    </div>

                                    {/* To Cheque */}
                                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                                        <Label className="sm:w-40 text-left sm:text-right" text="धनादेश पर्यंत :" />
                                        <Input
                                            name="toCheque"
                                            value={values.toCheque}
                                            onChange={handleChange}
                                            className="flex-1 w-full"
                                        />
                                    </div>
                                </div>


                                {/* ✅ BUTTONS */}
                                <div className="flex flex-wrap justify-center gap-3 mt-4">
                                    <Button type="submit" className="bg-blue-900 text-white px-6">
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
                                        onClick={() => navigate("/HomePage/FrmHomePage")}
                                    >
                                        Exit
                                    </Button>
                                </div>

                                {/* ✅ TABLE */}
                                {tableData.length > 0 && (
                                    <div className="mt-4">
                                        <ShadCNTable
                                            headers={headers}
                                            data={tableData}
                                            keyMapping={keyMapping}
                                            pagination={true}
                                            rowsPerPage={5}
                                        />
                                    </div>
                                )}

                            </CardContent>
                        </Card>
                    </motion.div>
                </Form>
            )}
        </Formik>
    );
};

export default FrmChequeUpdatereport;