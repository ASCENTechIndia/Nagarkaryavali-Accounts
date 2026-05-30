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
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { useAuth } from "@/context/AuthContext";

const initialValues = {
  stateId: "",
  districtName: "",
  districtId: "",
};

const FrmDistrictMst = () => {
  const { user } = useAuth();
  const token = user?.token;
  const ulbId = user?.ulbId;
  const navigate = useNavigate();
  const location = useLocation();
  const { mode, data } = location.state || {};

  const BASE_URL = import.meta.env.VITE_BASE_URL;

  const [corporations, setCorporations] = useState([]);
  const [states, setStates] = useState([]);
  const [formValues, setFormValues] = useState(initialValues);
  const [initialLoading, setInitialLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchStates = async () => {
    try {
        const res = await axios.get(`${BASE_URL}/api/CityList/statelist`, {
        headers: { Authorization: `Bearer ${token}` },
        });

        if (res?.data?.data?.success) {
        const formatted = res.data.data.list.map((s) => ({
            value: s.STATE_ID.toString(),
            label: s.STATE_NAME,
        }));
        setStates(formatted);
        }
    } catch (err) {
        console.error("State API Error:", err);
    }
  };

  const fetchDistrictById = async (id, setValues) => {
    try {
        const res = await axios.get(
        `${BASE_URL}/api/District/district/${id}`,
        {
            headers: { Authorization: `Bearer ${token}` },
        }
        );

        const apiData = res?.data?.data?.data;

        if (apiData) {
        setValues({
            stateId: apiData.STATEID.toString(),
            districtName: apiData.DISTRICTNAME,
            districtId: apiData.DISTRICTID,
        });
        }
    } catch (err) {
        console.error("Autofill Error:", err);
    }
  };

  const handleSubmit = async (values) => {
    try {
        const payload = {
        stateId: Number(values.stateId),
        districtId: mode === 2 ? values.districtId : undefined,
        districtName: values.districtName,
        userId: user?.userId,
        mode: mode === 2 ? 2 : 1,
        };

        const res = await axios.post(
        `${BASE_URL}/api/District/districtmaster`,
        payload,
        {
            headers: { Authorization: `Bearer ${token}` },
        }
        );

        if (res?.data?.ok && res?.data?.data?.success) {
        Swal.fire({
            // icon: "success",
            text: "Saved successfully",
            confirmButtonColor: "#1e3a8a",
        });

        navigate("/Masters/FrmDistrictList");
        } else {
        Swal.fire({
            // icon: "error",
            text: res?.data?.message || "Something went wrong",
            confirmButtonColor: "#1e3a8a",
        });
        }
    } catch (err) {
        console.error("Save API Error:", err);
        Swal.fire({
        // icon: "error",
        text: "Something went wrong",
        confirmButtonColor: "#1e3a8a",
        });
    }
  };
  const handleDelete = async (values) => {
    try {
        setDeleteLoading(true);

        const payload = {
        stateId: Number(values.stateId),
        districtId: mode === 2 ? values.districtId : undefined,
        districtName: values.districtName,
        userId: user?.userId,
        mode: 3,
        };

        const res = await axios.post(
        `${BASE_URL}/api/District/districtmaster`,
        payload,
        {
            headers: { Authorization: `Bearer ${token}` },
        }
        );

        if (res?.data?.ok && res?.data?.data?.success) {
        Swal.fire({
            // icon: "success",
            text: "Deleted successfully",
            confirmButtonColor: "#1e3a8a",
        });

        navigate("/Masters/FrmDistrictList");
        } else {
        Swal.fire({
            // icon: "error",
            text: res?.data?.message || "Something went wrong",
            confirmButtonColor: "#1e3a8a",
        });
        }
    } catch (err) {
        console.error("Save API Error:", err);
        Swal.fire({
        // icon: "error",
        text: "Something went wrong",
        confirmButtonColor: "#1e3a8a",
        });
    } finally {
      setDeleteLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
        setInitialLoading(true);

        await fetchStates();

        if (mode === 2 && data?.id) {
        const res = await axios.get(
            `${BASE_URL}/api/District/district/${data.id}`,
            {
            headers: { Authorization: `Bearer ${token}` },
            }
        );

        const apiData = res?.data?.data?.data;

        if (apiData) {
            setFormValues({
            stateId: apiData.STATEID.toString(),
            districtName: apiData.DISTRICTNAME,
            districtId: apiData.DISTRICTID,
            });
        }
        }

        setInitialLoading(false);
    };

    init();
  }, []);

  if (initialLoading) {
    return (
        <div className="flex justify-center items-center h-64">
        <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading data...</p>
        </div>
        </div>
    );
  }

  return (
    <Formik initialValues={formValues} enableReinitialize onSubmit={handleSubmit}>
      {({ values, handleChange, setValues, setFieldValue }) => {

        return (
          <Form>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="px-2 sm:px-4 mt-4 sm:mt-6"
            >
              <Card className="border shadow-sm">
                <CardHeader className="flex sm:flex-row flex-col items-center justify-between gap-4 border-b">
                    <CardTitle className="text-lg font-semibold">
                        जिल्हा मास्टर
                    </CardTitle>
                </CardHeader>

                <CardContent className="p-4 sm:p-6 space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">

                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <Label className="sm:w-40" text="राज्याचे नांव :" />
                        <Select
                            value={values.stateId}
                            onValueChange={(v) => setFieldValue("stateId", v)}
                            disabled={mode === 2}
                        >
                            <SelectTrigger className="w-full sm:flex-1">
                                <SelectValue placeholder="-- विकल्प निवडा --" />
                            </SelectTrigger>
                            <SelectContent>
                                {states.map((state) => (
                                <SelectItem key={state.value} value={state.value}>
                                    {state.label}
                                </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <Label className="sm:w-40" text="जिल्हा नांव" />
                      <Input
                        name="districtName"
                        value={values.districtName}
                        onChange={handleChange}
                        className="w-full sm:flex-1"
                       />
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 pt-4">
                    <Button type="submit" className="bg-blue-900 text-white px-6 w-full sm:w-auto">
                      साठवा
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleDelete(values)}
                      disabled={deleteLoading}
                      className={`${mode === 2 ? 'block': 'hidden'}`}
                    >
                      रद्द
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      className="px-6 w-full sm:w-auto"
                      onClick={() => navigate("/Masters/FrmDistrictList")}
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

export default FrmDistrictMst;
