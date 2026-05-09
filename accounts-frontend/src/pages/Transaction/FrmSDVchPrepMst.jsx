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

const FrmSDVchPrepMst = () => {
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
                                    Security Deposit Refund Voucher Preparation
                                </CardTitle>
                            </CardHeader>

                            <CardContent className="p-3 sm:p-5 space-y-6">

                                {/* Main Section */}
                                <div className="border border-gray-300 rounded-sm bg-white p-4 sm:p-5 space-y-6">

                                    {/* Top Details */}
                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">

                                        {/* Date */}
                                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                                            <Label
                                                className="sm:w-28 text-left sm:text-right font-semibold"
                                                text="तारीख :"
                                            />

                                            <Input
                                                type="text"
                                                name="voucherDate"
                                                value={values.voucherDate}
                                                onChange={handleChange}
                                                className="flex-1 w-full h-10"
                                            />
                                        </div>

                                        {/* Party */}
                                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                                            <Label
                                                className="sm:w-24 text-left sm:text-right font-semibold"
                                                text="पार्टी :"
                                            />

                                            <div className="flex-1 w-full">
                                                <SearchableSelect
                                                    name="entryDeptCode"
                                                    value={values.entryDeptCode}
                                                    options={glList}
                                                    onChange={(val) => {
                                                        if (!val) return;

                                                        setFieldValue(
                                                            "entryDeptCode",
                                                            val.value
                                                        );

                                                        fetchCreditLeasure(val.value);

                                                        setFieldValue("entryHead", "");
                                                    }}
                                                />
                                            </div>
                                        </div>


                                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                                            <Label
                                                className="sm:w-28 text-left sm:text-right font-semibold"
                                                text="पॅनकोड :"
                                            />

                                            <Input
                                                name="panNo"
                                                value={values.panNo}
                                                onChange={handleChange}
                                                className="flex-1 w-full h-10"
                                            />
                                        </div>

                                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                                            <Label
                                                className="sm:w-28 text-left sm:text-right font-semibold"
                                                text="जी.एस.टी नंबर :"
                                            />

                                            <Input
                                                name="gstNo"
                                                value={values.gstNo}
                                                onChange={handleChange}
                                                className="flex-1 w-full h-10"
                                            />
                                        </div>
                                    </div>

                                    {/* Bank Section */}
                                    <div className="border-t border-gray-300 pt-5">

                                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 items-start">

                                            {/* Select Bank Button */}
                                            <div>
                                                <Button className="bg-blue-900 hover:bg-blue-950 text-white px-6">
                                                    Select Bank
                                                </Button>
                                            </div>

                                            {/* Bank + IFSC */}
                                            <div className="space-y-4">

                                                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                                                    <Label
                                                        className="sm:w-24 text-left sm:text-right font-semibold"
                                                        text="Bank :"
                                                    />

                                                    <Input
                                                        name="bankName"
                                                        value={values.bankName}
                                                        onChange={handleChange}
                                                        className="flex-1 w-full h-10"
                                                    />
                                                </div>

                                                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                                                    <Label
                                                        className="sm:w-24 text-left sm:text-right font-semibold"
                                                        text="IFSC :"
                                                    />

                                                    <Input
                                                        name="ifsc"
                                                        value={values.ifsc}
                                                        onChange={handleChange}
                                                        className="flex-1 w-full h-10"
                                                    />
                                                </div>
                                            </div>

                                            {/* Branch + AC */}
                                            <div className="space-y-4">

                                                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                                                    <Label
                                                        className="sm:w-24 text-left sm:text-right font-semibold"
                                                        text="Branch :"
                                                    />

                                                    <Input
                                                        name="branch"
                                                        value={values.branch}
                                                        onChange={handleChange}
                                                        className="flex-1 w-full h-10"
                                                    />
                                                </div>

                                                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                                                    <Label
                                                        className="sm:w-24 text-left sm:text-right font-semibold"
                                                        text="A/c No :"
                                                    />

                                                    <Input
                                                        name="accountNo"
                                                        value={values.accountNo}
                                                        onChange={handleChange}
                                                        className="flex-1 w-full h-10"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Voucher Details */}
                                    <div className="border-t border-gray-300 pt-5">

                                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">


                                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                                                <Label
                                                    className="sm:w-32 text-left sm:text-right font-semibold"
                                                    text="प्रभाग :"
                                                />

                                                <div className="flex-1 w-full">
                                                    <SearchableSelect
                                                        name="prabhag"
                                                        value={values.prabhag}
                                                        options={glList}
                                                        onChange={(val) => {
                                                            if (!val) return;

                                                            setFieldValue(
                                                                "prabhag",
                                                                val.value
                                                            );
                                                        }}
                                                    />
                                                </div>
                                            </div>

                                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                                                <Label
                                                    className="sm:w-32 text-left sm:text-right font-semibold"
                                                    text="व्यवहार क्र. :"
                                                />
                                                <Input
                                                    name="transactionNo"
                                                    value={values.transactionNo}
                                                    onChange={handleChange}
                                                    className="flex-1 w-full h-10"
                                                />
                                            </div>

                                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                                                <Label
                                                    className="sm:w-32 text-left sm:text-right font-semibold"
                                                    text="एकूण देयक रक्कम :"
                                                />

                                                <Input
                                                    name="totalAmount"
                                                    value={values.totalAmount}
                                                    onChange={handleChange}
                                                    className="flex-1 w-full h-10"
                                                />
                                            </div>

                                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                                                <Label
                                                    className="sm:w-32 text-left sm:text-right font-semibold"
                                                    text="बजेट :"
                                                />

                                                <div className="flex-1 w-full">
                                                    <SearchableSelect
                                                        name="budget"
                                                        value={values.budget}
                                                        options={glList}
                                                        onChange={(val) => {
                                                            if (!val) return;

                                                            setFieldValue(
                                                                "budget",
                                                                val.value
                                                            );
                                                        }}
                                                    />
                                                </div>
                                            </div>

                                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                                                <Label
                                                    className="sm:w-32 text-left sm:text-right font-semibold"
                                                    text="फक्सान कोड :"
                                                />

                                                <div className="flex-1 w-full">
                                                    <SearchableSelect
                                                        name="functionCode"
                                                        value={values.functionCode}
                                                        options={glList}
                                                        onChange={(val) => {
                                                            if (!val) return;

                                                            setFieldValue(
                                                                "functionCode",
                                                                val.value
                                                            );
                                                        }}
                                                    />
                                                </div>
                                            </div>




                                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                                                <Label
                                                    className="sm:w-36 text-left sm:text-right font-semibold"
                                                    text="विभाग :"
                                                />

                                                <div className="flex-1 w-full">
                                                    <SearchableSelect
                                                        name="department"
                                                        value={values.department}
                                                        options={glList}
                                                        onChange={(val) => {
                                                            if (!val) return;

                                                            setFieldValue(
                                                                "department",
                                                                val.value
                                                            );
                                                        }}
                                                    />
                                                </div>
                                            </div>

                                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                                                <Label
                                                    className="sm:w-36 text-left sm:text-right font-semibold text-nowrap"
                                                    text="सु.अ.परताव प्रमाणक क्र. :"
                                                />

                                                <Input
                                                    name="refundVoucherNo"
                                                    value={values.refundVoucherNo}
                                                    onChange={handleChange}
                                                    className="flex-1 w-full h-10"
                                                />
                                            </div>

                                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                                                <Label
                                                    className="sm:w-36 text-left sm:text-right font-semibold"
                                                    text="निधी :"
                                                />

                                                <div className="flex-1 w-full">
                                                    <SearchableSelect
                                                        name="fund"
                                                        value={values.fund}
                                                        options={entryHeadList}
                                                        onChange={(val) => {
                                                            if (!val) return;

                                                            setFieldValue(
                                                                "fund",
                                                                val.value
                                                            );
                                                        }}
                                                    />
                                                </div>
                                            </div>

                                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                                                <Label
                                                    className="sm:w-36 text-left sm:text-right font-semibold text-nowrap"
                                                    text="ऑब्जेक्ट कोड/बँक खाते :"
                                                />

                                                <div className="flex-1 w-full">
                                                    <SearchableSelect
                                                        name="objectCode"
                                                        value={values.objectCode}
                                                        options={entryHeadList}
                                                        onChange={(val) => {
                                                            if (!val) return;

                                                            setFieldValue(
                                                                "objectCode",
                                                                val.value
                                                            );
                                                        }}
                                                    />
                                                </div>
                                            </div>



                                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                                                <Label
                                                    className="sm:w-32 text-left sm:text-right font-semibold"
                                                    text="परताव तारीख :"
                                                />
                                                <DatePicker
                                                    value={values.refundDate}
                                                    onChange={(date) => setFieldValue("refundDate", date)}
                                                />
                                            </div>
                                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                                                <Label
                                                    className="sm:w-32 text-left sm:text-right font-semibold"
                                                    text="तपशील"
                                                />

                                                <Input
                                                    name="details"
                                                    value={values.details}
                                                    onChange={handleChange}
                                                    rows={4}
                                                    className="flex-1 w-full h-10"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Footer Buttons */}
                                    <div className="border-t border-gray-300 pt-6 flex justify-center gap-3">

                                        <Button
                                            type="submit"
                                            className="bg-blue-900 hover:bg-blue-950 text-white px-8"
                                        >
                                            Accept
                                        </Button>

                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() =>
                                                navigate("/HomePage/FrmHomePage")
                                            }
                                        >
                                            Back
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                </Form>
            )}
        </Formik>
    );
};

export default FrmSDVchPrepMst;