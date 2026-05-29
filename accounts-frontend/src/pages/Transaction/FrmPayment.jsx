import { useEffect, useRef, useState } from "react";
import { Formik, Form } from "formik";
import { motion } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
import { useAuth } from "@/context/AuthContext";
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
import { DatePicker } from "@/components/ui/calendar";
import SearchableSelect from "@/components/SearchableSelect";


const BASE_URL = import.meta.env.VITE_BASE_URL;

const INITIAL_VALUES = {
    zoneId: "",
    transactionType: "",
    debtorType: "",
    date: new Date(),
    deptCode: "",
    ledgerHead: "",
    bankBalance: "",
    costomerName: "",
    voucherNo: "",
    chequeNo: "",
    chequePageNo: "",
    chequeDate: new Date(),
    debtorDeptCode: "",
    debtorLedgerHead: "",
    amount: "",
    details: "",
    partyCode: "",
};

const formatDate = (date) => {
    if (!date) return "";
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, "0");
    const month = d.toLocaleString("en-GB", { month: "short" }).toUpperCase();
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
};


const FrmPayment = () => {
    const { user } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const refNo = location.state?.referenceNo;
    const ulbId = user?.ulbId;
    const token = user?.token;

    const [zones, setZones] = useState([]);
    const [transTypes, setTransTypes] = useState([]);
    const [paymentTypes, setPaymentTypes] = useState([]);
    const [partyMaster, setPartyMaster] = useState([]);
    const [deptGlList, setDeptGlList] = useState([]);
    const [debtorGlList, setDebtorGlList] = useState([]);
    const [entryHeadList, setEntryHeadList] = useState([]);
    const [partyList, setPartyList] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [tempLedger, setTempLedger] = useState(null);
    const [tempDebtorLedger, setTempDebtorLedger] = useState(null);
    const [showAmountFields, setShowAmountFields] = useState(false);

    const setFieldValueRef = useRef(null);


    const fetchZones = async () => {
        try {
            const res = await axios.post(
                `${BASE_URL}/api/Receipt/zones`,
                { corp_id: ulbId },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setZones(res.data?.data || []);
        } catch (err) {
            console.error("Zones API Error:", err);
        }
    };

    const fetchTransTypes = async () => {
        try {
            const res = await axios.get(
                `${BASE_URL}/api/frmPayment/transtype-list`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setTransTypes(res.data?.data?.data || []);
        } catch (err) {
            console.error("TransTypes API Error:", err);
        }
    };

    const fetchPaymentTypes = async () => {
        try {
            const res = await axios.get(
                `${BASE_URL}/api/frmPayment/payment-types`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setPaymentTypes(res.data?.data?.data || []);
        } catch (err) {
            console.error("PaymentTypes API Error:", err);
        }
    };

    const fetchAdvancePaymentType = async (setFieldValue) => {
        try {
            const res = await axios.get(
                `${BASE_URL}/api/frmPayment/advance-payment-type`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const paymentList = res.data?.data?.data || [];

            setPaymentTypes(paymentList);

            if (paymentList.length > 0) {
                setFieldValue(
                    "debtorType",
                    paymentList[0].VALUEFIELD.toString()
                );
            }

        } catch (err) {
            console.error("Advance Payment Type API Error:", err);
        }
    };

    const fetchPartyMaster = async () => {
        try {
            const res = await axios.post(
                `${BASE_URL}/api/frmPayment/party-list`,
                { ulbId },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            const rawParty = res.data?.data?.data || [];
            setPartyMaster(
                rawParty.map((item) => ({
                    label: item.PARTYNAME,
                    value: item.PARTYID.toString(),
                }))
            );
        } catch (err) {
            console.error("PartyMaster API Error:", err);
        }
    };

    const fetchDeptGLList = async (trnstyid) => {
        try {
            if (!trnstyid) {
                setDeptGlList([]);
                return;
            }

            const res = await axios.post(
                `${BASE_URL}/api/frmPayment/gl-list-by-transtype`,
                {
                    trnstyid,
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            setDeptGlList(res.data?.data?.data || []);
        } catch (err) {
            console.error("Dept GL List API Error:", err);
            setDeptGlList([]);
        }
    };

    const fetchDebtorGLList = async () => {
        try {
            const res = await axios.get(
                `${BASE_URL}/api/Receipt/searchGLALL`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            setDebtorGlList(res.data?.data || []);
        } catch (err) {
            console.error("Debtor GL List API Error:", err);
        }
    };

    const fetchCreditLeasure = async (glcode, type) => {
        if (!glcode) return;
        try {
            debugger;
            const res = await axios.post(
                `${BASE_URL}/api/FrmTransfer/credit-leasure`,
                { corp_id: ulbId, glcode },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            const data = res.data?.data?.rows || res.data?.data || [];
            const formatted = data.map((item) => ({
                label: item.ACCNAME,
                value: item.OBJECTCODE?.toString(),
            }));

            if (type === "entryHead") setEntryHeadList(formatted);
            else if (type === "party") setPartyList(formatted);
        } catch (err) {
            console.error("Credit Leasure API Error:", err);
        }
    };

    const fetchPaymentDetails = async (setFieldValue) => {
        try {
            // Swal.fire({
            //     title: "Loading ...",
            //     allowOutsideClick: false,
            //     didOpen: () => {
            //         Swal.showLoading();
            //     },
            // });
            const res = await axios.post(
                `${BASE_URL}/api/frmPayment/payment-details`,
                { refno: refNo },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            const data = res.data?.data?.data?.[0];
            if (!data) return;

            setFieldValue("date", new Date(data.TRNSDATE));
            setFieldValue("voucherNo", data.VCHNO?.toString());
            // setFieldValue("transactionType", data.TRNSTYPE?.toString());
            // setFieldValue("zoneId", data.ZONEID?.toString());
            const trnsType = data.TRNSTYPE?.toString();

            setFieldValue("transactionType", trnsType);

            await fetchDeptGLList(trnsType);

            setFieldValue("zoneId", data.ZONEID?.toString());
            setFieldValue("chequeNo", data.CHQNO?.toString());
            setFieldValue("chequePageNo", data.CHQBOOKNO?.toString() || "");
            setFieldValue("chequeDate", new Date(data.CHQDATE));
            setFieldValue("amount", data.AMOUNT?.toString());
            setFieldValue("details", data.NARRATION);
            setFieldValue("partyCode", data.PARTYCODE?.toString());
            setFieldValue("debtorType", data.PAYMENTTYPE?.toString());
            setFieldValue("costomerName", data.PARTYNAME || "");

            setFieldValue("deptCode", data.GLCODE?.toString());
            setFieldValue("debtorDeptCode", data.CRGL?.toString());

            setTempLedger(data.ACCNO?.toString());
            setTempDebtorLedger(data.CRACC?.toString());

            await fetchCreditLeasure(data.GLCODE?.toString(), "entryHead");
            await fetchCreditLeasure(data.CRGL?.toString(), "party");

        } catch (err) {
            console.error("Payment Details API Error:", err);
        } finally {
            Swal.close();
        }
    };

    const fetchAccountBalance = async (values, setFieldValue) => {
        try {
            if (!values.deptCode || !values.ledgerHead) return;

            const payload = {
                targetDate: formatDate(new Date()),
                corpId: Number(ulbId),
                ulbid: Number(ulbId),
                glcode: values.deptCode,
                accno: values.ledgerHead,
            };

            const res = await axios.post(
                `${BASE_URL}/api/frmPayment/account-balance`,
                payload,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            const balance = res.data?.data?.data?.BALANCE || 0;
            const crdr = res.data?.data?.data?.CRDR || "";

            setFieldValue("bankBalance", `${Math.abs(balance)}`);

        } catch (err) {
            console.error("Account Balance API Error:", err);
            setFieldValue("bankBalance", "");
        }
    };

    const fetchChequeBook = async (values, setFieldValue) => {
        try {
            if (!values.deptCode || !values.ledgerHead || !values.chequeNo) return;

            const payload = {
                bank_glcode: values.deptCode,
                bank_accno: values.ledgerHead,
                cheque_no: values.chequeNo,
                corp_id: ulbId.toString(),
                zone_id: values.zoneId,
            };

            const res = await axios.post(
                `${BASE_URL}/api/FrmVoucherGeneration/cheque-book`,
                payload,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            console.log("Cheque API Response:", res.data);

            const rows = res.data?.rows ?? [];

            if (rows.length > 0) {
                setFieldValue("chequePageNo", rows[0].BOOKNO.toString());
            } else {
                setFieldValue("chequePageNo", "");
            }

        } catch (err) {
            console.error("Cheque Book API Error:", err);
            setFieldValue("chequePageNo", "");
        }
    };

    // for jcmc only
    const fetchCorporationById = async () => {
        try {
            const res = await axios.post(
                `${BASE_URL}/api/frmPayment/corporation-by-id`,
                {
                    corpId: ulbId,
                },
                {
                    headers: {
                        Authorization: `Bearer ${user.token}`,
                    },
                }
            );

            const corpData = res.data?.data?.data?.[0];

            if (corpData?.CORPORATIONCODE === "JCMC") {
                setShowAmountFields(true);
            } else {
                setShowAmountFields(false);
            }
        } catch (err) {
            console.error("Corporation API Error:", err);
            setShowAmountFields(false);
        }
    };

    useEffect(() => {
        if (!ulbId) return;

        setIsLoading(true);

        Swal.fire({
            title: "Loading...",
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            },
        });

        Promise.all([
            fetchZones(),
            fetchTransTypes(),
            fetchPaymentTypes(),
            fetchPartyMaster(),
            fetchDebtorGLList(),
            fetchCorporationById(),
        ])
            .then(() => {
                // 👉 If NOT edit mode → close here
                if (!refNo) {
                    setIsLoading(false);
                    Swal.close();
                }
            })
            .catch(() => {
                Swal.close();
                setIsLoading(false);
            });

    }, [ulbId]);


    useEffect(() => {
        if (entryHeadList.length && tempLedger && setFieldValueRef.current) {
            const selected = entryHeadList.find((item) => item.value === tempLedger);
            if (selected) {
                setFieldValueRef.current("ledgerHead", selected.value);
                setTempLedger(null);
            }
        }
    }, [entryHeadList, tempLedger]);

    useEffect(() => {
        if (partyList.length && tempDebtorLedger && setFieldValueRef.current) {
            const selected = partyList.find((item) => item.value === tempDebtorLedger);
            if (selected) {
                setFieldValueRef.current("debtorLedgerHead", selected.value);
                setTempDebtorLedger(null);
            }
        }
    }, [partyList, tempDebtorLedger]);

    const deptGlOptions = deptGlList.map((g) => ({
        label: g.GLNAME,
        value: g.GLCODE?.toString(),
    }));

    const debtorGlOptions = debtorGlList.map((g) => ({
        label: g.GLSEARCHNAME,
        value: g.GLFUNCTION?.toString(),
    }));


    const handleSubmit = async (values) => {
        try {
            const isEdit = Boolean(refNo);
            const inMode = isEdit ? 2 : 1;
            const currentRefNo = isEdit ? refNo : 0;

            const isBankPayment = values.transactionType === "4";

            const chqDate = isBankPayment
                ? formatDate(values.date)
                : formatDate(values.chequeDate || values.date);

            const paramStr = [
                formatDate(values.date),
                ulbId == 2 ? "" : (values.voucherNo || ""),
                values.transactionType,
                values.zoneId,
                "0",
                isBankPayment ? (values.chequeNo || "") : "",
                chqDate,
                values.deptCode,
                values.ledgerHead,
                values.debtorDeptCode,
                values.debtorLedgerHead,
                values.amount,
                values.details,
                values.partyCode,
                inMode,
                currentRefNo,
                values.transactionType,
                1,
                "",
                "",
                isBankPayment ? (values.chequePageNo || "") : "",
                "",
                values.debtorType,
                values.costomerName,
                "",
                "",
            ].join("~");

            const paramStr2 = values.debtorDeptCode && values.debtorLedgerHead
                ? [
                    values.debtorDeptCode,
                    values.partyCode,
                    values.debtorDeptCode,
                    values.debtorLedgerHead,
                    values.amount,
                    values.voucherNo || 0,
                    formatDate(values.date),
                ].join("#")
                : "";

            const payload = {
                paramStr,
                paramStr2,
                paramStr3: null,
                userId: user?.userId,
                zoneId: Number(values.zoneId),
            };

            console.log("Payload →", JSON.stringify(payload, null, 2));

            const res = await axios.post(
                `${BASE_URL}/api/frmPayment/save-payment`,
                payload,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            const result = res.data?.data;
            console.log(result);

            if (result?.errorCode === -100) {
                Swal.fire({
                    text: result.message,
                    confirmButtonColor: "#1e3a8a",
                }).then(async () => {

                    // JCMC 
                    if (showAmountFields) {
                        navigate("/Transactions/FrmPaymentList");
                        return;
                    }


                    try {
                        Swal.fire({
                            title: "Generating PDF...",
                            allowOutsideClick: false,
                            didOpen: () => {
                                Swal.showLoading();
                            },
                        });

                        const generatedRefNo = result?.refno || currentRefNo;


                        const pdfRes = await axios.post(
                            `${BASE_URL}/api/frmPayment/payment-pdf`,
                            {
                                refno: generatedRefNo,
                                ulbid: user?.ulbId,
                            },
                            {
                                headers: {
                                    Authorization: `Bearer ${token}`,
                                },
                            }
                        );

                        // ✅ CLOSE LOADER
                        Swal.close();

                        if (pdfRes.data?.pdfUrl) {
                            window.open(pdfRes.data.pdfUrl, "_blank");
                        } else {
                            Swal.fire({
                                text: "PDF generation failed",
                                icon: "error",
                            });
                        }

                    } catch (pdfErr) {
                        console.error("PDF ERROR:", pdfErr);

                        Swal.close();

                        Swal.fire({
                            text: "PDF generation failed",
                            icon: "error",
                        });
                    }

                    // ✅ NAVIGATE AFTER PDF
                    navigate("/Transactions/FrmPaymentList");
                });
            } else {
                Swal.fire({
                    text: result?.message || "Transaction failed.",
                    confirmButtonColor: "#1e3a8a",
                });
            }

        } catch (err) {
            console.error("Submit error:", err);
            Swal.fire({
                text: err.response?.data?.message || "Something went wrong!",
                confirmButtonColor: "#1e3a8a",
            });
        }
    };


    return (
        <Formik initialValues={INITIAL_VALUES} onSubmit={handleSubmit}>
            {({ values, handleChange, setFieldValue, errors, touched }) => {

                setFieldValueRef.current = setFieldValue;

                useEffect(() => {
                    if (values.transactionType !== "4") {
                        setFieldValue("chequeNo", "");
                        setFieldValue("chequePageNo", "");
                        setFieldValue("chequeDate", "");
                    }
                }, [values.transactionType]);

                useEffect(() => {
                    if (values.deptCode) fetchCreditLeasure(values.deptCode, "entryHead");
                    else setEntryHeadList([]);
                }, [values.deptCode]);

                useEffect(() => {
                    if (values.debtorDeptCode) fetchCreditLeasure(values.debtorDeptCode, "party");
                    else setPartyList([]);
                }, [values.debtorDeptCode]);

                useEffect(() => {
                    const allLoaded =
                        refNo && ulbId &&
                        zones.length &&
                        transTypes.length &&
                        paymentTypes.length &&
                        partyMaster.length &&
                        debtorGlList.length;

                    if (allLoaded) {
                        fetchPaymentDetails(setFieldValue).finally(() => {
                            setIsLoading(false);
                            Swal.close();
                        });
                    }
                }, [refNo, ulbId, zones, transTypes, paymentTypes, partyMaster]);

                useEffect(() => {
                    if (values.deptCode && values.ledgerHead) {
                        fetchAccountBalance(values, setFieldValue);
                    }
                }, [values.deptCode, values.ledgerHead, values.date]);

                const isBankPayment = values.transactionType === "4";

                useEffect(() => {
                    if (values.transactionType) {
                        fetchDeptGLList(values.transactionType);

                        setFieldValue("deptCode", "");
                        setFieldValue("ledgerHead", "");
                    } else {
                        setDeptGlList([]);
                    }
                }, [values.transactionType]);

                useEffect(() => {
                    if (values.transactionType === "3") {
                        fetchAdvancePaymentType(setFieldValue);
                    } else {
                        fetchPaymentTypes();
                        setFieldValue("debtorType", "");
                    }
                }, [values.transactionType]);

                return (
                    <Form>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            <Card className="gap-0 border shadow-sm">
                                <CardHeader className="border-b">
                                    <CardTitle className="text-lg font-semibold">
                                        Direct Payment Entry
                                    </CardTitle>
                                </CardHeader>

                                <CardContent className="px-4 py-2 sm:px-6 space-y-2">

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div>
                                            <Label text="प्रभाग :" />
                                            <Select value={values.zoneId} onValueChange={(v) => setFieldValue("zoneId", v)}>
                                                <SelectTrigger className="w-full border rounded-md">
                                                    <SelectValue placeholder="-- विकल्प निवडा --" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {zones.map((z) => (
                                                        <SelectItem key={z.ZONEID} value={z.ZONEID.toString()}>
                                                            {z.ZONEENAME}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            {errors.zoneId && touched.zoneId && (
                                                <p className="mt-1 text-sm text-red-500">{errors.zoneId}</p>
                                            )}
                                        </div>

                                        <div>
                                            <Label text="व्यवहार प्रकार :" />
                                            <Select value={values.transactionType} onValueChange={(v) => setFieldValue("transactionType", v)}>
                                                <SelectTrigger className="w-full border rounded-md">
                                                    <SelectValue placeholder="-- विकल्प निवडा --" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {transTypes.map((t) => (
                                                        <SelectItem key={t.ID} value={t.ID.toString()}>
                                                            {t.ENGLISHNAME}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            {errors.transactionType && touched.transactionType && (
                                                <p className="text-red-500 text-sm">{errors.transactionType}</p>
                                            )}
                                        </div>

                                        <div>
                                            <Label text="देवक प्रकार :" />
                                            <Select value={values.debtorType} onValueChange={(v) => setFieldValue("debtorType", v)}>
                                                <SelectTrigger className="w-full border rounded-md">
                                                    <SelectValue placeholder="-- विकल्प निवडा --" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {paymentTypes.map((p) => (
                                                        <SelectItem key={p.VALUEFIELD} value={p.VALUEFIELD.toString()}>
                                                            {p.DISPLAYTEXT}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            {errors.debtorType && touched.debtorType && (
                                                <p className="text-red-500 text-sm">{errors.debtorType}</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div>
                                            <Label text="दिनांक :" />
                                            <DatePicker value={values.date} onChange={(d) => setFieldValue("date", d)} />
                                            {errors.date && touched.date && (
                                                <p className="text-red-500 text-sm">{errors.date}</p>
                                            )}
                                        </div>

                                        <div>
                                            <Label text="विभाग कोड :" />
                                            <SearchableSelect
                                                options={deptGlOptions}
                                                name="deptCode"
                                                value={values.deptCode}
                                                onChange={(val) => {
                                                    setFieldValue("deptCode", val.value);
                                                    setFieldValue("ledgerHead", "");
                                                }}
                                            />
                                            {errors.deptCode && touched.deptCode && (
                                                <p className="text-red-500 text-sm">{errors.deptCode}</p>
                                            )}
                                        </div>

                                        <div>
                                            <Label text="लेखाशीर्ष :" />
                                            <SearchableSelect
                                                options={entryHeadList}
                                                name="ledgerHead"
                                                value={values.ledgerHead}
                                                onChange={(val) => setFieldValue("ledgerHead", val.value)}
                                                disabled={!values.deptCode}
                                            />
                                            {errors.ledgerHead && touched.ledgerHead && (
                                                <p className="text-red-500 text-sm">{errors.ledgerHead}</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        {ulbId != 2 && (
                                            <div>
                                                <Label text="व्हाउचर क्रमांक :" />
                                                <Input name="voucherNo" value={values.voucherNo} onChange={handleChange} />
                                                {errors.voucherNo && touched.voucherNo && (
                                                    <p className="text-red-500 text-sm">{errors.voucherNo}</p>
                                                )}
                                            </div>
                                        )}

                                        <div>
                                            <Label text="बैंकची शिल्लक :" />
                                            <Input name="bankBalance" value={values.bankBalance} type="number" disabled />
                                            {errors.bankBalance && touched.bankBalance && (
                                                <p className="text-red-500 text-sm">{errors.bankBalance}</p>
                                            )}
                                        </div>
                                    </div>

                                    {isBankPayment && (
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                                            {isBankPayment && (
                                                <div>
                                                    <Label text="धनादेश क्रमांक :" />
                                                    <Input
                                                        name="chequeNo"
                                                        value={values.chequeNo}
                                                        onChange={(e) => {
                                                            let val = e.target.value;
                                                            val = val.replace(/\D/g, "");
                                                            if (val.length <= 6) {
                                                                setFieldValue("chequeNo", val);
                                                            }
                                                        }}
                                                        inputMode="numeric"
                                                        maxLength={6}
                                                        onBlur={() => {
                                                            if (!values.chequeNo) return;

                                                            if (values.chequeNo.length < 6) {
                                                                Swal.fire({
                                                                    text: "Cheque number must be 6 digits",
                                                                    confirmButtonColor: "#1e3a8a",
                                                                });
                                                                return;
                                                            }

                                                            if (
                                                                values.deptCode &&
                                                                values.ledgerHead &&
                                                                values.zoneId
                                                            ) {
                                                                fetchChequeBook(values, setFieldValue);
                                                            }
                                                        }}
                                                    />
                                                    {errors.chequeNo && touched.chequeNo && (
                                                        <p className="text-red-500 text-sm">{errors.chequeNo}</p>
                                                    )}
                                                </div>
                                            )}

                                            <div>
                                                <Label text="धनादेश पृष्ठिका क्रमांक :" className="whitespace-nowrap" />
                                                <Input name="chequePageNo" value={values.chequePageNo} disabled />
                                                {errors.chequePageNo && touched.chequePageNo && (
                                                    <p className="text-red-500 text-sm">{errors.chequePageNo}</p>
                                                )}
                                            </div>

                                            <div>
                                                <Label text="धनादेश दिनांक :" />
                                                <DatePicker value={values.chequeDate} onChange={(d) => setFieldValue("chequeDate", d)} />
                                                {errors.chequeDate && touched.chequeDate && (
                                                    <p className="text-red-500 text-sm">{errors.chequeDate}</p>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div>
                                            <Label text="देयकाधाराकाचे नाव :" className="whitespace-nowrap" />
                                            <Input name="costomerName" value={values.costomerName} onChange={handleChange} />
                                            {errors.costomerName && touched.costomerName && (
                                                <p className="text-red-500 text-sm">{errors.costomerName}</p>
                                            )}
                                        </div>

                                        <div>
                                            <Label text="विभाग कोड :" />
                                            <SearchableSelect
                                                options={debtorGlOptions}
                                                name="debtorDeptCode"
                                                value={values.debtorDeptCode}
                                                onChange={(val) => {
                                                    setFieldValue("debtorDeptCode", val.value);
                                                    setFieldValue("debtorLedgerHead", "");
                                                }}
                                            />
                                            {errors.debtorDeptCode && touched.debtorDeptCode && (
                                                <p className="text-red-500 text-sm">{errors.debtorDeptCode}</p>
                                            )}
                                        </div>

                                        <div>
                                            <Label text="लेखाशीर्ष :" />
                                            <SearchableSelect
                                                options={partyList}
                                                name="debtorLedgerHead"
                                                value={values.debtorLedgerHead}
                                                onChange={(val) => setFieldValue("debtorLedgerHead", val.value)}
                                                disabled={!values.debtorDeptCode}
                                            />
                                            {errors.debtorLedgerHead && touched.debtorLedgerHead && (
                                                <p className="text-red-500 text-sm">{errors.debtorLedgerHead}</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div>
                                            <Label text="रक्कम :" />
                                            <Input name="amount" value={values.amount} onChange={handleChange} placeholder="रक्कम" type="number" />
                                            {errors.amount && touched.amount && (
                                                <p className="text-red-500 text-sm">{errors.amount}</p>
                                            )}
                                        </div>

                                        <div>
                                            <Label text="तपशील :" />
                                            <Input name="details" value={values.details} onChange={handleChange} />
                                            {errors.details && touched.details && (
                                                <p className="text-red-500 text-sm">{errors.details}</p>
                                            )}
                                        </div>

                                        <div>
                                            <Label text="पार्टी कोड :" />
                                            <Select value={values.partyCode} onValueChange={(v) => setFieldValue("partyCode", v)}>
                                                <SelectTrigger className="w-full border rounded-md">
                                                    <SelectValue placeholder="-- विकल्प निवडा --" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {partyMaster.map((p) => (
                                                        <SelectItem key={p.value} value={p.value}>
                                                            {p.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            {errors.partyCode && touched.partyCode && (
                                                <p className="text-red-500 text-sm">{errors.partyCode}</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex justify-center gap-3 pt-4">
                                        <Button type="submit" className="bg-blue-900 text-white hover:bg-blue-800">
                                            स्वीकार
                                        </Button>
                                        <Button type="button" variant="destructive">
                                            हटवा
                                        </Button>
                                        <Button type="button" path="/Transactions/FrmPaymentList">
                                            बाहेर जा
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

export default FrmPayment;