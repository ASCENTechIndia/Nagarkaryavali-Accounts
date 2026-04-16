import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Formik, Form } from "formik";
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
import { DatePicker } from "@/components/ui/calendar";
import ShadCNTable from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { useState, useEffect } from "react";
import axios from "axios";

const FrmSearchOption = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const token = user?.token;
    const ulbId = user?.ulbId;

    const BASE_URL = import.meta.env.VITE_BASE_URL;

    const [zoneList, setZoneList] = useState([]);
    const [tableData, setTableData] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    const formatDate = (date) => {
        if (!date) return "";
        const d = new Date(date);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        const dd = String(d.getDate()).padStart(2, "0");
        return `${yyyy}-${mm}-${dd}`;
    };


    const initialValues = {
        zoneId: "",
        txnNo: "",
        fromDate: new Date(),
        toDate: new Date(),
        amountFrom: "",
        amountTo: "",
        receiptNo: "",
        contractorName: "",
    };

    const keyMapping = {
        "पावती क्र.": "RECEIPTNO",
        "व्यवहार क्र.": "TRANSNO",
        "कंत्राटीचे नाव": "PARTYNAME",
        "व्यवहाराची दिनांक": "TRNSDATE",
        "सामान्य खातेवही कोड": "GLCODE",
        "सामान्य खातेवहीचे नाव": "GLNAME",
        "खात्री क्र.": "ACCNO",
        "खात्रीचे नाव": "ACCNAME",
        "प्रभागाची नाव": "ZONEENAME",
        "वर्णन": "NARRATION",
        "रक्कम": "AMOUNT",
    };



    const fetchZones = async () => {
        try {

            const res = await axios.post(
                `${BASE_URL}/api/Receipt/zones`,
                { corp_id: ulbId },
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            if (res.data?.ok) {
                setZoneList(res.data.data || []);
            }
        } catch (err) {
            console.error("Zone API Error:", err);
        }
    };

    useEffect(() => {
        fetchZones();
    }, [ulbId]);

    const handleSubmit = async (values) => {
        setIsLoading(true);
        try {
            const res = await axios.post(
                `${BASE_URL}/api/FrmSearchOption/receipt-search`,
                {
                    fromDate: formatDate(values.fromDate),
                    toDate: formatDate(values.toDate),
                    zoneId: values.zoneId,
                    transNo: values.txnNo,
                    receiptNo: values.receiptNo,
                    partyId: "",
                    fromAmount: values.amountFrom,
                    toAmount: values.amountTo,
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (res.data?.success) {
                setTableData(res.data.data?.rows || []);
            } else {
                setTableData([]);
            }
        } catch (err) {
            console.error("Search API Error:", err);
            setTableData([]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 sm:mt-6 px-2 sm:px-4"
        >
            <Formik initialValues={initialValues} onSubmit={handleSubmit}>
                {({ values, setFieldValue }) => (
                    <Form>
                        <Card className="shadow-sm border rounded-lg">
                            <CardHeader className="border-b">
                                <CardTitle className="text-lg font-semibold">पावती शोधा</CardTitle>
                            </CardHeader>

                            <CardContent className="p-4 sm:p-6 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">

                                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                                        <Label className="text-sm">प्रभाग :</Label>
                                        <Select
                                            value={values.zoneId}
                                            onValueChange={(v) => setFieldValue("zoneId", v)}
                                        >
                                            <SelectTrigger className="w-full sm:flex-1">
                                                <SelectValue placeholder="-- निवडा --" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {zoneList.map((zone) => (
                                                    <SelectItem
                                                        key={zone.ZONEID}
                                                        value={zone.ZONEID.toString()}
                                                    >
                                                        {zone.ZONEENAME}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>

                                    </div>

                                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                                        <Label text="व्यवहार क्र. :" />
                                        <input
                                            type="text"
                                            className="border rounded px-2 h-9 w-full sm:flex-1"
                                            value={values.txnNo}
                                            onChange={(e) => setFieldValue("txnNo", e.target.value)}
                                        />
                                    </div>

                                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                                        <Label text="चलन/पावती क्र. :" />
                                        <input
                                            type="text"
                                            className="border rounded px-2 h-9 w-full sm:flex-1"
                                            value={values.receiptNo}
                                            onChange={(e) => setFieldValue("receiptNo", e.target.value)}
                                        />
                                    </div>

                                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                                        <Label text="दिनांकापासून :" />
                                        <DatePicker
                                            value={values.fromDate}
                                            onChange={(date) =>
                                                setFieldValue("fromDate", date)
                                            }
                                        />
                                    </div>

                                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                                        <Label text="आजपर्यंत :" />
                                        <DatePicker
                                            value={values.toDate}
                                            onChange={(date) =>
                                                setFieldValue("toDate", date)
                                            }
                                        />
                                    </div>

                                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                                        <Label text="कंत्राटीचे नाव :" />
                                        <input
                                            type="text"
                                            className="border rounded px-2 h-9 w-full sm:flex-1"
                                            value={values.contractorName}
                                            onChange={(e) => setFieldValue("contractorName", e.target.value)}
                                        />
                                    </div>

                                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                                        <Label text="रक्कम पासून :" />
                                        <input
                                            type="number"
                                            className="border rounded px-2 h-9 w-full sm:flex-1"
                                            value={values.amountFrom}
                                            onChange={(e) => setFieldValue("amountFrom", e.target.value)}
                                        />
                                    </div>

                                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                                        <Label text="रक्कम पर्यंत :" />
                                        <input
                                            type="number"
                                            className="border rounded px-2 h-9 w-full sm:flex-1"
                                            value={values.amountTo}
                                            onChange={(e) => setFieldValue("amountTo", e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="flex justify-center gap-4 pt-4">
                                    <Button type="submit" className="bg-blue-900 text-white px-6 h-9">
                                        शोधा
                                    </Button>
                                    <Button className="px-6 h-9" onClick={() => navigate("/HomePage/FrmHomePage")}>
                                        परत
                                    </Button>
                                </div>

                                {isLoading && (
                                    <p className="text-center text-sm text-gray-500 mt-4">लोड होत आहे...</p>
                                )}

                                {!isLoading && tableData.length === 0 && (
                                    <p className="text-center text-sm text-gray-400 mt-4">कोणताही डेटा आढळला नाही.</p>
                                )}

                                {!isLoading && tableData.length > 0 && (
                                    <div className="border rounded-md bg-white overflow-x-auto mt-6">
                                        <ShadCNTable
                                            headers={Object.keys(keyMapping)}
                                            data={tableData}
                                            keyMapping={keyMapping}
                                        />
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </Form>
                )}
            </Formik>
        </motion.div>
    );
};

export default FrmSearchOption;
