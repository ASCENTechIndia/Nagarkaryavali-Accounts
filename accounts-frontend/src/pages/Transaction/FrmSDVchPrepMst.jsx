import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
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
import SearchableSelect from "@/components/SearchableSelect";
import { DatePicker } from "@/components/ui/calendar";
import { useLocation } from "react-router-dom";



const FrmSDVchPrepMst = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const token = user?.token;
    const ulbId = user?.ulbId;
    const location = useLocation();

    const receiptNo = location.state?.receiptNo;
    const partyId = location.state?.partyId;
    const sdid = location.state?.sdid;

    console.log("dataaaa :", receiptNo, partyId, sdid);

    const BASE_URL = import.meta.env.VITE_BASE_URL;

    const [glList, setGlList] = useState([]);
    const [entryHeadList, setEntryHeadList] = useState([]);
    const [zoneList, setZoneList] = useState([]);
    const [departmentList, setDepartmentList] = useState([]);
    const [budgetList, setBudgetList] = useState([]);
    const [nidhiList, setNidhiList] = useState([]);
    const [showBankModal, setShowBankModal] = useState(false);
    const [partyBankList, setPartyBankList] = useState([]);
    const [loadingBanks, setLoadingBanks] = useState(false);

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


    useEffect(() => {

        const fetchZoneList = async () => {
            try {
                const res = await axios.post(
                    `${BASE_URL}/api/Receipt/zones`,
                    {
                        corp_id: ulbId,
                    },
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                const data = res.data?.data || [];

                const formatted = data.map((item) => ({
                    label: item.ZONEENAME,
                    value: item.ZONEID?.toString(),
                }));

                setZoneList(formatted);

            } catch (err) {
                console.error("Zone API Error:", err);
            }
        };

        const fetchDepartmentList = async () => {
            try {

                const res = await axios.get(
                    `${BASE_URL}/api/Bankdeposit/department?ulbId=${ulbId}`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                const data = res.data?.data?.list || [];

                const formatted = data.map((item) => ({
                    label: item.DEPTNAME,
                    value: item.DEPTID?.toString(),
                }));

                setDepartmentList(formatted);

            } catch (err) {
                console.error("Department API Error:", err);
            }
        };

        if (token && ulbId) {
            fetchZoneList();
            fetchDepartmentList();
        }

    }, [token, ulbId]);

    useEffect(() => {
        const fetchBudgetList = async () => {
            try {

                const res = await axios.get(
                    `${BASE_URL}/api/FrmTransfer/budget-heads`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                const data = res.data?.data?.rows || [];

                const formatted = data.map((item) => ({
                    label: item.VAR_BUDGETCONFIG_BUDGETNAME,
                    value: item.NUM_BUDGETCONFIG_HEADID?.toString(),
                }));

                setBudgetList(formatted);

            } catch (err) {
                console.error("Budget API Error:", err);
            }
        };

        if (token) {
            fetchBudgetList();
        }

    }, [token]);

    const fetchNidhiList = async (budgetId) => {

        if (!budgetId) return;

        try {

            const res = await axios.post(
                `${BASE_URL}/api/FrmVoucher/nidhi`,
                {
                    budgetid: Number(budgetId),
                    nidhiFlag: "Y",
                    ulbid: ulbId,
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const data = res.data?.data?.data || [];

            const formatted = data.map((item) => ({
                label: item.NIDHINAME,
                value: item.NIDHIID?.toString(),
            }));

            setNidhiList(formatted);

        } catch (err) {
            console.error("Nidhi API Error:", err);
        }
    };

    const fetchPartyBankDetails = async ({
        partyBankId,
        setFieldValue,
    }) => {

        if (!partyBankId) return;

        try {

            const res = await axios.post(
                `${BASE_URL}/api/frmSDRef/party-bank-details`,
                {
                    partyBankId: Number(partyBankId),
                    ulbId: ulbId,
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const data = res.data?.data?.data?.[0];

            if (!data) return;

            // 🔥 Autofill Bank Details
            setFieldValue(
                "bankName",
                data.VAR_BANKMST_BANKNAME || ""
            );

            setFieldValue(
                "branch",
                data.VAR_BRANCHMST_BRANCHNAME || ""
            );

            setFieldValue(
                "ifsc",
                data.VAR_PARTYBANK_IFSC || ""
            );

            setFieldValue(
                "accountNo",
                data.VAR_PARTYBANK_ACCOUNTNO || ""
            );

        } catch (err) {
            console.error("Party Bank Details API Error:", err);
        }
    };

    const fetchPartyBankList = async () => {
        try {
            setLoadingBanks(true);

            const res = await axios.post(
                `${BASE_URL}/api/frmSDRef/party-bank-list`,
                {
                    partyId: Number(partyId),
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const data = res.data?.data?.data || [];

            setPartyBankList(data);
            setShowBankModal(true);

        } catch (err) {
            console.error("Party Bank List API Error:", err);

            Swal.fire({
                icon: "error",
                text: "Failed to fetch bank details",
            });
        } finally {
            setLoadingBanks(false);
        }
    };

    const fetchVoucherMaster = async ({
        refNo,
        partyId,
        sdid,
        setFieldValue,
    }) => {
        try {
            const res = await axios.post(
                `${BASE_URL}/api/frmSDRef/voucher-master`,
                {
                    refNo: Number(refNo),
                    partyId: Number(partyId),
                    ulbId: ulbId,
                    sdid: Number(sdid),
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const data = res.data?.data?.data?.[0];

            if (!data) return;

            // 🔥 Autofill Fields
            setFieldValue(
                "voucherDate",
                data.TRNSDATE ? new Date(data.TRNSDATE) : ""
            );

            setFieldValue(
                "transactionNo",
                data.VCHNO || ""
            );

            setFieldValue(
                "totalAmount",
                data.TOTALAMT || ""
            );

            setFieldValue(
                "details",
                data.VAR_RECEIPTDET_NARRATION || ""
            );

            setFieldValue(
                "department",
                data.DEPTID?.toString() || ""
            );

            setFieldValue(
                "budget",
                data.NUM_RECEIPTMST_BUDGET_ID?.toString() || ""
            );

            setFieldValue(
                "fund",
                data.NIDHI_ID?.toString() || ""
            );

            setFieldValue(
                "functionCode",
                data.DRGL?.toString() || ""
            );

            setFieldValue(
                "objectCode",
                data.DRACC?.toString() || ""
            );

            setFieldValue(
                "prabhag",
                data.ZONEID?.toString() || ""
            );

            // 🔥 Fetch Nidhi List Automatically
            if (data.NUM_RECEIPTMST_BUDGET_ID) {
                await fetchNidhiList(
                    data.NUM_RECEIPTMST_BUDGET_ID
                );
            }

            // 🔥 Fetch Party Bank Details Automatically
            if (data.NUM_PARTYBANK_ID) {

                await fetchPartyBankDetails({
                    partyBankId: data.NUM_PARTYBANK_ID,
                    setFieldValue,
                });
            }

        } catch (err) {
            console.error("Voucher Master API Error:", err);
        }
    };

    const fetchRefundAmount = async ({
        refNo,
        partyId,
        recNo,
        setFieldValue,
    }) => {
        try {

            const res = await axios.post(
                `${BASE_URL}/api/frmSDRef/check-refund-status`,
                {
                    refNo: Number(refNo),
                    partyId: Number(partyId),
                    recNo: Number(recNo),
                    ulbId: ulbId,
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const data = res.data?.data?.data?.[0];

            if (!data) return;

            const balanceAmount =
                Number(data.AMOUNT || 0) -
                Number(data.PAYAMT || 0);

            setFieldValue(
                "totalAmount",
                balanceAmount
            );

        } catch (err) {
            console.error("Refund Status API Error:", err);
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


            Swal.close();

        } catch (err) {
            console.error("Report API Error:", err);

            Swal.fire({
                text: "Failed to fetch report",
            });
        }
    };

    return (
        <Formik
            initialValues={{
                entryDeptCode: "",
                entryHead: "",
                fromCheque: "",
                toCheque: "",
                prabhag: "",
                department: "",
                budget: "",
                fund: "",
                transactionNo: "",
                totalAmount: "",
                functionCode: "",
                objectCode: "",
                details: "",
                refundVoucherNo: "",
                voucherDate: "",
                refundDate: "",
                sdid: "",
                bankName: "",
                branch: "",
                ifsc: "",
                accountNo: "",
                panNo: "",
                gstNo: "",
            }}
            onSubmit={handleSubmit}
        >
            {({ values, setFieldValue, handleChange, resetForm }) => {

                useEffect(() => {

                    if (receiptNo && partyId && sdid) {

                        fetchVoucherMaster({
                            refNo: receiptNo,
                            partyId,
                            sdid,
                            setFieldValue,
                        });

                        fetchRefundAmount({
                            refNo: receiptNo,
                            partyId,
                            recNo: receiptNo,
                            setFieldValue,
                        });
                    }

                }, [receiptNo, partyId, sdid, token]);

                return (
                    <Form>
                        <motion.div className="mt-2 px-2 sm:px-4">
                            <Card className="border border-gray-300 rounded-sm shadow-none">
                                <CardHeader className="border-b py-4 px-4">
                                    <CardTitle className="text-[18px] font-semibold text-black">
                                        Security Deposit Refund Voucher Preparation
                                    </CardTitle>
                                </CardHeader>

                                <CardContent className="p-3 sm:p-5 space-y-6">
                                    <div className="border border-gray-300 rounded-sm bg-white p-4 sm:p-5 space-y-6">
                                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                                                <Label
                                                    className="sm:w-28 text-left sm:text-right font-semibold"
                                                    text="तारीख :"
                                                />

                                                <DatePicker
                                                    value={values.voucherDate}
                                                    onChange={(date) => setFieldValue("voucherDate", date)}
                                                    disabled
                                                />
                                            </div>

                                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                                                <Label
                                                    className="sm:w-24 text-left sm:text-right font-semibold"
                                                    text="पार्टी :"
                                                />

                                                <div className="flex-1 w-full">
                                                    <Input
                                                        name="entryDeptCode"
                                                        value={values.entryDeptCode}
                                                        onChange={handleChange}
                                                        className="flex-1 w-full h-10"
                                                    />

                                                </div>
                                            </div>


                                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                                                <Label
                                                    className="sm:w-28 text-left sm:text-right font-semibold"
                                                    text="पॅनकार्ड :"
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

                                        <div className="border-t border-gray-300 pt-5">

                                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 items-start">
                                                <div>
                                                    <Button
                                                        type="button"
                                                        onClick={fetchPartyBankList}
                                                        className="bg-blue-900 hover:bg-blue-950 text-white px-6"
                                                    >
                                                        Select Bank
                                                    </Button>
                                                </div>

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

                                        <div className="border-t border-gray-300 pt-5">

                                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">


                                                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                                                    <Label
                                                        className="sm:w-32 text-left sm:text-right font-semibold"
                                                        text="प्रभाग :"
                                                    />

                                                    <div className="flex-1 w-full">
                                                        <Select
                                                            value={values.prabhag}
                                                            onValueChange={(value) =>
                                                                setFieldValue("prabhag", value)
                                                            }
                                                        >
                                                            <SelectTrigger className="w-full">
                                                                <SelectValue placeholder="प्रभाग निवडा" />
                                                            </SelectTrigger>

                                                            <SelectContent>
                                                                {zoneList.map((zone) => (
                                                                    <SelectItem
                                                                        key={zone.value}
                                                                        value={zone.value}
                                                                    >
                                                                        {zone.label}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                </div>

                                                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                                                    <Label
                                                        className="sm:w-36 text-left sm:text-right font-semibold"
                                                        text="विभाग :"
                                                    />

                                                    <div className="flex-1 w-full">
                                                        <Select
                                                            value={values.department}
                                                            onValueChange={(value) =>
                                                                setFieldValue("department", value)
                                                            }
                                                        >
                                                            <SelectTrigger className="w-full">
                                                                <SelectValue placeholder="विभाग निवडा" />
                                                            </SelectTrigger>

                                                            <SelectContent>
                                                                {departmentList.map((dept) => (
                                                                    <SelectItem
                                                                        key={dept.value}
                                                                        value={dept.value}
                                                                    >
                                                                        {dept.label}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
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
                                                        <Select
                                                            value={values.budget}
                                                            onValueChange={(value) => {

                                                                setFieldValue("budget", value);
                                                                setFieldValue("fund", "");
                                                                fetchNidhiList(value);
                                                            }}
                                                        >
                                                            <SelectTrigger className="w-full">
                                                                <SelectValue placeholder="बजेट निवडा" />
                                                            </SelectTrigger>

                                                            <SelectContent>
                                                                {budgetList.map((budget) => (
                                                                    <SelectItem
                                                                        key={budget.value}
                                                                        value={budget.value}
                                                                    >
                                                                        {budget.label}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                </div>

                                                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                                                    <Label
                                                        className="sm:w-36 text-left sm:text-right font-semibold"
                                                        text="निधी :"
                                                    />

                                                    <div className="flex-1 w-full">
                                                        <Select
                                                            value={values.fund}
                                                            onValueChange={(value) =>
                                                                setFieldValue("fund", value)
                                                            }
                                                        >
                                                            <SelectTrigger className="w-full">
                                                                <SelectValue placeholder="निधी निवडा" />
                                                            </SelectTrigger>

                                                            <SelectContent>
                                                                {nidhiList.map((nidhi) => (
                                                                    <SelectItem
                                                                        key={nidhi.value}
                                                                        value={nidhi.value}
                                                                    >
                                                                        {nidhi.label}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                </div>

                                                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                                                    <Label
                                                        className="sm:w-32 text-left sm:text-right font-semibold"
                                                        text="फंक्शन कोड. :"
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
                                                        className="sm:w-36 text-left sm:text-right font-semibold text-nowrap"
                                                        text="सु.अ.परतावा प्रमाणक क्र. :"
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
                                                        className="sm:w-36 text-left sm:text-right font-semibold text-nowrap"
                                                        text="ऑब्जेक्ट कोड/बँक खाते :"
                                                    />

                                                    <div className="flex-1 w-full">
                                                        <Input
                                                            name="objectCode"
                                                            value={values.objectCode}
                                                            onChange={handleChange}
                                                            className="flex-1 w-full h-10"
                                                        />
                                                    </div>
                                                </div>



                                                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                                                    <Label
                                                        className="sm:w-32 text-left sm:text-right font-semibold"
                                                        text="परतावा तारीख :"
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
                                                    navigate("/Transactions/FrmSDRefund")
                                                }
                                            >
                                                Back
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>


                        {showBankModal && (
                            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-2">
                                <div className="bg-[#f5f1e8] w-full max-w-4xl rounded-md shadow-lg border border-gray-400">

                                    {/* Header */}
                                    <div className="border-b p-4 text-center">
                                        <h2 className="text-2xl font-semibold">
                                            Party Bank Details
                                        </h2>
                                    </div>

                                    {/* Table */}
                                    <div className="p-6 overflow-x-auto">

                                        {loadingBanks ? (
                                            <div className="text-center py-10">
                                                Loading...
                                            </div>
                                        ) : (
                                            <table className="w-full border border-gray-300 text-sm">
                                                <thead className="bg-gray-100">
                                                    <tr>
                                                        <th className="border p-2 text-left">
                                                            बँक नाव
                                                        </th>

                                                        <th className="border p-2 text-left">
                                                            ब्रांच नाव
                                                        </th>

                                                        <th className="border p-2 text-left">
                                                            IFSC कोड
                                                        </th>

                                                        <th className="border p-2 text-left">
                                                            अकाउंट नं.
                                                        </th>

                                                        <th className="border p-2 text-left">
                                                            स्टेटस
                                                        </th>

                                                        <th className="border p-2 text-center">
                                                            Select
                                                        </th>
                                                    </tr>
                                                </thead>

                                                <tbody>
                                                    {partyBankList.length > 0 ? (
                                                        partyBankList.map((bank) => (
                                                            <tr key={bank.NUM_PARTYBANK_ID}>
                                                                <td className="border p-2">
                                                                    {bank.VAR_BANKMST_BANKNAME}
                                                                </td>

                                                                <td className="border p-2">
                                                                    {bank.VAR_BRANCHMST_BRANCHNAME}
                                                                </td>

                                                                <td className="border p-2">
                                                                    {bank.VAR_PARTYBANK_IFSC}
                                                                </td>

                                                                <td className="border p-2">
                                                                    {bank.VAR_PARTYBANK_ACCOUNTNO}
                                                                </td>

                                                                <td className="border p-2">
                                                                    {bank.VAR_PARTYBANK_STATUS}
                                                                </td>

                                                                <td className="border p-2 text-center">
                                                                    <button
                                                                        type="button"
                                                                        className="text-blue-600 hover:underline"
                                                                        onClick={() => {

                                                                            setFieldValue(
                                                                                "bankName",
                                                                                bank.VAR_BANKMST_BANKNAME || ""
                                                                            );

                                                                            setFieldValue(
                                                                                "branch",
                                                                                bank.VAR_BRANCHMST_BRANCHNAME || ""
                                                                            );

                                                                            setFieldValue(
                                                                                "ifsc",
                                                                                bank.VAR_PARTYBANK_IFSC || ""
                                                                            );

                                                                            setFieldValue(
                                                                                "accountNo",
                                                                                bank.VAR_PARTYBANK_ACCOUNTNO || ""
                                                                            );

                                                                            setShowBankModal(false);
                                                                        }}
                                                                    >
                                                                        Select
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        ))
                                                    ) : (
                                                        <tr>
                                                            <td
                                                                colSpan={6}
                                                                className="text-center p-4"
                                                            >
                                                                No bank details found
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        )}

                                        {/* Close Button */}
                                        <div className="flex justify-center mt-6">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() => setShowBankModal(false)}
                                            >
                                                Close
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </Form>
                );
            }}
        </Formik>
    );
};

export default FrmSDVchPrepMst;