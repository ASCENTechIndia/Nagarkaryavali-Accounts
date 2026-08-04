import React, { useEffect, useState } from "react";
import { Formik, Form } from "formik";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import config from "@/utils/config.jsx";
import Swal from "sweetalert2";
import { DatePicker } from "@/components/ui/calendar";
import ShadCNTable from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";

const initialValues = {
    zoneId: "",
    fromDate: new Date(),
    toDate: new Date(),
    userId: "",
    department: "-1",
};

const FrmVoucherAuthList = () => {
    const { user } = useAuth();
    const token = user?.token;
    const ulbId = user?.ulbId;
    const deptId = config.deptId;
    const navigate = useNavigate();

    const BASE_URL = import.meta.env.VITE_BASE_URL;

    const [zoneList, setZoneList] = useState([]);
    const [userList, setUserList] = useState([]);
    const [showPendingOnly, setShowPendingOnly] = useState(false);
    const [tableData, setTableData] = useState([]);

    const headers = [
        "संदर्भ क्र.",
        "व्यवहार क्र",
        "व्यवहार दिनांक",
        "व्यवहार प्रकार",
        "प्रभाग",
        "धनादेश क्र",
        "धनादेश दिनांक",
    ];

    const keyMapping = {
        "संदर्भ क्र.": "",
        "व्यवहार क्र": "voucherNo",
        "व्यवहार दिनांक": "voucherDate",
        "व्यवहार प्रकार": "voucherType",
        "प्रभाग": "zoneName",
        "धनादेश क्र": "chequeNo",
        "धनादेश दिनांक": "chequeDate",
    };

    const columnStyles = {
        "निवडा": { width: "80px" },
        "व्यवहार क्र": { width: "170px" },
        "व्यवहार दिनांक": { width: "150px" },
        "व्यवहार प्रकार": { width: "220px" },
        "प्रभाग": { width: "120px" },
        "धनादेश क्र": { width: "160px" },
        "धनादेश दिनांक": { width: "170px" },
    };

    const fetchZones = async () => {
        try {
            const res = await axios.post(
                `${BASE_URL}/api/Receipt/zones`,
                { corp_id: ulbId },
                {
                    headers: { Authorization: `Bearer ${token}` },
                },
            );

            if (res.data?.ok) {
                setZoneList(res.data.data || []);
            }
        } catch (err) {
            console.error("Zone API Error:", err);
        }
    };

    const fetchUsers = async () => {
        try {
            const res = await axios.post(
                `${BASE_URL}/api/FrmTransAuthList/user-list`,
                {
                    ulbId: ulbId?.toString(),
                    deptId: deptId,
                },
                {
                    headers: { Authorization: `Bearer ${token}` },
                },
            );

            if (res.data?.success) {
                setUserList(res.data.rows || []);
            }
        } catch (err) {
            console.error("User API Error:", err);
        }
    };

    useEffect(() => {
        fetchZones();
        fetchUsers();
    }, [ulbId]);

    const handleSubmit = async (values) => {
        console.log(values);
    };

    return (
        <Formik initialValues={initialValues} onSubmit={handleSubmit}>
            {({ values, setFieldValue }) => {

                return (
                    <Form>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="px-2 sm:px-4 mt-4 sm:mt-6"
                        >
                            <Card className="border shadow-sm">
                                <CardHeader className="border-b">
                                    <CardTitle className="text-lg font-semibold">
                                        प्रमाणक अधिकृतता
                                    </CardTitle>
                                </CardHeader>

                                <CardContent className="p-4 sm:p-5 space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                                            <div className="sm:w-36 shrink-0 flex justify-start sm:justify-between items-center">
                                                <Label text="प्रभाग" />
                                                <span>:</span>
                                            </div>

                                            <Select
                                                value={values.zoneId}
                                                onValueChange={(v) => setFieldValue("zoneId", v)}
                                            >
                                                <SelectTrigger className="w-full h-9">
                                                    <SelectValue placeholder="-- ALL --" />
                                                </SelectTrigger>

                                                <SelectContent>
                                                    <SelectItem
                                                        value={"-1"}
                                                    >
                                                        -- ALL --
                                                    </SelectItem>
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

                                        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                            <div className="sm:w-36 shrink-0 flex items-center justify-between">

                                                <div className="flex items-center gap-2">
                                                    <Checkbox
                                                        checked={showPendingOnly}
                                                        onCheckedChange={(checked) =>
                                                            setShowPendingOnly(checked === true)
                                                        }
                                                    />

                                                    <Label text="दिनांक पासून" />
                                                </div>

                                                <span>:</span>

                                            </div>

                                            <DatePicker
                                                value={values.fromDate}
                                                onChange={(date) => setFieldValue("fromDate", date)}
                                                className="w-full h-9"
                                            />
                                        </div>
                                        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                            <div className="sm:w-36 shrink-0 flex justify-start sm:justify-between items-center">
                                                <Label text="दिनांक पर्यंत" />
                                                <span>:</span>
                                            </div>

                                            <DatePicker
                                                value={values.toDate}
                                                onChange={(date) =>
                                                    setFieldValue("toDate", date)
                                                }
                                                className="w-full h-9"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                            <div className="sm:w-36 shrink-0 flex justify-start sm:justify-between items-center">
                                                <Label text="वापरकर्ता" />
                                                <span>:</span>
                                            </div>

                                            <Select
                                                value={values.userId}
                                                onValueChange={(v) => setFieldValue("userId", v)}
                                            >
                                                <SelectTrigger className="w-full h-9">
                                                    <SelectValue placeholder="-- विकल्प निवडा --" />
                                                </SelectTrigger>

                                                <SelectContent>
                                                    {userList.length > 0 ? (
                                                        userList.map((user) => (
                                                            <SelectItem
                                                                key={user.USERID}
                                                                value={user.USERID}
                                                            >
                                                                {user.USERNAME}
                                                            </SelectItem>
                                                        ))
                                                    ) : (
                                                        <SelectItem value="no-data" disabled>
                                                            No Users Found
                                                        </SelectItem>
                                                    )}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>


                                    <div className="flex justify-center flex-wrap gap-4 pt-4">
                                        <Button
                                            type="submit"
                                            className="bg-blue-900 text-white px-6 h-9"
                                        >
                                            व्हाउचर शोध
                                        </Button>
                                    </div>


                                    <div className="mt-6">
                                        <ShadCNTable
                                            headers={headers}
                                            data={tableData}
                                            keyMapping={keyMapping}
                                            columnStyles={columnStyles}
                                            pagination={false}
                                        />
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

export default FrmVoucherAuthList;