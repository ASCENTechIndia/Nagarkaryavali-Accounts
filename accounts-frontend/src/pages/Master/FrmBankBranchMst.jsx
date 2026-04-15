
import React, { useEffect, useState } from "react";
import { Formik, Form } from "formik";
import { motion } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import Swal from "sweetalert2";

const initialValues = {
    bankName: "",
    branchName: "",
    micr: "",
    ifsc: "",
};

const FrmBankBranchMst = () => {
    const { user } = useAuth();
    const token = user?.token;
    const navigate = useNavigate();
    const location = useLocation();
    const { mode, data } = location.state || {};

    const BASE_URL = import.meta.env.VITE_BASE_URL;

    const [bankList, setBankList] = useState([]);

    const fetchBankList = async () => {
        try {
            const res = await axios.get(
                `${BASE_URL}/api/Bankbranch/banklist`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            setBankList(res.data?.data?.list || []);
        } catch (err) {
            console.error("Bank List Error:", err);
        }
    };

    const fetchBranchById = async (id, setValues) => {
        try {
            const res = await axios.get(
                `${BASE_URL}/api/Bankbranch/branch/${id}`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            const apiData = res.data?.data?.data;

            if (apiData) {
                setValues({
                    bankName: apiData.BANKID?.toString(),
                    branchName: apiData.BRANCHNAME?.trim(),
                    micr: apiData.MICR || "",
                    ifsc: apiData.IFSC || "",
                });
            }
        } catch (err) {
            console.error("Autofill Error:", err);
        }
    };

    const handleSubmit = async (values) => {
        try {
            const payload = {
                bankId: Number(values.bankName),
                branchName: values.branchName,
                micr: values.micr,
                ifsc: values.ifsc,
                userId: user?.userId,
                mode: mode === 2 ? 2 : 1,
            };

            const res = await axios.post(
                `${BASE_URL}/api/Bankbranch/branchmaster`,
                payload,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            if (res.data?.ok) {
                Swal.fire({
                    text: res.data.message,
                    confirmButtonColor: "#1e3a8a",
                });
                navigate("/Masters/FrmBankBranchList");
            }
        } catch (err) {
            console.error("Save Error:", err);
            Swal.fire({
                text: "Something went wrong",
                confirmButtonColor: "#1e3a8a",
            });
        }
    };

    useEffect(() => {
        fetchBankList();
    }, []);

    return (
        <Formik
            initialValues={initialValues}
            enableReinitialize
            onSubmit={handleSubmit}
        >
            {({ values, handleChange, setFieldValue, setValues }) => {
                useEffect(() => {
                    if (mode === 2 && data?.id && bankList.length > 0) {
                        fetchBranchById(data.id, setValues);
                    }
                }, [mode, data, bankList]);

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
                                        बँक शाखा मास्टर
                                    </CardTitle>
                                </CardHeader>

                                <CardContent className="p-4 sm:p-6 space-y-6">
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">

                                        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                            <Label className="sm:w-40">बँकेचे नाव :</Label>

                                            <Select
                                                value={values.bankName}
                                                onValueChange={(v) => setFieldValue("bankName", v)}
                                                disabled={mode === 2}
                                            >
                                                <SelectTrigger className="w-full sm:flex-1">
                                                    <SelectValue placeholder="-- पर्याय निवडा --" />
                                                </SelectTrigger>

                                                <SelectContent>
                                                    {bankList.map((bank) => (
                                                        <SelectItem
                                                            key={bank.VALUE}
                                                            value={bank.VALUE.toString()}
                                                        >
                                                            {bank.LABEL}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                            <Label className="sm:w-40">शाखेचे नाव :</Label>
                                            <Input
                                                name="branchName"
                                                value={values.branchName}
                                                onChange={handleChange}
                                                className="w-full sm:flex-1"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                                        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                            <Label className="sm:w-40">एमआयसीआर संकेतांक :</Label>
                                            <Input
                                                name="micr"
                                                value={values.micr}
                                                onChange={handleChange}
                                                className="w-full sm:flex-1"
                                            />
                                        </div>

                                        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                            <Label className="sm:w-40">आयएफएससी संकेतांक :</Label>
                                            <Input
                                                name="ifsc"
                                                value={values.ifsc}
                                                onChange={handleChange}
                                                className="w-full sm:flex-1"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 pt-4">
                                        <Button
                                            type="submit"
                                            className="bg-blue-900 text-white px-6 w-full sm:w-auto"
                                        >
                                            साठवा
                                        </Button>

                                        <Button
                                            type="button"
                                            variant="destructive"
                                            className="px-6 w-full sm:w-auto"
                                            onClick={() => navigate("/Masters/FrmBankBranchList")}
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

export default FrmBankBranchMst;