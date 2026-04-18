import React, { useEffect, useState } from "react";
import { Formik, Form } from "formik";
import { motion } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";

const initialValues = {
    ulbId: "",
    status: "Active",
};

const Frmauthorizationconfig = () => {
    const { user } = useAuth();
    const token = user?.token;
    const navigate = useNavigate();
    const location = useLocation();
    const { mode, data } = location.state || {};

    const BASE_URL = import.meta.env.VITE_BASE_URL;

    const [corporations, setCorporations] = useState([]);

    const fetchCorporations = async () => {
        try {
            const res = await axios.get(
                `${BASE_URL}/api/FrmParty/corporation/list`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            setCorporations(res.data?.data?.list || []);
        } catch (err) {
            console.error("Corporation API Error:", err);
        }
    };

    useEffect(() => {
        fetchCorporations();
    }, []);

    const handleSubmit = async (values) => {
        try {
            const payload = {
                authorizId: mode === 2 ? data?.id : "",
                ulbId: values.ulbId,
                flag: values.status === "Active" ? "Y" : "N",
                userId: user?.userId,
                mode: mode === 2 ? 2 : 1,
            };

            Swal.fire({
                title: "Saving...",
                allowOutsideClick: false,
                didOpen: () => Swal.showLoading(),
            });

            const res = await axios.post(
                `${BASE_URL}/api/Frmauthorizationconfig/authconfig-master`,
                payload,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            Swal.close();

            if (res.data?.ok) {
                Swal.fire({
                    text: res.data.message,
                    confirmButtonColor: "#1e3a8a",
                }).then(() => {
                    navigate("/Masters/FrmauthorizationconfigList");
                });
            }
        } catch (err) {
            console.error("Save Error:", err);
            Swal.fire("Error", "Something went wrong", "error");
        }
    };

    const handleDelete = async (values) => {
        try {
            const confirm = await Swal.fire({
                title: "Are you sure?",
                text: "You want to delete this record",
                showCancelButton: true,
            });

            if (!confirm.isConfirmed) return;

            const payload = {
                authorizId: data?.id,
                ulbId: values.ulbId,
                flag: values.status === "Active" ? "Y" : "N",
                userId: user?.userId,
                mode: 3,
            };

            Swal.fire({
                title: "Deleting...",
                allowOutsideClick: false,
                didOpen: () => Swal.showLoading(),
            });

            const res = await axios.post(
                `${BASE_URL}/api/Frmauthorizationconfig/authconfig-master`,
                payload,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            Swal.close();

            if (res.data?.ok) {
                Swal.fire({
                    text: res.data.message,
                    confirmButtonColor: "#1e3a8a",
                }).then(() => {
                    navigate("/Masters/FrmauthorizationconfigList");
                });
            }

        } catch (err) {
            console.error("Delete Error:", err);
            Swal.fire("Error", "Delete failed", "error");
        }
    };

    return (
        <Formik
            initialValues={{
                ulbId: data?.code || "",
                status: data?.status || "Active",
            }}
            enableReinitialize
            onSubmit={handleSubmit}
        >
            {({ values, handleChange, setFieldValue }) => (
                <Form>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="px-2 sm:px-4 mt-4 sm:mt-6"
                    >
                        <Card className="border shadow-sm">
                            <CardHeader className="border-b">
                                <CardTitle className="text-lg font-semibold">
                                    Authorization Config
                                </CardTitle>
                            </CardHeader>

                            <CardContent className="p-6 space-y-6">
                                <div className="flex items-center gap-4">
                                    <Label className="w-40 font-medium" text="नगरपालिका :" />

                                    <select
                                        name="ulbId"
                                        value={values.ulbId}
                                        onChange={handleChange}
                                        className="border border-gray-400 px-3 py-2 w-1/2 rounded-sm"
                                    >
                                        <option value="">-- विकल्प निवडा --</option>
                                        {corporations.map((item) => (
                                            <option
                                                key={item.NUM_CORPORATION_ID}
                                                value={item.NUM_CORPORATION_ID}
                                            >
                                                {item.VAR_CORPORATION_NAME}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="flex items-center gap-4">
                                    <Label className="w-40 font-medium" text="स्थिती :" />

                                    <div className="flex gap-4">
                                        <label className="flex items-center gap-2">
                                            <Input
                                                type="radio"
                                                checked={values.status === "Active"}
                                                onChange={() => setFieldValue("status", "Active")}
                                            />
                                            Active
                                        </label>

                                        <label className="flex items-center gap-2">
                                            <Input
                                                type="radio"
                                                checked={values.status === "InActive"}
                                                onChange={() => setFieldValue("status", "InActive")}
                                            />
                                            InActive
                                        </label>
                                    </div>
                                </div>

                                <div className="flex justify-center gap-4 pt-6">
                                    <Button type="submit" className="bg-blue-900 text-white px-6">
                                        Submit
                                    </Button>

                                    {mode === 2 && (
                                        <Button
                                            type="button"
                                            variant="destructive"
                                            onClick={() => handleDelete(values)}
                                        >
                                            Delete
                                        </Button>
                                    )}

                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() =>
                                            navigate("/Masters/FrmauthorizationconfigList")
                                        }
                                    >
                                        Back
                                    </Button>
                                </div>

                            </CardContent>
                        </Card>
                    </motion.div>
                </Form>
            )}
        </Formik>
    );
};

export default Frmauthorizationconfig;