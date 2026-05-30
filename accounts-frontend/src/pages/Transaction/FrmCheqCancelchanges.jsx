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

const FrmCheqCancelchanges = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const token = user?.token;
    const ulbId = user?.ulbId;
    const userId = user?.userId;

    const BASE_URL = import.meta.env.VITE_BASE_URL;

    const [tableData, setTableData] = useState([]);
    const [glList, setGlList] = useState([]);
    const [entryHeadList, setEntryHeadList] = useState([]);
    const [isDetailView, setIsDetailView] = useState(false);
    const [selectedData, setSelectedData] = useState(null);


    const headers = [
        "Trans No",
        "व्यवहार दिनांक",
        "बँकेचे नाव",
        "धनादेश क्रमांक",
        "धनादेश दिनांक",
        "रक्कम",
        "तपशील",
    ];

    const keyMapping = {
        "Trans No": "transNo",
        "व्यवहार दिनांक": "transDate",
        "बँकेचे नाव": "bankName",
        "धनादेश क्रमांक": "chequeNo",
        "धनादेश दिनांक": "chequeDate",
        "रक्कम": "amount",
        "तपशील": "details",
    };


    const formatDate = (date) => {
        if (!date) return "";

        const d = new Date(date);
        const day = String(d.getDate()).padStart(2, "0");
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const year = d.getFullYear();

        return `${day}-${month}-${year}`;
    };

    const formatDateForAPI = (date) => {
        if (!date) return "";

        const d = new Date(date);
        const day = String(d.getDate()).padStart(2, "0");

        const months = [
            "JAN", "FEB", "MAR", "APR", "MAY", "JUN",
            "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"
        ];

        const month = months[d.getMonth()];
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

    const fetchChequeBook = async (chequeNo, setFieldValue) => {
        if (!chequeNo || !selectedData) return;

        try {
            const res = await axios.post(
                `${BASE_URL}/api/FrmVoucherGeneration/cheque-book`,
                {
                    bank_glcode: selectedData.BANKGL,
                    bank_accno: selectedData.BANKACNO,
                    cheque_no: chequeNo,
                    corp_id: ulbId,
                    zone_id: selectedData.ZONEID,
                },
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            const data = res.data?.rows?.[0] || res.data?.data?.rows?.[0];

            if (data) {
                setFieldValue(
                    "newChequePageNo",
                    data.BOOKNO || data.NUM_CHEQUEBOOK_BOOKNO?.toString() || ""
                );
            } else {
                setFieldValue("newChequePageNo", "");

                Swal.fire({
                    text: "Cheque Book not found",
                });
            }
        } catch (err) {
            console.error("Cheque Book API Error:", err);

            Swal.fire({
                text: "Failed to fetch cheque book",
            });
        }
    };

    const fetchAutoFill = async (row, setFieldValue) => {
        try {
            Swal.fire({
                title: "Loading...",
                allowOutsideClick: false,
                didOpen: () => Swal.showLoading(),
            });

            const res = await axios.post(
                `${BASE_URL}/api/FrmCheqCancelchanges/cheque-cancel-details-Autofill`,
                {
                    ulbId,
                    transNo: row.rawTransNo,
                    chequeNo: row.chequeNo,
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            const data = res.data?.data?.rows?.[0];
            if (!data) return;

            setFieldValue("txnNo", data.TRANSNO || "");
            setFieldValue("chequeNo", data.CHEQNO || "");
            setFieldValue("amount", data.CHEQAMT || "");
            setFieldValue("entryDeptCode", data.BANKGL?.toString() || "");
            setFieldValue("entryHead", data.BANKACNO?.toString() || "");

            setFieldValue("fromDate", new Date(data.CHEQDATE));
            setFieldValue("toDate", new Date(data.CHEQDATE));
            setFieldValue("oldChequeDate", new Date(data.CHEQDATE));
            setSelectedData(data);
            setIsDetailView(true);

            Swal.close();
        } catch (err) {
            Swal.fire({ text: "Failed to autofill data" });
        }
    };

    const handleSubmit = async (values, { setFieldValue }) => {
        try {

            if (values.fromDate > values.toDate) {
                Swal.fire({ text: "From Date should be less than To Date" });
                return;
            }

            Swal.fire({
                title: "Processing...",
                allowOutsideClick: false,
                didOpen: () => Swal.showLoading(),
            });

            const payload = {
                fromDate: formatDateForAPI(values.fromDate),
                toDate: formatDateForAPI(values.toDate),
                ulbId: ulbId,
                transactionNo: values.txnNo || "",
                chequeNo: values.chequeNo || "",
                amount: values.amount || "",
                bankGl: values.entryDeptCode || "",
                bankAccNo: values.entryHead || "",
            };

            const res = await axios.post(
                `${BASE_URL}/api/FrmCheqCancelchanges/cheque-cancel-details`,
                payload,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            const rows = res.data?.data?.rows || [];

            if (!rows.length) {
                Swal.close();
                Swal.fire({
                    text: "No records found ",
                });
                return;
            }

            const formatted = rows.map((item) => ({
                transNo: (
                    <span
                        className="text-blue-600 underline cursor-pointer"
                        onClick={() =>
                            fetchAutoFill(
                                {
                                    rawTransNo: item.TRANSNO,
                                    chequeNo: item.CHEQNO,
                                },
                                setFieldValue
                            )
                        }
                    >
                        {item.TRANSNO}
                    </span>
                ),
                chequeNo: item.CHEQNO?.toString() || "",
                transDate: formatDate(item.SYSTEMBILLDATE),
                bankName: item.BANKNAME || "",
                chequeDate: formatDate(item.CHEQDATE),
                amount: item.CHEQAMT?.toString() || "",
                details: item.REMARK || "",
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

    const handleUpdate = async (values) => {
        try {
            if (!selectedData) {
                Swal.fire({ text: "No data selected" });
                return;
            }

            if (!values.newChequeNo) {
                Swal.fire({ text: "Enter New Cheque No" });
                return;
            }

            if (!values.newChequePageNo) {
                Swal.fire({ text: "Cheque Book No not found" });
                return;
            }

            Swal.fire({
                title: "Updating...",
                allowOutsideClick: false,
                didOpen: () => Swal.showLoading(),
            });

            const payload = {
                userId: userId,
                ulbId: ulbId,
                chequeNo: Number(values.newChequeNo),
                cheqBookNo: Number(values.newChequePageNo),
                cheqDate: formatDate(values.newChequeDate),
                transNo: Number(values.txnNo),
                remark: values.cancelReson || "",
                glCode: Number(selectedData.BANKGL),
                accNo: Number(selectedData.BANKACNO),
                ward: Number(selectedData.ZONEID),
                vchNo: selectedData.VCHNO || "",
                vchDate: formatDate(values.newChequeDate),
                nidhiId: Number(selectedData.NIDHIID || 0),
                vchRemark: values.cancelReson || "",
                oldChequeNo: Number(selectedData.CHEQNO),
                oldCheqDate: formatDate(values.oldChequeDate),
                oldCheqBookNo: Number(selectedData.CHQBOOK),
            };

            const res = await axios.post(
                `${BASE_URL}/api/FrmCheqCancelchanges/cheque-cancel-insert`,
                payload,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            const response = res.data;

            if (response?.ok) {
                Swal.fire({
                    text: response?.data?.message,
                });

                setIsDetailView(false);
                setSelectedData(null);
            } else {
                Swal.fire({
                    text: response?.error || "Update failed",
                });
            }

        } catch (err) {
            console.error("Update API Error:", err);

            Swal.fire({
                // icon: "error",
                text: "Failed to update cheque",
            });
        }
    };


    return (
        <Formik
            initialValues={{
                txnNo: "",
                chequeNo: "",
                entryDeptCode: "",
                entryHead: "",
                fromDate: new Date(),
                toDate: new Date(),
                amount: "",
                oldChequeDate: null,
                cancelReson: "",
                newChequeNo: "",
                newChequePageNo: "",
                newChequeDate: new Date(),
            }}
            onSubmit={(values, actions) => handleSubmit(values, actions)}
        >
            {({ values, setFieldValue, handleChange, resetForm }) => (
                <Form>
                    <motion.div className="mt-4 px-2 sm:px-4">
                        <Card className="border shadow-sm">

                            <CardHeader className="border-b">
                                <CardTitle className="text-lg font-bold">
                                    Cheque Change
                                </CardTitle>
                            </CardHeader>

                            <CardContent className="p-4 ">

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">

                                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                                        <Label className="sm:w-40 text-left sm:text-right" text="व्यवहार क्रमांक :" />
                                        <div className="flex-1 w-full">
                                            <Input
                                                name="txnNo"
                                                value={values.txnNo}
                                                onChange={handleChange}
                                                className="w-full"
                                                disabled={isDetailView}
                                            />
                                        </div>
                                    </div>


                                    {!isDetailView && (
                                        <>
                                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                                                <Label className="sm:w-40 text-left sm:text-right" text="धनादेश क्रमांक :" />
                                                <div className="flex-1 w-full">
                                                    <Input
                                                        name="chequeNo"
                                                        value={values.chequeNo}
                                                        onChange={handleChange}
                                                        className="w-full"
                                                    />
                                                </div>
                                            </div>

                                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                                                <Label className="sm:w-40 text-left sm:text-right">विभाग संकेतांक :</Label>
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

                                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                                                <Label className="sm:w-40 text-left sm:text-right" text="तारीख पासून :" />
                                                <div className="flex-1 w-full">
                                                    <DatePicker
                                                        value={values.fromDate}
                                                        onChange={(date) => setFieldValue("fromDate", date)}
                                                    />
                                                </div>
                                            </div>

                                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                                                <Label className="sm:w-40 text-left sm:text-right" text="तारीख पर्यंत :" />
                                                <div className="flex-1 w-full">
                                                    <DatePicker
                                                        value={values.toDate}
                                                        onChange={(date) => setFieldValue("toDate", date)}
                                                    />
                                                </div>
                                            </div>

                                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                                                <Label className="sm:w-40 text-left sm:text-right" text="रक्कम :" />
                                                <div className="flex-1 w-full">
                                                    <Input
                                                        name="amount"
                                                        value={values.amount}
                                                        onChange={handleChange}
                                                        className="w-full"
                                                    />
                                                </div>
                                            </div>
                                        </>
                                    )}


                                    {isDetailView && selectedData && (
                                        <>
                                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                                                <Label className="sm:w-40 text-left sm:text-right" text="व्यवहार दिनांक :" />
                                                <Input value={formatDate(selectedData.SYSTEMBILLDATE)} disabled />
                                            </div>
                                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                                                <Label className="sm:w-40 text-left sm:text-right" text="प्रभाग :" />
                                                <Input value={selectedData.ZONEENAME} disabled />
                                            </div>

                                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                                                <Label className="sm:w-40 text-left sm:text-right" text="व्यवहार तपशील :" />
                                                <Input value={selectedData.REMARK} disabled />
                                            </div>

                                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                                                <Label className="sm:w-40 text-left sm:text-right" text="जुना धनादेश क्रमांक :" />
                                                <Input value={selectedData.CHEQNO} disabled />
                                            </div>

                                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                                                <Label className="sm:w-40 text-left sm:text-right text-nowrap" text="जुने धनादेशपुस्तिकेचा क्रमांक :" />
                                                <Input value={selectedData.CHQBOOK} disabled />
                                            </div>

                                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                                                <Label className="sm:w-40 text-left sm:text-right" text="जुना धनादेश तारीख :" />
                                                <DatePicker
                                                    value={values.oldChequeDate}
                                                    onChange={(date) => setFieldValue("oldChequeDate", date)}
                                                />
                                            </div>

                                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                                                <Label className="sm:w-40 text-left sm:text-right" text="निधीचे नाव :" />
                                                <Input value={selectedData.NIDHI || ""} disabled />
                                            </div>

                                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                                                <Label className="sm:w-40 text-left sm:text-right" text="बँकेचे नाव :" />
                                                <Input value={selectedData.BANKNAME} disabled />
                                            </div>

                                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                                                <Label className="sm:w-40 text-left sm:text-right" text="रद्द करण्याचे कारण :" />
                                                <Input
                                                    name="cancelReson"
                                                    value={values.cancelReson}
                                                    onChange={handleChange}
                                                    className="w-full"
                                                />
                                            </div>
                                        </>
                                    )}

                                </div>

                                {isDetailView && (
                                    <div className="border-t pt-4 mt-6">
                                        <h3 className="font-semibold mb-3">New Cheque Details</h3>

                                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-3">
                                                <Label className="sm:w-40 text-left sm:text-right" text="नवीन धनादेश क्रमांक :" />
                                                <div className="flex-1 w-full">
                                                    <Input
                                                        name="newChequeNo"
                                                        value={values.newChequeNo}
                                                        onChange={handleChange}
                                                        onBlur={() =>
                                                            fetchChequeBook(values.newChequeNo, setFieldValue)
                                                        }
                                                        className="w-full"
                                                    />
                                                </div>
                                            </div>


                                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                                                <Label className="sm:w-40 text-left sm:text-right text-nowrap" text="नवीन धनादेशपुस्तिकेचा क्रमांक :" />
                                                <div className="flex-1 w-full">
                                                    <Input
                                                        name="newChequePageNo"
                                                        value={values.newChequePageNo}
                                                        onChange={handleChange}
                                                        className="w-full"
                                                        disabled
                                                    />
                                                </div>
                                            </div>


                                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                                                <Label className="sm:w-40 text-left sm:text-right" text="नवीन धनादेश तारीख :" />
                                                <div className="flex-1 w-full">
                                                    <DatePicker
                                                        value={values.newChequeDate}
                                                        onChange={(date) => setFieldValue("newChequeDate", date)}
                                                    />
                                                </div>
                                            </div>

                                        </div>
                                    </div>
                                )}

                                <div className="flex justify-center gap-3 mt-6">

                                    {!isDetailView ? (
                                        <>
                                            <Button type="submit" className="bg-blue-900 px-6">
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
                                        </>
                                    ) : (
                                        <>
                                            <Button
                                                type="button"
                                                className="bg-blue-900 px-6"
                                                onClick={() => handleUpdate(values)}
                                            >
                                                Update
                                            </Button>
                                            <Button
                                                variant="outline"
                                                onClick={() => {
                                                    setIsDetailView(false);
                                                    setSelectedData(null);
                                                }}
                                            >
                                                Back
                                            </Button>
                                        </>
                                    )}

                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="text-red-600"
                                        onClick={() => navigate("/HomePage/FrmHomePage")}
                                    >
                                        Exit
                                    </Button>
                                </div>

                                {!isDetailView && tableData.length > 0 && (
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
                            </CardContent>
                        </Card>
                    </motion.div>
                </Form>
            )}
        </Formik>
    );
};

export default FrmCheqCancelchanges;